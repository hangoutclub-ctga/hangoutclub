
"use client";

import React, { useState, useMemo } from "react";
import { PlusCircle, CalendarCheck, Calendar as CalendarIcon, Square, CheckCircle2, Edit, Trash2, AlertTriangle, TrendingUp, Layers, ArrowRight, DollarSign, Cake, Wallet, Users, BookOpen, ArrowUpRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useAgenda } from "@/hooks/use-agenda";
import { useData } from "@/hooks/use-data";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction-form";
import { EventForm } from "@/components/event-form";
import { toast } from "@/hooks/use-toast";
import { DisplayEvent, ManualEvent } from "@/types";
import { ClassProfile } from "@/components/class-profile";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    students, 
    classes, 
    transactions, 
    users, 
    inventoryItems, 
    addTransaction, 
    addEvent, 
    updateEvent 
  } = useData();

  const [confirmedDate, setConfirmedDate] = useState<Date>(new Date());
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [isViewEventOpen, setIsViewEventOpen] = useState(false);
  const [isClassProfileOpen, setIsClassProfileOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<ManualEvent> | null>(null);
  const [completedEventIds, setCompletedEventIds] = useState<string[]>([]);

  // Dashboard focado nos compromissos do usuário ou geral se admin/secretaria
  const isAdmin = user?.role === 'Admin';
  const isSecretaria = user?.role === 'Secretaria';
  const { events } = useAgenda(confirmedDate, user, 'day', (isAdmin || isSecretaria) ? 'todos' : (user?.nickname || ""));

  // Dados filtrados em tempo real
  const activeStudents = useMemo(() => students.filter(s => s.status !== 'Apagado'), [students]);
  const enrolledActiveStudentsCount = useMemo(() => students.filter(s => s.status === 'Ativo').length, [students]);
  const activeClasses = useMemo(() => classes.filter(c => c.status === 'Ativa'), [classes]);

  // Balanço financeiro dinâmico (mês atual ou acumulado)
  const financialSummary = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const curMonthTrx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const monthProfit = curMonthTrx.reduce((acc, t) => t.type === 'Entrada' ? acc + t.value : acc - t.value, 0);
    const totalProfit = transactions.reduce((acc, t) => t.type === 'Entrada' ? acc + t.value : acc - t.value, 0);

    return {
      hasCurrentMonth: curMonthTrx.length > 0,
      monthProfit,
      totalProfit,
      displayProfit: curMonthTrx.length > 0 ? monthProfit : totalProfit,
      label: curMonthTrx.length > 0 ? "Balanço deste mês" : "Saldo total"
    };
  }, [transactions]);

  const stats = useMemo(() => {
    if (isAdmin || isSecretaria) {
      return {
        students: enrolledActiveStudentsCount,
        classes: activeClasses.length,
        profit: financialSummary.displayProfit,
        profitLabel: financialSummary.label
      };
    } else {
      const teacherClasses = activeClasses.filter(c => 
        (c.teacherId && c.teacherId === user?.id) || 
        (c.teacher && c.teacher === user?.nickname)
      );
      const teacherStudentsCount = activeStudents.filter(s => 
        teacherClasses.some(c => 
          c.name === s.class || 
          (c.studentIds && c.studentIds.includes(s.id))
        )
      ).length;
      return {
        students: teacherStudentsCount,
        classes: teacherClasses.length,
        profit: 0,
        profitLabel: "Agenda"
      };
    }
  }, [isAdmin, isSecretaria, user, enrolledActiveStudentsCount, activeClasses, activeStudents, financialSummary]);

  const lowStockCount = useMemo(() => 
    inventoryItems.filter(item => item.status !== 'Apagado' && item.stock <= item.minStock).length
  , [inventoryItems]);

  const popularItem = useMemo(() => {
    const active = inventoryItems.filter(i => i.status !== 'Apagado');
    if (active.length === 0) return null;
    return [...active].sort((a, b) => (b.recentMovements || 0) - (a.recentMovements || 0))[0];
  }, [inventoryItems]);

  const categoriesStats = useMemo(() => {
    const active = inventoryItems.filter(i => i.status !== 'Apagado');
    const unique = Array.from(new Set(active.map(i => i.category).filter(Boolean)));
    const critical = active.filter(i => i.stock <= i.minStock).length;
    return {
      total: unique.length,
      critical
    };
  }, [inventoryItems]);

  const handleToggleComplete = (id: string) => {
    setCompletedEventIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    toast({ title: "Status alterado" });
  };

  const handleEventClick = (evt: DisplayEvent) => {
    if (evt.type === 'class' && evt.classId) {
      setSelectedEvent(evt);
      setIsClassProfileOpen(true);
      return;
    }
    setSelectedEvent(evt);
    setIsViewEventOpen(true);
  };

  const onAttendanceSaved = () => {
    if (selectedEvent) {
      setCompletedEventIds(prev => [...prev, selectedEvent.id]);
      setIsClassProfileOpen(false);
      toast({ title: "Aula Concluída!", description: "Frequência salva e compromisso marcado como feito." });
    }
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

  return (
    <div className="flex flex-col gap-4 sm:gap-8 max-w-7xl mx-auto">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">Início</h1>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">Seu resumo geral e ações rápidas.</p>
          </div>
        </div>
        
        {isAdmin && (
          <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent hover:bg-accent/90 h-10 w-9 sm:w-auto px-0 sm:px-4 shadow-md">
                <DollarSign className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova Transação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl w-[94vw] max-h-[96vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="p-6 shrink-0 bg-muted/10 border-b">
                <DialogTitle>Adicionar Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <TransactionForm 
                  onSave={async (data) => { 
                    try {
                      await addTransaction({
                        type: data.type.includes('Entrada') ? 'Entrada' : 'Saída',
                        category: data.type === 'Entrada (Aluno)' ? 'Aluno' : 'Outros',
                        name: data.name,
                        description: data.description,
                        value: data.value,
                        date: data.date.toISOString(),
                        receiptUrl: data.receiptUrl,
                        paymentMethod: data.paymentMethod
                      });
                      toast({ title: "Transação Registrada!", description: "Salva com sucesso." }); 
                      setIsTransactionOpen(false); 
                    } catch (err: any) {
                      toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
                    }
                  }} 
                  onCancel={() => setIsTransactionOpen(false)} 
                  students={activeStudents} 
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-lg border-primary/10 overflow-hidden">
        <CardHeader className="py-2.5 px-4 sm:py-2 sm:px-4 bg-muted/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-accent/10 rounded-lg">
                <CalendarCheck className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-sm">Sua Agenda do Dia</CardTitle>
                <CardDescription className="text-[10px]">{format(confirmedDate, "'Dia' dd 'de' MMMM", { locale: ptBR })}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Popover open={isCalendarOpen} onOpenChange={(open) => {
                setIsCalendarOpen(open);
                if (open) setTempDate(confirmedDate);
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 w-9 sm:w-auto gap-1.5 text-[10px] px-0 sm:px-3">
                    <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                    <span className="hidden sm:inline">Mudar Data</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                  <Calendar 
                    mode="single" 
                    selected={tempDate} 
                    onSelect={(d) => d && setTempDate(d)} 
                    onOk={() => { setConfirmedDate(tempDate); setIsCalendarOpen(false); }}
                    locale={ptBR} 
                    disabled={{ dayOfWeek: [0] }}
                  />
                </PopoverContent>
              </Popover>
              
              <Dialog open={isEventOpen} onOpenChange={(open) => {
                setIsEventOpen(open);
                if (!open) setEditingEvent(null);
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] rounded-3xl w-[94vw] max-h-[96vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 shrink-0 bg-muted/10 border-b">
                    <DialogTitle>{editingEvent?.id ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-6">
                    <EventForm 
                      allUsers={users}
                      eventData={editingEvent || undefined}
                      onSave={async (data) => { 
                        try {
                          if (editingEvent?.id) {
                            await updateEvent(editingEvent.id, data);
                            toast({ title: "Evento Atualizado!", description: "Salvo com sucesso." });
                          } else {
                            await addEvent(data);
                            toast({ title: "Evento Criado!", description: "Salvo com sucesso." });
                          }
                          setIsEventOpen(false); 
                        } catch (err: any) {
                          toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
                        }
                      }}
                      onCancel={() => setIsEventOpen(false)}
                      isAllUsersView={isAdmin}
                      existingEvents={events}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {events.length > 0 ? events.map((evt) => {
              const isBirthday = evt.type === 'birthday';
              const ownersLabel = evt.owners.join(", ");
              const isCompleted = completedEventIds.includes(evt.id) || evt.completed;
              
              return (
                <div key={evt.id} className={cn(
                  "flex items-center gap-3 p-4 px-4 sm:p-4 sm:px-5 hover:bg-muted/30 transition-colors group cursor-pointer",
                  isBirthday && "bg-accent/5"
                )} onClick={() => handleEventClick(evt)}>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                  </div>
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
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setEditingEvent(evt as any); setIsEventOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => toast({ title: "Evento Removido" })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground italic text-[10px] px-4">Sem compromissos para hoje.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isClassProfileOpen} onOpenChange={setIsClassProfileOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 rounded-3xl w-[94vw] max-h-[96vh] overflow-hidden flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-5 sm:p-6 shrink-0 border-b bg-primary text-primary-foreground rounded-t-3xl">
            <DialogTitle className="text-base sm:text-lg font-black tracking-tight">Registro de Frequência</DialogTitle>
            <div className="text-primary-foreground/80 text-[10px] sm:text-xs font-medium mt-1 truncate">
              {selectedEvent?.task}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {selectedEvent && selectedEvent.classId && (
              <ClassProfile 
                classId={selectedEvent.classId} 
                minimal={true} 
                onAttendanceSaved={onAttendanceSaved}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewEventOpen} onOpenChange={setIsViewEventOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl w-[94vw] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Título</span>
                <span className="text-sm font-bold text-primary">{selectedEvent.task}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Horário</span>
                  <span className="text-sm font-medium">{selectedEvent.time}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Responsáveis</span>
                  <span className="text-sm font-medium">{selectedEvent.owners.join(", ")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Detalhes</span>
                <span className="text-sm font-medium leading-relaxed">{selectedEvent.details || 'Sem detalhes.'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo</span>
                <span className="text-sm font-medium capitalize">{getTypeLabel(selectedEvent.type)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {!isSecretaria && (
        <div className="grid gap-2 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-all border-l-4 border-l-primary/40">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-0.5 sm:p-3 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Alunos</CardTitle>
              <Users className="h-3.5 w-3.5 text-primary/60" />
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-xl sm:text-3xl font-black">{stats.students}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-0">{(isAdmin || isSecretaria) ? "Alunos ativos" : "Seus alunos"}</p>
            </CardContent>
            <CardFooter className="p-2 pt-1 sm:p-3 border-t bg-muted/5">
              <Button variant="ghost" size="sm" className="h-5 sm:h-6 w-full justify-between text-[9px] sm:text-[10px] hover:bg-transparent p-0" onClick={() => router.push('/dashboard/students')}>
                Ver todos <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 w-3 text-accent" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-all border-l-4 border-l-primary/40">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-0.5 sm:p-3 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Turmas</CardTitle>
              <BookOpen className="h-3.5 w-3.5 text-primary/60" />
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0 sm:p-3 sm:pt-0">
              <div className="text-xl sm:text-3xl font-black">{stats.classes}</div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-0">{(isAdmin || isSecretaria) ? "Em andamento" : "Titularidade"}</p>
            </CardContent>
            <CardFooter className="p-2 pt-1 sm:p-3 border-t bg-muted/5">
              <Button variant="ghost" size="sm" className="h-5 sm:h-6 w-full justify-between text-[9px] sm:text-[10px] hover:bg-transparent p-0" onClick={() => router.push('/dashboard/classes')}>
                Ver todas <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 w-3 text-accent" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-all border-l-4 border-l-primary/40">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-0.5 sm:p-3 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">{(isAdmin || isSecretaria) ? "Faturamento" : "Agenda"}</CardTitle>
              {(isAdmin || isSecretaria) ? <Wallet className="h-3.5 w-3.5 text-primary/60" /> : <CalendarIcon className="h-3.5 w-3.5 text-primary/60" />}
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0 sm:p-3 sm:pt-0">
              <div className={cn("text-lg sm:text-3xl font-black truncate", (isAdmin || isSecretaria) && (stats.profit >= 0 ? "text-green-600" : "text-red-500"))}>
                {(isAdmin || isSecretaria) ? formatCurrency(stats.profit) : events.length}
              </div>
              <p className="text-[9px] sm:text-xs text-muted-foreground mt-0">{(isAdmin || isSecretaria) ? stats.profitLabel : "Agendamentos hoje"}</p>
            </CardContent>
            <CardFooter className="p-2 pt-1 sm:p-3 border-t bg-muted/5">
              <Button variant="ghost" size="sm" className="h-5 sm:h-6 w-full justify-between text-[9px] sm:text-[10px] hover:bg-transparent p-0" onClick={() => router.push((isAdmin || isSecretaria) ? '/dashboard/finance' : '/dashboard/agenda')}>
                Detalhes <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 w-3 text-accent" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-accent/5 border-accent/20 shadow-accent/5 shadow-lg border-2">
            <CardHeader className="flex flex-row items-center justify-between p-2 pb-0.5 sm:p-3 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-accent">Notas</CardTitle>
              <Award className="h-4 w-4 text-accent animate-pulse" />
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-0 sm:p-3 sm:pt-0">
              <p className="text-[9px] sm:text-xs text-muted-foreground font-medium">Registro pedagógico.</p>
            </CardContent>
            <CardFooter className="p-2 pt-1 sm:p-3">
              <Button className="h-6 sm:h-7 w-full justify-between bg-accent hover:bg-accent/90 text-white shadow-md text-[9px] sm:text-[10px]" onClick={() => router.push('/dashboard/grades')}>
                Acessar <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {(isAdmin || isSecretaria) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-6">
          <Card className={cn("border-2 transition-all", lowStockCount > 0 ? "border-red-500/50 bg-red-500/5" : "border-muted")}>
            <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-3 pb-1 space-y-0">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase text-red-600">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            </CardHeader>
            <CardContent className="px-2 sm:px-3 pb-1.5 pt-0">
              <div className="text-xl sm:text-3xl font-black">{lowStockCount}</div>
              <p className="text-[9px] sm:[10px] text-muted-foreground mt-0.5">Reposição necessária.</p>
            </CardContent>
            <CardFooter className="px-2 sm:px-3 pb-3">
              <Button variant="outline" size="sm" className="h-6 text-[9px] sm:text-[10px] gap-1 px-2" onClick={() => router.push('/dashboard/inventory')}>
                Ver <ArrowRight className="h-2.5 w-2.5" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-3 pb-1 space-y-0">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Populares</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-2 sm:px-3 pb-1.5 pt-0">
              <div className="text-xs sm:text-sm font-bold truncate">{popularItem ? popularItem.name : "Nenhum item"}</div>
              <p className="text-[9px] sm:[10px] text-muted-foreground mt-0.5">
                {popularItem ? `${popularItem.recentMovements || 0} movimentações` : "Sem movimentações"}
              </p>
            </CardContent>
            <CardFooter className="px-2 sm:px-3 pb-3">
              <Button variant="ghost" size="sm" className="h-6 text-[9px] sm:text-[10px] p-0 hover:bg-transparent" onClick={() => router.push('/dashboard/inventory')}>
                Gerenciar <ArrowUpRight className="h-2.5 w-2.5 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-3 pb-1 space-y-0">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">Categorias</CardTitle>
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-2 sm:px-3 pb-1.5 pt-0">
              <div className="text-xs sm:text-sm font-bold truncate">
                {categoriesStats.total} {categoriesStats.total === 1 ? 'Categoria ativa' : 'Categorias ativas'}
              </div>
              <p className="text-[9px] sm:[10px] text-muted-foreground mt-0.5">
                {categoriesStats.critical} {categoriesStats.critical === 1 ? 'item crítico' : 'itens críticos'}.
              </p>
            </CardContent>
            <CardFooter className="px-2 sm:px-3 pb-3">
              <Button variant="ghost" size="sm" className="h-6 text-[9px] sm:text-[10px] p-0 hover:bg-transparent" onClick={() => router.push('/dashboard/inventory')}>
                Organizar <ArrowUpRight className="h-2.5 w-2.5 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
