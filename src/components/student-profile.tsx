
"use client";

import Link from "next/link";
import { User, Shield, GraduationCap, BookOpen, Wallet, FileText, CheckCircle, XCircle, Clock, Printer, Megaphone, CalendarDays, ExternalLink, ImageIcon, FileWarning, Eye, Plus, FileUp, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoading } from "@/app/dashboard/layout";
import { useAuth } from "@/hooks/use-auth";
import { Grade, Attendance, Student, StudentDocument } from "@/types";
import { cn, getDisplayAvatarUrl, formatCurrency } from "@/lib/utils";
import { uploadFileToStorage } from "@/lib/supabase/storage";
import React from "react";
import { differenceInYears } from "date-fns";
import { useData } from "@/hooks/use-data";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";

const getAttendanceIcon = (status: string) => {
    switch (status) {
        case 'present': return { icon: <CheckCircle className="h-3 w-3 text-green-500" />, text: 'Presente', color: 'text-green-700 bg-green-50' };
        case 'absent': return { icon: <XCircle className="h-3 w-3 text-red-500" />, text: 'Ausente', color: 'text-red-700 bg-red-50' };
        case 'justified': return { icon: <Megaphone className="h-3 w-3 text-yellow-500" />, text: 'Justificado', color: 'text-yellow-700 bg-yellow-50' };
        default: return { icon: null, text: '', color: ''};
    }
}

export function StudentProfile({ student: initialStudent }: { student: Student }) {
  const { handleLinkClick } = useLoading();
  const { hasPermission } = useAuth();
  const { students, updateStudent } = useData();
  const canViewFinance = hasPermission('finance:view');

  const student = students.find(s => s.id === initialStudent.id) || initialStudent;
  
  const [localDocuments, setLocalDocuments] = React.useState<StudentDocument[]>(student.documents || []);
  const [isAddingDoc, setIsAddingDoc] = React.useState(false);
  const [newDocName, setNewDocName] = React.useState("");
  const [newDocUrl, setNewDocUrl] = React.useState("");
  const [newDocType, setNewDocType] = React.useState<'image' | 'pdf' | 'link'>('image');
  const [isSavingDoc, setIsSavingDoc] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);

  if (!student) {
    return (
        <div className="flex items-center justify-center p-10 h-[50vh]">
            <p>Selecione um aluno para ver a ficha.</p>
        </div>
    )
  }
  
  const fullAddress = `${student.address}, ${student.addressNumber}${student.addressComplement ? ` - ${student.addressComplement}` : ''}`;
  const displayAvatarUrl = getDisplayAvatarUrl(student.avatarUrl);
  const isMinor = differenceInYears(new Date(), new Date(student.dob)) < 18;

  const getDocIcon = (type: string) => {
      switch (type) {
          case 'image': return <ImageIcon className="h-4 w-4 text-accent" />;
          case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
          default: return <ExternalLink className="h-4 w-4 text-blue-500" />;
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    setNewDocType(isPdf ? 'pdf' : 'image');
    if (!newDocName) {
      setNewDocName(file.name.replace(/\.[^/.]+$/, ""));
    }

    setIsUploadingDoc(true);
    try {
      const { url, error } = await uploadFileToStorage(file, 'documents', file.name);
      if (error) {
        toast({ variant: 'destructive', title: "Erro no envio", description: error });
      } else if (url) {
        setNewDocUrl(url);
        toast({ title: "Arquivo anexado!", description: "Upload concluído com sucesso." });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro no envio", description: err.message });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocName || !newDocUrl) {
      toast({ variant: 'destructive', title: "Dados incompletos", description: "Informe o nome e anexe o arquivo/link." });
      return;
    }

    setIsSavingDoc(true);
    try {
      const newDoc: StudentDocument = {
        name: newDocName,
        type: newDocType,
        url: newDocUrl,
        category: "Geral"
      };

      const updatedDocs = [...localDocuments, newDoc];
      await updateStudent(student.id, { documents: updatedDocs });
      setLocalDocuments(updatedDocs);
      setNewDocName("");
      setNewDocUrl("");
      setIsAddingDoc(false);
      toast({ title: "Documento anexado!", description: "O arquivo foi salvo no banco de dados." });
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro ao anexar", description: err.message || "Falha ao salvar documento." });
    } finally {
      setIsSavingDoc(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pt-0 max-h-[85vh] overflow-y-auto">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <User className="h-4 w-4 text-accent"/>
                    <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                    <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-lg">
                         <Avatar className="h-12 w-12 border">
                            <AvatarImage src={displayAvatarUrl} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <p className="font-bold text-sm">{student.name}</p>
                            <p className="text-muted-foreground">{new Date(student.dob).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p><strong>Telefone:</strong> {student.phone}</p>
                        <p><strong>Endereço:</strong> {fullAddress}</p>
                        <div className="flex items-center gap-2 pt-1">
                            <strong>Status:</strong> 
                            <Badge className={cn("h-5 text-[10px]", student.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500')}>
                                {student.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
                {isMinor && (
                    <CardContent className="space-y-2 text-xs border-t pt-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-3 w-3 text-accent"/>
                            <span className="font-bold">Responsável</span>
                        </div>
                        <p><strong>Nome:</strong> {student.guardianName}</p>
                        <p><strong>CPF:</strong> {student.guardianCpf}</p>
                    </CardContent>
                )}
            </Card>
           
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <GraduationCap className="h-4 w-4 text-accent"/>
                    <CardTitle className="text-lg">Matrícula</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                    <p><strong>Turma:</strong> {student.class || 'Nenhuma'}</p>
                    <div className="flex items-center gap-1">
                        <strong>Condição:</strong> 
                        <Badge variant="outline" className="h-5 text-[10px]">{student.studentCondition}</Badge>
                    </div>
                    {student.class && (
                        <Button size="sm" variant="link" className="p-0 h-auto text-xs" onClick={() => handleLinkClick('/dashboard/classes')}>
                            <Link href="/dashboard/classes">Ver detalhes da turma <BookOpen className="ml-1 h-3 w-3"/></Link>
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm border-accent/10">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 bg-muted/5">
                    <div className="flex items-center gap-2">
                        <FileWarning className="h-4 w-4 text-accent"/>
                        <CardTitle className="text-lg">Docs e Anexos</CardTitle>
                    </div>
                    <Dialog open={isAddingDoc} onOpenChange={setIsAddingDoc}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-accent/10 text-accent hover:bg-accent/20 rounded-full">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Anexar Novo Documento</DialogTitle>
                                <CardDescription>Adicione arquivos diretamente à ficha de {student.name}.</CardDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nome do Documento</Label>
                                    <Input placeholder="Ex: Atestado, RG, Contrato" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                        variant="outline" 
                                        className={cn("h-12 flex-col gap-1 text-[10px]", newDocType === 'image' && "border-accent bg-accent/5")} 
                                        onClick={() => setNewDocType('image')}
                                        type="button"
                                    >
                                        <ImageIcon className="h-4 w-4" /> Foto / Imagem
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className={cn("h-12 flex-col gap-1 text-[10px]", newDocType === 'pdf' && "border-accent bg-accent/5")} 
                                        onClick={() => setNewDocType('pdf')}
                                        type="button"
                                    >
                                        <FileText className="h-4 w-4" /> Arquivo PDF
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Anexar ou Colar Link</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="URL ou arraste o arquivo" 
                                            value={newDocUrl} 
                                            onChange={e => setNewDocUrl(e.target.value)} 
                                            className="flex-1"
                                        />
                                        <div className="relative">
                                            <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isUploadingDoc} />
                                            <Button variant="outline" size="icon" type="button" disabled={isUploadingDoc}>
                                                {isUploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic">Suporta JPEG, PNG, PDF ou Links.</p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <DialogClose asChild>
                                        <Button variant="outline" className="flex-1">Cancelar</Button>
                                    </DialogClose>
                                    <Button className="flex-1 bg-accent" onClick={handleAddDocument} disabled={isSavingDoc}>
                                        {isSavingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : "Anexar"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                    {localDocuments.length > 0 ? (
                        <div className="grid gap-2">
                            {localDocuments.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => window.open(doc.url, '_blank')}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-2 bg-muted rounded-lg group-hover:bg-background transition-colors shadow-sm">
                                            {getDocIcon(doc.type)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-black truncate text-primary">{doc.name}</span>
                                            <span className="text-[9px] uppercase font-bold text-muted-foreground">{doc.type}</span>
                                        </div>
                                    </div>
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-[10px] text-muted-foreground italic px-4 border-2 border-dashed rounded-xl">
                            Nenhum documento anexado.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-2 bg-muted/10 pb-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-accent"/>
                        <CardTitle className="text-lg">Desempenho Pedagógico</CardTitle>
                    </div>
                    <Badge variant="secondary" className="font-mono">{student.grades.length} notas</Badge>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/5">
                                <TableHead className="h-9 text-[10px] uppercase font-bold">Avaliação</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold">Período</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Nota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {student.grades && student.grades.length > 0 ? student.grades.map((grade: Grade, index: number) => (
                                <TableRow key={index} className="hover:bg-muted/5">
                                    <TableCell className="py-2 text-xs font-medium">{grade.subject}</TableCell>
                                    <TableCell className="py-2 text-xs">{grade.periodNumber}º {grade.periodType}</TableCell>
                                    <TableCell className={cn(
                                        "py-2 text-xs text-right font-bold",
                                        grade.grade >= 60 ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {grade.grade.toFixed(1)}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={3} className="h-20 text-center text-xs text-muted-foreground italic">Nenhuma nota registrada.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Card className="shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-2 bg-muted/10 pb-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-accent"/>
                        <CardTitle className="text-lg">Registro de Frequência</CardTitle>
                    </div>
                    <Badge variant="secondary" className="font-mono">Frequência: {student.attendance.length > 0 ? Math.round((student.attendance.filter(a => a.status === 'present').length / student.attendance.length) * 100) : 0}%</Badge>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/5">
                                <TableHead className="h-9 text-[10px] uppercase font-bold">Data da Aula</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {student.attendance && student.attendance.length > 0 ? student.attendance.map((att: Attendance, index: number) => {
                                const {icon, text, color} = getAttendanceIcon(att.status);
                                return (
                                <TableRow key={index} className="hover:bg-muted/5">
                                    <TableCell className="py-2 text-xs">{new Date(att.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                                    <TableCell className="py-2 text-right">
                                        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px]", color)}>
                                            {icon} {text}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                )
                            }) : (
                                <TableRow><TableCell colSpan={2} className="h-20 text-center text-xs text-muted-foreground italic">Nenhum registro de frequência.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {canViewFinance && (
             <Card className="shadow-sm overflow-hidden border-accent/20">
                <CardHeader className="flex flex-row items-center justify-between gap-2 bg-accent/5 pb-3">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-accent"/>
                        <CardTitle className="text-lg">Histórico Financeiro</CardTitle>
                    </div>
                    <Badge className="bg-accent/10 text-accent border-accent/20 font-mono">Mensalidade: {formatCurrency(student.monthlyFee)}</Badge>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/5">
                                <TableHead className="h-9 text-[10px] uppercase font-bold">Data</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold">Descrição</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {student.paymentHistory && student.paymentHistory.length > 0 ? student.paymentHistory.map((payment: any, index: number) => (
                                <TableRow key={index} className="hover:bg-muted/5">
                                    <TableCell className="py-2 text-xs">{new Date(payment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell className="py-2 text-xs font-medium">{payment.description}</TableCell>
                                    <TableCell className="py-2 text-xs text-right font-bold text-green-600">{formatCurrency(payment.amount)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={3} className="h-20 text-center text-xs text-muted-foreground italic">Nenhum pagamento registrado.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            )}
        </div>
      </div>
    </div>
  );
}
