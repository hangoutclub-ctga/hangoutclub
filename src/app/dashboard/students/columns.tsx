
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Student } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { cn, getDisplayAvatarUrl } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"

export const columns: ColumnDef<Student>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "avatarUrl",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Foto" />
    ),
    cell: ({ row }) => {
      const student = row.original;
      const displayUrl = getDisplayAvatarUrl(student.avatarUrl);
      return (
        <div 
          data-no-row-click="true"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <Dialog>
              <DialogTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={displayUrl} alt={student.name} data-ai-hint="student avatar" />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
              </DialogTrigger>
              <DialogContent className="w-auto max-w-[90vw] sm:max-w-md p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center overflow-hidden border bg-card shadow-2xl [&>button]:bg-background/80 [&>button]:backdrop-blur-xs [&>button]:rounded-full [&>button]:p-1.5 [&>button]:shadow-md [&>button]:z-20 [&>button]:top-2 [&>button]:right-2 sm:[&>button]:top-3 sm:[&>button]:right-3">
                  <DialogTitle className="sr-only">Foto de {student.name}</DialogTitle>
                  <div className="relative w-[75vw] max-w-[320px] sm:max-w-[360px] aspect-square rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center border shadow-inner">
                      {student.avatarUrl && !student.avatarUrl.includes('placehold.co') ? (
                          <img 
                              src={getDisplayAvatarUrl(student.avatarUrl)} 
                              alt={student.name} 
                              className="w-full h-full object-cover" 
                          />
                      ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground select-none">
                              <span className="text-5xl sm:text-6xl font-black font-headline text-primary/40">
                                  {student.name.substring(0, 2).toUpperCase()}
                              </span>
                          </div>
                      )}
                  </div>
              </DialogContent>
          </Dialog>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Aluno" />
    ),
  },
  {
    accessorKey: "guardianName",
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Responsável" />
    ),
  },
  {
    accessorKey: "class",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Turma" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "studentCondition",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Condição" />
    ),
    cell: ({ row }) => {
      const studentCondition = row.getValue("studentCondition") as string
      return <Badge variant="outline">{studentCondition}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
   {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const colorClass = status === 'Ativo' ? 'bg-green-500' : 'bg-red-500';
      return <Badge className={cn('text-white', colorClass)}>{status}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <div 
        data-no-row-click="true"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <DataTableRowActions row={row} table={table} />
      </div>
    ),
  },
]
