
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { parse, isValid, isSameDay } from 'date-fns';

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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { CalendarIcon, User, AlertCircle, Loader2, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Role, User as UserType, DisplayEvent } from "@/types";
import { Switch } from "./ui/switch";
import { DialogClose } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const recurrenceWeekDays = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
];

const createFormSchema = (isAllUsersView?: boolean) => z.object({
  type: z.enum(["task", "class", "meeting", "trial", "test", "planning"]),
  title: z.string().min(3, "O título do evento é muito curto."),
  date: z.date({ required_error: "A data do evento é obrigatória." }),
  time: z.string().min(1, "Horário é obrigatório."),
  details: z.string().optional(),
  recurrent: z.boolean().default(false),
  recurrenceDays: z.array(z.string()).optional(),
  owners: z.array(z.string()).min(1, "Selecione pelo menos um responsável."),
});

export type EventFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface EventFormProps {
    userRole?: Role;
    eventData?: Partial<EventFormValues> & { id?: string, date?: any };
    allUsers: UserType[];
    onSave: (data: EventFormValues) => void;
    onCancel: () => void;
    isAllUsersView?: boolean;
    existingEvents: DisplayEvent[];
}

export function EventForm({ onSave, eventData, onCancel, isAllUsersView = false, allUsers, existingEvents }: EventFormProps) {
  const formSchema = createFormSchema(isAllUsersView);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const getSafeDate = (d: any): Date => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d.toDate === 'function') return d.toDate();
    const parsed = new Date(d);
    return isValid(parsed) ? parsed : new Date();
  };

  const initialDate = getSafeDate(eventData?.date);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: eventData?.type || "task",
      title: eventData?.title || "",
      date: initialDate,
      time: eventData?.time || "",
      details: eventData?.details || "",
      recurrent: !!eventData?.recurrent,
      recurrenceDays: eventData?.recurrenceDays || [],
      owners: eventData?.owners || [],
    },
  });
  
  const [manualDate, setManualDate] = React.useState<string>(format(initialDate, 'dd/MM/yyyy'));
  const [conflictError, setConflictError] = React.useState<string | null>(null);

  const watchDate = form.watch("date");
  const watchTime = form.watch("time");
  const watchOwners = form.watch("owners");
  const watchRecurrent = form.watch("recurrent");

  // Verifica conflitos em tempo real
  React.useEffect(() => {
    if (!watchDate || !watchTime || watchOwners.length === 0) {
        setConflictError(null);
        return;
    }

    const conflict = existingEvents.find(evt => {
        // Ignora o próprio evento se estiver editando
        if (eventData?.id && evt.id.startsWith(eventData.id)) return false;
        
        return isSameDay(evt.date, watchDate) && 
               evt.time === watchTime && 
               evt.owners.some(owner => watchOwners.includes(owner));
    });

    if (conflict) {
        const conflictingOwners = conflict.owners.filter(o => watchOwners.includes(o)).join(", ");
        setConflictError(`Conflito: ${conflictingOwners} já tem um compromisso "${conflict.task}" neste horário.`);
    } else {
        setConflictError(null);
    }
  }, [watchDate, watchTime, watchOwners, existingEvents, eventData]);

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

  const handleSubmit = async (data: EventFormValues) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    await onSave(data);
    setIsSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
        <div className="space-y-6 overflow-y-auto max-h-[65vh] px-1 pb-4 scrollbar-thin">
            {conflictError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Horário Ocupado</AlertTitle>
                    <AlertDescription className="text-xs">{conflictError}</AlertDescription>
                </Alert>
            )}

            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Título do Evento</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Reunião com pais" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <FormField
                control={form.control}
                name="owners"
                render={() => (
                <FormItem>
                    <div className="mb-2">
                        <FormLabel>Responsáveis</FormLabel>
                        <FormDescription className="text-[10px]">Selecione um ou mais membros da equipe.</FormDescription>
                    </div>
                    <ScrollArea className="h-32 w-full rounded-md border p-2">
                        <div className="grid grid-cols-2 gap-2">
                            {allUsers.map((user) => (
                                <FormField
                                    key={user.id}
                                    control={form.control}
                                    name="owners"
                                    render={({ field }) => {
                                        return (
                                        <FormItem key={user.id} className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(user.nickname)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), user.nickname])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== user.nickname
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal text-xs">{user.nickname}</FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data</FormLabel>
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
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo de Evento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                    <SelectItem value="class">Aula</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="trial">Aula Experimental</SelectItem>
                    <SelectItem value="test">Prova</SelectItem>
                    <SelectItem value="planning">Planejamento de Aula</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
              <FormField
                control={form.control}
                name="recurrent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-accent" /> Recorrência
                      </FormLabel>
                      <FormDescription className="text-[10px]">Repetir este evento semanalmente</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchRecurrent && (
                <FormField
                  control={form.control}
                  name="recurrenceDays"
                  render={() => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Dias da Semana</FormLabel>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {recurrenceWeekDays.map((day) => (
                          <FormField
                            key={day.id}
                            control={form.control}
                            name="recurrenceDays"
                            render={({ field }) => {
                              return (
                                <FormItem key={day.id} className="flex flex-row items-start space-x-0 space-y-0">
                                  <FormControl>
                                    <div 
                                      className={cn(
                                        "h-8 w-11 rounded-lg border flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all",
                                        field.value?.includes(day.id) ? "bg-accent text-white border-accent shadow-sm" : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                                      )}
                                      onClick={() => {
                                        const newValue = field.value?.includes(day.id)
                                          ? field.value.filter(v => v !== day.id)
                                          : [...(field.value || []), day.id];
                                        field.onChange(newValue);
                                      }}
                                    >
                                      {day.label}
                                    </div>
                                  </FormControl>
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
              )}
            </div>

            <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Detalhes (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Preparar material para Turma VIP" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={!!conflictError || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {eventData?.id ? "Salvar Alterações" : "Salvar Evento"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
