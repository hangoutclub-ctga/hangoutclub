
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

  // Se já for data URI ou blob URL, retorna diretamente
  if (url.startsWith('data:image/') || url.startsWith('blob:')) {
    return url;
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

/**
 * Converte qualquer string de data de nascimento (yyyy-MM-dd, ISO ou dd/MM/yyyy)
 * para um Date local sem sofrer com desvio de fuso horário UTC.
 */
export function parseDobToDate(dobStr?: string | null): Date | undefined {
  if (!dobStr) return undefined;
  const trimmed = dobStr.trim();
  if (!trimmed) return undefined;

  // YYYY-MM-DD ou ISO começando com YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.slice(0, 10).split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0);
  }

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0);
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Verifica se um aniversário (armazenado em dob) cai no dia e mês da data alvo (targetDay).
 * Imune a fusos horários.
 */
export function isBirthdayOnDay(dobStr: string | null | undefined, targetDay: Date): boolean {
  if (!dobStr) return false;
  const trimmed = dobStr.trim();
  if (!trimmed) return false;

  let birthMonth: number | null = null;
  let birthDay: number | null = null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.slice(0, 10).split('-');
    birthMonth = parseInt(parts[1], 10) - 1;
    birthDay = parseInt(parts[2], 10);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    birthDay = parseInt(parts[0], 10);
    birthMonth = parseInt(parts[1], 10) - 1;
  } else {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      birthMonth = parsed.getUTCMonth();
      birthDay = parsed.getUTCDate();
    }
  }

  if (birthMonth === null || birthDay === null) return false;

  return birthDay === targetDay.getDate() && birthMonth === targetDay.getMonth();
}

