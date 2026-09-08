
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { FixedExpense } from "@/types";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ImagePicker } from "./image-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  description: z.string().min(3, "Descrição muito curta."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  receiptUrl: z.string().optional().or(z.literal('')),
});

export type PayExpenseFormValues = z.infer<typeof formSchema>;

interface PayExpenseFormProps {
    expense: FixedExpense;
    onSave: (data: PayExpenseFormValues) => Promise<void>;
}


export function PayExpenseForm({ expense, onSave }: PayExpenseFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<PayExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: expense.description,
      value: expense.value,
      date: new Date(),
      receiptUrl: ""
    },
  });

  const [manualDate, setManualDate] = React.useState<string>(format(new Date(), 'dd/MM/yyyy'));

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
      } else {
        form.setError('date', { type: 'manual', message: 'Data inválida' });
      }
    }
  };

  const handleSubmit = async (data: PayExpenseFormValues) => {
    setIsSaving(true);
    await onSave(data);
    setIsSaving(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Mensalidade, Material de Limpeza" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Pago</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="R$ 0,00" {...field} />
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
                    <FormLabel>Data do Pagamento</FormLabel>
                    <div className="relative">
                        <FormControl>
                            <Input
                                placeholder="DD/MM/AAAA"
                                value={manualDate}
                                onChange={(e) => handleDateChange(e.target.value)}
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
            name="receiptUrl"
            render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/10">
                    <FormControl>
                        <ImagePicker 
                            value={field.value} 
                            onChange={field.onChange} 
                            label="Comprovante de Pagamento" 
                            aspect="square" 
                            folder="receipts"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar Pagamento
        </Button>
      </form>
    </Form>
  );
}
