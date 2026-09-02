
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Class, Student, User } from "@/types";
import { DialogClose } from "./ui/dialog";

const formSchema = z.object({
  name: z.string().min(3, "O nome da turma é muito curto."),
  teacherId: z.string().min(1, "Selecione um professor."),
  weekDays: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Selecione pelo menos um dia da semana.",
  }),
  time: z.string().min(1, "Horário é obrigatório."),
  studentIds: z.array(z.string()).optional(),
  modality: z.string().min(1, "Modalidade é obrigatória."),
});

export type ClassFormValues = z.infer<typeof formSchema>;

const weekDays = [
  { id: 'seg', label: 'Segunda-feira' },
  { id: 'ter', label: 'Terça-feira' },
  { id: 'qua', label: 'Quarta-feira' },
  { id: 'qui', label: 'Quinta-feira' },
  { id: 'sex', label: 'Sexta-feira' },
  { id: 'sab', label: 'Sábado' },
];

interface ClassFormProps {
    classData?: Class;
    availableStudents: Student[];
    allUsers: User[];
    classModalities: string[];
    onSave: (data: ClassFormValues) => void;
    onCancel: () => void;
}

export function ClassForm({ classData, availableStudents, allUsers, classModalities, onSave, onCancel }: ClassFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const teachers = allUsers.filter(u => u.role === 'Professor');
  
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: classData?.name || "",
      teacherId: classData?.teacherId || "",
      weekDays: classData?.schedule ? classData.schedule.split(' - ')[0].split(', ') : [],
      time: classData?.schedule ? classData.schedule.split(' - ')[1] : "",
      studentIds: classData?.studentIds || [],
      modality: classData?.modality || ""
    },
  });

  const handleSubmit = async (data: ClassFormValues) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    await onSave(data);
    setIsSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
        <div className="space-y-6 overflow-y-auto max-h-[65vh] px-1 pb-4 scrollbar-thin">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome da Turma</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Regular - Tarde" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Professor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o professor" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                        {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>{teacher.nickname}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
            control={form.control}
            name="modality"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Modalidade da Turma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a modalidade" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                        {classModalities.map(modality => (
                            <SelectItem key={modality} value={modality}>{modality}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            />


            <FormField
            control={form.control}
            name="weekDays"
            render={() => (
                <FormItem>
                    <div className="mb-4">
                        <FormLabel>Dias da semana</FormLabel>
                        <FormDescription className="text-[10px]">Selecione os dias em que a aula acontece.</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {weekDays.map((item) => (
                            <FormField
                            key={item.id}
                            control={form.control}
                            name="weekDays"
                            render={({ field }) => {
                                return (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item.id
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal text-xs">{item.label}</FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                    </div>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="studentIds"
            render={() => (
                <FormItem>
                    <div className="mb-4">
                        <FormLabel>Alunos</FormLabel>
                        <FormDescription className="text-[10px]">Selecione alunos que não estão em nenhuma turma.</FormDescription>
                    </div>
                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                    {availableStudents.length > 0 ? (
                        availableStudents.map((student) => (
                            <FormField
                                key={student.id}
                                control={form.control}
                                name="studentIds"
                                render={({ field }) => {
                                    return (
                                    <FormItem key={student.id} className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(student.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), student.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                    (value) => value !== student.id
                                                    )
                                                )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal text-xs">{student.name}</FormLabel>
                                    </FormItem>
                                    )
                                }}
                            />
                        ))
                        ) : (
                        <p className="text-sm text-center text-muted-foreground pt-12">Nenhum aluno disponível.</p>
                        )
                    }
                    </ScrollArea>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {classData ? "Salvar Alterações" : "Criar Turma"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
