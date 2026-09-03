
"use client";

import React from "react";
import { BookOpen, Printer, UserCheck, Users, Check, X, Megaphone } from "lucide-react";
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

type AttendanceStatus = 'present' | 'absent' | 'justified';

const AttendanceTaker = ({ students, onAttendanceSaved, minimal = false }: { students: Student[], onAttendanceSaved: () => void, minimal?: boolean }) => {
    const { updateStudent } = useData();
    const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>({});
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSetAttendance = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    }

    const handleSaveAttendance = async () => {
        if (Object.keys(attendance).length === 0) {
            toast({ variant: 'destructive', title: "Nenhuma alteração", description: "Marque a presença de pelo menos um aluno." });
            return;
        }

        setIsSaving(true);
        try {
            const todayIso = new Date().toISOString().split('T')[0];
            for (const [studentId, status] of Object.entries(attendance)) {
                const targetStudent = students.find(s => s.id === studentId);
                if (!targetStudent) continue;

                const existingAttendance = targetStudent.attendance || [];
                // replace or prepend today
                const filtered = existingAttendance.filter(a => a.date !== todayIso);
                const updatedList: Attendance[] = [{ date: todayIso, status }, ...filtered];
                await updateStudent(studentId, { attendance: updatedList });
            }
            toast({ title: "Chamada Salva!", description: "A frequência foi registrada com sucesso." });
            onAttendanceSaved();
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message || "Falha ao salvar chamada." });
        } finally {
            setIsSaving(false);
        }
    }
    
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
        <div className={cn("space-y-4", minimal && "space-y-3")}>
             {!minimal && (
                <div className="mb-2 px-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data da Chamada</p>
                    <p className="text-xs font-medium text-primary">{today}</p>
                </div>
             )}
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
                                    size="icon" 
                                    variant={status === 'present' ? 'default' : 'ghost'} 
                                    className={cn("rounded-lg transition-all", minimal ? "h-7 w-7" : "h-8 w-8", status === 'present' ? "bg-green-600 hover:bg-green-700 text-white" : "text-green-600 hover:bg-green-50")} 
                                    onClick={() => handleSetAttendance(student.id, 'present')}
                                >
                                    <Check className={minimal ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant={status === 'absent' ? 'destructive' : 'ghost'} 
                                    className={cn("rounded-lg transition-all", minimal ? "h-7 w-7" : "h-8 w-8", status === 'absent' ? "" : "text-red-600 hover:bg-red-50")} 
                                    onClick={() => handleSetAttendance(student.id, 'absent')}
                                >
                                    <X className={minimal ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                </Button>
                                 <Button 
                                    size="icon" 
                                    variant={status === 'justified' ? 'default' : 'ghost'} 
                                    className={cn("rounded-lg transition-all", minimal ? "h-7 w-7" : "h-8 w-8", status === 'justified' ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "text-yellow-600 hover:bg-yellow-50")} 
                                    onClick={() => handleSetAttendance(student.id, 'justified')}
                                >
                                    <Megaphone className={minimal ? "h-3.5 w-3.5" : "h-4 w-4"} />
                                </Button>
                            </div>
                        </li>
                    )
                })}
            </ul>
             <Button className={cn("w-full bg-accent hover:bg-accent/90 font-black shadow-lg shadow-accent/20 rounded-2xl uppercase tracking-widest transition-all active:scale-95", minimal ? "h-10 text-[10px] mt-2" : "h-11 sm:h-12 text-xs sm:text-sm mt-4")} onClick={handleSaveAttendance}>
                Salvar Chamada
            </Button>
        </div>
    )
}

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
                                                        <DialogHeader className="p-6 flex flex-row justify-between items-center">
                                                            <DialogTitle>Ficha do Aluno: {student.name}</DialogTitle>
                                                            <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
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
