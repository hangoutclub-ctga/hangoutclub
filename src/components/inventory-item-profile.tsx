"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, History, ArrowDown, ArrowUp, FileText } from "lucide-react";
import { InventoryItem } from "@/types";
import { getDisplayAvatarUrl, cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface InventoryItemProfileProps {
    item: InventoryItem;
}

export function InventoryItemProfile({ item }: InventoryItemProfileProps) {
    if (!item) return null;

    const stockPercentage = (item.maxStock > 0) ? (item.stock / item.maxStock) * 100 : 0;
    const isLowStock = item.stock <= item.minStock;

    return (
        <div className="flex flex-col gap-6 p-6 pt-0 max-h-[80vh] overflow-y-auto">
             <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-card flex-shrink-0 bg-muted flex items-center justify-center">
                     <Image 
                        src={getDisplayAvatarUrl(item.imageUrl)} 
                        alt={item.name} 
                        fill
                        className="object-cover" 
                        data-ai-hint="inventory item"
                    />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h2 className="text-2xl font-black text-primary">{item.name}</h2>
                    <Badge variant="outline" className="text-sm">{item.category}</Badge>
                </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <Package className="h-5 w-5 text-accent"/>
                        <CardTitle className="text-lg">Estado Atual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-sm">Capacidade de Estoque</span>
                                <span className="font-mono text-sm font-semibold">{item.stock} / {item.maxStock}</span>
                            </div>
                            <Progress value={stockPercentage} className="h-2" />
                        </div>
                         <div className="grid grid-cols-2 gap-4 text-center border rounded-lg p-4 bg-muted/5">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase">Mínimo</p>
                                <p className="font-mono text-xl font-black text-primary">{item.minStock}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase">Atual</p>
                                <p className={cn("font-mono text-xl font-black", isLowStock ? "text-red-600" : "text-green-600")}>{item.stock}</p>
                            </div>
                         </div>
                         {isLowStock && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-md border border-red-100 text-xs font-bold">
                                <AlertTriangle className="h-4 w-4" />
                                Item em nível crítico. Necessita reposição.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader className="flex flex-row items-center gap-2 pb-2">
                        <History className="h-5 w-5 text-accent"/>
                        <CardTitle className="text-lg">Histórico de Movimentação</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-64">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/5">
                                        <TableHead className="h-9 text-[10px] font-bold">Data</TableHead>
                                        <TableHead className="h-9 text-[10px] font-bold">Tipo</TableHead>
                                        <TableHead className="h-9 text-[10px] font-bold">Qtd.</TableHead>
                                        <TableHead className="h-9 text-[10px] font-bold text-right">Motivo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {item.movements && item.movements.length > 0 ? (
                                        [...item.movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((move, index) => (
                                            <TableRow key={index} className="hover:bg-muted/5">
                                                <TableCell className="py-2 text-[10px]">{new Date(move.date).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell className="py-2">
                                                    <div className={cn("flex items-center gap-1 text-[10px] font-bold uppercase", move.type === 'entrada' ? 'text-green-600' : 'text-red-600')}>
                                                        {move.type === 'entrada' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3" />}
                                                        {move.type}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 font-mono text-[10px] font-bold">{move.quantity}</TableCell>
                                                <TableCell className="py-2 text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                <FileText className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Detalhes da Movimentação</DialogTitle>
                                                                <CardDescription>{new Date(move.date).toLocaleString('pt-BR')}</CardDescription>
                                                            </DialogHeader>
                                                            <div className="py-4 space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div><p className="text-xs font-bold text-muted-foreground uppercase">Usuário</p><p className="text-sm">{move.user}</p></div>
                                                                    <div><p className="text-xs font-bold text-muted-foreground uppercase">Quantidade</p><p className="text-sm">{move.quantity}</p></div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-muted-foreground uppercase">Observações</p>
                                                                    <p className="text-sm p-3 bg-muted rounded-md italic">"{move.notes || 'Sem observações.'}"</p>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground italic">Nenhuma movimentação registrada.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}