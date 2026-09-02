
"use client";

import * as React from "react";
import { Student } from "@/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, ChevronLeft, Home, Printer } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { mockStudents, mockClasses } from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function StudentsPage() {
    const { user, hasPermission } = useAuth();
    const router = useRouter();
    const { handleLinkClick } = useLoading();
    const [students, setStudents] = React.useState<Student[]>(mockStudents);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingStudent, setEditingStudent] = React.useState<Student | undefined>(undefined);
    const [viewingStudent, setViewingStudent] = React.useState<Student | null>(null);

    const isAdmin = user?.role === 'Admin';

    const filteredStudents = React.useMemo(() => {
        if (isAdmin) return students;
        const myClasses = mockClasses.filter(c => c.teacher === user?.nickname).map(c => c.name);
        return students.filter(s => myClasses.includes(s.class));
    }, [students, isAdmin, user]);

    const handleOpenForm = (student?: Student) => {
        setEditingStudent(student);
        setIsFormOpen(true);
    };

    const handleSaveStudent = (data: any) => {
        if (editingStudent) {
            setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...data } : s));
            toast({ title: "Aluno Atualizado!", description: "As alterações foram salvas localmente." });
        } else {
            const newStudent: Student = {
                id: `STU-${Math.floor(Math.random() * 1000)}`,
                ...data,
                grades: [],
                paymentHistory: [],
                attendance: [],
                status: 'Ativo'
            };
            setStudents(prev => [newStudent, ...prev]);
            toast({ title: "Sucesso!", description: "Novo aluno cadastrado no protótipo." });
        }
        setIsFormOpen(false);
        setEditingStudent(undefined);
    };

    const handleDeleteStudent = (id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
        toast({ title: "Removido", description: "Aluno removido localmente." });
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
                        <span className="hidden sm:inline">Novo Aluno</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>{editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</DialogTitle>
                      </DialogHeader>
                      <StudentForm 
                          student={editingStudent} 
                          onSave={handleSaveStudent} 
                          onCancel={() => setIsFormOpen(false)}
                          availableClasses={mockClasses}
                          studentConditions={['Integral', 'Bolsa', 'Desconto']}
                      />
                    </DialogContent>
                  </Dialog>
                )}
            </div>
            
            <DataTable 
                columns={columns} 
                data={filteredStudents}
                classes={mockClasses}
                studentConditions={['Integral', 'Bolsa', 'Desconto']}
                onEdit={handleOpenForm}
                onView={(student) => setViewingStudent(student)}
                onDelete={handleDeleteStudent}
                onBulkUpdate={(ids, updates) => setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, ...updates } : s))}
                onBulkDelete={(ids) => setStudents(prev => prev.filter(s => !ids.includes(s.id)))}
                onNextPage={() => {}}
                onPreviousPage={() => {}}
                canGoNext={false}
                canGoPrevious={false}
                pageCount={1}
                currentPage={1}
            />

            <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
                <DialogContent className="sm:max-w-[80vw] p-0">
                    <DialogHeader className="p-6 flex flex-row justify-between items-center">
                        <DialogTitle>Ficha do Aluno: {viewingStudent?.name}</DialogTitle>
                        <Button variant="outline" size="icon" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    {viewingStudent && <StudentProfile student={viewingStudent} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
