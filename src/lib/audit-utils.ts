import { DeletionAudit } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Cria a tag de auditoria codificada em JSON para persistência em campos de texto.
 */
export function buildAuditTag(audit: DeletionAudit): string {
  return `[DELETION_AUDIT:${JSON.stringify(audit)}]`;
}

/**
 * Extrai os dados de auditoria gravados na tag [DELETION_AUDIT:{...}].
 */
export function extractDeletionAudit(rawText?: string | null): DeletionAudit | null {
  if (!rawText) return null;
  const match = rawText.match(/\[DELETION_AUDIT:(\{.*?\})\]/);
  if (match) {
    try {
      return JSON.parse(match[1]) as DeletionAudit;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Extrai os dados de auditoria gravados nas permissões de usuário (profiles).
 */
export function extractUserDeletionAudit(permissions?: string[] | null): DeletionAudit | null {
  if (!permissions || !Array.isArray(permissions)) return null;
  const auditPerm = permissions.find((p) => p.startsWith("DELETION_AUDIT:"));
  if (auditPerm) {
    try {
      return JSON.parse(auditPerm.replace("DELETION_AUDIT:", "")) as DeletionAudit;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Remove a tag de auditoria de um texto, devolvendo o conteúdo limpo.
 */
export function cleanAuditTag(text?: string | null): string {
  if (!text) return "";
  return text.replace(/\[DELETION_AUDIT:\{.*?\}\]\s*/g, "").trim();
}

/**
 * Formata a data e hora ISO para formato legível brasileiro (ex: 26/09/2026 às 13:45).
 */
export function formatAuditDate(isoDate?: string | null): string {
  if (!isoDate) return "Data não registrada";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return isoDate;
  }
}
