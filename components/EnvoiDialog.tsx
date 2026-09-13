"use client";

import { useState, type ReactNode } from "react";
import { emailValide } from "@/lib/validation";
import { ConfirmDialog } from "./ConfirmDialog";
import { inputClass } from "./Field";

type EnvoiDialogProps = {
  titre: string;
  emailInitial: string;
  confirmLabel: string;
  avertissement?: ReactNode;
  onConfirm: (email: string) => void;
  onCancel: () => void;
};

/** Confirmation d'envoi (démo) : e-mail modifiable, mention que rien ne part réellement. À monter seulement quand il est ouvert. */
export function EnvoiDialog({ titre, emailInitial, confirmLabel, avertissement, onConfirm, onCancel }: EnvoiDialogProps) {
  const [email, setEmail] = useState(emailInitial);
  const valide = emailValide(email);
  const confirmer = () => {
    if (valide) onConfirm(email.trim());
  };
  return (
    <ConfirmDialog open title={titre} confirmLabel={confirmLabel} confirmVariant="primary" confirmDisabled={!valide} onConfirm={confirmer} onCancel={onCancel}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="envoi-email" className="text-[12.5px] font-medium text-muted">
          E-mail du destinataire
        </label>
        <input
          id="envoi-email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={inputClass}
          value={email}
          aria-invalid={!valide || undefined}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmer();
          }}
        />
        {!valide ? <p className="text-[12.5px] text-danger">Adresse e-mail invalide, par exemple nom@domaine.ch.</p> : null}
      </div>
      {avertissement ? <div className="mt-3 text-[13px] text-warn">{avertissement}</div> : null}
      <p className="mt-3 rounded-rs bg-warn-soft px-3 py-2 text-ink">Démo : l&apos;e-mail n&apos;est pas envoyé, le PDF est téléchargé.</p>
    </ConfirmDialog>
  );
}
