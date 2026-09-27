
"use client";

import React from "react";
import { BookOpen, Printer, UserCheck, Users, Check, X, Megaphone, Calendar as CalendarIcon, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { StudentProfile } from "./student-profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getDisplayAvatarUrl } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Class, Student, Attendance } from "@/types";
import { useData } from "@/hooks/use-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type AttendanceStatus = 'present' | 'absent' | 'justified';

const AttendanceTaker = ({ students, onAttendanceSaved, minimal = false }: { students: Student[], onAttendanceSaved: () => void, minimal?: boolean }) => {
    const { updateStudent } = useData();
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>({});
    const [isSaving, setIsSaving] = React.useState(false);

    // Carrega a frequência gravada para a data selecionada
    React.useEffect(() => {
        const dateIso = format(selectedDate, 'yyyy-MM-dd');
        const initialMap: Record<string, AttendanceStatus> = {};
        students.forEach(student => {
            const found = (student.attendance || []).find(a => a.date === dateIso);
            if (found) {
                initialMap[student.id] = found.status as AttendanceStatus;
            }
        });
        setAttendance(initialMap);
    }, [selectedDate, students]);

    const handleSetAttendance = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => {
            // Se clicar no mesmo status já ativo, desmarca
            if (prev[studentId] === status) {
                const next = { ...prev };
                delete next[studentId];
                return next;
            }
            return { ...prev, [studentId]: status };
        });
    };

    const handleMarkAllPresent = () => {
        const allPresent: Record<string, AttendanceStatus> = {};
        students.forEach(s => {
            allPresent[s.id] = 'present';
        });
        setAttendance(allPresent);
        toast({ title: "Todos Presentes", description: "Todos os alunos foram marcados com presença." });
    };

    const handleSaveAttendance = async () => {
        if (Object.keys(attendance).length === 0) {
            toast({ variant: 'destructive', title: "Nenhuma alteração", description: "Marque a frequência de pelo menos um aluno antes de salvar." });
            return;
        }

        setIsSaving(true);
        try {
            const dateIso = format(selectedDate, 'yyyy-MM-dd');
            for (const [studentId, status] of Object.entries(attendance)) {
                const targetStudent = students.find(s => s.id === studentId);
                if (!targetStudent) continue;

                const existingAttendance = targetStudent.attendance || [];
                // Remove o registro pré-existente desta data e anexa o atualizado
                const filtered = existingAttendance.filter(a => a.date !== dateIso);
                const updatedList: Attendance[] = [{ date: dateIso, status }, ...filtered];
                await updateStudent(studentId, { attendance: updatedList });
            }
            toast({ 
                title: "Chamada Salva!", 
                description: `Frequência de ${format(selectedDate, "dd/MM/yyyy")} registrada com sucesso.` 
            });
            onAttendanceSaved();
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message || "Falha ao salvar chamada." });
        } finally {
            setIsSaving(false);
        }
    };

    const stats = React.useMemo(() => {
        const counts = { present: 0, absent: 0, justified: 0, pending: 0 };
        students.forEach(s => {
            const st = attendance[s.id];
            if (st === 'present') counts.present++;
            else if (st === 'absent') counts.absent++;
            else if (st === 'justified') counts.justified++;
            else counts.pending++;
        });
        return counts;
    }, [students, attendance]);

    return (
        <div className={cn("space-y-4", minimal && "space-y-3")}>
             {/* Barra de Seleção de Data e Resumo */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border shadow-xs">
                <div>
                    <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data da Chamada</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-primary capitalize mt-0.5">
                        {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="h-8 gap-1.5 text-xs font-semibold bg-background hover:bg-accent/10 hover:border-accent shadow-xs"
                            >
                                <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                                <span>Alterar Data</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(d) => {
                                    if (d) {
                                        setSelectedDate(d);
                                        setIsCalendarOpen(false);
                                    }
                                }}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleMarkAllPresent}
                        className="h-8 gap-1.5 text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-950/40 hover:text-green-700 shadow-xs"
                        title="Marcar todos os alunos como presentes"
                    >
                        <CheckCheck className="h-3.5 w-3.5 text-green-600" />
                        <span className="hidden sm:inline">Todos Presentes</span>
                    </Button>
                </div>
             </div>

             {/* Contador Rápido */}
             <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground px-1">
                <span className="text-green-600 font-bold">{stats.present} presentes</span>
                <span>•</span>
                <span className="text-red-500 font-bold">{stats.absent} faltas</span>
                {stats.justified > 0 && (
                    <>
                        <span>•</span>
                        <span className="text-yellow-600 font-bold">{stats.justified} justificados</span>
                    </>
                )}
                {stats.pending > 0 && (
                    <>
                        <span>•</span>
                        <span className="text-muted-foreground">{stats.pending} não marcados</span>
                    </>
                )}
             </div>

            {/* Lista de Alunos */}
            <ul className={cn("space-y-2", minimal && "space-y-1.5")}>
                {students.map(student => {
                    const status = attendance[student.id];
                    return (
                        <li key={student.id} className={cn(
                            "flex items-center justify-between p-2 rounded-xl border transition-all shadow-sm",
                            status === 'present' && 'bg-green-500/10 border-green-500/30',
                            status === 'absent' && 'bg-red-500/10 border-red-500/30',
                            status === 'justified' && 'bg-yellow-500/10 border-yellow-500/30',
                            !status && 'bg-card border-border'
                        )}>
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <Avatar className={cn("border", minimal ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9")}>
                                    <AvatarImage src={getDisplayAvatarUrl(student.avatarUrl)} alt={student.name} />
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className={cn("font-bold truncate pr-2", minimal ? "text-[10px] sm:text-xs" : "text-[11px] sm:text-sm")}>{student.name}</span>
                            </div>
                            <div className="flex gap-1">
                                <Button 
                                    type="button"
                                    size="icon" 
                                    variant={status === 'present' ? 'default' : 'ghost'} 
                                    className={cn("rounded-lg transition-all", minimal ? "h-7 w-7" : "h-8 w-8", status === 'present' ? "bg-green-600 hover:bg-green-700 text-white shadow-xs" : "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40")} 
                                    onClick={() => handleSetAttendance(student.id, 'present')}
                                    title="Presente"
                                >
                                    <Check className={minimal ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                </Button>
                                <Button 
                                    type="button"
                                    size="icon" 
                                    variant={status === 'absent' ? 'destructive' : 'ghost'} 
                                    className={cn("rounded-lg transition-all", minimal ? "h-7 w-7" : "h-8 w-8", status === 'absent' ? "shadow-xs" : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40")} 
                                    onClick={() => handleSetAttendance(student.id, 'absent')}
                                    title="Ausente"
                                >
                                    <X className={minimal ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                </Button>
                                <Button 
                                    type="button"
                                    size="icon" 
                                    variant={status === 'justified' ? 'default' : 'ghost'} 
                                    className={cn("rounded-lg transition-all", minimal ? "h-7 w-7" : "h-8 w-8", status === 'justified' ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-xs" : "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/40")} 
                                    onClick={() => handleSetAttendance(student.id, 'justified')}
                                    title="Justificado"
                                >
                                    <Megaphone className={minimal ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                </Button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <Button 
                type="button"
                disabled={isSaving}
                className={cn(
                    "w-full bg-accent hover:bg-accent/90 font-black shadow-lg shadow-accent/20 rounded-2xl uppercase tracking-widest transition-all active:scale-95", 
                    minimal ? "h-10 text-[10px] mt-2" : "h-11 sm:h-12 text-xs sm:text-sm mt-4"
                )} 
                onClick={handleSaveAttendance}
            >
                {isSaving ? "Salvando..." : `Salvar Chamada (${format(selectedDate, "dd/MM")})`}
            </Button>
        </div>
    );
};

interface ClassProfileProps {
  classId: string;
  defaultTab?: "students" | "attendance";
  onAttendanceSaved?: () => void;
  minimal?: boolean;
}

export function ClassProfile({ classId, defaultTab = "students", onAttendanceSaved, minimal = false }: ClassProfileProps) {
  const { classes, students: allStudents } = useData();
  const classDetails = classes.find(c => c.id === classId);
  const students = allStudents.filter(s => classDetails?.studentIds.includes(s.id));

  if (!classDetails) {
    return <div className="flex items-center justify-center p-10"><p>Turma não encontrada.</p></div>
  }

  if (minimal) {
    return (
        <div className="p-3 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AttendanceTaker students={students} onAttendanceSaved={() => onAttendanceSaved?.()} minimal={true} />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 pt-0 max-h-[85vh] overflow-y-auto">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 flex flex-col gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <BookOpen className="h-5 w-5 text-accent"/>
                    <CardTitle className="text-xl">Detalhes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><strong>Modalidade:</strong> <Badge variant="outline">{classDetails.modality}</Badge></div>
                    <p><strong>Professor:</strong> {classDetails.teacher}</p>
                    <p><strong>Horário:</strong> {classDetails.schedule}</p>
                    <p><strong>Total de Alunos:</strong> {students.length}</p>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2 flex flex-col gap-8">
             <Tabs defaultValue={defaultTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="students">
                        <Users className="mr-2 h-4 w-4" /> Alunos
                    </TabsTrigger>
                    <TabsTrigger value="attendance">
                        <UserCheck className="mr-2 h-4 w-4" /> Frequência
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="students">
                    <Card>
                        <CardHeader><CardTitle className="text-xl">Alunos na Turma</CardTitle></CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.length > 0 ? students.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={getDisplayAvatarUrl(student.avatarUrl)} alt={student.name} />
                                                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                               <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm">Ver Ficha</Button></DialogTrigger>
                                                    <DialogContent className="sm:max-w-[80vw] p-0">
                                                        <DialogHeader className="p-6 flex flex-row justify-between items-center no-print">
                                                            <DialogTitle>Ficha do Aluno: {student.name}</DialogTitle>
                                                            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 text-xs">
                                                                <Printer className="h-4 w-4" />
                                                                <span className="hidden sm:inline">Imprimir Ficha</span>
                                                            </Button>
                                                        </DialogHeader>
                                                        <StudentProfile student={student} />
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={2} className="text-center h-24">Nenhum aluno.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="attendance">
                    <Card>
                         <CardContent className="pt-6">
                            <AttendanceTaker students={students} onAttendanceSaved={() => onAttendanceSaved?.()} />
                         </CardContent>
                    </Card>
                </TabsContent>
             </Tabs>
        </div>
      </div>
    </div>
  );
}
