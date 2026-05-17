const IDB_NAME = "pokerogue-fusion";
const IDB_STORE = "settings";
const IDB_KEY = "ifFolderHandle";

let activeHandle: FileSystemDirectoryHandle | null = null;
const listeners = new Set<(h: FileSystemDirectoryHandle | null) => void>();

let dbPromise: Promise<IDBDatabase> | null = null;
function getDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbPut(value: unknown): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).delete(IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(): Promise<unknown> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function getIfFolderHandle(): FileSystemDirectoryHandle | null {
  return activeHandle;
}

/** Pass null to clear. Notifies subscribers and persists to IDB. */
export async function setIfFolderHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
  activeHandle = handle;
  try {
    if (handle) {
      await idbPut(handle);
    } else {
      await idbDelete();
    }
  } catch (err) {
    // IDB write failures must not break the session.
    console.warn("Failed to persist IF folder handle:", err);
  }
  for (const fn of listeners) {
    fn(handle);
  }
}

/**
 * Restores the stored handle on app start. Idempotent.
 * @param promptOnDenied - If true, shows the browser permission prompt;
 *   otherwise the loader will prompt later on first file access.
 */
export async function restoreIfFolderHandle(promptOnDenied = false): Promise<void> {
  if (activeHandle) {
    return;
  }
  let stored: unknown;
  try {
    stored = await idbGet();
  } catch {
    return;
  }
  if (!stored || typeof (stored as { queryPermission?: unknown }).queryPermission !== "function") {
    return;
  }
  const handle = stored as FileSystemDirectoryHandle;
  try {
    const status = await (
      handle as unknown as {
        queryPermission(opts: { mode: "read" }): Promise<PermissionState>;
      }
    ).queryPermission({ mode: "read" });
    if (status === "granted") {
      activeHandle = handle;
    } else if (promptOnDenied) {
      const req = await (
        handle as unknown as {
          requestPermission(opts: { mode: "read" }): Promise<PermissionState>;
        }
      ).requestPermission({ mode: "read" });
      if (req === "granted") {
        activeHandle = handle;
      }
    }
  } catch (err) {
    console.warn("Failed to restore IF folder permission:", err);
  }
  for (const fn of listeners) {
    fn(activeHandle);
  }
}

export function onIfFolderHandleChange(fn: (handle: FileSystemDirectoryHandle | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Resolves a path inside the granted folder to a File, or null. Walks
 * subdirectories explicitly because the FSA API rejects compound paths in
 * `getFileHandle`.
 */
export async function getFileFromIfFolder(path: string): Promise<File | null> {
  if (!activeHandle) {
    return null;
  }
  const parts = path.split("/").filter(p => p.length > 0);
  if (parts.length === 0) {
    return null;
  }
  let dir: FileSystemDirectoryHandle = activeHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    try {
      dir = await dir.getDirectoryHandle(parts[i]);
    } catch {
      return null;
    }
  }
  try {
    const fileHandle = await dir.getFileHandle(parts.at(-1)!);
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

/** Caller owns revoking the URL. */
export async function getBlobUrlFromIfFolder(path: string): Promise<string | null> {
  const file = await getFileFromIfFolder(path);
  if (!file) {
    return null;
  }
  return URL.createObjectURL(file);
}
