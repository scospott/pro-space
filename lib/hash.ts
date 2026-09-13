/** Empreinte stable (indépendante de l'ordre) d'une liste d'ids de photos. FNV-1a 32 bits. */
export function empreintePhotos(ids: readonly string[]): string {
  const texte = [...ids].sort().join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${ids.length}-${h.toString(16).padStart(8, "0")}`;
}
