"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Copy, Mail, Check, ChevronRight, ChevronLeft, ListChecks, FileText, Send, BookTemplate } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Class, Student, CommunicationTemplate } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const formSchema = z.object({
  classIds: z.array(z.string()).optional(),
  studentIds: z.array(z.string()).optional(),
  template: z.string().optional(),
  subject: z.string().min(5, "O assunto é muito curto."),
  message: z.string().min(10, "A mensagem é muito curta."),
});

type CommunicationFormValues = z.infer<typeof formSchema>;

interface CommunicationFormProps {
  communicationTemplates: CommunicationTemplate[];
  allClasses: Class[];
  allStudents: Student[];
}

export function CommunicationForm({ 
  communicationTemplates, 
  allClasses, 
  allStudents,
}: CommunicationFormProps) {
  const [step, setStep] = useState(1);
  const [copiedStates, setCopiedStates] = useState({
    emails: false,
    subject: false,
    message: false,
    all: false
  });
  
  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classIds: [],
      studentIds: [],
      template: "",
      subject: "",
      message: "",
    },
  });

  const selectedClassIds = useWatch({ control: form.control, name: "classIds" }) || [];
  const selectedStudentIds = useWatch({ control: form.control, name: "studentIds" }) || [];

  const studentsInList = React.useMemo(() => {
    if (selectedClassIds.length === 0) {
      return allStudents.filter(s => s.status === 'Ativo');
    }
    const selectedClassNames = allClasses
      .filter(c => selectedClassIds.includes(c.id))
      .map(c => c.name);
    return allStudents.filter(s => selectedClassNames.includes(s.class) && s.status === 'Ativo');
  }, [selectedClassIds, allStudents, allClasses]);

  const selectedRecipients = React.useMemo(() => {
    const recipients = new Map<string, { name: string; email: string }>();
    if (selectedStudentIds.length > 0) {
      allStudents
        .filter(s => selectedStudentIds.includes(s.id) && s.status === 'Ativo' && s.email)
        .forEach(s => recipients.set(s.email!, { name: s.name, email: s.email! }));
    } else if (selectedClassIds.length > 0) {
      const classNames = allClasses.filter(c => selectedClassIds.includes(c.id)).map(c => c.name);
      allStudents
        .filter(s => classNames.includes(s.class) && s.status === 'Ativo' && s.email)
        .forEach(s => recipients.set(s.email!, { name: s.name, email: s.email! }));
    } else {
      allStudents
        .filter(s => s.status === 'Ativo' && s.email)
        .forEach(s => recipients.set(s.email!, { name: s.name, email: s.email! }));
    }
    return Array.from(recipients.values());
  }, [selectedClassIds, selectedStudentIds, allStudents, allClasses]);

  const handleSelectAllClasses = (checked: boolean) => {
    if (checked) {
      form.setValue('classIds', allClasses.filter(c => c.status === 'Ativa').map(c => c.id));
    } else {
      form.setValue('classIds', []);
    }
    form.setValue('studentIds', []);
  };

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      form.setValue('studentIds', studentsInList.map(s => s.id));
    } else {
      form.setValue('studentIds', []);
    }
  };

  const handleCopy = (text: string, type: keyof typeof copiedStates) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [type]: true }));
    toast({ title: "Copiado com sucesso!" });
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
  };

  const handleTemplateChange = (templateId: string) => {
    if (templateId === "__CUSTOM__") {
        form.setValue("subject", "");
        form.setValue("message", "");
        return;
    }
    const template = communicationTemplates.find(t => t.id === templateId);
    if (template) {
      form.setValue("subject", template.subject);
      form.setValue("message", template.message);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4 px-2 overflow-x-auto gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-fit">
                    <div className={cn(
                        "h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs transition-colors",
                        step === i ? "bg-accent text-white" : (step > i ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")
                    )}>
                        {step > i ? <Check className="h-4 w-4" /> : i}
                    </div>
                    <span className={cn("text-[9px] font-bold uppercase", step === i ? "text-accent" : "text-muted-foreground")}>
                        {i === 1 ? 'Turmas' : i === 2 ? 'Alunos' : i === 3 ? 'Mensagem' : 'Resumo'}
                    </span>
                </div>
            ))}
        </div>

        <div className="min-h-[300px]">
            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold">Filtrar por Turmas</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Selecione para restringir a lista.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border">
                            <Checkbox 
                                id="all-classes" 
                                checked={selectedClassIds.length === allClasses.filter(c => c.status === 'Ativa').length && selectedClassIds.length > 0}
                                onCheckedChange={handleSelectAllClasses}
                            />
                            <label htmlFor="all-classes" className="text-[10px] font-bold cursor-pointer">Todas</label>
                        </div>
                    </div>
                    <ScrollArea className="h-60 sm:h-72 border rounded-xl p-3 sm:p-4 bg-muted/5">
                        <div className="grid gap-2">
                            {allClasses.filter(c => c.status === 'Ativa').map((c) => (
                                <FormField
                                    key={c.id}
                                    control={form.control}
                                    name="classIds"
                                    render={({ field }) => (
                                        <FormItem 
                                            className="flex flex-row items-center space-x-3 space-y-0 p-2.5 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => {
                                                const isChecked = field.value?.includes(c.id);
                                                const newValue = isChecked
                                                    ? (field.value || []).filter((v: string) => v !== c.id)
                                                    : [...(field.value || []), c.id];
                                                field.onChange(newValue);
                                                form.setValue('studentIds', []);
                                            }}
                                        >
                                            <FormControl onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={field.value?.includes(c.id)}
                                                    onCheckedChange={(checked) => {
                                                        const newValue = checked
                                                            ? [...(field.value || []), c.id]
                                                            : (field.value || []).filter((v) => v !== c.id);
                                                        field.onChange(newValue);
                                                        form.setValue('studentIds', []);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-medium text-xs sm:text-sm flex-1 cursor-pointer" onClick={(e) => e.preventDefault()}>
                                                {c.name}
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base sm:text-lg font-bold">Destinatários Específicos</h3>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Opcional: deixe vazio para a turma toda.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border">
                            <Checkbox 
                                id="all-students" 
                                checked={selectedStudentIds.length === studentsInList.length && selectedStudentIds.length > 0}
                                onCheckedChange={handleSelectAllStudents}
                            />
                            <label htmlFor="all-students" className="text-[10px] font-bold cursor-pointer">Todos</label>
                        </div>
                    </div>
                    <ScrollArea className="h-60 sm:h-72 border rounded-xl p-3 sm:p-4 bg-muted/5">
                        <div className="grid gap-2">
                            {studentsInList.length > 0 ? studentsInList.map((s) => (
                                <FormField
                                    key={s.id}
                                    control={form.control}
                                    name="studentIds"
                                    render={({ field }) => (
                                        <FormItem 
                                            className="flex flex-row items-center space-x-3 space-y-0 p-2.5 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => {
                                                const isChecked = field.value?.includes(s.id);
                                                const newValue = isChecked
                                                    ? (field.value || []).filter((v: string) => v !== s.id)
                                                    : [...(field.value || []), s.id];
                                                field.onChange(newValue);
                                            }}
                                        >
                                            <FormControl onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={field.value?.includes(s.id)}
                                                    onCheckedChange={(checked) => {
                                                        const newValue = checked
                                                            ? [...(field.value || []), s.id]
                                                            : (field.value || []).filter((v) => v !== s.id);
                                                        field.onChange(newValue);
                                                    }}
                                                />
                                            </FormControl>
                                            <div className="flex-1 cursor-pointer">
                                                <FormLabel className="font-medium text-xs sm:text-sm cursor-pointer" onClick={(e) => e.preventDefault()}>
                                                    {s.name}
                                                </FormLabel>
                                                <p className="text-[9px] sm:text-[10px] text-muted-foreground">{s.email || 'Sem e-mail'}</p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            )) : (
                                <div className="text-center py-20 text-muted-foreground italic text-xs">Nenhum aluno encontrado nas turmas.</div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1.5">
                        <FormLabel className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                            <BookTemplate className="h-3 w-3" /> Usar modelo escolar pronto
                        </FormLabel>
                        <Select onValueChange={handleTemplateChange}>
                            <SelectTrigger className="bg-muted/30 h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder="Escolher um tema..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__CUSTOM__">Texto Personalizado</SelectItem>
                                {communicationTemplates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Assunto do E-mail</FormLabel>
                                <FormControl><Input placeholder="Ex: Aviso de Feriado" className="h-9 sm:h-10 text-xs sm:text-sm" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Corpo da Mensagem</FormLabel>
                                <FormControl><Textarea placeholder="Escreva o comunicado..." className="min-h-[120px] sm:min-h-[200px] text-xs sm:text-sm" {...field} /></FormControl>
                                <FormDescription className="text-[9px] sm:text-[10px]">Dica: use <strong>{'{student_name}'}</strong> para personalizar.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}

            {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Card className="bg-accent/5 border-accent/20">
                        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm flex items-center gap-2"><ListChecks className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Resumo do Comunicado</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-background rounded-lg border">
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold">Destinatários</p>
                                    <p className="text-base sm:text-lg font-black text-primary">{selectedRecipients.length}</p>
                                </div>
                                <div className="p-2 bg-background rounded-lg border">
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold">Origem</p>
                                    <p className="text-[10px] sm:text-xs font-bold truncate">
                                        {selectedClassIds.length > 0 ? `${selectedClassIds.length} Turmas` : 'Todos os Ativos'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-2 bg-background rounded-lg border">
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold">Assunto Definido</p>
                                <p className="text-[10px] sm:text-xs font-medium italic line-clamp-1">"{form.getValues('subject')}"</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-2">
                        <Button 
                            variant="outline" 
                            className="h-10 sm:h-12 justify-between px-3 sm:px-4 hover:bg-accent/5 text-[11px] sm:text-sm" 
                            onClick={() => handleCopy(selectedRecipients.map(r => r.email).join(', '), 'emails')}
                            disabled={selectedRecipients.length === 0}
                            type="button"
                        >
                            <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Copiar Lista de E-mails</span>
                            {copiedStates.emails ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />}
                        </Button>

                        <Button 
                            variant="outline" 
                            className="h-10 sm:h-12 justify-between px-3 sm:px-4 hover:bg-accent/5 text-[11px] sm:text-sm" 
                            onClick={() => handleCopy(form.getValues('subject'), 'subject')}
                            type="button"
                        >
                            <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> Copiar Apenas Assunto</span>
                            {copiedStates.subject ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />}
                        </Button>

                        <Button 
                            className="h-11 sm:h-14 justify-center gap-2 bg-accent hover:bg-accent/90 shadow-lg text-xs sm:text-base font-bold mt-2" 
                            onClick={() => handleCopy(`Assunto: ${form.getValues('subject')}\n\n${form.getValues('message')}`, 'all')}
                            type="button"
                        >
                            <span className="flex items-center gap-2">
                                {copiedStates.all ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Send className="h-4 w-4 sm:h-5 sm:w-5" />} 
                                Copiar Mensagem Completa
                            </span>
                        </Button>
                    </div>
                </div>
            )}
        </div>

        <div className="flex items-center justify-between pt-4 sm:pt-6 border-t mt-auto">
            <Button 
                variant="ghost" 
                size="sm"
                onClick={prevStep} 
                disabled={step === 1}
                className={cn("h-9 sm:h-10 text-xs", step === 1 && "opacity-0")}
                type="button"
            >
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            
            {step < 4 ? (
                <Button 
                    size="sm"
                    className="bg-accent hover:bg-accent/90 px-6 sm:px-8 h-9 sm:h-10 text-xs" 
                    onClick={nextStep}
                    disabled={step === 3 && (!form.getValues('subject') || !form.getValues('message'))}
                    type="button"
                >
                    Próximo <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            ) : (
                <Button 
                    variant="outline"
                    size="sm"
                    className="border-accent text-accent hover:bg-accent/5 h-9 sm:h-10 text-xs"
                    onClick={() => { setStep(1); form.reset(); }}
                    type="button"
                >
                    <ListChecks className="mr-1 h-4 w-4" /> Novo Comunicado
                </Button>
            )}
        </div>
      </div>
    </Form>
  );
}
