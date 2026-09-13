"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getPhoto } from "@/lib/photos";
import type { Photo } from "@/lib/types";

type PhotoTileProps = {
  photo: Photo;
  titre: string;
  onSupprimer: () => void;
  disabled?: boolean;
};

export function PhotoTile({ photo, titre, onSupprimer, disabled }: PhotoTileProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [introuvable, setIntrouvable] = useState(false);

  useEffect(() => {
    let annule = false;
    let objectUrl: string | null = null;
    getPhoto(photo.blobKey)
      .then((blob) => {
        if (annule) return;
        if (!blob) {
          setIntrouvable(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!annule) setIntrouvable(true);
      });
    return () => {
      annule = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.blobKey]);

  return (
    <figure className="relative m-0 aspect-[4/3] overflow-hidden rounded-r bg-line" data-testid="vignette">
      {url ? (
        <Image src={url} alt={titre} fill unoptimized sizes="200px" className="object-cover" />
      ) : introuvable ? (
        <div className="flex h-full items-center justify-center p-3 text-center text-[12px] text-muted">
          Photo introuvable sur cette tablette. Supprimez-la et reprenez-la.
        </div>
      ) : (
        <div className="h-full w-full bg-surface-2" aria-hidden="true" />
      )}
      <figcaption className="absolute bottom-2 left-2.5 text-[12px] font-medium text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
        {titre}
      </figcaption>
      <button
        type="button"
        onClick={onSupprimer}
        disabled={disabled}
        aria-label={`Supprimer ${titre}`}
        className="absolute top-0 right-0 flex h-12 w-12 items-center justify-center disabled:opacity-40"
      >
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-black/55 text-[17px] leading-none text-white" aria-hidden="true">
          ×
        </span>
      </button>
    </figure>
  );
}
