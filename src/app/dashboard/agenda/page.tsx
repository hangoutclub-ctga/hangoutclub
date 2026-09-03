
"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle, Square, CheckCircle2, Cake, Eye, Edit, Trash2, Users, ChevronLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EventForm } from "@/components/event-form";
import { useAuth } from "@/hooks/use-auth";
import { useAgenda } from "@/hooks/use-agenda";
import { useData } from "@/hooks/use-data";
import { ManualEvent, DisplayEvent } from "@/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function AgendaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  const { users, addEvent, updateEvent, deleteEvent } = useData();
  const [confirmedDate, setConfirmedDate] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const canSeeOthers = user?.role === 'Admin' || user?.role === 'Secretaria';
  const [staffFilter, setStaffFilter] = useState(canSeeOthers ? "todos" : user?.nickname || "");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewEventOpen, setIsViewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<ManualEvent> | undefined>(undefined);
  const [completedEventIds, setCompletedEventIds] = useState<string[]>([]);

  const { events } = useAgenda(confirmedDate, user, 'week', staffFilter);

  const isAdmin = user?.role === 'Admin';

  const handleToggleComplete = (id: string) => {
    setCompletedEventIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    toast({ title: "Status alterado" });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Tarefa';
      case 'class': return 'Aula';
      case 'meeting': return 'Reunião';
      case 'trial': return 'Experimental';
      case 'test': return 'Prova';
      case 'planning': return 'Planejamento';
      case 'birthday': return 'Aniversário';
      default: return 'Evento';
    }
  };

  const handleBack = () => {
    handleLinkClick();
    router.back();
  };

  const handleHome = () => {
    handleLinkClick('/dashboard');
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleHome}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">Agenda</h1>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">Visão semanal de compromissos.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {canSeeOthers && (
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-9 sm:w-40 h-10 border-accent/20 text-[10px] sm:text-sm px-0 sm:px-3 flex justify-center sm:justify-start">
                <Users className="h-4 w-4 text-accent sm:mr-2" />
                <span className="hidden sm:inline"><SelectValue placeholder="Staff" /></span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.nickname}>{u.nickname}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Popover open={isCalendarOpen} onOpenChange={(open) => {
            setIsCalendarOpen(open);
            if (open) setTempDate(confirmedDate);
          }}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 border-accent/20 text-[10px] sm:text-sm px-0 sm:px-4 w-9 sm:w-auto">
                <CalendarIcon className="h-4 w-4 text-accent sm:mr-2" />
                <span className="hidden sm:inline">{format(confirmedDate, "dd/MM", { locale: ptBR })}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar 
                mode="single" 
                selected={tempDate} 
                onSelect={(d) => d && setTempDate(d)} 
                onOk={() => {
                  setConfirmedDate(tempDate);
                  setIsCalendarOpen(false);
                }}
                locale={ptBR} 
              />
            </PopoverContent>
          </Popover>
          
          <Dialog open={isFormOpen} onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setEditingEvent(undefined);
          }}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-accent hover:bg-accent/90 h-10 w-9 sm:w-auto px-0 sm:px-4">
                    <PlusCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Novo</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingEvent?.id ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
                </DialogHeader>
                <EventForm 
                    allUsers={users}
                    eventData={editingEvent}
                    onSave={async (eventData) => {
                        try {
                            if (editingEvent?.id) {
                                await updateEvent(editingEvent.id, eventData);
                                toast({ title: "Evento Atualizado!", description: "Salvo no Supabase." });
                            } else {
                                await addEvent(eventData);
                                toast({ title: "Evento Criado!", description: "Salvo no Supabase." });
                            }
                            setIsFormOpen(false);
                        } catch (err: any) {
                            toast({ variant: "destructive", title: "Erro ao salvar", description: err.message });
                        }
                    }}
                    onCancel={() => setIsFormOpen(false)}
                    isAllUsersView={isAdmin}
                    existingEvents={events}
                />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Compromissos da Semana</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Exibindo eventos para {staffFilter === 'todos' ? 'toda a equipe' : staffFilter}.</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 sm:pt-0">
          <div className="space-y-3 sm:space-y-4">
            {events.length > 0 ? events.map((evt: DisplayEvent) => {
              const isBirthday = evt.type === 'birthday';
              const ownersLabel = evt.owners.join(", ");
              const isCompleted = completedEventIds.includes(evt.id) || evt.completed;
              
              return (
                <div key={evt.id} className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border hover:shadow-sm transition-all group",
                  isBirthday ? "bg-accent/10 border-accent/20" : "bg-muted/20 border-border"
                )}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={isBirthday}
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 transition-all",
                      isCompleted ? "bg-green-500/10 border-green-500 text-green-600" : "bg-background text-muted-foreground",
                      isBirthday && "border-accent text-accent bg-accent/10"
                    )}
                    onClick={() => handleToggleComplete(evt.id)}
                  >
                    {isBirthday ? <Cake className="h-4 w-4" /> : (isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Square className="h-4 w-4" />)}
                  </Button>
                  <div className={cn("flex-1 min-w-0 transition-all", isCompleted && "opacity-50")}>
                    <p className={cn(
                      "font-bold text-xs sm:text-sm tracking-tight truncate text-foreground", 
                      isCompleted && "line-through",
                      isBirthday && "text-accent"
                    )}>
                      {isBirthday ? `🎈 Aniversário` : `${getTypeLabel(evt.type)} - ${evt.task}`}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                      {format(evt.date, "EEEE", { locale: ptBR })} • {evt.time} {ownersLabel && `• ${ownersLabel}`}
                    </p>
                    {evt.details && (
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground/70 italic mt-1 leading-tight line-clamp-1">
                        {evt.details}
                      </p>
                    )}
                  </div>
                  {!isBirthday && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground" 
                        onClick={() => {
                          setSelectedEvent(evt);
                          setIsViewEventOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setEditingEvent(evt as any); setIsFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => toast({ title: "Evento Removido" })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              );
            }) : (
                <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-xl text-[10px] sm:text-xs">
                    Sem eventos registrados para esta semana.
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewEventOpen} onOpenChange={setIsViewEventOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Título</span>
                <span className="text-sm font-medium">{selectedEvent.task}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Horário</span>
                  <span className="text-sm font-medium">{selectedEvent.time}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Responsáveis</span>
                  <span className="text-sm font-medium">{selectedEvent.owners.join(", ")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Detalhes</span>
                <span className="text-sm font-medium leading-relaxed">{selectedEvent.details || 'Sem detalhes adicionais.'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Tipo</span>
                <span className="text-sm font-medium capitalize">{getTypeLabel(selectedEvent.type)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
