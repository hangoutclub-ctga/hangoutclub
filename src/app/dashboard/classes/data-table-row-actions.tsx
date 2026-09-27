"use client"

import { Row, Table } from "@tanstack/react-table"
import { Eye, Edit, Trash2 } from "lucide-react"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ClassProfile } from "@/components/class-profile"
import type { Class, DeletionAudit } from "@/types"
import { useAuth } from "@/hooks/use-auth"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  table: Table<TData>
}

export function DataTableRowActions<TData>({
  row,
  table,
}: DataTableRowActionsProps<TData>) {
  const { user, hasPermission } = useAuth();
  const c = row.original as Class;
  const isAdmin = user?.role === 'Admin';
  const canEdit = isAdmin || hasPermission('classes:edit');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
        <Dialog>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
                >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Visualizar Turma</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] p-0">
                <DialogHeader className="p-6">
                    <DialogTitle>Perfil da Turma: {c.name}</DialogTitle>
                </DialogHeader>
                <ClassProfile classId={c.id} />
            </DialogContent>
        </Dialog>
        
        {canEdit && (
          <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => (table.options.meta as any)?.editClass?.(c)}
          >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
          </Button>
        )}

        {isAdmin && (
          <>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setIsDeleteDialogOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Apagar</span>
            </Button>

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                itemName={c.name}
                itemType="a turma"
                title="Confirmar Exclusão de Turma"
                onConfirm={async (audit: DeletionAudit) => {
                    await (table.options.meta as any)?.deleteClass?.(c.id, audit);
                }}
            />
          </>
        )}
    </div>
  )
}
