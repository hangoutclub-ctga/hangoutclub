
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Award, Frown, Smile, History, BookCopy, Loader2, Star, Users, Edit, MoreHorizontal, ChevronLeft, Home } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Grade, Student, Class } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayAvatarUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

type GradeWithStudentInfo = Grade & { studentName: string, studentId: string };

const evaluations: { [key: string]: { id: string, name: string }[] } = {
  'sem-1': [{ id: "Escrita 1", name: "Escrita 1" }],
  'sem-2': [{ id: "Escrita 2", name: "Escrita 2" }, { id: "Oral", name: "Oral" }],
};

const evaluationPeriods = [
    {id: 'sem-1', label: '1º Semestre'},
    {id: 'sem-2', label: '2º Semestre'},
]

export default function GradesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  const { classes: allClasses, students: allStudents, updateStudent } = useData();
  
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const [selectedStudentId, setSelectedStudentId] = React.useState("");
  const [selectedPeriod, setSelectedPeriod] = React.useState("");
  const [grades, setGrades] = React.useState<{ [key: string]: string }>({});

  const [latestGrades, setLatestGrades] = React.useState<GradeWithStudentInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isStudentSelectorOpen, setIsStudentSelectorOpen] = React.useState(false);

  React.useEffect(() => {
    const isAdmin = user?.role === 'Admin';
    let accessibleStudentIds: string[] = [];

    if (isAdmin) {
      accessibleStudentIds = allStudents.map(s => s.id);
    } else if (user?.role === 'Professor') {
      const teacherClasses = allClasses.filter(c => c.teacher === user.nickname);
      accessibleStudentIds = Array.from(new Set(teacherClasses.flatMap(c => c.studentIds || [])));
    }

    const compiledGrades: GradeWithStudentInfo[] = [];
    allStudents
      .filter(s => accessibleStudentIds.includes(s.id))
      .forEach(student => {
        student.grades?.forEach(grade => {
          compiledGrades.push({
            ...grade,
            studentName: student.name,
            studentId: student.id,
          });
        });
      });

    compiledGrades.sort((a, b) => {
      const dateA = a.evaluationDate ? new Date(a.evaluationDate).getTime() : 0;
      const dateB = b.evaluationDate ? new Date(b.evaluationDate).getTime() : 0;
      return dateB - dateA;
    });

    setLatestGrades(compiledGrades.slice(0, 10));
  }, [user, allClasses, allStudents]);

  const availableClasses = React.useMemo(() => {
    if (user?.role === 'Professor') {
      return allClasses.filter(c => c.teacher === user.nickname && c.status === 'Ativa');
    }
    return allClasses.filter(c => c.status === 'Ativa');
  }, [user, allClasses]);

  const selectedStudent = React.useMemo(() => {
    return allStudents.find(s => s.id === selectedStudentId);
  }, [selectedStudentId, allStudents]);

  const studentHistory = React.useMemo(() => (
    (selectedStudent?.grades || []).sort((a,b) => (b.evaluationDate || "").localeCompare(a.evaluationDate || ""))
  ), [selectedStudent]);

  const currentEvaluations = React.useMemo(() => {
    if (!selectedPeriod) return [];
    return evaluations[selectedPeriod as keyof typeof evaluations] || [];
  }, [selectedPeriod]);

  const studentsInSelectedClass = React.useMemo(() => {
    if (!selectedClass) return [];
    const studentIdsInClass = selectedClass.studentIds || [];
    return allStudents.filter(s => studentIdsInClass.includes(s.id));
  }, [selectedClass, allStudents]);
  
  const handleClassChange = (classId: string) => {
    const newSelectedClass = allClasses.find(c => c.id === classId);
    if(newSelectedClass) {
        setSelectedClass(newSelectedClass);
        setSelectedStudentId("");
        setSelectedPeriod("");
        setGrades({});
        setIsStudentSelectorOpen(true);
    }
  }

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedPeriod("");
    setGrades({});
    setIsStudentSelectorOpen(false);
  }
  
  const handleGradeChange = (subjectId: string, value: string) => {
    setGrades(prev => ({ ...prev, [subjectId]: value }));
  }

  const handleSaveGrades = async () => {
    const targetStudent = allStudents.find(s => s.id === selectedStudentId);
    if (!targetStudent) return;

    setIsLoading(true);
    try {
      const newGrades: Grade[] = Object.entries(grades).map(([subject, val]) => ({
        subject,
        periodType: 'Semestre',
        periodNumber: selectedPeriod === 'sem-1' ? 1 : 2,
        grade: parseFloat(val) || 0,
        evaluationDate: new Date().toISOString().split('T')[0]
      }));

      const existingGrades = targetStudent.grades || [];
      const updatedGrades = [
        ...existingGrades.filter(g => !(g.periodNumber === (selectedPeriod === 'sem-1' ? 1 : 2) && Object.keys(grades).includes(g.subject))),
        ...newGrades
      ];

      await updateStudent(targetStudent.id, { grades: updatedGrades });
      toast({ title: "Notas Salvas!", description: "As notas foram salvas com sucesso no Supabase." });
      setSelectedPeriod("");
      setGrades({});
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro ao salvar notas", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverage = () => {
    const numericGrades = Object.values(grades).map(g => parseFloat(g)).filter(g => !isNaN(g));
    if (numericGrades.length === 0) return 0;
    const sum = numericGrades.reduce((acc, curr) => acc + curr, 0);
    return parseFloat((sum / numericGrades.length).toFixed(2));
  };
  
  const average = calculateAverage();
  const isApproved = average >= 60;

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                      Notas
                    </h1>
                    <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">
                      Selecione a turma e o aluno para registrar as notas.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Select value={selectedClass?.id || ""} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                        {classesForSelect.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Dialog open={isStudentSelectorOpen} onOpenChange={setIsStudentSelectorOpen}>
                     <DialogTrigger asChild>
                        {selectedClass && (
                            <Button variant="outline" size="icon">
                                <Users className="h-4 w-4" />
                            </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Selecione um Aluno da Turma: {selectedClass?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 py-4">
                            {studentsInSelectedClass.length > 0 ? (
                                studentsInSelectedClass.map(s => (
                                    <Button key={s.id} variant="outline" className="w-full justify-start gap-3" onClick={() => handleStudentSelect(s.id)}>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={getDisplayAvatarUrl(s.avatarUrl)} alt={s.name} />
                                            <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span>{s.name}</span>
                                    </Button>
                                ))
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-4">Nenhum aluno nesta turma.</p>
                            )}
                        </div>
                    </DialogContent>
                 </Dialog>
            </div>
        </div>

        {!selectedStudent ? (
            <Card>
                <CardContent className="p-4 text-muted-foreground flex flex-row justify-center items-center gap-4">
                    <Award className="h-6 w-6"/>
                    <div>
                        <p className="font-bold">Nenhum aluno selecionado</p>
                        <p className="text-sm">Selecione uma turma e depois um aluno para começar a lançar as notas.</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                  <Card>
                    <CardHeader>
                        <CardTitle>Lançar Notas para: {selectedStudent.name}</CardTitle>
                        <CardDescription>
                            Selecione o período e insira as notas de 0 a 100.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="period-selector">Período de Avaliação</Label>
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger id="period-selector">
                                    <SelectValue placeholder="Selecione o período" />
                                </SelectTrigger>
                                <SelectContent>
                                    {evaluationPeriods.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPeriod && currentEvaluations.length > 0 && (
                            <div id="grade-input-area" className="pt-4 border-t space-y-4">
                                {currentEvaluations.map(subject => (
                                    <div key={subject.id} className="flex items-center gap-4">
                                    <Label htmlFor={subject.id} className="flex-1">{subject.name}</Label>
                                    <Input
                                        id={subject.id}
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-28"
                                        value={grades[subject.id] || ""}
                                        onChange={(e) => handleGradeChange(subject.id, e.target.value)}
                                        placeholder="0 - 100"
                                    />
                                    </div>
                                ))}
                            </div>
                        )}
                        {selectedPeriod && currentEvaluations.length > 0 && (
                            <>
                            <div className="mt-6 pt-4 border-t">
                                <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
                                    <div>
                                    <p className="text-sm font-bold text-muted-foreground">APROVEITAMENTO</p>
                                    <p className={`text-3xl font-black ${isApproved ? 'text-green-600' : 'text-red-600'}`}>{calculateAverage()}%</p>
                                    </div>
                                    {isApproved ? (
                                        <div className="text-center text-green-600">
                                            <Smile className="h-10 w-10 mx-auto"/>
                                            <p className="text-xs font-bold">APROVADO</p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-red-600">
                                            <Frown className="h-10 w-10 mx-auto"/>
                                            <p className="text-xs font-bold">REPROVADO</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button className="w-full mt-4 bg-accent hover:bg-accent/90" onClick={handleSaveGrades} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Notas
                            </Button>
                            </>
                        )}
                    </CardContent>
                   </Card>
                </div>
                 <div>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <History className="h-5 w-5 text-accent" />
                            <CardTitle>Histórico do Aluno</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {studentHistory.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Avaliação</TableHead>
                                            <TableHead>Período</TableHead>
                                            <TableHead className="text-right">Pontos</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentHistory.map((grade, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{grade.subject}</TableCell>
                                                <TableCell>{grade.periodNumber}º {grade.periodType}</TableCell>
                                                <TableCell className={`text-right font-bold ${grade.grade >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {grade.grade.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center p-10 text-muted-foreground">
                                    <BookCopy className="h-12 w-12 mx-auto mb-2"/>
                                    <p>Nenhuma nota registrada anteriormente para este aluno.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                 </div>
            </div>
        )}
        
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Star className="h-5 w-5 text-accent" />
                <CardTitle>Últimas Notas Lançadas</CardTitle>
            </CardHeader>
            <CardContent>
                {latestGrades.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Aluno</TableHead>
                                <TableHead>Avaliação</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Nota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {latestGrades.map((grade, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{grade.studentName}</TableCell>
                                    <TableCell>{grade.subject}</TableCell>
                                    <TableCell>
                                        {grade.evaluationDate ? new Date(grade.evaluationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${grade.grade >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                        {grade.grade.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center p-10 text-muted-foreground">
                        <p>Nenhuma nota lançada recentemente.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
