// Redimensionnement côté client avant stockage (docs/SPEC.md §3 écran 2) :
// côté long ≤ 1280 px, JPEG qualité 0,82, orientation EXIF respectée.

export const COTE_MAX_PX = 1280;
export const QUALITE_JPEG = 0.82;

export type ImagePreparee = { blob: Blob; width: number; height: number };

export class ImageIllisibleError extends Error {
  constructor() {
    super("Image illisible");
    this.name = "ImageIllisibleError";
  }
}

type Source = { image: CanvasImageSource; width: number; height: number; liberer: () => void };

export function dimensionsReduites(width: number, height: number, max = COTE_MAX_PX): { width: number; height: number } {
  const ratio = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

async function chargerSource(fichier: Blob): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, liberer: () => bitmap.close() };
    } catch {
      // Repli sur <img> (navigateur sans l'option imageOrientation ou format non décodable par createImageBitmap).
    }
  }
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { image: img, width: img.naturalWidth, height: img.naturalHeight, liberer: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageIllisibleError();
  }
}

export async function preparerImage(fichier: Blob): Promise<ImagePreparee> {
  const source = await chargerSource(fichier);
  try {
    if (source.width === 0 || source.height === 0) throw new ImageIllisibleError();
    const { width, height } = dimensionsReduites(source.width, source.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ImageIllisibleError();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source.image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITE_JPEG));
    if (!blob) throw new ImageIllisibleError();
    return { blob, width, height };
  } finally {
    source.liberer();
  }
}
