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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryItem } from "@/types";
import { DialogClose } from "./ui/dialog";
import { ImagePicker } from "./image-picker";


export const formSchema = z.object({
  name: z.string().min(3, "O nome do item é muito curto."),
  category: z.string().min(1, "Selecione uma categoria."),
  stock: z.coerce.number().min(0, "O estoque não pode ser negativo."),
  minStock: z.coerce.number().min(0, "O estoque mínimo não pode ser negativo."),
  maxStock: z.coerce.number().min(0, "O estoque máximo não pode ser negativo."),
  imageUrl: z.string().optional().or(z.literal('')),
  status: z.enum(["Ativo", "Apagado"]).default("Ativo"),
});

export type InventoryItemFormValues = z.infer<typeof formSchema>;


interface InventoryItemFormProps {
    item?: InventoryItem;
    categories: string[];
    onSave: (data: InventoryItemFormValues) => void;
    onCancel: () => void;
}

export function InventoryItemForm({ item, categories, onSave, onCancel }: InventoryItemFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: item ? {
        name: item.name,
        category: item.category,
        stock: item.stock,
        minStock: item.minStock,
        maxStock: item.maxStock,
        imageUrl: item.imageUrl || "",
        status: item.status || "Ativo",
    } : {
      name: "",
      category: "",
      stock: 0,
      minStock: 5,
      maxStock: 50,
      imageUrl: "",
      status: "Ativo",
    },
  });

  const handleSubmit = async (data: InventoryItemFormValues) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    await onSave(data);
    setIsSaving(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        
        <div className="flex justify-center mb-6">
            <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <ImagePicker 
                                value={field.value} 
                                onChange={field.onChange} 
                                label="Foto do Item" 
                                aspect="square"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Item</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Livro Didático Nível 1" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estoque Atual</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mínimo</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="maxStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Máximo</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel} className="h-10 px-6" disabled={isSaving}>Cancelar</Button>
          </DialogClose>
          <Button type="submit" className="bg-accent h-10 px-8" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? "Salvar Alterações" : "Salvar Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
