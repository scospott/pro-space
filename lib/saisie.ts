// Registre des saisies différées (debounce) : permet de tout enregistrer avant une validation ou une navigation.

const enAttente = new Set<() => void>();

export function enregistrerFlush(flush: () => void): () => void {
  enAttente.add(flush);
  return () => {
    enAttente.delete(flush);
  };
}

/** Écrit immédiatement dans le store toutes les frappes encore en attente. */
export function flushSaisies(): void {
  for (const flush of [...enAttente]) flush();
}
