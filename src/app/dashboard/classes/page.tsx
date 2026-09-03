"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClassForm } from "@/components/class-form";
import { BookPlus, ChevronLeft, Home } from 'lucide-react';
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { ClassProfile } from "@/components/class-profile";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { Class } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function ClassesPage() {
  const { user, hasPermission } = useAuth();
  const { classes, students, users, addClass, updateClass, deleteClass, isLoading } = useData();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  
  const [editingClass, setEditingClass] = React.useState<Class | undefined>(undefined);
  const [viewingClass, setViewingClass] = React.useState<Class | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const isAdmin = user?.role === 'Admin';
  const canCreate = hasPermission('classes:create');

  const activeClasses = React.useMemo(() => {
    return classes.filter(c => c.status !== 'Apagado');
  }, [classes]);

  const studentsWithoutClass = React.useMemo(() => {
    return students.filter(s => (!s.class || s.class.trim() === "") && s.status !== 'Apagado');
  }, [students]);

  const filteredClasses = React.useMemo(() => {
    if (isAdmin) return activeClasses;
    return activeClasses.filter(c => c.teacher === user?.nickname);
  }, [activeClasses, isAdmin, user]);

  const handleOpenForm = (c?: Class) => {
    setEditingClass(c);
    setIsFormOpen(true);
  };

  const handleSaveClass = async (data: any) => {
    try {
      const teacherName = users.find(u => u.id === data.teacherId)?.nickname || 'Desconhecido';
      const scheduleStr = `${data.weekDays ? data.weekDays.join(', ') : ''} - ${data.time || ''}`;

      if (editingClass) {
        await updateClass(editingClass.id, { 
          ...data,
          teacher: teacherName,
          schedule: scheduleStr
        });
        toast({ title: "Turma Atualizada!", description: "As alterações foram salvas no Supabase." });
      } else {
        await addClass({
          name: data.name,
          teacherId: data.teacherId,
          teacher: teacherName,
          modality: data.modality,
          schedule: scheduleStr,
          studentIds: data.studentIds || [],
          status: 'Ativa'
        });
        toast({ title: "Sucesso!", description: "Nova turma cadastrada no Supabase." });
      }
      setIsFormOpen(false);
      setEditingClass(undefined);
    } catch (err: any) {
      toast({ 
        title: "Erro ao salvar turma", 
        description: err.message || "Não foi possível salvar a turma.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteClass(id, true);
      toast({ title: "Turma Removida", description: "Turma desativada com sucesso." });
    } catch (err: any) {
      toast({ 
        title: "Erro ao excluir", 
        description: err.message || "Não foi possível remover a turma.",
        variant: "destructive"
      });
    }
  };

  const handleBulkUpdate = async (selectedIds: string[], updates: any) => {
    try {
      for (const id of selectedIds) {
        await updateClass(id, updates);
      }
      toast({ title: "Ação em Massa", description: `${selectedIds.length} turmas atualizadas.` });
    } catch (err: any) {
      toast({ title: "Erro na atualização em massa", variant: "destructive" });
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      for (const id of selectedIds) {
        await deleteClass(id, true);
      }
      toast({ title: "Ação em Massa", description: `${selectedIds.length} turmas removidas.` });
    } catch (err: any) {
      toast({ title: "Erro na exclusão em massa", variant: "destructive" });
    }
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">Turmas</h1>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">
              {isAdmin ? "Visualize e gerencie todas as turmas do seu clube." : "Suas turmas em andamento."}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingClass(undefined);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent hover:bg-accent/90 h-10 w-9 sm:w-auto px-0 sm:px-4" disabled={!canCreate}>
                <BookPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Criar Nova Turma</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Editar Turma' : 'Cadastrar Nova Turma'}</DialogTitle>
              </DialogHeader>
              <ClassForm 
                  classData={editingClass}
                  availableStudents={editingClass ? students : studentsWithoutClass}
                  allUsers={users}
                  onSave={handleSaveClass}
                  onCancel={() => setIsFormOpen(false)}
                  classModalities={['Regular', 'VIP', 'Acompanhamento']}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <DataTable 
          columns={columns} 
          data={filteredClasses}
          users={users}
          classModalities={['Regular', 'VIP', 'Acompanhamento']}
          onEdit={handleOpenForm}
          onView={(c) => setViewingClass(c)}
          onDelete={handleDeleteClass}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onNextPage={() => {}}
          onPreviousPage={() => {}}
          canGoNext={false}
          canGoPrevious={false}
          pageCount={1}
          currentPage={1}
      />

      <Dialog open={!!viewingClass} onOpenChange={(open) => !open && setViewingClass(null)}>
          <DialogContent className="sm:max-w-[80vw] p-0">
              <DialogHeader className="p-6">
                  <DialogTitle>Perfil da Turma: {viewingClass?.name}</DialogTitle>
              </DialogHeader>
              {viewingClass && <ClassProfile classId={viewingClass.id} />}
          </DialogContent>
      </Dialog>
    </div>
  );
}
