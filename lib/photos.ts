// Blobs des photos dans IndexedDB (idb-keyval). Les métadonnées sont dans le store.
import { createStore, del, delMany, get, set, type UseStore } from "idb-keyval";

let base: UseStore | null = null;

function magasin(): UseStore {
  if (!base) base = createStore("pro-space-devis", "photos");
  return base;
}

export class QuotaPhotosError extends Error {
  constructor() {
    super("Espace de stockage de la tablette plein");
    this.name = "QuotaPhotosError";
  }
}

function estQuota(e: unknown): boolean {
  return e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
}

export async function putPhoto(key: string, blob: Blob): Promise<void> {
  try {
    await set(key, blob, magasin());
  } catch (e) {
    if (estQuota(e)) throw new QuotaPhotosError();
    throw e;
  }
}

export async function getPhoto(key: string): Promise<Blob | undefined> {
  const valeur: unknown = await get(key, magasin());
  return valeur instanceof Blob ? valeur : undefined;
}

export async function deletePhoto(key: string): Promise<void> {
  await del(key, magasin());
}

export async function deletePhotos(keys: readonly string[]): Promise<void> {
  if (keys.length === 0) return;
  await delMany([...keys], magasin());
}
