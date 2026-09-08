
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { CalendarIcon, Link as LinkIcon, Loader2, Camera, FileUp, FileText, ImageIcon, X, Check } from "lucide-react";
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
import { cn, getDisplayAvatarUrl } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FixedExpense } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "./ui/dialog";
import { toast } from "@/hooks/use-toast";
import { uploadFileToStorage, uploadDataUrlToStorage } from "@/lib/supabase/storage";

const formSchema = z.object({
  description: z.string().min(3, "Descrição muito curta."),
  value: z.coerce.number().positive("O valor deve ser positivo."),
  date: z.date({ required_error: "A data é obrigatória." }),
  paymentMethod: z.string().min(1, "Selecione a forma de pagamento."),
  receiptUrl: z.string().optional().or(z.literal('')),
});

export type PayFixedExpenseFormValues = z.infer<typeof formSchema>;

interface PayFixedExpenseFormProps {
    expense: FixedExpense;
    onSave: (data: PayFixedExpenseFormValues) => Promise<void>;
    onCancel: () => void;
}

const paymentMethods = ["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito", "Transferência Bancária", "Boleto"];

export function PayFixedExpenseForm({ expense, onSave, onCancel }: PayFixedExpenseFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentMode, setAttachmentMode] = useState<'options' | 'camera' | 'link'>('options');
  const [tempLink, setLinkValue] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const form = useForm<PayFixedExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: expense.description,
      value: expense.value,
      date: new Date(),
      paymentMethod: "PIX",
      receiptUrl: ""
    },
  });
  
  const receiptUrl = form.watch("receiptUrl");
  const [manualDate, setManualDate] = React.useState<string>(format(new Date(), 'dd/MM/yyyy'));

  const isPDF = receiptUrl?.startsWith('data:application/pdf');

  const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 800;
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
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUri;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const result = event.target?.result as string;
            const compressed = await compressImage(result);
            const { url, error } = await uploadDataUrlToStorage(compressed, 'receipts', file.name);
            if (error) {
              toast({ variant: 'destructive', title: "Erro no envio", description: error });
            } else if (url) {
              form.setValue("receiptUrl", url);
              setIsAddingAttachment(false);
              setAttachmentMode('options');
              toast({ title: "Comprovante anexado!", description: "Upload concluído com sucesso." });
            }
          } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao processar", description: err.message });
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const { url, error } = await uploadFileToStorage(file, 'receipts', file.name);
        if (error) {
          toast({ variant: 'destructive', title: "Erro no envio", description: error });
        } else if (url) {
          form.setValue("receiptUrl", url);
          setIsAddingAttachment(false);
          setAttachmentMode('options');
          toast({ title: "Comprovante anexado!", description: "Upload concluído com sucesso." });
        }
        setIsUploading(false);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro no envio", description: err.message });
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    setAttachmentMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      toast({ variant: 'destructive', title: "Erro na Câmera", description: "Não foi possível acessar a câmera." });
      setAttachmentMode('options');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUri = canvas.toDataURL('image/jpeg');
    
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    
    setIsUploading(true);
    try {
      const compressed = await compressImage(dataUri);
      const { url, error } = await uploadDataUrlToStorage(compressed, 'receipts', `recibo-${Date.now()}.jpg`);
      if (error) {
        toast({ variant: 'destructive', title: "Erro no envio", description: error });
      } else if (url) {
        form.setValue("receiptUrl", url);
        setIsAddingAttachment(false);
        setAttachmentMode('options');
        toast({ title: "Foto capturada!", description: "Upload concluído com sucesso." });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkSave = () => {
    if (tempLink) {
      form.setValue("receiptUrl", tempLink);
      setIsAddingAttachment(false);
      setLinkValue("");
      setAttachmentMode('options');
    }
  };

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

  const handleSubmit = async (data: PayFixedExpenseFormValues) => {
    setIsSaving(true);
    await onSave(data);
    setIsSaving(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-4 border rounded-xl bg-muted/30 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Despesa a Pagar</p>
            <p className="font-black text-primary text-base">{expense.description}</p>
            <p className="text-[10px] font-medium text-muted-foreground">Valor esperado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.value)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor Real Pago</FormLabel>
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
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data do Pagamento</FormLabel>
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
                            <PopoverContent className="w-auto p-0" align="start">
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
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <FileUp className="h-4 w-4" /> Comprovante de Pagamento
            </FormLabel>
            
            {receiptUrl ? (
                <div className="relative group border rounded-xl overflow-hidden bg-muted/20 aspect-video flex items-center justify-center">
                    {isPDF ? (
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="h-12 w-12 text-red-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Comprovante PDF</span>
                        </div>
                    ) : (
                        <Image 
                            src={getDisplayAvatarUrl(receiptUrl)} 
                            alt="Comprovante" 
                            fill 
                            className="object-contain" 
                        />
                    )}
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => form.setValue("receiptUrl", "")}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Dialog open={isAddingAttachment} onOpenChange={(open) => {
                    setIsAddingAttachment(open);
                    if (!open) {
                        setAttachmentMode('options');
                        if (videoRef.current?.srcObject) {
                            const stream = videoRef.current.srcObject as MediaStream;
                            stream.getTracks().forEach(track => track.stop());
                        }
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full h-24 border-dashed border-2 flex-col gap-2 hover:bg-muted/50 rounded-xl">
                            <FileUp className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Anexar Recibo</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Anexar Comprovante</DialogTitle>
                        </DialogHeader>
                        
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
                                    Enviando para o storage...
                                </p>
                            </div>
                        ) : (
                            <>
                                {attachmentMode === 'options' && (
                            <div className="grid gap-3 py-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl text-[10px] font-bold uppercase" onClick={() => startCamera()}>
                                        <Camera className="h-6 w-6 text-accent" /> Câmera
                                    </Button>
                                    <div className="relative">
                                        <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" onChange={handleFileUpload} />
                                        <Button variant="outline" className="h-20 w-full flex-col gap-2 rounded-xl text-[10px] font-bold uppercase pointer-events-none">
                                            <FileUp className="h-6 w-6 text-accent" /> Arquivo (Img/PDF)
                                        </Button>
                                    </div>
                                </div>
                                <Button variant="outline" className="h-12 justify-start gap-3 rounded-xl text-[10px] font-bold uppercase" onClick={() => setAttachmentMode('link')}>
                                    <LinkIcon className="h-5 w-5 text-accent" /> Colar Link da Imagem
                                </Button>
                            </div>
                        )}

                        {attachmentMode === 'camera' && (
                            <div className="space-y-4 py-4">
                                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" className="flex-1 h-11" onClick={() => setAttachmentMode('options')}>Voltar</Button>
                                    <Button className="flex-1 gap-2 bg-accent h-11" onClick={capturePhoto}>
                                        <Check className="h-4 w-4" /> Capturar Recibo
                                    </Button>
                                </div>
                            </div>
                        )}

                                {attachmentMode === 'link' && (
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground">URL da Imagem</FormLabel>
                                            <Input placeholder="https://..." value={tempLink} onChange={e => setLinkValue(e.target.value)} autoFocus className="h-11" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" className="flex-1 h-11" onClick={() => setAttachmentMode('options')}>Voltar</Button>
                                            <Button className="flex-1 bg-accent h-11" onClick={handleLinkSave}>Salvar Link</Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-green-500/20" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Pagamento
            </Button>
        </div>
      </form>
    </Form>
  );
}

