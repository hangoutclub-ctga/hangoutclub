
"use client"

import { Row, Table } from "@tanstack/react-table"
import { Eye, Edit, Trash2 } from "lucide-react"
import React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { ClassProfile } from "@/components/class-profile"
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
  const { user } = useAuth();
  const c = row.original as Class;
  const isAdmin = user?.role === 'Admin';

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
        
        {isAdmin && (
          <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => (table.options.meta as any)?.editClass?.(c)}
            >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar</span>
            </Button>

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Apagar</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Confirmar Exclusão</DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja apagar a turma <strong>{c.name}</strong>? Esta ação não pode ser desfeita.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                         <DialogClose asChild>
                            <Button variant="destructive" onClick={() => (table.options.meta as any)?.deleteClass?.(c.id)}>Apagar Turma</Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
          </>
        )}
    </div>
  )
}
