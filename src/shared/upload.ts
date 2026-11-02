// Upload attempts are counted by format, with content and identity excluded,
// so whether anyone tries another format is a fact to look up rather than a
// guess (backlog v1 item 2). The format is one word from this closed list;
// the server stores nothing else.

export const UPLOAD_FORMATS = [
  "paste",
  "txt",
  "md",
  "zip",
  "several files",
  "tar.gz",
  "tgz",
  "gz",
  "7z",
  "rar",
  "docx",
  "doc",
  "odt",
  "rtf",
  "pdf",
  "pptx",
  "xlsx",
  "html",
  "json",
  "csv",
  "png",
  "jpg",
  "heic",
  "no extension",
  "other",
] as const;

export type UploadFormat = (typeof UPLOAD_FORMATS)[number];

const ALIASES: Record<string, UploadFormat> = { markdown: "md", jpeg: "jpg", htm: "html", text: "txt" };

/** The format of the files a teacher picked, by name only. */
export function uploadFormat(names: string[]): UploadFormat {
  if (names.length > 1) return "several files";
  const name = (names[0] ?? "").toLowerCase();
  if (name.endsWith(".tar.gz")) return "tar.gz";
  const ext = name.match(/\.([a-z0-9]{1,8})$/)?.[1];
  if (!ext) return "no extension";
  const format = ALIASES[ext] ?? ext;
  return isUploadFormat(format) ? format : "other";
}

export function isUploadFormat(s: unknown): s is UploadFormat {
  return typeof s === "string" && (UPLOAD_FORMATS as readonly string[]).includes(s);
}
