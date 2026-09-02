
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { toast } from "@/hooks/use-toast";
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
import { InventoryItem } from "@/types";

const formSchema = z.object({
  type: z.enum(["entrada", "saida"]),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  notes: z.string().min(3, "O motivo é obrigatório e deve ter pelo menos 3 caracteres."),
});

export type StockMovementFormValues = z.infer<typeof formSchema>;

interface StockMovementFormProps {
    item: InventoryItem;
    type: 'entrada' | 'saida';
    onSave: (itemId: string, data: StockMovementFormValues) => void;
}


export function StockMovementForm({ item, type = "entrada", onSave }: StockMovementFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: type,
      quantity: 1,
      notes: type === 'entrada' ? "Reposição de Estoque" : "",
    },
  });

  const movementType = type;

  const handleSubmit = async (data: StockMovementFormValues) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    await onSave(item.id, data);
    setIsSaving(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-4 border rounded-md bg-muted/50">
            <p className="font-bold">{item.name}</p>
            <p className="text-sm text-muted-foreground">Estoque atual: {item.stock}</p>
        </div>
        
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {movementType === 'entrada' ? 'Motivo da Entrada' : 'Motivo da Saída'}
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: Compra do fornecedor X, Uso na turma Y" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
            type="submit" 
            className="w-full"
            variant={movementType === 'entrada' ? 'default' : 'destructive'}
            disabled={isSaving}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {movementType === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída'}
        </Button>
      </form>
    </Form>
  );
}
