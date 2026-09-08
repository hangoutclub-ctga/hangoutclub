"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { parse, isValid } from 'date-fns';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Student } from "@/types";
import { ImagePicker } from "./image-picker";


type TransactionType = "Entrada (Aluno)" | "Entrada (Outros)" | "Saída";

const formSchema = z.object({
  type: z.enum(["Entrada (Aluno)", "Entrada (Outros)", "Saída"]),
  description: z.string().min(3, "Descrição muito curta."),
  name: z.string().min(1, "O nome é obrigatório."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  paymentMethod: z.string().min(1, "Selecione a forma de pagamento."),
  receiptUrl: z.string().optional().or(z.literal('')),
});

export type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
    defaultValues?: Partial<TransactionFormValues>;
    allowedTypes?: TransactionType[];
    students: Student[];
    onSave: (data: TransactionFormValues) => Promise<void>;
    onCancel: () => void;
}


const allTypes: TransactionType[] = ["Entrada (Aluno)", "Entrada (Outros)", "Saída"];
const paymentMethods = ["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito", "Transferência Bancária", "Boleto"];

export function TransactionForm({ defaultValues, allowedTypes = allTypes, onSave, onCancel, students }: TransactionFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      type: allowedTypes[0],
      description: "",
      name: "",
      value: 0,
      date: new Date(),
      paymentMethod: "Dinheiro",
      receiptUrl: "",
    },
  });

  const transactionType = useWatch({
    control: form.control,
    name: "type",
  });
  
  const selectedStudentName = useWatch({
      control: form.control,
      name: "name"
  })

  React.useEffect(() => {
    if (transactionType === 'Entrada (Aluno)' && selectedStudentName) {
        const student = students.find(s => s.name === selectedStudentName);
        if (student && student.monthlyFee) {
            form.setValue('value', student.monthlyFee);
        }
    }
  }, [selectedStudentName, transactionType, form, students])

  const [manualDate, setManualDate] = React.useState<string>(
    defaultValues?.date ? format(new Date(defaultValues.date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')
  );

  const handleDateChange = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    if (v.length > 5) v = `${v.slice(0, 5)}/${v.slice(5)}`;
    setManualDate(v);
    if (v.length === 10) {
      const parsedDate = parse(v, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate)) {
        form.setValue('date', parsedDate, { shouldValidate: true });
      }
    }
  };

  const handleSubmit = async (data: TransactionFormValues) => {
    setIsSaving(true);
    await onSave(data);
    setIsSaving(false);
  };

  const renderNameField = () => {
    switch (transactionType) {
        case 'Entrada (Aluno)':
            return (
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aluno</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione o aluno" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                            {students.map(student => (
                                <SelectItem key={student.id} value={student.name}>{student.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            );
        default:
            return (
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Origem/Destino</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Venda de Material, Fornecedor X" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
        <div className="space-y-6 overflow-y-auto max-h-[65vh] px-1 pb-4 scrollbar-thin">
            <div className="flex justify-center mb-4">
                <FormField
                    control={form.control}
                    name="receiptUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <ImagePicker 
                                    value={field.value} 
                                    onChange={field.onChange} 
                                    label="Anexar Recibo/Foto" 
                                    aspect="video"
                                    folder="receipts"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Transação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={allowedTypes.length === 1}>
                    <FormControl>
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                    {allowedTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descrição</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Mensalidade, Material de Limpeza" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            {renderNameField()}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="R$ 0,00" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data</FormLabel>
                        <div className="relative">
                            <FormControl>
                                <Input
                                    placeholder="DD/MM/AAAA"
                                    value={manualDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="h-11"
                                />
                            </FormControl>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            if (date) {
                                                field.onChange(date);
                                                setManualDate(format(date, 'dd/MM/yyyy'));
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

            <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Forma de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                    {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="h-11 px-6">Cancelar</Button>
            <Button type="submit" className="bg-accent h-11 px-8" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Transação
            </Button>
        </div>
      </form>
    </Form>
  );
}
