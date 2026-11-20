// Code 39 standard symbol-width table, cross-checked against ZXing Code39Reader.
// ZXing authors, Apache-2.0; source attribution in docs/BARCODE_NOTES.md.
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%";
const widths = [
  0x034, 0x121, 0x061, 0x160, 0x031, 0x130, 0x070, 0x025, 0x124, 0x064, 0x109, 0x049, 0x148, 0x019,
  0x118, 0x058, 0x00d, 0x10c, 0x04c, 0x01c, 0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106,
  0x046, 0x016, 0x181, 0x0c1, 0x1c0, 0x091, 0x190, 0x0d0, 0x085, 0x184, 0x0c4, 0x0a8, 0x0a2, 0x08a,
  0x02a,
];
export function encodeLabel(sku: string) {
  const text = sku.toUpperCase();
  if (!text || text.length > 24 || [...text].some((c) => !alphabet.includes(c))) return null;
  let x = 12;
  const bars: { x: number; width: number }[] = [];
  for (const c of "*" + text + "*") {
    const value = c === "*" ? 0x094 : widths[alphabet.indexOf(c)];
    for (let n = 8; n >= 0; n--) {
      const width = value & (1 << n) ? 3 : 1;
      if (n % 2 === 0) bars.push({ x, width });
      x += width;
    }
    x++;
  }
  return { text, width: x + 11, bars };
}
