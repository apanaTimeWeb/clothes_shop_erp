const eventName = "application-document-change";
export function readDocument(key: string): string | null {
  return window.localStorage.getItem(key);
}
export function commitDocument(
  key: string,
  expected: string | null,
  value: string,
): void {
  if (readDocument(key) !== expected)
    throw new Error("Saved document changed. Reload before continuing.");
  try {
    window.localStorage.setItem(key, value);
  } catch {
    throw new Error(
      "Browser storage is unavailable or full. Nothing was saved.",
    );
  }
  window.dispatchEvent(new CustomEvent(eventName, { detail: { key } }));
}
export function subscribeDocument(
  key: string,
  changed: () => void,
  external: () => void,
): () => void {
  const same = (e: Event) => {
    if ((e as CustomEvent<{ key: string }>).detail.key === key) changed();
  };
  const other = (e: StorageEvent) => {
    if (e.key === key || e.key === null) external();
  };
  window.addEventListener(eventName, same);
  window.addEventListener("storage", other);
  return () => {
    window.removeEventListener(eventName, same);
    window.removeEventListener("storage", other);
  };
}
export function readSessionValue(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writeSessionValue(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* UI preferences are optional. */
  }
  window.dispatchEvent(new CustomEvent(eventName, { detail: { key, value } }));
}
export function subscribeSessionValue(
  key: string,
  changed: (value: string) => void,
): () => void {
  const listener = (e: Event) => {
    const d = (e as CustomEvent<{ key: string; value: string }>).detail;
    if (d.key === key) changed(d.value);
  };
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}

export function commitDocuments(
  changes: { key: string; expected: string | null; value: string }[],
): void {
  if (new Set(changes.map((c) => c.key)).size !== changes.length)
    throw Error("Duplicate document key.");
  for (const c of changes)
    if (readDocument(c.key) !== c.expected)
      throw Error("Saved data changed. Reload before retrying.");
  const written: typeof changes = [];
  try {
    for (const c of changes) {
      window.localStorage.setItem(c.key, c.value);
      written.push(c);
    }
  } catch {
    let restored = true;
    for (const c of written.reverse()) {
      try {
        if (c.expected === null) window.localStorage.removeItem(c.key);
        else window.localStorage.setItem(c.key, c.expected);
      } catch {
        restored = false;
      }
    }
    if (!restored)
      throw Error(
        "Storage failed and rollback was incomplete. Stop editing and restore your exported backup.",
      );
    throw Error(
      "Storage is unavailable or full. Previous documents were restored.",
    );
  }
  for (const c of changes)
    window.dispatchEvent(
      new CustomEvent(eventName, { detail: { key: c.key } }),
    );
}
