export function randomToken(bytes = 24): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Any digit may be 0: for the teacher code's two digits after the class code. */
export function randomDigits(digits: number): string {
  const b = crypto.getRandomValues(new Uint32Array(digits));
  return Array.from(b, (x) => String(x % 10)).join("");
}

/** Digits only, never starting with 0 (a leading zero gets dropped when said aloud or typed). */
export function randomCode(digits: number): string {
  const b = crypto.getRandomValues(new Uint32Array(digits));
  let s = String(1 + (b[0] % 9));
  for (let i = 1; i < digits; i++) s += String(b[i] % 10);
  return s;
}
