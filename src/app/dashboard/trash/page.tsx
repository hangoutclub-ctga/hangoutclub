
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Undo, Loader2, Trash2, Eye, EyeOff, Menu, ChevronLeft, Home } from "lucide-react";
import { Student, Class, InventoryItem, User } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function TrashPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  const [activeTab, setActiveTab] = useState("students");
  const [deletedStudents, setDeletedStudents] = useState<Student[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{ collectionName: string; id: string; name: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const MASTER_PASSWORD = "@Neosist2025";

  const handleRestore = (collectionName: string, id: string) => {
    toast({ title: "Item Restaurado!", description: "Simulação de restauração no protótipo." });
  };
  
  const handleOpenDeleteDialog = (collectionName: string, id: string, name: string) => {
    setItemToDelete({ collectionName, id, name });
    setIsDeleteDialogOpen(true);
    setAdminPassword("");
  }

  const handlePermanentDelete = () => {
    if (adminPassword !== MASTER_PASSWORD) {
        toast({ title: "Senha Incorreta", variant: "destructive" });
        return;
    }
    setIsDeleting(itemToDelete?.id || "");
    setTimeout(() => {
        toast({ title: "Excluído Permanentemente!" });
        setIsDeleteDialogOpen(false);
        setIsDeleting(null);
    }, 1000);
  }

  const renderEmptyState = (itemType: string) => (
    <TableRow>
      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
        Nenhum {itemType} na lixeira no momento.
      </TableCell>
    </TableRow>
  );

  const handleBack = () => {
    handleLinkClick();
    router.back();
  };

  const handleHome = () => {
    handleLinkClick('/dashboard');
    router.push('/dashboard');
  };

  const tabOptions = [
    { value: "agenda", label: "Agenda" },
    { value: "students", label: "Alunos" },
    { value: "classes", label: "Turmas" },
    { value: "categories", label: "Categorias" },
    { value: "inventory", label: "Inventário" },
    { value: "employees", label: "Funcionários" },
    { value: "roles", label: "Cargos" },
    { value: "finance", label: "Finanças" },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">
              Lixeira
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">
              Gerencie e restaure itens apagados do sistema.
            </p>
          </div>
        </div>

        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 border-accent/20">
                <Menu className="h-6 w-6 text-accent" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {tabOptions.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => setActiveTab(opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!isMobile && (
          <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 mb-6">
            {tabOptions.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="agenda" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-lg">Eventos Apagados</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{renderEmptyState("evento")}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alunos Apagados</CardTitle>
              <CardDescription className="text-xs">Itens que podem ser restaurados.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedStudents.length > 0
                    ? deletedStudents.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-bold">{s.name}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleRestore("students", s.id)}><Undo className="mr-2 h-4 w-4" /> Restaurar</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog("students", s.id, s.name)}><Trash2 className="mr-2 h-4 w-4" /> Excluir</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    : renderEmptyState("aluno")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-lg">Turmas Apagadas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{renderEmptyState("turma")}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-lg">Categorias Apagadas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{renderEmptyState("categoria")}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-lg">Inventário Apagado</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{renderEmptyState("item")}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-lg">Funcionários Apagados</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{renderEmptyState("funcionário")}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-lg">Cargos Apagados</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Cargo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{renderEmptyState("cargo")}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-0">
          <Card>
            <CardHeader><CardTitle className="text-lg">Transações Apagadas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{renderEmptyState("transação")}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Exclusão Permanente</DialogTitle>
                <DialogDescription>Esta ação é irreversível. Insira a senha mestra.</DialogDescription>
            </DialogHeader>
            <div className="pt-4">
                <Label htmlFor="admin-password">Senha Mestra</Label>
                <div className="relative">
                    <Input id="admin-password" type={showPassword ? "text" : "password"} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button variant="destructive" onClick={handlePermanentDelete} disabled={!!isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4"/>} Excluir Permanentemente
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
