"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DeletionAudit } from "@/types";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  itemType?: string; // ex: "a turma", "o aluno", "o item", "o colaborador"
  title?: string;
  description?: string;
  onConfirm: (audit: DeletionAudit) => Promise<void> | void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = "o item",
  title = "Confirmar Exclusão",
  description,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedReason = reason.trim();
  const isValid = trimmedReason.length >= 3;

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setReason("");
      setIsSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const audit: DeletionAudit = {
        reason: trimmedReason,
        deletedBy: user?.nickname || user?.email || "Administrador",
        deletedAt: new Date().toISOString(),
      };
      await onConfirm(audit);
      handleClose(false);
    } catch (err) {
      console.error("Erro ao confirmar exclusão:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[480px]"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
            <Trash2 className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/80 pt-1">
            {description ? (
              description
            ) : (
              <>
                Tem certeza que deseja apagar {itemType}{" "}
                {itemName && <strong>&quot;{itemName}&quot;</strong>}? Ele será movido para a Lixeira.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Alerta de obrigatoriedade */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold">Justificativa obrigatória:</span> Informe o motivo da exclusão. Esta informação ficará gravada para histórico e auditoria na Lixeira.
            </div>
          </div>

          {/* Campo de Justificativa */}
          <div className="space-y-1.5">
            <Label htmlFor="deletion-reason" className="text-xs font-semibold">
              Motivo da Exclusão / Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="deletion-reason"
              placeholder="Descreva detalhadamente o motivo pelo qual este item está sendo apagado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none min-h-[90px] text-xs sm:text-sm focus-visible:ring-destructive"
              autoFocus
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>
                {trimmedReason.length < 3 ? (
                  <span className="text-destructive font-medium">Mínimo de 3 caracteres para liberar</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Motivo válido</span>
                )}
              </span>
              <span className="font-mono">{trimmedReason.length} caracteres</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
            className="text-xs sm:text-sm"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
            className="text-xs sm:text-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...
              </>
            ) : (
              "Confirmar Exclusão"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
