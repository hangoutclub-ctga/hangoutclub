"use client";

import React, { useState, useMemo } from "react";
import { useData } from "@/hooks/use-data";
import { EventType, SystemCategory, SystemCategoryType } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  Layers,
  GraduationCap,
  Package,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { label: "Azul", value: "#3b82f6" },
  { label: "Verde", value: "#10b981" },
  { label: "Roxo", value: "#8b5cf6" },
  { label: "Âmbar", value: "#f59e0b" },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Índigo", value: "#6366f1" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Ciano", value: "#06b6d4" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Lima", value: "#84cc16" },
  { label: "Laranja", value: "#f97316" },
  { label: "Grafite", value: "#64748b" },
];

interface GenericCategoryItem {
  id: string;
  name: string;
  color?: string;
  description?: string;
  type?: string;
}

export function CategoryManager() {
  const {
    eventTypes,
    addEventType,
    updateEventType,
    deleteEventType,
    systemCategories,
    addSystemCategory,
    updateSystemCategory,
    deleteSystemCategory,
    manualEvents,
    students,
    classes,
    inventoryItems,
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>("event-types");

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GenericCategoryItem | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete Dialog State
  const [itemToDelete, setItemToDelete] = useState<GenericCategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category Tabs Configuration
  const categoryTabs = useMemo(() => [
    {
      id: "event-types",
      title: "Tipos de Evento",
      subtitle: "Agenda & Compromissos",
      icon: Calendar,
      entityName: "Tipo de Evento",
      pluralEntityName: "Tipos de Evento",
      unitLabel: "compromisso(s) na Agenda",
      typeKey: null as null,
      description: "Cadastre e edite os tipos de compromissos exibidos no formulário de criação de eventos da Agenda.",
      items: eventTypes as GenericCategoryItem[],
    },
    {
      id: "student-conditions",
      title: "Condições do Aluno",
      subtitle: "Integral, Bolsa, etc.",
      icon: GraduationCap,
      entityName: "Condição do Aluno",
      pluralEntityName: "Condições do Aluno",
      unitLabel: "aluno(s)",
      typeKey: "student_condition" as SystemCategoryType,
      description: "Cadastre e edite as condições de matrícula aplicadas aos alunos (ex: Integral, Bolsa, Desconto).",
      items: systemCategories.filter(c => c.type === "student_condition") as GenericCategoryItem[],
    },
    {
      id: "class-modalities",
      title: "Modalidades de Turma",
      subtitle: "Regular, VIP, etc.",
      icon: Layers,
      entityName: "Modalidade de Turma",
      pluralEntityName: "Modalidades de Turma",
      unitLabel: "turma(s)",
      typeKey: "class_modality" as SystemCategoryType,
      description: "Cadastre e edite as modalidades de turmas oferecidas pela escola (ex: Regular, VIP, Acompanhamento).",
      items: systemCategories.filter(c => c.type === "class_modality") as GenericCategoryItem[],
    },
    {
      id: "inventory-categories",
      title: "Categorias de Estoque",
      subtitle: "Didático, Escritório, etc.",
      icon: Package,
      entityName: "Categoria de Estoque",
      pluralEntityName: "Categorias de Estoque",
      unitLabel: "item(ns) no estoque",
      typeKey: "inventory_category" as SystemCategoryType,
      description: "Classifique os produtos e materiais pedagógicos e administrativos armazenados no inventário.",
      items: systemCategories.filter(c => c.type === "inventory_category") as GenericCategoryItem[],
    },
  ], [eventTypes, systemCategories]);

  const activeTab = useMemo(
    () => categoryTabs.find(t => t.id === selectedCategory) || categoryTabs[0],
    [categoryTabs, selectedCategory]
  );

  const getUsageCount = (item: GenericCategoryItem): number => {
    switch (selectedCategory) {
      case "event-types":
        return manualEvents.filter(
          (e) => e.type === item.id || e.type.toLowerCase() === item.name.toLowerCase()
        ).length;
      case "student-conditions":
        return students.filter(
          (s) => s.status !== "Apagado" && s.studentCondition === item.name
        ).length;
      case "class-modalities":
        return classes.filter(
          (c) => c.status !== "Apagado" && c.modality === item.name
        ).length;
      case "inventory-categories":
        return inventoryItems.filter(
          (i) => i.status !== "Apagado" && i.category === item.name
        ).length;
      default:
        return 0;
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName("");
    setColor("#3b82f6");
    setDescription("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: GenericCategoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setColor(item.color || "#3b82f6");
    setDescription(item.description || "");
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome Obrigatório",
        description: `Informe o nome para este(a) ${activeTab.entityName.toLowerCase()}.`,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedCategory === "event-types") {
        if (editingItem) {
          await updateEventType(editingItem.id, {
            name: name.trim(),
            color,
            description: description.trim() || undefined,
          });
        } else {
          await addEventType({
            name: name.trim(),
            color,
            description: description.trim() || undefined,
          });
        }
      } else {
        if (editingItem) {
          await updateSystemCategory(editingItem.id, {
            name: name.trim(),
            color,
            description: description.trim() || undefined,
          });
        } else {
          await addSystemCategory({
            type: activeTab.typeKey!,
            name: name.trim(),
            color,
            description: description.trim() || undefined,
          });
        }
      }

      toast({
        title: editingItem ? `${activeTab.entityName} Atualizado(a)` : `${activeTab.entityName} Criado(a)`,
        description: `"${name.trim()}" foi salvo com sucesso no banco de dados.`,
      });
      setIsFormOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Não foi possível concluir a alteração.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      if (selectedCategory === "event-types") {
        await deleteEventType(itemToDelete.id);
      } else {
        await deleteSystemCategory(itemToDelete.id);
      }

      toast({
        title: `${activeTab.entityName} Removido(a)`,
        description: `"${itemToDelete.name}" foi excluído(a) com sucesso.`,
      });
      setItemToDelete(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: err.message || "Não foi possível excluir o registro.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Navigation Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm ring-1 ring-primary"
                  : "bg-card hover:bg-muted/50 border-border text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    isSelected
                      ? "bg-white/10 text-white"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-none truncate">{tab.title}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1 truncate",
                      isSelected ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    {tab.subtitle}
                  </p>
                </div>
              </div>
              <Badge
                variant={isSelected ? "secondary" : "outline"}
                className="text-[10px] ml-2 shrink-0 font-semibold"
              >
                {tab.items.length}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4 border-b">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <activeTab.icon className="h-5 w-5 text-primary" />
              {activeTab.pluralEntityName}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {activeTab.description}
            </CardDescription>
          </div>
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-sm w-full sm:w-auto shrink-0"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Novo(a) {activeTab.entityName}
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12 text-center">Cor</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-center w-36">Vínculos Atuais</TableHead>
                  <TableHead className="text-right w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground text-xs italic"
                    >
                      Nenhum(a) {activeTab.entityName.toLowerCase()} cadastrado(a). Clique no botão acima para adicionar.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeTab.items.map((item) => {
                    const usageCount = getUsageCount(item);
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        <TableCell className="text-center">
                          <span
                            className="inline-block w-4 h-4 rounded-full shadow-xs border border-black/10 shrink-0"
                            style={{ backgroundColor: item.color || "#3b82f6" }}
                            title={`Cor: ${item.color || "#3b82f6"}`}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-xs sm:text-sm text-foreground">
                            {item.name}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                          {item.description || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold"
                          >
                            {usageCount} {activeTab.unitLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(item)}
                              title="Editar"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setItemToDelete(item)}
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog for Create / Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold">
              {editingItem ? `Editar ${activeTab.entityName}` : `Novo(a) ${activeTab.entityName}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina o nome, cor de identificação visual e uma descrição opcional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="category-name" className="text-xs font-semibold">
                Nome *
              </Label>
              <Input
                id="category-name"
                placeholder={`Ex: ${
                  selectedCategory === "event-types"
                    ? "Workshop, Treinamento"
                    : selectedCategory === "student-conditions"
                    ? "Bolsa Parcial, Convênio"
                    : selectedCategory === "class-modalities"
                    ? "Semipresencial, Intensivo"
                    : "Uniforme, Material de Apoio"
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Cor de Destaque</Label>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">
                    {color}
                  </span>
                </div>
              </div>

              {/* Color swatches */}
              <div className="grid grid-cols-6 gap-2 p-2 rounded-xl bg-muted/40 border border-muted">
                {PRESET_COLORS.map((c) => {
                  const isSelected = color.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={cn(
                        "h-8 rounded-lg flex items-center justify-center transition-all relative border cursor-pointer",
                        isSelected
                          ? "ring-2 ring-primary ring-offset-1 scale-105"
                          : "opacity-80 hover:opacity-100 hover:scale-102"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    >
                      {isSelected && <Check className="h-4 w-4 text-white drop-shadow-sm" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom hex input */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-8 p-0.5 border cursor-pointer shrink-0"
                  title="Seletor livre de cor"
                />
                <Input
                  type="text"
                  placeholder="#3b82f6"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category-desc" className="text-xs font-semibold">
                Descrição (opcional)
              </Label>
              <Textarea
                id="category-desc"
                placeholder="Insira detalhes sobre esta categoria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : editingItem ? (
                  "Salvar Alterações"
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Excluir {activeTab.entityName}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <span>
                Tem certeza que deseja excluir <strong>&quot;{itemToDelete?.name}&quot;</strong>?
              </span>
              {itemToDelete && getUsageCount(itemToDelete) > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-medium mt-2">
                  Atenção: Existem {getUsageCount(itemToDelete)} {activeTab.unitLabel} vinculados a este registro.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
