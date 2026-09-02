
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { Loader2 } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { FixedExpense } from "@/types";

const formSchema = z.object({
  description: z.string().min(3, "Descrição muito curta."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  dueDate: z.coerce.number().min(1, "Dia de vencimento é obrigatório."),
});

export type FixedExpenseFormValues = z.infer<typeof formSchema>;

interface FixedExpenseFormProps {
    defaultValues?: Omit<FixedExpense, 'status' | 'month' | 'year' | 'receiptUrl'>;
    onSave: (data: FixedExpenseFormValues) => Promise<void>;
    onCancel: () => void;
}


export function FixedExpenseForm({ onSave, defaultValues, onCancel }: FixedExpenseFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<FixedExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      description: "",
      value: 0,
      dueDate: 5,
    },
  });

  const handleSubmit = async (data: FixedExpenseFormValues) => {
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
                <Input placeholder="Ex: Aluguel, Salário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Valor Mensal</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="R$ 0,00" {...field} />
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
                    <FormLabel>Dia do Vencimento</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                        <FormControl>
                        <SelectTrigger>
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
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Despesa
            </Button>
        </div>
      </form>
    </Form>
  );
}
