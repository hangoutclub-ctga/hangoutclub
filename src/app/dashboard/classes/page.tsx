
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ClassForm } from "@/components/class-form"
import { BookPlus, ChevronLeft, Home } from 'lucide-react'
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { ClassProfile } from "@/components/class-profile"
import { useAuth } from "@/hooks/use-auth"
import { Class } from "@/types"
import { toast } from "@/hooks/use-toast"
import { mockClasses, mockStudents, mockUsers } from "@/lib/mock-data"
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function ClassesPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  const [classes, setClasses] = React.useState<Class[]>(mockClasses);
  const [editingClass, setEditingClass] = React.useState<Class | undefined>(undefined);
  const [viewingClass, setViewingClass] = React.useState<Class | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const isAdmin = user?.role === 'Admin';
  const canCreate = hasPermission('classes:create');

  const studentsWithoutClass = React.useMemo(() => {
    return mockStudents.filter(s => !s.class || s.class.trim() === "");
  }, []);

  const filteredClasses = React.useMemo(() => {
    if (isAdmin) return classes;
    return classes.filter(c => c.teacher === user?.nickname);
  }, [classes, isAdmin, user]);

  const handleOpenForm = (c?: Class) => {
    setEditingClass(c);
    setIsFormOpen(true);
  }

  const handleSaveClass = (data: any) => {
    if (editingClass) {
      setClasses(prev => prev.map(c => c.id === editingClass.id ? { 
        ...c, 
        ...data,
        teacher: mockUsers.find(u => u.id === data.teacherId)?.nickname || 'Desconhecido',
        schedule: `${data.weekDays.join(', ')} - ${data.time}`
      } : c));
      toast({ title: "Turma Atualizada!" });
    } else {
      const newClass: Class = {
        id: `CLS-${Math.floor(Math.random() * 1000)}`,
        name: data.name,
        teacherId: data.teacherId,
        teacher: mockUsers.find(u => u.id === data.teacherId)?.nickname || 'Desconhecido',
        modality: data.modality,
        schedule: `${data.weekDays.join(', ')} - ${data.time}`,
        studentIds: data.studentIds || [],
        status: 'Ativa'
      };
      setClasses(prev => [newClass, ...prev]);
      toast({ title: "Sucesso!" });
    }
    setIsFormOpen(false);
    setEditingClass(undefined);
  }

  const handleDeleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    toast({ title: "Turma Removida" });
  }

  const handleBulkUpdate = (selectedIds: string[], updates: any) => {
    setClasses(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, ...updates } : c));
    toast({ title: "Ação em Massa", description: `${selectedIds.length} turmas atualizadas.` });
  }

  const handleBulkDelete = (selectedIds: string[]) => {
    setClasses(prev => prev.filter(c => !selectedIds.includes(c.id)));
    toast({ title: "Ação em Massa", description: `${selectedIds.length} turmas removidas.` });
  }

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
                  availableStudents={editingClass ? mockStudents : studentsWithoutClass}
                  allUsers={mockUsers}
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
          users={mockUsers}
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
  )
}
