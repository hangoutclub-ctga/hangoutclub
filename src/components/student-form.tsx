
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { differenceInYears, parse, isValid } from 'date-fns';
import { CalendarIcon, Search, Loader2, FileUp, X, FileText, ImageIcon, Link as LinkIcon, Plus } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Switch } from "./ui/switch";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ImagePicker } from "./image-picker";
import { uploadFileToStorage } from "@/lib/supabase/storage";

const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  avatarUrl: z.string().optional().or(z.literal('')),
  dob: z.date({ required_error: "Data de nascimento é obrigatória." }),
  guardianName: z.string().optional(),
  guardianCpf: z.string().optional(),
  medicalInfo: z.string().optional(),
  class: z.string().optional(),
  cep: z.string().optional(),
  address: z.string().min(5, "Endereço muito curto."),
  addressNumber: z.string().min(1, "O número é obrigatório."),
  addressComplement: z.string().optional(),
  phone: z.string().min(10, "Telefone inválido."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
  paymentStatus: z.enum(["pago", "parcial", "nao_pago"]),
  partialAmount: z.coerce.number().optional(),
  partialDate: z.date().optional(),
  monthlyFee: z.coerce.number().min(0, "O valor não pode ser negativo.").optional(),
  dueDate: z.coerce.number().min(1, "Selecione um dia.").max(31, "Dia inválido.").optional(),
  studentCondition: z.string().min(1, "A condição do aluno é obrigatória."),
  status: z.enum(["Ativo", "Inativo"]),
  documents: z.array(z.object({
    name: z.string(),
    type: z.enum(['image', 'pdf', 'link']),
    url: z.string(),
    category: z.string(),
  })).default([]),
}).superRefine((data, ctx) => {
    if (data.dob) {
        const age = differenceInYears(new Date(), data.dob);
        if (age < 18) {
            if (!data.guardianName || data.guardianName.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Nome do responsável é obrigatório.",
                    path: ["guardianName"],
                });
            }
            if (!data.guardianCpf || data.guardianCpf.length < 11) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "CPF do responsável é obrigatório.",
                    path: ["guardianCpf"],
                });
            }
        }
    }
    if (data.paymentStatus !== 'nao_pago' && (!data.partialAmount || data.partialAmount <= 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "O valor pago deve ser maior que zero.",
            path: ["partialAmount"],
        });
    }
    if (data.paymentStatus !== 'nao_pago' && !data.partialDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A data do pagamento é obrigatória.",
            path: ["partialDate"],
        });
    }
});


export type StudentFormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
    student?: Student;
    availableClasses: Class[];
    studentConditions: string[];
    onSave: (data: StudentFormValues) => void;
    onCancel: () => void;
}

export function StudentForm({ student, onSave, onCancel, availableClasses, studentConditions }: StudentFormProps) {
  const [isMinor, setIsMinor] = React.useState(
      student ? differenceInYears(new Date(), new Date(student.dob)) < 18 : true
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAddingDoc, setIsAddingDoc] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);
  const [newDocName, setNewDocName] = React.useState("");
  const [newDocUrl, setNewDocUrl] = React.useState("");
  const [newDocType, setNewDocType] = React.useState<'image' | 'pdf' | 'link'>('image');
  
  const numberInputRef = React.useRef<HTMLInputElement>(null);
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student?.name || "",
      avatarUrl: student?.avatarUrl || "",
      dob: student?.dob ? new Date(student.dob) : undefined,
      guardianName: student?.guardianName || "",
      guardianCpf: student?.guardianCpf || "",
      medicalInfo: student?.medicalInfo || "",
      class: student?.class || "",
      cep: student?.cep || "",
      address: student?.address || "",
      addressNumber: student?.addressNumber || "",
      addressComplement: student?.addressComplement || "",
      phone: student?.phone || "",
      email: student?.email || "",
      paymentStatus: student?.paymentStatus || "nao_pago",
      partialAmount: student?.partialAmount || 0,
      partialDate: student?.partialDate ? new Date(student.partialDate) : undefined,
      monthlyFee: student?.monthlyFee || 0,
      dueDate: student?.dueDate || 5,
      studentCondition: student?.studentCondition || 'Integral',
      status: student?.status || "Ativo",
      documents: student?.documents || [],
    },
  });

  const [manualDob, setManualDob] = React.useState<string>(
    student?.dob ? format(new Date(student.dob), 'dd/MM/yyyy') : ''
  );
  const [manualPartialDate, setManualPartialDate] = React.useState<string>(
    student?.partialDate ? format(new Date(student.partialDate), 'dd/MM/yyyy') : ''
  );
  
  const paymentStatus = form.watch("paymentStatus");
  const studentCondition = form.watch("studentCondition");
  const attachedDocs = form.watch("documents") || [];
  
  const handleSubmit = async (data: StudentFormValues) => {
    setIsSaving(true);
    const dataToSend = {
      ...data,
      class: data.class === '__NONE__' ? '' : data.class,
    };
    await new Promise(resolve => setTimeout(resolve, 600));
    await onSave(dataToSend);
    setIsSaving(false);
  };

  const handleAddDocument = () => {
    if (!newDocName || !newDocUrl) {
      toast({ variant: 'destructive', title: "Dados incompletos", description: "Informe o nome e anexe o arquivo/link." });
      return;
    }
    const newDoc: StudentDocument = {
      name: newDocName,
      type: newDocType,
      url: newDocUrl,
      category: "Geral"
    };
    form.setValue("documents", [...attachedDocs, newDoc]);
    setNewDocName("");
    setNewDocUrl("");
    setIsAddingDoc(false);
    toast({ title: "Anexo adicionado!" });
  };

  const removeDocument = (index: number) => {
    const updated = attachedDocs.filter((_, i) => i !== index);
    form.setValue("documents", updated);
  };

  React.useEffect(() => {
    if (studentCondition === 'Bolsa') {
      form.setValue("monthlyFee", 0);
      form.setValue("dueDate", undefined, { shouldValidate: true });
    }
  }, [studentCondition, form]);
  
  const handleDateChange = (value: string, fieldName: 'dob' | 'partialDate', setManual: (v: string) => void) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    if (v.length > 5) v = `${v.slice(0, 5)}/${v.slice(5)}`;
    setManual(v);
    if (v.length === 10) {
      const parsedDate = parse(v, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        form.setValue(fieldName, parsedDate, { shouldValidate: true });
        if (fieldName === 'dob') {
            setIsMinor(differenceInYears(new Date(), parsedDate) < 18);
        }
      } else {
        form.setError(fieldName, { type: 'manual', message: 'Data inválida' });
      }
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

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cpf;
  };
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      form.setValue('guardianCpf', formatCPF(e.target.value));
  }


  const handleCepSearch = async () => {
    const cep = form.getValues("cep")?.replace(/\D/g, '');
    
    if (cep && cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                toast({
                    variant: "destructive",
                    title: "CEP não encontrado",
                    description: "Verifique o CEP e tente novamente.",
                });
            } else {
                const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
                form.setValue("address", fullAddress);
                toast({
                    title: "Endereço Encontrado!",
                    description: "O endereço foi preenchido automaticamente.",
                });
                numberInputRef.current?.focus();
            }
        } catch (error) {
             console.error("CEP fetch error:", error);
             toast({
                variant: "destructive",
                title: "Erro na busca",
                description: "Não foi possível buscar o CEP. Verifique sua conexão.",
            });
        }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 overflow-y-auto max-h-[70vh] p-1">
        
        <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-xl mb-6">
            <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <ImagePicker value={field.value} onChange={field.onChange} label="Foto do Aluno" folder="avatars" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/50">
                <div className="space-y-0.5">
                    <FormLabel>Status do Aluno</FormLabel>
                    <FormDescription className="text-[10px]">
                    {field.value === 'Ativo' ? 'O aluno está ativo no sistema.' : 'O aluno está inativo.'}
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={field.value === 'Ativo'}
                    onCheckedChange={(checked) => field.onChange(checked ? 'Ativo' : 'Inativo')}
                    />
                </FormControl>
                </FormItem>
            )}
            />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Aluno</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data de Nascimento</FormLabel>
                        <div className="relative">
                            <FormControl>
                                <Input
                                    placeholder="DD/MM/AAAA"
                                    value={manualDob}
                                    onChange={(e) => handleDateChange(e.target.value, 'dob', setManualDob)}
                                />
                            </FormControl>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8 text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            if (date) {
                                                setManualDob(format(date, 'dd/MM/yyyy'));
                                                setIsMinor(differenceInYears(new Date(), date) < 18);
                                            }
                                        }}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        {isMinor && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-2">Informações do Responsável</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Responsável</FormLabel>
                          <FormControl>
                            <Input placeholder="Maria da Silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guardianCpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CPF do Responsável</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} onChange={handleCpfChange} maxLength={14} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Telefone de Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 90000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="contato@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="space-y-2">
            <div className="flex items-end gap-2">
                <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                    <FormItem className="flex-grow">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CEP</FormLabel>
                    <FormControl>
                        <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleCepSearch} className="h-10">
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Buscar CEP</span>
                </Button>
            </div>
        </div>

        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
            <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Endereço</FormLabel>
                <FormControl>
                <Input placeholder="Rua das Flores, Bairro, Cidade - UF" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="addressNumber"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} ref={numberInputRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="addressComplement"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto 45 / Próximo ao mercado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
         <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vincular Turma</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || '__NONE__'}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione uma turma..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__NONE__">Não vincular a nenhuma turma</SelectItem>
                      {availableClasses.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        
        <FormField
          control={form.control}
          name="medicalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ficha Médica</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Alergias, condições médicas, etc."
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 p-4 border rounded-md bg-muted/50">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-2">Informações Financeiras</h3>
             <FormField
                control={form.control}
                name="studentCondition"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Condição do Aluno</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Selecione a condição do aluno" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {studentConditions.map(condition => (
                                    <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="monthlyFee"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Mensalidade</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="R$ 0,00" {...field} disabled={studentCondition === 'Bolsa'} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vencimento (Dia)</FormLabel>
                        <Select 
                            onValueChange={(value) => field.onChange(Number(value))} 
                            defaultValue={String(field.value)}
                            disabled={studentCondition === 'Bolsa'}
                        >
                            <FormControl>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Dia" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        </div>
        
        <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
                <FormItem className="space-y-3 p-4 border rounded-md bg-muted/50">
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-primary">Pagamento do Material</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="pago" /></FormControl>
                            <FormLabel className="font-normal text-xs">Realizado</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="parcial" /></FormControl>
                            <FormLabel className="font-normal text-xs">Parcialmente</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="nao_pago" /></FormControl>
                            <FormLabel className="font-normal text-xs">Não Realizado</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />

        {paymentStatus !== 'nao_pago' && (
             <div className="space-y-4 p-4 border rounded-md bg-muted/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="partialAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Pago</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="R$ 100,00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="partialDate"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data do Pagamento</FormLabel>
                        <div className="relative">
                           <FormControl>
                                <Input
                                    placeholder="DD/MM/AAAA"
                                    value={manualPartialDate}
                                    onChange={(e) => handleDateChange(e.target.value, 'partialDate', setManualPartialDate)}
                                />
                            </FormControl>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8 text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            if (date) {
                                                setManualPartialDate(format(date, 'dd/MM/yyyy'));
                                            }
                                        }}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        )}

        <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <FileUp className="h-4 w-4" /> Anexar Documentos
                </h3>
                <Dialog open={isAddingDoc} onOpenChange={setIsAddingDoc}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 border border-accent/20">
                            <Plus className="h-3 w-3" /> Adicionar Anexo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Novo Documento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Nome do Documento</FormLabel>
                                <Input placeholder="Ex: Atestado Médico, RG, Contrato" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    className={cn("h-12 flex-col gap-1 text-[10px]", newDocType === 'image' && "border-accent bg-accent/5")} 
                                    onClick={() => {
                                        setNewDocType('image');
                                        // Abre o image picker padrão ou dispara input de arquivo
                                    }}
                                    type="button"
                                >
                                    <ImageIcon className="h-4 w-4" /> Foto / Imagem
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className={cn("h-12 flex-col gap-1 text-[10px]", newDocType === 'pdf' && "border-accent bg-accent/5")} 
                                    onClick={() => {
                                        setNewDocType('pdf');
                                        // Dispara input de arquivo PDF
                                    }}
                                    type="button"
                                >
                                    <FileText className="h-4 w-4" /> Arquivo PDF
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Anexar ou Colar Link</FormLabel>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Arraste o arquivo ou cole a URL" 
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
                                <p className="text-[9px] text-muted-foreground italic">Suporta JPEG, PNG, PDF ou URLs externas.</p>
                            </div>

                            <Button className="w-full bg-accent" onClick={handleAddDocument}>Vincular ao Aluno</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {attachedDocs.length > 0 ? (
                <div className="grid gap-2">
                    {attachedDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-background border rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 bg-muted rounded">
                                    {doc.type === 'image' ? <ImageIcon className="h-3.5 w-3.5 text-accent" /> : (doc.type === 'pdf' ? <FileText className="h-3.5 w-3.5 text-red-500" /> : <LinkIcon className="h-3.5 w-3.5 text-blue-500" />)}
                                </div>
                                <span className="text-[11px] font-bold truncate pr-2">{doc.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeDocument(idx)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 border-2 border-dashed rounded-lg text-muted-foreground text-[10px] italic">Nenhum documento anexado ainda.</div>
            )}
        </div>

        <div className="flex justify-end gap-2 pt-6 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-2">
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onCancel} className="h-10" disabled={isSaving}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="bg-accent h-10 px-8" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {student ? "Salvar Alterações" : "Cadastrar Aluno"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
