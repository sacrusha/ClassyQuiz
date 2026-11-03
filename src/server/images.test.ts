import { test } from "node:test";
import assert from "node:assert/strict";
import { imageInfo, matchImages } from "./images.ts";
import { parseQuiz } from "../quiz/format.ts";
import { MAX_IMAGE_BYTES } from "../shared/protocol.ts";

function pngHeader(w: number, h: number): Uint8Array {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const dv = new DataView(b.buffer);
  dv.setUint32(16, w);
  dv.setUint32(20, h);
  return b;
}

function jpegHeader(w: number, h: number): Uint8Array {
  // SOI, an APP0 segment (length 16), a fill byte, then SOF2 (progressive).
  const app0 = [0xff, 0xe0, 0, 16, ...new Array(14).fill(0)];
  const sof = [0xff, 0xff, 0xc2, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 0, 0, 0, 0, 0, 0, 0, 0];
  return new Uint8Array([0xff, 0xd8, ...app0, ...sof]);
}

test("PNG and JPEG: type and size read from the file", () => {
  assert.deepEqual(imageInfo(pngHeader(1600, 900)), { type: "image/png", w: 1600, h: 900 });
  assert.deepEqual(imageInfo(jpegHeader(1200, 1600)), { type: "image/jpeg", w: 1200, h: 1600 });
});

test("anything else is refused", () => {
  assert.equal(imageInfo(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), null);
  assert.equal(imageInfo(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0])), null);
  assert.equal(imageInfo(pngHeader(0, 10)), null);
  assert.equal(imageInfo(new Uint8Array([0xff, 0xd8, 0xff])), null);
  assert.equal(imageInfo(new Uint8Array()), null);
});

const quiz = () =>
  parseQuiz(`Title: T\n1. Q1?\nImage: Bilder/q1.png\n+ a\n- b\n2. Q2?\nImage: q1.png\n+ a\n- b\n3. Q3?\nImage: q3.jpg\n+ a\n- b\n4. Q4?\n+ a\n- b\n`).quiz;

test("pictures are matched by imageKey; one used twice is stored once; unnamed files are dropped", () => {
  const r = matchImages(
    quiz(),
    [
      { name: "Q1.PNG", bytes: pngHeader(800, 600) },
      { name: "pics/q3.jpg", bytes: jpegHeader(640, 480) },
      { name: "unused.png", bytes: pngHeader(10, 10) },
    ],
    false,
  );
  assert.ok(r.ok);
  assert.deepEqual(r.index, { "q1.png": { type: "image/png", w: 800, h: 600, n: 0 }, "q3.jpg": { type: "image/jpeg", w: 640, h: 480, n: 1 } });
  assert.deepEqual(Object.keys(r.files), ["img:0", "img:1"]);
});

test("a picture that didn't come is an error naming it, or left out when the teacher chose so", () => {
  const r = matchImages(quiz(), [{ name: "q1.png", bytes: pngHeader(8, 8) }], false);
  assert.equal(r.ok, false);
  assert.ok(!r.ok);
  assert.deepEqual(r.missing, ["q3.jpg"]);
  assert.match(r.errors[0].message, /^Question 3 shows the picture "q3.jpg", which didn't come with the quiz/);

  const q = quiz();
  const left = matchImages(q, [{ name: "q1.png", bytes: pngHeader(8, 8) }], true);
  assert.ok(left.ok);
  assert.match(left.warnings[0].message, /^Question 3 runs without its picture "q3.jpg"/);
  assert.equal(q.questions[2].image, "");
  assert.equal(q.questions[0].image, "Bilder/q1.png");
});

test("a file that isn't PNG or JPEG, or is too large, is refused", () => {
  const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
  big.set(pngHeader(10, 10));
  for (const bytes of [new TextEncoder().encode("<svg/>"), big]) {
    const r = matchImages(quiz(), [{ name: "q1.png", bytes }, { name: "q3.jpg", bytes: jpegHeader(4, 4) }], false);
    assert.ok(!r.ok);
    assert.match(r.errors[0].message, /^Question 1 shows the picture "Bilder\/q1.png", which couldn't be read/);
  }
});

test("backgrounds: the quiz's and a question's own are matched like pictures, and shared files stored once", () => {
  const q = parseQuiz(`Title: T\nBackground: wald.jpg\n1. Q1?\nImage: q1.png\n+ a\n- b\n2. Q2?\nBackground: q1.png\n+ a\n- b\n`).quiz;
  const r = matchImages(q, [{ name: "wald.jpg", bytes: jpegHeader(1600, 900) }, { name: "q1.png", bytes: pngHeader(8, 8) }], false);
  assert.ok(r.ok);
  assert.deepEqual(Object.keys(r.index), ["wald.jpg", "q1.png"]);

  const left = parseQuiz(`Title: T\nBackground: wald.jpg\n1. Q1?\nBackground: see.jpg\n+ a\n- b\n`).quiz;
  const l = matchImages(left, [], true);
  assert.ok(l.ok);
  assert.deepEqual(l.warnings.map((w) => w.message), ['The quiz runs without its background "wald.jpg".', 'Question 1 runs without its background "see.jpg".']);
  assert.equal(left.background, "");
  assert.equal(left.questions[0].background, "");

  const missing = matchImages(parseQuiz(`Title: T\nBackground: wald.jpg\n1. Q1?\n+ a\n- b\n`).quiz, [], false);
  assert.ok(!missing.ok);
  assert.match(missing.errors[0].message, /^The quiz has the background "wald.jpg", which didn't come with the quiz/);
});

test("answer pictures: stored like any picture, their small copies packed for the devices", () => {
  const q = parseQuiz(`Title: T
1. Which?
Image: q.png
+ Image: a.png
- Image: b.png
- Image: c.png
- Image: q.png
2. Again?
+ Image: d.png
- Image: e.png
- Image: f.png
- Image: a.png
`).quiz;
  const names = ["q", "a", "b", "c", "d", "e", "f"];
  const small = (extra: number) => {
    const b = new Uint8Array(33 + extra);
    b.set(pngHeader(320, 320));
    return b;
  };
  const r = matchImages(
    q,
    names.map((n) => ({ name: `${n}.png`, bytes: pngHeader(600, 600) })),
    false,
    [...names.map((n) => ({ name: `${n}.png`, bytes: small(290_000) })), { name: "stray.png", bytes: pngHeader(4, 4) }, { name: "toobig.png", bytes: small(400_000) }],
  );
  assert.ok(r.ok);
  // Seven files, each stored once; five small copies of 290 KB fill a pack, the sixth starts the next.
  assert.equal(Object.keys(r.files).filter((k) => k.startsWith("img:")).length, 7);
  assert.equal(r.packs, 2);
  assert.deepEqual(r.index["a.png"].small, { type: "image/png", w: 320, h: 320, p: 0, o: 0, l: 290_033 });
  assert.deepEqual(r.index["q.png"].small, { type: "image/png", w: 320, h: 320, p: 0, o: 3 * 290_033, l: 290_033 });
  assert.deepEqual(r.index["f.png"].small, { type: "image/png", w: 320, h: 320, p: 1, o: 290_033, l: 290_033 });
  assert.equal(r.files["pack:0"].byteLength, 5 * 290_033);
  assert.equal(r.files["pack:1"].byteLength, 2 * 290_033);
  assert.deepEqual(r.warnings, []);
});

test("answer pictures: a missing small copy is no error; different proportions get a warning", () => {
  const q = parseQuiz(`Title: T\n1. Which?\n+ Image: a.png\n- Image: b.png\n`).quiz;
  const r = matchImages(q, [{ name: "a.png", bytes: pngHeader(600, 600) }, { name: "b.png", bytes: pngHeader(1200, 300) }], false);
  assert.ok(r.ok);
  assert.equal(r.packs, 0);
  assert.equal(r.index["a.png"].small, undefined);
  assert.equal(r.warnings.length, 1);
  assert.match(r.warnings[0].message, /^Question 1's answer pictures have different proportions \(from 1:1 to 4:1\)/);

  const left = parseQuiz(`Title: T\n1. Which?\n+ Image: a.png\n- Image: b.png\n`).quiz;
  const l = matchImages(left, [{ name: "a.png", bytes: pngHeader(600, 600) }], true);
  assert.ok(l.ok);
  assert.deepEqual(l.warnings.map((w) => w.message), ['Question 1 runs without its answer picture "b.png": that answer shows only its colour and shape.']);
  assert.equal(left.questions[0].answers[1].image, "");
});
