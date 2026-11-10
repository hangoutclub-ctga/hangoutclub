
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

/**
 * Extrai ano e mês (1 a 12) de uma data de transação (YYYY-MM-DD, ISO ou Date)
 * de forma consistente e imune a desvios de fuso horário.
 */
export function getTransactionYearMonth(dateStr?: string | null): { year: number; month: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // YYYY-MM... (ex: "2026-09-18", "2026-09-01T00:00:00+00:00", "2026-11-10T14:00:00.000Z")
  const match = trimmed.match(/^(\d{4})-(\d{2})/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10) // 1 a 12
    };
  }

  // DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    return {
      year: parseInt(dmyMatch[3], 10),
      month: parseInt(dmyMatch[2], 10) // 1 a 12
    };
  }

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1
  };
}

/**
 * Verifica se a data da transação pertence ao ano e mês desejados (mês de 1 a 12).
 */
export function isTransactionInMonth(dateStr: string | null | undefined, targetYear: number, targetMonth: number): boolean {
  const ym = getTransactionYearMonth(dateStr);
  if (!ym) return false;
  return ym.year === targetYear && ym.month === targetMonth;
}

/**
 * Formata a data da transação no padrão brasileiro DD/MM/AAAA de forma segura contra fusos horários.
 */
export function formatTransactionDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [_, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {}
  return trimmed;
}



