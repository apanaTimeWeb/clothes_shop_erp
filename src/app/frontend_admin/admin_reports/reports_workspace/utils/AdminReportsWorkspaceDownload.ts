export function csvText(rows: (string | number)[][]) {
  const cell = (value: string | number) => {
    const text = String(value);
    const safe =
      typeof value === "string" && /^[\s]*[=+@-]/.test(text)
        ? `'${text}`
        : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
export function downloadText(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
