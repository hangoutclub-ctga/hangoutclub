
"use client";

import Link from "next/link";
import Image from "next/image";
import { User, Shield, GraduationCap, BookOpen, Wallet, FileText, CheckCircle, XCircle, Clock, Printer, Megaphone, CalendarDays, ExternalLink, ImageIcon, FileWarning, Eye, Plus, FileUp, X, Loader2, HeartPulse, Camera, Upload, Link as LinkIcon, Check, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoading } from "@/hooks/use-loading";
import { useAuth } from "@/hooks/use-auth";
import { Grade, Attendance, Student, StudentDocument } from "@/types";
import { cn, getDisplayAvatarUrl, formatCurrency } from "@/lib/utils";
import { uploadFileToStorage, uploadDataUrlToStorage } from "@/lib/supabase/storage";
import React from "react";
import { differenceInYears, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useData } from "@/hooks/use-data";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "@/hooks/use-toast";
import { StudentPrintSheet } from "./student-print-sheet";
import { TransactionForm } from "./transaction-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getAttendanceIcon = (status: string) => {
    switch (status) {
        case 'present': return { icon: <CheckCircle className="h-3 w-3 text-green-500" />, text: 'Presente', color: 'text-green-700 bg-green-50' };
        case 'absent': return { icon: <XCircle className="h-3 w-3 text-red-500" />, text: 'Ausente', color: 'text-red-700 bg-red-50' };
        case 'justified': return { icon: <Megaphone className="h-3 w-3 text-yellow-500" />, text: 'Justificado', color: 'text-yellow-700 bg-yellow-50' };
        default: return { icon: null, text: '', color: ''};
    }
}

const WhatsAppButton = ({ 
  phone, 
  studentName, 
  guardianName, 
  isGuardian = false 
}: { 
  phone?: string; 
  studentName: string; 
  guardianName?: string; 
  isGuardian?: boolean; 
}) => {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return null;

  const targetName = isGuardian && guardianName ? guardianName : studentName;
  const fullNumber = clean.length <= 11 ? `55${clean}` : clean;

  const openWhatsApp = (msg: string) => {
    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const defaultMsg = `Olá, ${targetName}! Aqui é da equipe do Hangout Club, tudo bem?`;
  const reminderMsg = `Olá, ${targetName}! Passando para lembrar das aulas e atividades do Hangout Club. Qualquer dúvida estamos à disposição!`;
  const financeMsg = `Olá, ${targetName}! Entramos em contato da secretaria do Hangout Club referente a informações da sua matrícula/mensalidade. Podemos conversar?`;
  const celebrationMsg = `Parabéns, ${targetName}! 🎉 Toda a equipe do Hangout Club deseja um dia incrível e muito sucesso!`;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Button
        type="button"
        size="sm"
        onClick={() => openWhatsApp(defaultMsg)}
        className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm gap-1.5 transition-all active:scale-95"
        title="Conversar no WhatsApp"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span>WhatsApp</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            type="button" 
            size="icon" 
            variant="outline" 
            className="h-7 w-7 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 dark:border-emerald-700"
            title="Modelos de mensagem"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60 text-xs">
          <DropdownMenuItem onClick={() => openWhatsApp(defaultMsg)} className="cursor-pointer gap-2 py-2">
            <span>💬</span> <span>Saudação Geral</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openWhatsApp(reminderMsg)} className="cursor-pointer gap-2 py-2">
            <span>📅</span> <span>Lembrete de Aulas</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openWhatsApp(financeMsg)} className="cursor-pointer gap-2 py-2">
            <span>💳</span> <span>Secretaria / Financeiro</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openWhatsApp(celebrationMsg)} className="cursor-pointer gap-2 py-2">
            <span>🎉</span> <span>Parabéns / Aniversário</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function StudentProfile({ student: initialStudent }: { student: Student }) {
  const { handleLinkClick } = useLoading();
  const { hasPermission } = useAuth();
  const { students, transactions, addTransaction, updateStudent } = useData();
  const canViewFinance = hasPermission('finance:view');
  const canEditFinance = hasPermission('finance:edit');

  const student = students.find(s => s.id === initialStudent.id) || initialStudent;
  
  const [localDocuments, setLocalDocuments] = React.useState<StudentDocument[]>(student.documents || []);
  const [isAddingDoc, setIsAddingDoc] = React.useState(false);
  const [newDocName, setNewDocName] = React.useState("");
  const [newDocUrl, setNewDocUrl] = React.useState("");
  const [newDocType, setNewDocType] = React.useState<'image' | 'pdf' | 'link'>('image');
  const [isSavingDoc, setIsSavingDoc] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);
  const [docMode, setDocMode] = React.useState<'options' | 'camera' | 'link'>('options');
  const [uploadStatus, setUploadStatus] = React.useState("Processando...");
  const [tempLinkValue, setTempLinkValue] = React.useState("");
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Financial state
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [selectedReceipt, setSelectedReceipt] = React.useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);

  // Real transactions for this student
  const studentTransactions = React.useMemo(() => {
    const studentName = student.name.trim().toLowerCase();
    return transactions
      .filter(t => {
        if (t.type !== 'Entrada') return false;
        const txName = (t.name || '').trim().toLowerCase();
        return txName === studentName ||
               studentName.startsWith(txName) ||
               txName.startsWith(studentName);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, student.name]);

  const mock2023Dates = ['2023-08-05', '2023-09-05', '2023-10-05', '2023-09-10', '2023-10-10'];
  const legacyPayments = React.useMemo(() => {
    return (student.paymentHistory || []).filter(
      p => !mock2023Dates.includes(p.date)
    );
  }, [student.paymentHistory]);

  const displayPayments = React.useMemo(() => {
    if (studentTransactions.length > 0) {
      return studentTransactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.value,
        paymentMethod: t.paymentMethod,
        receiptUrl: t.receiptUrl,
        status: 'Pago' as const
      }));
    }
    return legacyPayments.map((p, idx) => ({
      id: `legacy-${idx}`,
      date: p.date,
      description: p.description,
      amount: p.amount,
      paymentMethod: undefined,
      receiptUrl: undefined,
      status: p.status || ('Pago' as const)
    }));
  }, [studentTransactions, legacyPayments]);

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

  const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 1200;
        if (width > height && width > max) {
          height *= max / width;
          width = max;
        } else if (height > max) {
          width *= max / height;
          height = max;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUri);
      img.src = dataUri;
    });
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setDocMode('options');
  };

  const startCamera = async () => {
    setDocMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast({ variant: 'destructive', title: "Erro na Câmera", description: "Não foi possível acessar a câmera." });
      setDocMode('options');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUri = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();

    setIsUploadingDoc(true);
    setUploadStatus("Salvando foto no storage...");
    try {
      const compressed = await compressImage(dataUri);
      const { url, error } = await uploadDataUrlToStorage(compressed, 'documents', `foto-${Date.now()}.jpg`);
      if (error) {
        toast({ variant: "destructive", title: "Erro no envio", description: error });
      } else if (url) {
        setNewDocUrl(url);
        setNewDocType('image');
        if (!newDocName.trim()) {
          setNewDocName(`Foto Capturada ${format(new Date(), 'dd/MM/yyyy HH:mm')}`);
        }
        toast({ title: "Foto salva!", description: "Upload concluído com sucesso." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err.message });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setUploadStatus("Otimizando e enviando...");
    const isPdf = file.type === 'application/pdf';

    if (!newDocName.trim()) {
      setNewDocName(file.name.replace(/\.[^/.]+$/, ""));
    }

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const rawDataUrl = event.target?.result as string;
            const compressed = await compressImage(rawDataUrl);
            setUploadStatus("Salvando no storage...");
            const { url, error } = await uploadDataUrlToStorage(compressed, 'documents', file.name);
            if (error) {
              toast({ variant: "destructive", title: "Erro no envio", description: error });
            } else if (url) {
              setNewDocUrl(url);
              setNewDocType('image');
              toast({ title: "Arquivo anexado!", description: "Upload concluído com sucesso." });
            }
          } catch (err: any) {
            toast({ variant: "destructive", title: "Erro ao processar", description: err.message });
          } finally {
            setIsUploadingDoc(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setUploadStatus("Enviando arquivo...");
        const { url, error } = await uploadFileToStorage(file, 'documents', file.name);
        if (error) {
          toast({ variant: "destructive", title: "Erro no envio", description: error });
        } else if (url) {
          setNewDocUrl(url);
          setNewDocType(isPdf ? 'pdf' : 'link');
          toast({ title: "Arquivo anexado!", description: "Upload concluído com sucesso." });
        }
        setIsUploadingDoc(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: err.message });
      setIsUploadingDoc(false);
    }
  };

  const handleSaveLink = () => {
    if (!tempLinkValue.trim()) return;
    const val = tempLinkValue.trim();
    setNewDocUrl(val);
    const lower = val.toLowerCase();
    if (lower.endsWith('.pdf')) {
      setNewDocType('pdf');
    } else if (lower.match(/\.(jpeg|jpg|png|webp|gif)/)) {
      setNewDocType('image');
    } else {
      setNewDocType('link');
    }
    if (!newDocName.trim()) {
      setNewDocName("Documento Externo");
    }
    setDocMode('options');
    setTempLinkValue("");
  };

  const handleCloseDocDialog = () => {
    stopCamera();
    setIsAddingDoc(false);
    setDocMode('options');
    setNewDocName("");
    setNewDocUrl("");
    setTempLinkValue("");
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim() || !newDocUrl) {
      toast({ variant: 'destructive', title: "Dados incompletos", description: "Informe o nome e anexe o arquivo/link." });
      return;
    }

    setIsSavingDoc(true);
    try {
      const newDoc: StudentDocument = {
        name: newDocName.trim(),
        type: newDocType,
        url: newDocUrl,
        category: "Geral"
      };

      const updatedDocs = [...localDocuments, newDoc];
      await updateStudent(student.id, { documents: updatedDocs });
      setLocalDocuments(updatedDocs);
      handleCloseDocDialog();
      toast({ title: "Documento anexado!", description: "O arquivo foi salvo na ficha do aluno." });
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro ao anexar", description: err.message || "Falha ao salvar documento." });
    } finally {
      setIsSavingDoc(false);
    }
  };

  return (
    <>
      {/* Visualização de Tela (Modal Interativo) */}
      <div className="flex flex-col gap-6 p-6 pt-0 max-h-[85vh] overflow-y-auto print:hidden">
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
                    <div className="space-y-2">
                        <div className="flex flex-col gap-1">
                            <p><strong>Telefone:</strong> {student.phone}</p>
                            <WhatsAppButton 
                              phone={student.phone} 
                              studentName={student.name} 
                              guardianName={student.guardianName} 
                              isGuardian={false} 
                            />
                        </div>
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
                        <div className="pt-1">
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Contato com Responsável:</p>
                          <WhatsAppButton 
                            phone={student.phone} 
                            studentName={student.name} 
                            guardianName={student.guardianName} 
                            isGuardian={true} 
                          />
                        </div>
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

            {student.medicalInfo && (
              <Card className="shadow-sm border-amber-300 bg-amber-50/40">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <HeartPulse className="h-4 w-4 text-amber-700"/>
                  <CardTitle className="text-base text-amber-950">Informações Médicas</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-amber-900 whitespace-pre-line">
                  {student.medicalInfo}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm border-accent/10">
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 bg-muted/5">
                    <div className="flex items-center gap-2">
                        <FileWarning className="h-4 w-4 text-accent"/>
                        <CardTitle className="text-lg">Docs e Anexos</CardTitle>
                    </div>
                    <Dialog open={isAddingDoc} onOpenChange={(open) => {
                        if (!open) {
                            handleCloseDocDialog();
                        } else {
                            setIsAddingDoc(true);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-accent/10 text-accent hover:bg-accent/20 rounded-full" title="Anexar Documento">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Anexar Novo Documento</DialogTitle>
                                <CardDescription>Adicione arquivos diretamente à ficha de {student.name}.</CardDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nome do Documento</Label>
                                    <Input 
                                        placeholder="Ex: Atestado, RG, Contrato" 
                                        value={newDocName} 
                                        onChange={e => setNewDocName(e.target.value)} 
                                        className="h-10"
                                    />
                                </div>

                                {isUploadingDoc ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3 border rounded-xl bg-muted/10">
                                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
                                            {uploadStatus}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {docMode === 'camera' && (
                                            <div className="space-y-4 py-2">
                                                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" className="flex-1 h-11" onClick={stopCamera} type="button">
                                                        Voltar
                                                    </Button>
                                                    <Button className="flex-1 gap-2 bg-accent h-11" onClick={capturePhoto} type="button">
                                                        <Check className="h-4 w-4" /> Capturar Agora
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {docMode === 'link' && (
                                            <div className="space-y-4 py-2">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">URL da Imagem / Arquivo</Label>
                                                    <Input 
                                                        placeholder="https://exemplo.com/documento.pdf" 
                                                        value={tempLinkValue} 
                                                        onChange={(e) => setTempLinkValue(e.target.value)}
                                                        autoFocus
                                                        className="h-10"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" className="flex-1 h-11" onClick={() => setDocMode('options')} type="button">
                                                        Voltar
                                                    </Button>
                                                    <Button className="flex-1 bg-accent h-11" onClick={handleSaveLink} type="button">
                                                        Salvar Link
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {docMode === 'options' && (
                                            <>
                                                {newDocUrl ? (
                                                    <div className="p-3 border rounded-xl bg-muted/20 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {newDocType === 'image' ? (
                                                                <img src={getDisplayAvatarUrl(newDocUrl)} alt="Preview" className="h-12 w-12 rounded-lg object-cover border" />
                                                            ) : newDocType === 'pdf' ? (
                                                                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                                    <FileText className="h-6 w-6 text-red-500" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                                    <ExternalLink className="h-6 w-6 text-blue-500" />
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-bold truncate max-w-[200px] text-foreground">
                                                                    {newDocName || "Arquivo Selecionado"}
                                                                </span>
                                                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                                                    <Check className="h-3 w-3 text-green-500" /> Anexado ({newDocType.toUpperCase()})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium h-8 px-2"
                                                            onClick={() => setNewDocUrl("")}
                                                            type="button"
                                                        >
                                                            <X className="h-4 w-4 mr-1" /> Trocar
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Adicionar Arquivo</Label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                className="h-20 flex-col gap-2 rounded-xl text-[10px] font-bold uppercase hover:border-accent hover:bg-accent/5 transition-all" 
                                                                onClick={startCamera} 
                                                                type="button"
                                                            >
                                                                <Camera className="h-6 w-6 text-accent" /> Câmera
                                                            </Button>
                                                            <div className="relative">
                                                                <Input 
                                                                    type="file" 
                                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                                                    accept="image/*,application/pdf" 
                                                                    onChange={handleFileUpload} 
                                                                />
                                                                <Button 
                                                                    variant="outline" 
                                                                    className="h-20 w-full flex-col gap-2 rounded-xl text-[10px] font-bold uppercase pointer-events-none hover:border-accent hover:bg-accent/5 transition-all"
                                                                >
                                                                    <Upload className="h-6 w-6 text-accent" /> Arquivo (Img/PDF)
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="outline" 
                                                            className="h-12 w-full justify-start gap-3 rounded-xl text-[10px] font-bold uppercase hover:border-accent hover:bg-accent/5 transition-all" 
                                                            onClick={() => setDocMode('link')} 
                                                            type="button"
                                                        >
                                                            <LinkIcon className="h-5 w-5 text-accent" /> Colar Link da Imagem
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                    <Button variant="outline" className="flex-1 h-11" onClick={handleCloseDocDialog} type="button">
                                        Cancelar
                                    </Button>
                                    <Button 
                                        className="flex-1 bg-accent h-11" 
                                        onClick={handleAddDocument} 
                                        disabled={!newDocName.trim() || !newDocUrl || isUploadingDoc || isSavingDoc}
                                        type="button"
                                    >
                                        {isSavingDoc ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Anexar
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
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                            title="Excluir anexo"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const updated = localDocuments.filter((_, i) => i !== idx);
                                                await updateStudent(student.id, { documents: updated });
                                                setLocalDocuments(updated);
                                                toast({ title: "Documento removido" });
                                            }}
                                            type="button"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
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
                    <div className="flex items-center gap-2">
                        <Badge className="bg-accent/10 text-accent border-accent/20 font-mono">Mensalidade: {formatCurrency(student.monthlyFee)}</Badge>
                        {canEditFinance && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs border-accent/40 text-accent hover:bg-accent/10 rounded-lg px-2.5"
                                onClick={() => setIsPaymentDialogOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Novo Pagamento
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/5">
                                <TableHead className="h-9 text-[10px] uppercase font-bold">Data</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold">Descrição</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold hidden sm:table-cell">Forma</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Valor</TableHead>
                                <TableHead className="h-9 text-[10px] uppercase font-bold text-center w-14">Comp.</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayPayments.length > 0 ? displayPayments.map((payment) => (
                                <TableRow key={payment.id} className="hover:bg-muted/5">
                                    <TableCell className="py-2 text-xs font-mono">{new Date(payment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</TableCell>
                                    <TableCell className="py-2 text-xs font-medium">{payment.description}</TableCell>
                                    <TableCell className="py-2 text-xs hidden sm:table-cell">
                                        {payment.paymentMethod ? (
                                            <Badge variant="outline" className="text-[9px] font-normal px-1.5 py-0 h-4">
                                                {payment.paymentMethod}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="py-2 text-xs text-right font-bold text-green-600 font-mono">{formatCurrency(payment.amount)}</TableCell>
                                    <TableCell className="py-2 text-center p-1">
                                        {payment.receiptUrl ? (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-accent hover:bg-accent/10" 
                                                onClick={() => {
                                                    setSelectedReceipt(payment.receiptUrl!);
                                                    setIsReceiptOpen(true);
                                                }}
                                                title="Ver Comprovante"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground/30 text-xs">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground italic">Nenhum pagamento registrado.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            )}
        </div>
      </div>
    </div>

      {/* Dialog Comprovante de Pagamento */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
              <DialogHeader><DialogTitle>Comprovante de Pagamento</DialogTitle></DialogHeader>
              <div className="flex justify-center p-4 bg-muted/20 rounded-lg border">
                  {selectedReceipt ? (
                      <Image 
                          src={getDisplayAvatarUrl(selectedReceipt)} 
                          alt="Comprovante" 
                          width={400} 
                          height={600} 
                          className="max-h-[70vh] object-contain rounded-md"
                          data-ai-hint="payment receipt"
                      />
                  ) : (
                      <div className="py-20 text-muted-foreground italic">Comprovante não disponível.</div>
                  )}
              </div>
              <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => setIsReceiptOpen(false)} className="rounded-xl h-10 px-8">Fechar</Button>
              </div>
          </DialogContent>
      </Dialog>

      {/* Dialog Novo Pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
              <DialogHeader><DialogTitle>Registrar Pagamento - {student.name}</DialogTitle></DialogHeader>
              <TransactionForm 
                  allowedTypes={["Entrada (Aluno)"]}
                  defaultValues={{
                      type: 'Entrada (Aluno)',
                      name: student.name,
                      value: student.monthlyFee || 0,
                      description: `Mensalidade ${format(new Date(), 'MMMM', { locale: ptBR })}`,
                      date: new Date(),
                      paymentMethod: 'PIX',
                      receiptUrl: '',
                  }}
                  onSave={async (data) => {
                      try {
                          await addTransaction({
                              type: 'Entrada',
                              category: 'Aluno',
                              name: data.name,
                              description: data.description,
                              value: data.value,
                              date: data.date.toISOString(),
                              receiptUrl: data.receiptUrl,
                              paymentMethod: data.paymentMethod
                          });
                          toast({ title: "Pagamento Registrado!", description: "Salvo com sucesso." });
                          setIsPaymentDialogOpen(false);
                      } catch (err: any) {
                          toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
                      }
                  }}
                  onCancel={() => setIsPaymentDialogOpen(false)}
                  students={students}
              />
          </DialogContent>
      </Dialog>

      {/* Modelo Oficial Formatado para Impressão A4 (Aparece apenas na impressão) */}
      <div className="hidden print:block w-full">
        <StudentPrintSheet student={student} canViewFinance={canViewFinance} payments={displayPayments} />
      </div>
    </>
  );
}
