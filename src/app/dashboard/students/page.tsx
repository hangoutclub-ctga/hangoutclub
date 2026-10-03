"use client";

import * as React from "react";
import { Student } from "@/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { UserPlus, ChevronLeft, Home, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StudentForm } from "@/components/student-form";
import { StudentProfile } from "@/components/student-profile";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLoading } from "@/hooks/use-loading";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

export default function StudentsPage() {
    const { user, hasPermission } = useAuth();
    const { 
        students, 
        classes, 
        addStudent, 
        updateStudent, 
        deleteStudent, 
        isLoading,
        categories 
    } = useData();
    const router = useRouter();
    const { handleLinkClick } = useLoading();
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingStudent, setEditingStudent] = React.useState<Student | undefined>(undefined);
    const [viewingStudent, setViewingStudent] = React.useState<Student | null>(null);
    const [deletingStudent, setDeletingStudent] = React.useState<Student | null>(null);
    const [bulkDeleteIds, setBulkDeleteIds] = React.useState<string[] | null>(null);

    const isAdmin = user?.role === 'Admin';

    const activeStudents = React.useMemo(() => {
        return students.filter(s => s.status !== 'Apagado');
    }, [students]);

    const filteredStudents = React.useMemo(() => {
        if (isAdmin || user?.role === 'Secretaria' || user?.role !== 'Professor') return activeStudents;
        const myClasses = classes.filter(c => 
            (c.teacherId && c.teacherId === user?.id) || 
            (c.teacher && c.teacher === user?.nickname)
        );
        const myClassNames = myClasses.map(c => c.name);
        const myStudentIds = myClasses.flatMap(c => c.studentIds || []);
        return activeStudents.filter(s => myClassNames.includes(s.class) || myStudentIds.includes(s.id));
    }, [activeStudents, classes, isAdmin, user]);

    const handleOpenForm = (student?: Student) => {
        setEditingStudent(student);
        setIsFormOpen(true);
    };

    const handleSaveStudent = async (data: any) => {
        try {
            if (editingStudent) {
                await updateStudent(editingStudent.id, data);
                toast({ title: "Aluno Atualizado!", description: "As alterações foram salvas com sucesso." });
            } else {
                await addStudent({
                    ...data,
                    grades: [],
                    paymentHistory: [],
                    attendance: [],
                    status: 'Ativo'
                });
                toast({ title: "Sucesso!", description: "Novo aluno cadastrado com sucesso." });
            }
            setIsFormOpen(false);
            setEditingStudent(undefined);
        } catch (err: any) {
            toast({ 
                title: "Erro ao salvar", 
                description: err.message || "Não foi possível salvar o aluno.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteStudent = async (id: string, audit?: any) => {
        try {
            await deleteStudent(id, true, audit);
            toast({ title: "Removido", description: "Aluno movido para a Lixeira com sucesso." });
        } catch (err: any) {
            toast({ 
                title: "Erro ao excluir", 
                description: err.message || "Não foi possível excluir o aluno.",
                variant: "destructive"
            });
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
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">
                            Alunos
                        </h1>
                        <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">
                            {isAdmin ? "Gerencie todos os membros do seu clube." : "Seus alunos vinculados."}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                  <Dialog open={isFormOpen} onOpenChange={(open) => {
                      setIsFormOpen(open);
                      if (!open) setEditingStudent(undefined);
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-accent hover:bg-accent/90 h-10 w-9 sm:w-auto px-0 sm:px-4" disabled={!hasPermission('students:create')}>
                        <UserPlus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Adicionar Aluno</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</DialogTitle>
                      </DialogHeader>
                      <StudentForm 
                          student={editingStudent} 
                          onSave={handleSaveStudent} 
                          onCancel={() => setIsFormOpen(false)}
                          availableClasses={classes}
                          studentConditions={categories.studentConditions}
                      />
                    </DialogContent>
                  </Dialog>
                )}
            </div>
            
            <DataTable 
                columns={columns} 
                data={filteredStudents}
                classes={classes}
                studentConditions={categories.studentConditions}
                onEdit={handleOpenForm}
                onView={(student) => setViewingStudent(student)}
                onRequestDelete={(student) => setDeletingStudent(student)}
                onDelete={handleDeleteStudent}
                onBulkUpdate={async (ids, updates) => {
                    for (const id of ids) {
                        await updateStudent(id, updates);
                    }
                }}
                onBulkDelete={(ids) => {
                    setBulkDeleteIds(ids);
                }}
                onNextPage={() => {}}
                onPreviousPage={() => {}}
                canGoNext={false}
                canGoPrevious={false}
                pageCount={1}
                currentPage={1}
            />

            <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
                <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[85vw] md:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl">
                    <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 flex flex-row justify-between items-center pr-12 sm:pr-14 shrink-0 no-print border-b border-border/40">
                        <DialogTitle className="text-sm sm:text-lg font-bold truncate min-w-0 mr-2">Ficha do Aluno: {viewingStudent?.name}</DialogTitle>
                        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs shrink-0 h-8 px-2.5 sm:px-3">
                            <Printer className="h-4 w-4" />
                            <span className="hidden sm:inline">Imprimir Ficha</span>
                        </Button>
                    </DialogHeader>
                    {viewingStudent && <StudentProfile student={viewingStudent} />}
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={!!deletingStudent}
                onOpenChange={(open) => !open && setDeletingStudent(null)}
                itemName={deletingStudent?.name}
                itemType="o aluno"
                title="Confirmar Exclusão de Aluno"
                onConfirm={async (audit) => {
                    if (!deletingStudent) return;
                    await handleDeleteStudent(deletingStudent.id, audit);
                    setDeletingStudent(null);
                }}
            />

            <DeleteConfirmDialog
                open={!!bulkDeleteIds && bulkDeleteIds.length > 0}
                onOpenChange={(open) => !open && setBulkDeleteIds(null)}
                title="Excluir Alunos em Massa"
                itemName={`${bulkDeleteIds?.length || 0} alunos selecionados`}
                itemType="os alunos selecionados"
                onConfirm={async (audit) => {
                    if (!bulkDeleteIds) return;
                    try {
                        for (const id of bulkDeleteIds) {
                            await deleteStudent(id, true, audit);
                        }
                        toast({ title: "Ação em Massa Concluída", description: `${bulkDeleteIds.length} alunos movidos para a lixeira.` });
                    } catch (err: any) {
                        toast({ title: "Erro na exclusão em massa", variant: "destructive" });
                    } finally {
                        setBulkDeleteIds(null);
                    }
                }}
            />
        </div>
    );
}
