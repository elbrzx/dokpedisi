import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert signature canvas to JPEG
export function convertSignatureToLowResJPEG(
  signatureDataUrl: string,
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(signatureDataUrl);

      canvas.width = 200;
      canvas.height = 100;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.3));
      };
      img.onerror = () => {
        resolve(signatureDataUrl);
      };
      img.src = signatureDataUrl;
    } catch (error) {
      console.error("Error converting signature:", error);
      resolve(signatureDataUrl);
    }
  });
}
