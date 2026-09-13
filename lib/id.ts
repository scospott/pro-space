/**
 * Identifiant aléatoire court. N'utilise pas crypto.randomUUID, indisponible hors contexte sécurisé
 * (tablette sur http://IP-du-PC:3000).
 */
export function nouvelId(prefixe = "id"): string {
  const octets = new Uint8Array(9);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(octets);
  } else {
    for (let i = 0; i < octets.length; i++) octets[i] = Math.floor(Math.random() * 256);
  }
  const corps = Array.from(octets, (o) => o.toString(36).padStart(2, "0")).join("");
  return `${prefixe}_${corps}`;
}
