
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { DataTableRowActions } from "./data-table-row-actions"
import { Class } from "@/types";

export const columns: ColumnDef<Class>[] = [
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
    accessorKey: "name",
    header: "Turma",
  },
  {
    accessorKey: "modality",
    header: "Modalidade",
    cell: ({ row }) => {
        return <Badge variant="outline">{row.original.modality}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "teacher",
    header: "Professor",
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "studentIds",
    header: "Alunos",
    cell: ({ row }) => row.original.studentIds?.length || 0,
  },
    {
    accessorKey: "schedule",
    header: "Horário",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return <Badge className={cn('text-white', status === 'Ativa' ? 'bg-green-500' : 'bg-red-500')}>{status}</Badge>
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
