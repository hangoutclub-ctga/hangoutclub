"use client"

import { Row, Table } from "@tanstack/react-table"
import { Eye, Edit, Trash2 } from "lucide-react"
import React from "react"
import { Button } from "@/components/ui/button"
import type { Class } from "@/types"
import { useAuth } from "@/hooks/use-auth"

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

  return (
    <div className="flex items-center justify-end gap-1">
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10"
            onClick={(e) => {
                e.stopPropagation();
                (table.options.meta as any)?.viewClass?.(c);
            }}
        >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar Turma</span>
        </Button>
        
        {canEdit && (
          <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                  e.stopPropagation();
                  (table.options.meta as any)?.editClass?.(c);
              }}
          >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
          </Button>
        )}

        {isAdmin && (
          <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                  e.stopPropagation();
                  (table.options.meta as any)?.requestDeleteClass?.(c);
              }}
          >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Apagar</span>
          </Button>
        )}
    </div>
  )
}
