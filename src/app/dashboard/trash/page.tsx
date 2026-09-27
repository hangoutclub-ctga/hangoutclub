"use client";

import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Undo,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Menu,
  ChevronLeft,
  Home,
  ShieldAlert,
  Calendar,
  GraduationCap,
  Layers,
  Package,
  Users,
  ShieldCheck,
  DollarSign,
  Tags,
  BookOpen,
  Clock,
  FileText,
  User as UserIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useLoading } from "@/hooks/use-loading";
import { useData } from "@/hooks/use-data";
import { formatCurrency, getDisplayAvatarUrl } from "@/lib/utils";
import { extractDeletionAudit, extractUserDeletionAudit, cleanAuditTag, formatAuditDate } from "@/lib/audit-utils";
import { DeletionAudit } from "@/types";

interface AuditDetailItem {
  name: string;
  category: string;
  audit: DeletionAudit | null;
}

interface ItemToDelete {
  collectionType:
    | "students"
    | "classes"
    | "inventory"
    | "agenda"
    | "finance_transaction"
    | "finance_fixed"
    | "employees"
    | "system_category"
    | "event_type";
  id: string;
  name: string;
}

export default function TrashPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  const [activeTab, setActiveTab] = useState("students");

  const {
    students,
    classes,
    inventoryItems,
    manualEvents,
    transactions,
    fixedExpenses,
    users,
    systemCategories,
    eventTypes,
    updateStudent,
    deleteStudent,
    updateClass,
    deleteClass,
    updateInventoryItem,
    deleteInventoryItem,
    updateEvent,
    deleteEvent,
    updateTransaction,
    deleteTransaction,
    updateFixedExpense,
    deleteFixedExpense,
    updateUser,
    deleteUser,
    updateSystemCategory,
    deleteSystemCategory,
    updateEventType,
    deleteEventType,
    isLoading,
  } = useData();

  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [viewingAudit, setViewingAudit] = useState<AuditDetailItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const MASTER_PASSWORD = "@Neosist2025";

  // ========================
  // FILTRAGEM DOS ITENS APAGADOS
  // ========================
  const deletedStudents = useMemo(() => {
    return students.filter((s) => s.status === "Apagado");
  }, [students]);

  const deletedClasses = useMemo(() => {
    return classes.filter((c) => c.status === "Apagado");
  }, [classes]);

  const deletedInventory = useMemo(() => {
    return inventoryItems.filter((i) => i.status === "Apagado");
  }, [inventoryItems]);

  const deletedEvents = useMemo(() => {
    return manualEvents.filter((e) => e.type === "Apagado");
  }, [manualEvents]);

  const deletedTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === "Apagado");
  }, [transactions]);

  const deletedFixedExpenses = useMemo(() => {
    return fixedExpenses.filter((fe) => fe.status === "Apagado");
  }, [fixedExpenses]);

  const deletedEmployees = useMemo(() => {
    return users.filter((u) => u.role === "Apagado");
  }, [users]);

  const deletedSystemCategories = useMemo(() => {
    return systemCategories.filter((c) => c.type === "Apagado");
  }, [systemCategories]);

  const deletedEventTypes = useMemo(() => {
    return eventTypes.filter((et) => et.name.startsWith("[Apagado]"));
  }, [eventTypes]);

  const totalDeletedCategoriesCount =
    deletedSystemCategories.length + deletedEventTypes.length;
  const totalDeletedFinanceCount =
    deletedTransactions.length + deletedFixedExpenses.length;

  const tabCounts: { [key: string]: number } = {
    agenda: deletedEvents.length,
    students: deletedStudents.length,
    classes: deletedClasses.length,
    categories: totalDeletedCategoriesCount,
    inventory: deletedInventory.length,
    employees: deletedEmployees.length,
    roles: 0,
    finance: totalDeletedFinanceCount,
  };

  const tabOptions = [
    { value: "agenda", label: "Agenda", icon: Calendar },
    { value: "students", label: "Alunos", icon: GraduationCap },
    { value: "classes", label: "Turmas", icon: Layers },
    { value: "categories", label: "Categorias", icon: Tags },
    { value: "inventory", label: "Inventário", icon: Package },
    { value: "employees", label: "Funcionários", icon: Users },
    { value: "roles", label: "Cargos", icon: ShieldCheck },
    { value: "finance", label: "Finanças", icon: DollarSign },
  ];

  // ========================
  // RESTAURAÇÃO DE ITENS
  // ========================
  const handleRestore = async (
    collectionType: ItemToDelete["collectionType"],
    id: string,
    extraData?: any
  ) => {
    setIsRestoring(id);
    try {
      switch (collectionType) {
        case "students": {
          const cleanMed = cleanAuditTag(extraData?.medicalInfo);
          await updateStudent(id, { status: "Ativo", medicalInfo: cleanMed });
          toast({ title: "Aluno Restaurado!", description: "O aluno retornou à lista de alunos ativos." });
          break;
        }

        case "classes": {
          const cleanSched = cleanAuditTag(extraData?.schedule);
          await updateClass(id, { status: "Ativa", schedule: cleanSched });
          toast({ title: "Turma Restaurada!", description: "A turma retornou à lista de turmas ativas." });
          break;
        }

        case "inventory": {
          const cleanCat = cleanAuditTag(extraData?.category);
          await updateInventoryItem(id, { status: "Ativo", category: cleanCat });
          toast({ title: "Item Restaurado!", description: "O item retornou ao inventário ativo." });
          break;
        }

        case "agenda": {
          const match = extraData?.details?.match(/\[ORIG_TYPE:([^\]]+)\]/);
          const origType = match ? match[1] : "task";
          const cleanDetails = cleanAuditTag(extraData?.details?.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, ""));
          await updateEvent(id, { type: origType as any, details: cleanDetails });
          toast({ title: "Evento Restaurado!", description: "O evento retornou à Agenda." });
          break;
        }

        case "finance_transaction": {
          const match = extraData?.description?.match(/\[ORIG_TYPE:([^\]]+)\]/);
          const origType = match ? match[1] : "Entrada";
          const cleanDesc = cleanAuditTag(extraData?.description?.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, ""));
          await updateTransaction(id, { type: origType as any, description: cleanDesc });
          toast({ title: "Transação Restaurada!", description: "A transação retornou ao Financeiro." });
          break;
        }

        case "finance_fixed": {
          const cleanDesc = cleanAuditTag(extraData?.description);
          await updateFixedExpense(id, { status: "Pendente", description: cleanDesc });
          toast({ title: "Despesa Fixa Restaurada!", description: "A despesa retornou ao Financeiro." });
          break;
        }

        case "employees": {
          const rolePerm = extraData?.permissions?.find((p: string) => p.startsWith("PREV_ROLE:"));
          const origRole = rolePerm ? rolePerm.replace("PREV_ROLE:", "") : "Professor";
          const cleanPerms = (extraData?.permissions || []).filter((p: string) => !p.startsWith("PREV_ROLE:") && !p.startsWith("DELETION_AUDIT:"));
          await updateUser(id, { role: origRole, permissions: cleanPerms });
          toast({ title: "Funcionário Restaurado!", description: "O colaborador retornou à equipe ativa." });
          break;
        }

        case "system_category": {
          const match = extraData?.description?.match(/\[ORIG_TYPE:([^\]]+)\]/);
          const origType = match ? match[1] : "student_condition";
          const cleanDesc = cleanAuditTag(extraData?.description?.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, ""));
          await updateSystemCategory(id, { type: origType as any, description: cleanDesc });
          toast({ title: "Categoria Restaurada!", description: "A categoria retornou às configurações ativas." });
          break;
        }

        case "event_type": {
          const cleanName = extraData?.name?.replace(/^\[Apagado\]\s*/, "") || "";
          const cleanDesc = cleanAuditTag(extraData?.description);
          await updateEventType(id, { name: cleanName, description: cleanDesc });
          toast({ title: "Tipo de Evento Restaurado!", description: "O tipo retornou à Agenda." });
          break;
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao restaurar",
        description: err.message || "Não foi possível restaurar o item.",
      });
    } finally {
      setIsRestoring(null);
    }
  };

  // ========================
  // EXCLUSÃO PERMANENTE COM SENHA MESTRA
  // ========================
  const handleOpenDeleteDialog = (
    collectionType: ItemToDelete["collectionType"],
    id: string,
    name: string
  ) => {
    setItemToDelete({ collectionType, id, name });
    setIsDeleteDialogOpen(true);
    setAdminPassword("");
  };

  const handlePermanentDelete = async () => {
    if (adminPassword !== MASTER_PASSWORD) {
      toast({ title: "Senha Incorreta", description: "A senha mestra informada não confere.", variant: "destructive" });
      return;
    }
    if (!itemToDelete) return;

    setIsDeleting(itemToDelete.id);
    try {
      switch (itemToDelete.collectionType) {
        case "students":
          await deleteStudent(itemToDelete.id, false);
          break;
        case "classes":
          await deleteClass(itemToDelete.id, false);
          break;
        case "inventory":
          await deleteInventoryItem(itemToDelete.id, false);
          break;
        case "agenda":
          await deleteEvent(itemToDelete.id, false);
          break;
        case "finance_transaction":
          await deleteTransaction(itemToDelete.id, false);
          break;
        case "finance_fixed":
          await deleteFixedExpense(itemToDelete.id, false);
          break;
        case "employees":
          await deleteUser(itemToDelete.id, false);
          break;
        case "system_category":
          await deleteSystemCategory(itemToDelete.id, false);
          break;
        case "event_type":
          await deleteEventType(itemToDelete.id, false);
          break;
      }

      toast({
        title: "Excluído Permanentemente!",
        description: `"${itemToDelete.name}" foi apagado em definitivo do banco de dados.`,
      });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setAdminPassword("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro na exclusão definitiva",
        description: err.message || "Falha ao apagar o registro do banco de dados.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const renderEmptyState = (itemType: string) => (
    <TableRow>
      <TableCell colSpan={5} className="h-28 text-center text-muted-foreground italic text-xs sm:text-sm">
        Nenhum(a) {itemType} na lixeira no momento.
      </TableCell>
    </TableRow>
  );

  const handleBack = () => {
    handleLinkClick();
    router.back();
  };

  const handleHome = () => {
    handleLinkClick("/dashboard");
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-8 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-accent"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-accent"
              onClick={handleHome}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">
              Lixeira do Sistema
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">
              Gerencie, restaure ou exclua definitivamente itens apagados com a senha mestra.
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
            <DropdownMenuContent align="end" className="w-56">
              {tabOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setActiveTab(opt.value)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4" /> {opt.label}
                  </span>
                  {tabCounts[opt.value] > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] bg-red-100 text-red-700 font-bold">
                      {tabCounts[opt.value]}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!isMobile && (
          <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 mb-6 gap-1">
            {tabOptions.map((opt) => (
              <TabsTrigger
                key={opt.value}
                value={opt.value}
                className="flex items-center gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-3 text-xs font-semibold"
              >
                <opt.icon className="h-3.5 w-3.5" />
                <span>{opt.label}</span>
                {tabCounts[opt.value] > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[9px] bg-red-100 text-red-700 font-bold">
                    {tabCounts[opt.value]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {/* ============================================================ */}
        {/* ABA: AGENDA */}
        {/* ============================================================ */}
        <TabsContent value="agenda" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Eventos Apagados da Agenda
              </CardTitle>
              <CardDescription className="text-xs">
                Eventos e compromissos removidos que podem ser restaurados para a Agenda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedEvents.length > 0
                    ? deletedEvents.map((e) => {
                        const cleanDetails = cleanAuditTag(e.details?.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, "")) || "Sem detalhes";
                        const audit = extractDeletionAudit(e.details);
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="font-bold">{e.title}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{e.time || "--:--"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{cleanDetails}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Ver motivo da exclusão"
                                onClick={() => setViewingAudit({ name: e.title, category: "Agenda", audit })}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore("agenda", e.id!, e)}
                                disabled={isRestoring === e.id}
                              >
                                {isRestoring === e.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                Restaurar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog("agenda", e.id!, e.title)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : renderEmptyState("evento")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ABA: ALUNOS */}
        {/* ============================================================ */}
        <TabsContent value="students" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Alunos Apagados
              </CardTitle>
              <CardDescription className="text-xs">
                Alunos excluídos que podem ser recuperados ou deletados permanentemente do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma / Condição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedStudents.length > 0
                    ? deletedStudents.map((s) => {
                        const audit = extractDeletionAudit(s.medicalInfo);
                        return (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div className="font-bold">{s.name}</div>
                              {s.email && <div className="text-[10px] text-muted-foreground">{s.email}</div>}
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className="font-medium">{s.class || "Sem turma"}</span>
                              <span className="text-muted-foreground"> ({s.studentCondition})</span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.guardianName}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Ver motivo da exclusão"
                                onClick={() => setViewingAudit({ name: s.name, category: "Aluno", audit })}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore("students", s.id, s)}
                                disabled={isRestoring === s.id}
                              >
                                {isRestoring === s.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                Restaurar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog("students", s.id, s.name)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : renderEmptyState("aluno")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ABA: TURMAS */}
        {/* ============================================================ */}
        <TabsContent value="classes" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Turmas Apagadas
              </CardTitle>
              <CardDescription className="text-xs">
                Turmas que foram apagadas do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Turma</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedClasses.length > 0
                    ? deletedClasses.map((c) => {
                        const audit = extractDeletionAudit(c.schedule);
                        const cleanSched = cleanAuditTag(c.schedule) || "--:--";
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-bold">{c.name}</TableCell>
                            <TableCell className="text-xs">{c.modality || "Regular"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{c.teacher || "Não atribuído"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{cleanSched}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Ver motivo da exclusão"
                                onClick={() => setViewingAudit({ name: c.name, category: "Turma", audit })}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore("classes", c.id, c)}
                                disabled={isRestoring === c.id}
                              >
                                {isRestoring === c.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                Restaurar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog("classes", c.id, c.name)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : renderEmptyState("turma")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ABA: CATEGORIAS */}
        {/* ============================================================ */}
        <TabsContent value="categories" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" /> Categorias e Tipos Apagados
              </CardTitle>
              <CardDescription className="text-xs">
                Condições de aluno, modalidades de turma, categorias de estoque e tipos de compromissos removidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Módulo Original</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totalDeletedCategoriesCount > 0 ? (
                    <>
                      {deletedSystemCategories.map((c) => {
                        const match = c.description?.match(/\[ORIG_TYPE:([^\]]+)\]/);
                        const origType = match ? match[1] : "Categoria";
                        const typeLabels: { [key: string]: string } = {
                          student_condition: "Condição do Aluno",
                          class_modality: "Modalidade de Turma",
                          inventory_category: "Categoria de Estoque",
                        };
                        const audit = extractDeletionAudit(c.description);
                        const cleanDesc = cleanAuditTag(c.description?.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, "")) || "--";

                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-bold flex items-center gap-2">
                              {c.color && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />}
                              {c.name}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">
                              {typeLabels[origType] || origType}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{cleanDesc}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Ver motivo da exclusão"
                                onClick={() => setViewingAudit({ name: c.name, category: `Categoria (${typeLabels[origType] || origType})`, audit })}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore("system_category", c.id, c)}
                                disabled={isRestoring === c.id}
                              >
                                {isRestoring === c.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                Restaurar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog("system_category", c.id, c.name)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {deletedEventTypes.map((et) => {
                        const cleanName = et.name.replace(/^\[Apagado\]\s*/, "");
                        const audit = extractDeletionAudit(et.description);
                        const cleanDesc = cleanAuditTag(et.description) || "--";
                        return (
                          <TableRow key={et.id}>
                            <TableCell className="font-bold flex items-center gap-2">
                              {et.color && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: et.color }} />}
                              {cleanName}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-primary">Tipo de Evento (Agenda)</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{cleanDesc}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Ver motivo da exclusão"
                                onClick={() => setViewingAudit({ name: cleanName, category: "Tipo de Evento", audit })}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore("event_type", et.id, et)}
                                disabled={isRestoring === et.id}
                              >
                                {isRestoring === et.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                Restaurar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog("event_type", et.id, cleanName)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ) : (
                    renderEmptyState("categoria")
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ABA: INVENTÁRIO */}
        {/* ============================================================ */}
        <TabsContent value="inventory" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Inventário Apagado
              </CardTitle>
              <CardDescription className="text-xs">
                Itens de materiais didáticos e suprimentos excluídos do estoque.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedInventory.length > 0
                    ? deletedInventory.map((i) => {
                        const audit = extractDeletionAudit(i.category) || (
                          i.movements?.find((m) => m.notes?.startsWith("[EXCLUSÃO]"))
                            ? {
                                reason: i.movements.find((m) => m.notes?.startsWith("[EXCLUSÃO]"))!.notes!.replace("[EXCLUSÃO] ", ""),
                                deletedBy: i.movements.find((m) => m.notes?.startsWith("[EXCLUSÃO]"))!.user || "Desconhecido",
                                deletedAt: i.movements.find((m) => m.notes?.startsWith("[EXCLUSÃO]"))!.date || new Date().toISOString(),
                              }
                            : null
                        );
                        const cleanCat = cleanAuditTag(i.category) || "Sem categoria";
                        return (
                          <TableRow key={i.id}>
                            <TableCell className="font-bold">{i.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{cleanCat}</TableCell>
                            <TableCell className="text-xs font-mono">{i.stock} un.</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Ver motivo da exclusão"
                                onClick={() => setViewingAudit({ name: i.name, category: "Inventário", audit })}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore("inventory", i.id, i)}
                                disabled={isRestoring === i.id}
                              >
                                {isRestoring === i.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                Restaurar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog("inventory", i.id, i.name)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : renderEmptyState("item")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ABA: FUNCIONÁRIOS */}
        {/* ============================================================ */}
        <TabsContent value="employees" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Funcionários Apagados
              </CardTitle>
              <CardDescription className="text-xs">
                Colaboradores desativados que podem ser reintegrados ou removidos definitivamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Cargo Anterior</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedEmployees.length > 0
                    ? deletedEmployees.map((u) => {
                        const rolePerm = u.permissions?.find((p) => p.startsWith("PREV_ROLE:"));
                        const origRole = rolePerm ? rolePerm.replace("PREV_ROLE:", "") : "Professor";
                        const audit = extractUserDeletionAudit(u.permissions);
                        return (
                          <TableRow key={u.id}>
                            <TableCell className="p-2 sm:p-4">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="h-8 w-8 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
                                  <img src={getDisplayAvatarUrl(u.avatar)} alt={u.nickname} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-xs sm:text-sm">{u.nickname}</span>
                                  <span className="text-[10px] text-muted-foreground">{u.email}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                {origRole}
                              </span>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                title="Ver motivo da exclusão"
                                onClick={() => setViewingAudit({ name: u.nickname, category: "Funcionário", audit })}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore("employees", u.id, u)}
                                disabled={isRestoring === u.id}
                              >
                                {isRestoring === u.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                Restaurar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleOpenDeleteDialog("employees", u.id, u.nickname)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    : renderEmptyState("funcionário")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ABA: CARGOS */}
        {/* ============================================================ */}
        <TabsContent value="roles" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Cargos do Sistema
              </CardTitle>
              <CardDescription className="text-xs">
                Informações sobre integridade e segurança de cargos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed rounded-xl bg-muted/10">
                <ShieldAlert className="h-10 w-10 text-primary mb-3" />
                <h3 className="font-bold text-sm text-foreground">Cargos Estruturais Protegidos</h3>
                <p className="text-xs text-muted-foreground max-w-md mt-1">
                  Os cargos padrão da instituição (Admin, Professor, Secretaria, Diarista) são papéis essenciais protegidos contra exclusão acidental para preservar os acessos e permissões do sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* ABA: FINANÇAS */}
        {/* ============================================================ */}
        <TabsContent value="finance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Registros Financeiros Apagados
              </CardTitle>
              <CardDescription className="text-xs">
                Transações de entradas/saídas e despesas fixas removidas que podem ser restauradas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transações */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Transações</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedTransactions.length > 0
                      ? deletedTransactions.map((t) => {
                          const match = t.description?.match(/\[ORIG_TYPE:([^\]]+)\]/);
                          const origType = match ? match[1] : "Entrada";
                          const audit = extractDeletionAudit(t.description);
                          const cleanDesc = cleanAuditTag(t.description?.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, "")) || t.name;
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="font-bold">
                                {cleanDesc}
                                {t.name && <div className="text-[10px] text-muted-foreground font-normal">{t.name}</div>}
                              </TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className={origType === "Entrada" ? "text-green-600 border-green-300" : "text-red-600 border-red-300"}>
                                  {origType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold text-xs">
                                {formatCurrency(t.value)}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Ver motivo da exclusão"
                                  onClick={() => setViewingAudit({ name: cleanDesc, category: "Transação Financeira", audit })}
                                  className="text-primary hover:text-primary hover:bg-primary/10"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestore("finance_transaction", t.id, t)}
                                  disabled={isRestoring === t.id}
                                >
                                  {isRestoring === t.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                  Restaurar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOpenDeleteDialog("finance_transaction", t.id, cleanDesc)}
                                >
                                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      : renderEmptyState("transação")}
                  </TableBody>
                </Table>
              </div>

              {/* Despesas Fixas */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Despesas Fixas</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Despesa</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedFixedExpenses.length > 0
                      ? deletedFixedExpenses.map((fe) => {
                          const audit = extractDeletionAudit(fe.description);
                          const cleanDesc = cleanAuditTag(fe.description) || fe.description;
                          return (
                            <TableRow key={fe.id}>
                              <TableCell className="font-bold">{cleanDesc}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">Dia {fe.dueDate}</TableCell>
                              <TableCell className="text-right font-mono font-bold text-xs">
                                {formatCurrency(fe.value)}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Ver motivo da exclusão"
                                  onClick={() => setViewingAudit({ name: cleanDesc, category: "Despesa Fixa", audit })}
                                  className="text-primary hover:text-primary hover:bg-primary/10"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestore("finance_fixed", fe.id, fe)}
                                  disabled={isRestoring === fe.id}
                                >
                                  {isRestoring === fe.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo className="mr-1 h-3.5 w-3.5" />}
                                  Restaurar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOpenDeleteDialog("finance_fixed", fe.id, cleanDesc)}
                                >
                                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      : renderEmptyState("despesa fixa")}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* DIÁLOGO DE EXCLUSÃO DEFINITIVA COM SENHA MESTRA */}
      {/* ============================================================ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Confirmar Exclusão Permanente
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong> e apagará o registro permanentemente do banco de dados.
            </DialogDescription>
          </DialogHeader>

          {itemToDelete && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs">
              <span className="font-semibold text-destructive">Item selecionado:</span>{" "}
              <span className="font-bold text-foreground">{itemToDelete.name}</span>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Label htmlFor="admin-password">Insira a Senha Mestra para autorizar:</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a senha mestra..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePermanentDelete();
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handlePermanentDelete}
              disabled={!adminPassword || !!isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIÁLOGO DE AUDITORIA DO MOTIVO DA EXCLUSÃO (ÍCONE LIVRO)     */}
      {/* ============================================================ */}
      <Dialog open={!!viewingAudit} onOpenChange={(open) => !open && setViewingAudit(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <BookOpen className="h-5 w-5" /> Motivo da Exclusão
            </DialogTitle>
            <DialogDescription>
              Registro de auditoria e justificativa fornecida no momento da exclusão do item.
            </DialogDescription>
          </DialogHeader>

          {viewingAudit && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/40 border rounded-xl p-3.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Excluído</span>
                  <Badge variant="outline" className="text-xs font-medium">
                    {viewingAudit.category}
                  </Badge>
                </div>
                <span className="font-bold text-base text-foreground break-words">
                  {viewingAudit.name}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Justificativa / Motivo
                </Label>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                  {viewingAudit.audit?.reason || (
                    <span className="italic text-muted-foreground font-normal">
                      Item excluído anteriormente sem justificativa gravada no sistema.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-card">
                  <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-medium text-muted-foreground">Excluído por</span>
                    <span className="text-xs font-semibold truncate text-foreground">
                      {viewingAudit.audit?.deletedBy || "Usuário não identificado"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-card">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-medium text-muted-foreground">Data e Horário</span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatAuditDate(viewingAudit.audit?.deletedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setViewingAudit(null)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
