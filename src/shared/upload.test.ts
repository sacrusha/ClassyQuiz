import { test } from "node:test";
import assert from "node:assert/strict";
import { isUploadFormat, uploadFormat } from "./upload.ts";

test("upload formats are told apart by file name only", () => {
  assert.equal(uploadFormat(["Quiz.ZIP"]), "zip");
  assert.equal(uploadFormat(["quiz.markdown"]), "md");
  assert.equal(uploadFormat(["Percentages.quiz"]), "quiz");
  assert.equal(uploadFormat(["quiz.tar.gz"]), "tar.gz");
  assert.equal(uploadFormat(["Arbeitsblatt 4.docx"]), "docx");
  assert.equal(uploadFormat(["IMG_2041.JPEG"]), "jpg");
  assert.equal(uploadFormat(["quiz"]), "no extension");
  assert.equal(uploadFormat(["quiz.xyz"]), "other");
  assert.equal(uploadFormat(["quiz.md", "fig1.png"]), "several files");
});

test("only words from the closed list are taken, so nothing else can be stored", () => {
  assert.equal(isUploadFormat("pdf"), true);
  assert.equal(isUploadFormat("Anna's quiz.pdf"), false);
  assert.equal(isUploadFormat(undefined), false);
});
