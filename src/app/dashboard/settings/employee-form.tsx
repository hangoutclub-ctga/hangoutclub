
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, User as UserIcon, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { User } from "@/types";
import { format, parse, isValid } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useData } from "@/hooks/use-data";
import { toast } from "@/hooks/use-toast";
import { ImagePicker } from "@/components/image-picker";
import { parseDobToDate } from "@/lib/utils";

const employeeFormSchema = z.object({
  nickname: z.string().min(2, "O nome de usuário é obrigatório."),
  email: z.string().email("Formato de e-mail inválido."),
  role: z.string().min(1, "O cargo é obrigatório"),
  password: z.string().optional(),
  dob: z.date({ required_error: "Data de nascimento é obrigatória." }),
  avatar: z.string().optional().or(z.literal('')),
});
type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const EmployeeForm = ({ employee, onSave, onCancel }: { employee?: User, onSave: (data: EmployeeFormValues) => Promise<void> | void, onCancel: () => void }) => {
    const { categories, isLoading } = useData();
    const initialDob = parseDobToDate(employee?.dob);
    const [manualDate, setManualDate] = useState<string>(initialDob ? format(initialDob, 'dd/MM/yyyy') : '');
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: {
            nickname: employee?.nickname || "",
            email: employee?.email || "",
            role: employee?.role || "Professor",
            password: "",
            dob: initialDob,
            avatar: employee?.avatar || ""
        }
    });

    const handleSubmit = async (data: EmployeeFormValues) => {
        setIsSaving(true);
        try {
            await onSave(data);
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
        if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
        setManualDate(value);
        if (value.length === 10) {
            const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
            if (isValid(parsedDate)) form.setValue('dob', parsedDate, { shouldValidate: true });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="flex justify-center mb-4">
                    <FormField control={form.control} name="avatar" render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <ImagePicker value={field.value} onChange={field.onChange} label="Foto do Funcionário" folder="avatars" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="nickname" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome de Usuário</FormLabel><FormControl><Input {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail</FormLabel><FormControl><Input type="email" {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="dob" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data de Nascimento</FormLabel><div className="relative"><FormControl><Input placeholder="DD/MM/AAAA" value={manualDate} onChange={handleManualDateChange} className="h-11"/></FormControl>
                    <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9 text-muted-foreground"><CalendarIcon className="h-4 w-4" /></Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={(date) => { field.onChange(date); if (date) setManualDate(format(date, 'dd/MM/yyyy')); }} disabled={(date) => date > new Date()} locale={ptBR}/></PopoverContent></Popover></div><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cargo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Selecione um cargo..." /></SelectTrigger></FormControl>
                    <SelectContent>{categories.userRoles.map(role => (<SelectItem key={role} value={role}>{role}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {employee ? "Nova Senha (opcional)" : "Senha de Acesso"}
                            </FormLabel>
                            <span className="text-[10px] text-muted-foreground">Padrão: Hangout@123</span>
                        </div>
                        <div className="relative">
                            <FormControl>
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={employee ? "Deixe em branco para manter a atual" : "Hangout@123"}
                                    {...field}
                                    className="h-11 pr-10"
                                />
                            </FormControl>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-9 w-9 text-muted-foreground hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel} className="h-10 px-6" disabled={isSaving}>Cancelar</Button></DialogClose>
                    <Button type="submit" className="bg-accent h-10 px-8" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </div>
            </form>
        </Form>
    )
}
