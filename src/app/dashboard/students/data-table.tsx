
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DataTableToolbar } from "./data-table-toolbar"
import { Student, Class } from "@/types"
import { useIsMobile } from "@/hooks/use-mobile"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  classes: Class[];
  studentConditions: string[];
  onEdit: (student: TData) => void;
  onView: (student: TData) => void;
  onDelete: (studentId: string) => void;
  onBulkUpdate: (selectedIds: string[], updates: Partial<TData>) => void;
  onBulkDelete: (selectedIds: string[]) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  pageCount: number;
  currentPage: number;
}

const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
    const search = value.toLowerCase();
    const studentName = (row.original as Student).name?.toLowerCase() || '';
    const guardianName = (row.original as Student).guardianName?.toLowerCase() || '';
    return studentName.includes(search) || guardianName.includes(search);
};

export function DataTable<TData, TValue>({
  columns,
  data,
  classes,
  studentConditions,
  onEdit,
  onView,
  onDelete,
  onBulkUpdate,
  onBulkDelete,
  onNextPage,
  onPreviousPage,
  canGoNext,
  canGoPrevious,
  pageCount,
  currentPage
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile()
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  
  const longPressTimers = React.useRef<Record<string, NodeJS.Timeout>>({});

  React.useEffect(() => {
    setColumnVisibility({
      select: !isMobile,
      avatarUrl: true,
      name: true,
      guardianName: !isMobile,
      class: !isMobile,
      studentCondition: !isMobile,
      status: !isMobile,
    })
  }, [isMobile])

  const table = useReactTable({
    data,
    columns,
    pageCount: -1, 
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    meta: {
        editStudent: (student: TData) => onEdit(student),
        deleteStudent: (studentId: string) => onDelete(studentId)
    }
  })
  
  React.useEffect(() => {
    table.resetRowSelection();
  }, [data, table]);

  const handlePointerDown = (row: any) => {
    const id = row.id;
    longPressTimers.current[id] = setTimeout(() => {
        row.toggleSelected();
        if (navigator.vibrate) navigator.vibrate(50);
        delete longPressTimers.current[id];
    }, 600);
  };

  const handlePointerUp = (row: any, original: TData) => {
    const id = row.id;
    if (longPressTimers.current[id]) {
        clearTimeout(longPressTimers.current[id]);
        delete longPressTimers.current[id];
        // Foi um clique simples -> Visualizar Ficha
        onView(original);
    }
  };

  const handlePointerLeave = (row: any) => {
    const id = row.id;
    if (longPressTimers.current[id]) {
        clearTimeout(longPressTimers.current[id]);
        delete longPressTimers.current[id];
    }
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table}
        classes={classes}
        studentConditions={studentConditions}
        onBulkUpdate={(...args) => {
            onBulkUpdate(...args);
            table.resetRowSelection();
        }}
        onBulkDelete={(...args) => {
            onBulkDelete(...args);
            table.resetRowSelection();
        }}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-[10px] sm:text-xs">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onPointerDown={() => handlePointerDown(row)}
                  onPointerUp={() => handlePointerUp(row, row.original)}
                  onPointerLeave={() => handlePointerLeave(row)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 px-2 sm:px-4 text-[10px] sm:text-xs">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-[10px] sm:text-xs"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-[10px] sm:text-xs text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-sm font-medium">
                Página {currentPage} de {pageCount}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={onPreviousPage}
                disabled={!canGoPrevious}
                className="h-7 text-[10px] sm:h-8 sm:text-xs"
            >
                Anterior
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={!canGoNext}
                className="h-7 text-[10px] sm:h-8 sm:text-xs"
            >
                Próxima
            </Button>
        </div>
      </div>
    </div>
  )
}
