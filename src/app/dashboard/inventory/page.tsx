
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlusCircle, MoreHorizontal, ArrowDown, ArrowUp, Pencil, Trash2, Search, X, CircleX, Eye, ChevronLeft, Home } from "lucide-react"
import { InventoryItemForm } from "@/components/inventory-item-form";
import { StockMovementForm } from "@/components/stock-movement-form";
import { InventoryItemProfile } from "@/components/inventory-item-profile";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { InventoryItem } from "@/types";
import { toast } from "@/hooks/use-toast";
import { getDisplayAvatarUrl, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockInventoryItems } from "@/lib/mock-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function InventoryPage() {
    const { hasPermission } = useAuth();
    const isMobile = useIsMobile();
    const router = useRouter();
    const { handleLinkClick } = useLoading();
    const canEdit = hasPermission('inventory:edit');
    
    const [items, setItems] = React.useState<InventoryItem[]>(mockInventoryItems);
    const [search, setSearch] = React.useState("");
    const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<InventoryItem | undefined>(undefined);
    const [selectedItemForProfile, setSelectedItemForProfile] = React.useState<InventoryItem | null>(null);
    const [activeMovement, setActiveMovement] = React.useState<{ item: InventoryItem, type: 'entrada' | 'saida' } | null>(null);

    const displayedItems = React.useMemo(() => {
        return items
            .filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }, [items, search]);

    const handleSaveItem = (data: any) => {
        if (editingItem) {
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...data } : i));
            toast({ title: "Item Atualizado!" });
        } else {
            const newItem: InventoryItem = {
                id: `INV-${Math.floor(Math.random() * 1000)}`,
                ...data,
                movements: [],
                status: 'Ativo'
            };
            setItems(prev => [newItem, ...prev]);
            toast({ title: "Item Cadastrado!" });
        }
        setIsFormOpen(false);
        setEditingItem(undefined);
    };

    const handleDelete = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        toast({ title: "Item Removido" });
    }

    const handleStockMovement = (itemId: string, data: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newStock = data.type === 'entrada' ? item.stock + data.quantity : item.stock - data.quantity;
                const newMovement = {
                    date: new Date().toISOString(),
                    type: data.type,
                    quantity: data.quantity,
                    user: "Usuário Atual",
                    notes: data.notes
                };
                return { 
                    ...item, 
                    stock: newStock,
                    movements: [newMovement, ...(item.movements || [])]
                };
            }
            return item;
        }));
        toast({ title: "Movimentação Realizada!" });
    };

    const handleBack = () => {
        handleLinkClick();
        router.back();
    };

    const handleHome = () => {
        handleLinkClick('/dashboard');
        router.push('/dashboard');
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-8">
            <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleBack}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleHome}>
                            <Home className="h-4 w-4" />
                        </Button>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">Inventário</h1>
                        <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">Controle os materiais e suprimentos do seu clube.</p>
                    </div>
                </div>
                 <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingItem(undefined); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-accent hover:bg-accent/90 h-10 w-9 sm:w-auto px-0 sm:px-4" disabled={!canEdit}>
                            <PlusCircle className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Novo Item</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader><DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle></DialogHeader>
                        <InventoryItemForm item={editingItem} categories={['Material Didático', 'Material de Escritório', 'Limpeza']} onSave={handleSaveItem} onCancel={() => setIsFormOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader className="p-3 sm:p-6">
                    <div className="flex flex-row items-center justify-between gap-2">
                        {!isSearchExpanded && <CardTitle className="text-sm sm:text-lg">Estoque</CardTitle>}
                         <div className={cn("flex items-center gap-1.5 ml-auto", isSearchExpanded && "w-full")}>
                            {isMobile ? (
                                isSearchExpanded ? (
                                    <div className="relative flex-1 flex items-center gap-1">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input 
                                                autoFocus
                                                placeholder="Buscar..." 
                                                value={search} 
                                                onChange={(e) => setSearch(e.target.value)} 
                                                className="h-8 pl-7 text-[10px] w-full" 
                                            />
                                            {search && (
                                                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-8 w-8" onClick={() => setSearch("")}>
                                                    <CircleX className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSearchExpanded(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsSearchExpanded(true)}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                )
                            ) : (
                                <div className="relative max-w-[200px]">
                                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                   <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" />
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-[10px] sm:text-xs px-2">Foto</TableHead>
                                <TableHead className="text-[10px] sm:text-xs px-2">Item</TableHead>
                                <TableHead className="text-[10px] sm:text-xs px-2 hidden md:table-cell">Categoria</TableHead>
                                <TableHead className="text-[10px] sm:text-xs px-2 w-16 hidden md:table-cell">Mínimo</TableHead>
                                <TableHead className="text-[10px] sm:text-xs px-2 w-16">Atual</TableHead>
                                <TableHead className="text-right text-[10px] sm:text-xs px-2">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedItems.map((item) => {
                                const isLow = item.stock <= item.minStock;
                                return (
                                    <TableRow key={item.id} className={isLow ? 'bg-red-500/5' : ''}>
                                        <TableCell className="p-2">
                                            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border"><AvatarImage src={getDisplayAvatarUrl(item.imageUrl)} /><AvatarFallback>IT</AvatarFallback></Avatar>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <div className="font-bold text-[10px] sm:text-sm truncate max-w-[80px] sm:max-w-none">{item.name}</div>
                                            <div className="md:hidden">
                                                <Badge 
                                                    variant={isLow ? "destructive" : "outline"} 
                                                    className={cn(
                                                        "h-3.5 text-[8px] py-0 px-1 mt-0.5", 
                                                        !isLow && "bg-green-500/10 text-green-600 border-green-200"
                                                    )}
                                                >
                                                    {isLow ? "Baixo" : "Estável"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-2 hidden md:table-cell">
                                            <div className="text-[10px] sm:text-xs text-muted-foreground">{item.category}</div>
                                        </TableCell>
                                        <TableCell className="p-2 hidden md:table-cell">
                                            <span className="font-mono text-[10px] sm:text-sm text-muted-foreground">{item.minStock}</span>
                                        </TableCell>
                                        <TableCell className="p-2">
                                            <div className="flex items-center gap-1 sm:gap-3">
                                                <span className={cn("font-mono text-[10px] sm:text-sm font-bold", isLow && "text-red-600")}>{item.stock}</span>
                                                <div className="hidden lg:block w-24">
                                                    <Progress value={(item.stock / item.maxStock) * 100} className="h-2" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-2 text-right">
                                            <div className="flex justify-end gap-0.5 sm:gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 sm:h-8 sm:w-8 text-accent hover:text-accent hover:bg-accent/10" 
                                                    onClick={() => setSelectedItemForProfile(item)}
                                                >
                                                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                </Button>

                                                <div className="hidden md:flex gap-0.5 sm:gap-1">
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" 
                                                        onClick={() => setActiveMovement({ item, type: 'entrada' })}
                                                    >
                                                        <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="icon" 
                                                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-600"
                                                        onClick={() => setActiveMovement({ item, type: 'saida' })}
                                                    >
                                                        <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                                            <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <div className="md:hidden">
                                                            <DropdownMenuItem onClick={() => setActiveMovement({ item, type: 'entrada' })}>
                                                                <ArrowUp className="mr-2 h-4 w-4 text-green-600" /> Registrar Entrada
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setActiveMovement({ item, type: 'saida' })}>
                                                                <ArrowDown className="mr-2 h-4 w-4 text-red-600" /> Registrar Saída
                                                            </DropdownMenuItem>
                                                        </div>
                                                        <DropdownMenuItem onClick={() => { setEditingItem(item); setIsFormOpen(true); }}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Apagar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedItemForProfile} onOpenChange={(open) => !open && setSelectedItemForProfile(null)}>
                <DialogContent className="sm:max-w-[80vw] p-0">
                    <DialogHeader className="p-6">
                        <DialogTitle>Ficha do Item: {selectedItemForProfile?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedItemForProfile && <InventoryItemProfile item={selectedItemForProfile} />}
                </DialogContent>
            </Dialog>

            <Dialog open={!!activeMovement} onOpenChange={(open) => !open && setActiveMovement(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar {activeMovement?.type === 'entrada' ? 'Entrada' : 'Saída'}</DialogTitle>
                    </DialogHeader>
                    {activeMovement && (
                        <StockMovementForm 
                            item={activeMovement.item} 
                            type={activeMovement.type} 
                            onSave={(id, data) => {
                                handleStockMovement(id, data);
                                setActiveMovement(null);
                            }} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
