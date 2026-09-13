export function Chargement({ texte = "Chargement du brouillon…" }: { texte?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center text-muted" role="status" aria-live="polite">
      <span className="ps-spinner mr-3 inline-block h-5 w-5 rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
      {texte}
    </div>
  );
}
