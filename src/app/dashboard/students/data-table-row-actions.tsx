"use client"

import { Row, Table } from "@tanstack/react-table"
import { Eye, Edit, Trash2 } from "lucide-react"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Student, DeletionAudit } from "@/types"
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
  const student = row.original as Student;
  const isAdmin = user?.role === 'Admin';
  const canEdit = isAdmin || hasPermission('students:edit');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
            onClick={(e) => {
                e.stopPropagation();
                (table.options.meta as any)?.viewStudent?.(student);
            }}
        >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Ver ficha</span>
        </Button>
        
        {canEdit && (
          <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => (table.options.meta as any)?.editStudent?.(student)}
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
                itemName={student.name}
                itemType="o aluno"
                title="Confirmar Exclusão de Aluno"
                onConfirm={async (audit: DeletionAudit) => {
                    await (table.options.meta as any)?.deleteStudent?.(student.id, audit);
                }}
            />
          </>
        )}
    </div>
  )
}
