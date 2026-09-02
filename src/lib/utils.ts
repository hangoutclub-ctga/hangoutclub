
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayAvatarUrl(url: string | undefined | null): string {
  const placeholder = "https://placehold.co/128x128/30475E/E8E6E7.png";
  if (!url) {
    return placeholder;
  }
  
  // Check for Google Image search redirect URL
  if (url.startsWith("https://www.google.com/url?")) {
    try {
      const urlParams = new URLSearchParams(new URL(url).search);
      const imgUrl = urlParams.get('imgurl'); // Google uses 'imgurl' for the direct image link
      if (imgUrl) {
        return imgUrl;
      }
    } catch (e) {
      console.error("Error parsing Google search redirect URL:", e);
      // Failed to parse, fall through to other checks
    }
  }

  // Check for Google Drive link
  const gdriveRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
  const gdriveMatch = url.match(gdriveRegex);
  
  if (gdriveMatch && gdriveMatch[1]) {
    const fileId = gdriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // Check for prnt.sc (Lightshot) link
  const prntscRegex = /prnt\.sc\/([a-zA-Z0-9]+)/;
  const prntscMatch = url.match(prntscRegex);
  if (prntscMatch && prntscMatch[1]) {
    const imageId = prntscMatch[1];
    // This is a common pattern, but might not be 100% reliable if they change their CDN.
    return `https://i.imgur.com/${imageId}.png`;
  }


  // Check if it's a valid URL format (simple check)
  try {
    new URL(url);
    // It seems to be a valid URL, so we use it directly.
    return url;
  } catch (e) {
    console.error("Invalid URL passed to getDisplayAvatarUrl:", e);
    // If it's not a valid URL, return the placeholder.
    return placeholder;
  }
}

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
