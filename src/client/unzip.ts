// Reads the quiz text out of a .zip, using the browser's own decompression
// (DecompressionStream "deflate-raw"); no library. v1 only needs the text
// file; v2 will take the images from the same archive (decisions.md, upload).

export interface ZipEntry {
  name: string;
  read(): Promise<Uint8Array>;
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

/** The quiz text in an archive: its one .md/.txt file (ignoring system clutter). */
export async function quizTextFromZip(buf: ArrayBuffer): Promise<string> {
  const texts = listZip(buf).filter((e) => /\.(md|txt|markdown)$/i.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name));
  if (texts.length === 0) throw new Error("The archive contains no .txt or .md file with the quiz.");
  // Prefer a file at the top level, then the shortest path.
  texts.sort((a, b) => a.name.split("/").length - b.name.split("/").length || a.name.length - b.name.length);
  return new TextDecoder().decode(await texts[0].read());
}
