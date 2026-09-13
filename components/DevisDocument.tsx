import Image from "next/image";
import { CONDITIONS, SOCIETE, colonneVolume, destinataire, enTeteDocument, libelleTva, lignesSociete, objetDevis, sectionsDevis, texteDuree } from "@/lib/document";
import { chf } from "@/lib/format";
import type { Devis, LigneDevis, Totaux } from "@/lib/types";

type DevisDocumentProps = {
  devis: Devis;
  lignes: LigneDevis[];
  totaux: Totaux;
};

/** Document tel que le client le reçoit (même mise en page que le PDF). Lecture seule. */
export function DevisDocument({ devis, lignes, totaux }: DevisDocumentProps) {
  const entete = enTeteDocument(devis);
  const dest = destinataire(devis);

  return (
    <article className="mx-auto w-full max-w-[640px] bg-surface px-10 pt-9 pb-8 text-[12.5px] shadow-[0_1px_3px_rgb(21_33_40/0.14)]" aria-label="Aperçu du devis">
      <header className="mb-[26px] flex items-start justify-between gap-6">
        <Image src="/logo.png" alt="Pro Space" width={90} height={44} priority className="h-11 w-auto" />
        <div className="text-right">
          <h2 className="m-0 text-[26px] font-semibold tracking-[-0.01em]">Devis</h2>
          <p className="mt-1 text-muted">
            N° {entete.numero}
            <br />
            {entete.lieuDate}
            <br />
            {entete.validite}
          </p>
        </div>
      </header>

      <div className="mb-[22px] flex justify-between gap-6 leading-normal">
        <div>
          <strong className="mb-0.5 block">{SOCIETE.nom}</strong>
          {lignesSociete().map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
          <span className="block text-muted">{SOCIETE.ide}</span>
        </div>
        <div className="text-right">
          <strong className="mb-0.5 block">{dest.titre || "Client à compléter"}</strong>
          {dest.lignes.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </div>
      </div>

      <p className="mb-[18px] rounded-rs bg-surface-2 px-3 py-2.5">
        <strong>Objet</strong> : {objetDevis(devis)}
      </p>

      <table className="w-full border-collapse tabular-nums">
        <thead>
          <tr>
            <th className="border-b border-line pr-2 pb-2 text-left text-[11.5px] font-medium text-muted">Désignation</th>
            <th className="border-b border-line pr-2 pb-2 text-right text-[11.5px] font-medium text-muted">Qté</th>
            <th className="border-b border-line pr-2 pb-2 text-right text-[11.5px] font-medium text-muted">Volume</th>
            <th className="border-b border-line pb-2 text-right text-[11.5px] font-medium text-muted">Montant</th>
          </tr>
        </thead>
        <tbody>
          {sectionsDevis(lignes).map((s) => [
            <tr key={`s-${s.section}`}>
              <td colSpan={4} className="border-b border-line pt-4 pb-[7px] font-semibold text-brand-ink">
                {s.titre}
              </td>
            </tr>,
            ...s.lignes.map((l, i) => (
              <tr key={`${s.section}-${i}`} className={l.avertissement ? "text-warn" : undefined}>
                <td className="border-b border-line-soft py-[7px] pr-2 align-top">
                  {l.designation}
                  {l.piece ? <span className="ml-1.5 text-[11.5px] text-muted">{l.piece}</span> : null}
                  {l.detail ? <div className={`text-[11.5px] ${l.avertissement ? "text-warn" : "text-muted"}`}>{l.detail}</div> : null}
                </td>
                <td className="montant border-b border-line-soft py-[7px] pr-2 text-right align-top">{l.quantite ?? ""}</td>
                <td className="montant border-b border-line-soft py-[7px] pr-2 text-right align-top">{colonneVolume(l)}</td>
                <td className="montant border-b border-line-soft py-[7px] text-right align-top">{chf(l.montantCHF)}</td>
              </tr>
            )),
          ])}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-[270px] max-w-full tabular-nums">
        <div className="flex justify-between py-1.5">
          <span>Sous-total HT</span>
          <span className="montant">{chf(totaux.sousTotalHT)}</span>
        </div>
        {totaux.minimumApplique ? (
          <div className="flex justify-between py-1.5 text-[12px] text-warn">
            <span>Minimum de facturation appliqué</span>
            <span className="montant">{chf(totaux.minimumHT)}</span>
          </div>
        ) : null}
        <div className="flex justify-between py-1.5">
          <span>{libelleTva(totaux.tvaPct)}</span>
          <span className="montant">{chf(totaux.tva)}</span>
        </div>
        <div className="mt-1.5 flex justify-between border-t-[1.5px] border-ink pt-2.5 text-[15px] font-semibold">
          <span>Total TTC</span>
          <span className="montant" data-testid="total-ttc">
            {chf(totaux.totalTTC)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-muted">{texteDuree(totaux)}</p>
      <p className="mt-[18px] border-t border-line-soft pt-3 text-[11px] leading-[1.55] text-muted">{CONDITIONS}</p>
    </article>
  );
}
