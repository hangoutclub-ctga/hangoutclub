
"use client"

import { Table } from "@tanstack/react-table"
import { SlidersHorizontal, Trash2, Users, SwatchBook, ToggleRight, Check, Search, CircleX, X } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { Student, Class } from "@/types"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { useIsMobile } from "@/hooks/use-mobile"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  classes: Class[];
  studentConditions: string[];
  onBulkUpdate: (selectedIds: string[], updates: Partial<TData>) => void;
  onBulkDelete: (selectedIds: string[]) => void;
}

const columnNames: { [key: string]: string } = {
  avatarUrl: "Foto",
  name: "Aluno",
  class: "Turma",
  studentCondition: "Condição",
  guardianName: "Responsável",
  status: "Status",
};

export function DataTableToolbar<TData>({
  table,
  classes,
  studentConditions,
  onBulkUpdate,
  onBulkDelete
}: DataTableToolbarProps<TData>) {
  const isMobile = useIsMobile()
  const isRowSelected = table.getFilteredSelectedRowModel().rows.length > 0
  const activeClasses = classes.filter(c => c.status === 'Ativa');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);

  const [searchValue, setSearchValue] = React.useState<string>("");
  const debouncedSearchValue = useDebounce(searchValue, 300);

  React.useEffect(() => {
    table.setGlobalFilter(debouncedSearchValue);
  }, [debouncedSearchValue, table]);

  const getSelectedRowIds = () => {
    return table.getFilteredSelectedRowModel().rows.map(row => (row.original as Student).id);
  }

  const conditionOptions = studentConditions.map(c => ({ label: c, value: c }));

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        
        {isMobile ? (
            isSearchExpanded ? (
                <div className="relative flex-1 flex items-center gap-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Buscar..."
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            className="h-8 pl-7 pr-7 text-[10px] w-full"
                        />
                        {searchValue && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:bg-transparent"
                                onClick={() => setSearchValue("")}
                            >
                                <CircleX className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSearchExpanded(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Button variant="ghost" size="icon" className="h-8 w-8 border" onClick={() => setIsSearchExpanded(true)}>
                    <Search className="h-4 w-4" />
                </Button>
            )
        ) : (
            <div className="relative flex-1 max-w-[250px]">
                 <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                 <Input
                    placeholder="Buscar..."
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    className="h-8 pl-7 text-xs"
                />
            </div>
        )}
        
        {isRowSelected && !isSearchExpanded && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-[10px] sm:text-xs">
                Ações ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <ToggleRight className="mr-2 h-4 w-4" />
                        Mudar Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => onBulkUpdate(getSelectedRowIds(), { status: 'Ativo' } as any)}>
                            <Check className="mr-2 h-4 w-4 text-green-500" /> Ativo
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onBulkUpdate(getSelectedRowIds(), { status: 'Inativo' } as any)}>
                            <Check className="mr-2 h-4 w-4 text-red-500" /> Inativo
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Users className="mr-2 h-4 w-4" />
                        Mudar Turma
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {activeClasses.map(c => (
                            <DropdownMenuItem key={c.id} onSelect={() => onBulkUpdate(getSelectedRowIds(), { class: c.name } as any)}>{c.name}</DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <SwatchBook className="mr-2 h-4 w-4" />
                        Mudar Condição
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                         {conditionOptions.map(c => (
                            <DropdownMenuItem key={c.value} onSelect={() => onBulkUpdate(getSelectedRowIds(), { studentCondition: c.value } as any)}>{c.label}</DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => onBulkDelete(getSelectedRowIds())}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar Selecionados
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {!isSearchExpanded && (
        <div className="flex items-center space-x-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Alternar Colunas</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                .getAllColumns()
                .filter(
                    (column) =>
                    typeof column.accessorFn !== "undefined" && column.getCanHide()
                )
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {columnNames[column.id] || column.id}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )}
    </div>
  )
}
