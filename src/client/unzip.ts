// Reads the quiz text and its pictures out of a .zip, using the browser's own
// decompression (DecompressionStream "deflate-raw"); no library. Entries are
// read one at a time, when asked for (images.ts).

import { parseQuiz } from "../quiz/format.ts";

export interface ZipEntry {
  name: string;
  read(): Promise<Uint8Array<ArrayBuffer>>;
}

export function listZip(buf: ArrayBuffer): ZipEntry[] {
  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  // End of central directory: signature 0x06054b50, searched from the end
  // (a comment of up to 64 KiB may follow it).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("This file is not a readable .zip archive.");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("The .zip archive is damaged.");
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    entries.push({
      name,
      read: async () => {
        const lNameLen = dv.getUint16(local + 26, true);
        const lExtraLen = dv.getUint16(local + 28, true);
        const start = local + 30 + lNameLen + lExtraLen;
        const data = bytes.subarray(start, start + csize);
        if (method === 0) return data.slice();
        if (method !== 8) throw new Error(`"${name}" is packed in a way the site can't read.`);
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        return new Uint8Array(await new Response(stream).arrayBuffer());
      },
    });
  }
  return entries;
}

/**
 * The quiz text among an archive's entries (ignoring system clutter). With
 * several .md/.txt files (a README, the AI's notes beside the quiz), the
 * one that reads as a quiz: no errors, then the most questions; a tie goes
 * to the file at the top level, then the shortest path. When none has a
 * question, that first file, so the teacher sees what's wrong with it.
 */
export async function quizTextFromEntries(entries: ZipEntry[]): Promise<string> {
  const texts = entries.filter((e) => /\.(md|txt|markdown)$/i.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name));
  if (texts.length === 0) throw new Error("The archive contains no .txt or .md file with the quiz.");
  texts.sort((a, b) => a.name.split("/").length - b.name.split("/").length || a.name.length - b.name.length);
  const dec = new TextDecoder();
  if (texts.length === 1) return dec.decode(await texts[0].read());
  const read = await Promise.all(texts.map(async (e) => dec.decode(await e.read())));
  let best = 0;
  let bestRank = [-1, -1];
  read.forEach((text, i) => {
    const r = parseQuiz(text);
    const rank = [r.ok ? 1 : 0, r.quiz.questions.length];
    if (rank[0] > bestRank[0] || (rank[0] === bestRank[0] && rank[1] > bestRank[1])) {
      best = i;
      bestRank = rank;
    }
  });
  return bestRank[1] > 0 ? read[best] : read[0];
}
