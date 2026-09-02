
"use client"

import { Row, Table } from "@tanstack/react-table"
import { Eye, Edit, Trash2, Printer } from "lucide-react"
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
import { StudentProfile } from "@/components/student-profile"
import { Student } from "@/types"
import { useAuth } from "@/hooks/use-auth"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  table: Table<TData>
}

// Extend the table's meta property
declare module '@tanstack/react-table' {
    interface TableMeta<TData extends Record<string, unknown>> {
      editStudent: (student: TData) => void;
      deleteStudent: (studentId: string) => void;
    }
}

const handlePrint = () => {
    window.print();
};

export function DataTableRowActions<TData>({
  row,
  table,
}: DataTableRowActionsProps<TData>) {
  const { user } = useAuth();
  const student = row.original as Student;
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
                    <span className="sr-only">Ver ficha</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] p-0">
                <DialogHeader className="p-6 flex flex-row justify-between items-center">
                    <DialogTitle>Ficha do Aluno: {student.name}</DialogTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>
                <StudentProfile student={student} />
            </DialogContent>
        </Dialog>
        
        {isAdmin && (
          <>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => (table.options.meta as any)?.editStudent?.(student)}
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
                            Tem certeza que deseja apagar o aluno <strong>{student.name}</strong>? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                        </DialogClose>
                         <DialogClose asChild>
                            <Button variant="destructive" onClick={() => (table.options.meta as any)?.deleteStudent?.(student.id)}>Apagar Aluno</Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
          </>
        )}
    </div>
  )
}
