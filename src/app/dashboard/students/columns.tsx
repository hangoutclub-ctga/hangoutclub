
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
        <div onClick={(e) => e.stopPropagation()}>
          <Dialog>
              <DialogTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                      <AvatarImage src={displayUrl} alt={student.name} data-ai-hint="student avatar" />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                      <DialogTitle>Foto de {student.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center items-center p-4">
                       <Avatar className="h-64 w-64">
                          <AvatarImage src={displayUrl} alt={student.name} data-ai-hint="student avatar" />
                          <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
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
      <div onClick={(e) => e.stopPropagation()}>
        <DataTableRowActions row={row} table={table} />
      </div>
    ),
  },
]
