
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transaction-form";
import { FixedExpenseForm } from "@/components/fixed-expense-form";
import { PayFixedExpenseForm } from "@/components/pay-fixed-expense-form";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Printer, AlertCircle, CheckCircle, Trash2, FilterX, Calendar as CalendarIcon, DollarSign, PlusCircle, Eye, CreditCard, ChevronLeft, Home } from 'lucide-react';
import { Transaction, Student, FixedExpense } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { cn, formatCurrency, getDisplayAvatarUrl } from "@/lib/utils";
import { useData } from "@/hooks/use-data";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/dashboard/layout";

export default function FinancePage() {
    const { hasPermission } = useAuth();
    const router = useRouter();
    const { handleLinkClick } = useLoading();
    const { 
        transactions, 
        fixedExpenses, 
        students, 
        addTransaction, 
        deleteTransaction, 
        addFixedExpense, 
        updateFixedExpense 
    } = useData();

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [filter, setFilter] = useState<string>("Todos");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFixedFormOpen, setIsFixedFormOpen] = useState(false);
    const [isPayFormOpen, setIsPayFormOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [payingExpense, setPayingExpense] = useState<FixedExpense | null>(null);
    const [prefilledData, setPrefilledData] = useState<any>(undefined);

    const canEdit = hasPermission('finance:edit');
    
    const months = [
        { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
    ];

    const years = [2023, 2024, 2025, 2026];

    const filteredByDate = useMemo(() => {
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d.getUTCMonth() + 1 === currentMonth && d.getUTCFullYear() === currentYear;
        });
    }, [transactions, currentMonth, currentYear]);

    const totals = useMemo(() => {
        const income = filteredByDate.filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.value, 0);
        const outcome = filteredByDate.filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.value, 0);
        const pendingFixed = fixedExpenses.filter(f => f.status === 'Pendente').reduce((acc, f) => acc + f.value, 0);
        return { income, outcome, fixed: pendingFixed, profit: income - outcome };
    }, [filteredByDate, fixedExpenses]);

    const filteredTransactions = useMemo(() => {
        if (filter === "Todos") return filteredByDate;
        if (filter === "Entradas") return filteredByDate.filter(t => t.type === "Entrada");
        if (filter === "Saídas") return filteredByDate.filter(t => t.type === "Saída");
        return filteredByDate;
    }, [filteredByDate, filter]);

    const handleSaveTransaction = async (data: any) => {
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
            toast({ title: "Transação Registrada!", description: "Salva com sucesso no Supabase." });
            setIsFormOpen(false);
            setPrefilledData(undefined);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao salvar transação", description: err.message });
        }
    };

    const handleConfirmFixedPayment = async (data: any) => {
        if (!payingExpense) return;

        try {
            await updateFixedExpense(payingExpense.id, {
                status: 'Pago',
                receiptUrl: data.receiptUrl,
                paymentMethod: data.paymentMethod
            });

            await addTransaction({
                type: 'Saída',
                category: 'Despesa Fixa',
                name: 'Pagamento de Despesa Fixa',
                description: `Pgto: ${payingExpense.description}`,
                value: data.value,
                date: data.date.toISOString(),
                receiptUrl: data.receiptUrl,
                paymentMethod: data.paymentMethod
            });

            toast({ title: "Pagamento Confirmado!", description: "Despesa fixa registrada como saída no Supabase." });
            setIsPayFormOpen(false);
            setPayingExpense(null);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao registrar pagamento", description: err.message });
        }
    };

    const handleSaveFixedExpense = async (data: any) => {
        try {
            await addFixedExpense({
                description: data.description,
                value: data.value,
                status: 'Pendente',
                month: currentMonth,
                year: currentYear,
                dueDate: data.dueDate
            });
            toast({ title: "Despesa Fixa Adicionada!", description: "Salva com sucesso no Supabase." });
            setIsFixedFormOpen(false);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao criar despesa fixa", description: err.message });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTransaction(id);
            toast({ title: "Removido", description: "Transação removida do Supabase." });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao remover", description: err.message });
        }
    };

    const pendingStudents = students.filter(s => s.status === 'Ativo' && s.studentCondition !== 'Bolsa');

    const handleOpenForm = (student?: Student) => {
        if (student) {
            setPrefilledData({
                type: 'Entrada (Aluno)',
                name: student.name,
                value: student.monthlyFee || 0,
                description: `Mensalidade ${months.find(m => m.value === currentMonth)?.label}`
            });
        } else {
            setPrefilledData(undefined);
        }
        setIsFormOpen(true);
    };

    const handleViewReceipt = (url: string) => {
        setSelectedReceipt(url);
        setIsReceiptOpen(true);
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
    <div className="flex flex-col gap-4 sm:gap-8 printable-area">
        <div className="flex flex-row items-center justify-between no-print gap-2">
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
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">Financeiro</h1>
                    <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">Controle as finanças do seu clube.</p>
                </div>
            </div>
             <div className="flex gap-2">
                {filter === "Despesas Fixas" && (
                    <Dialog open={isFixedFormOpen} onOpenChange={setIsFixedFormOpen}>
                        <Button size="sm" variant="outline" className="h-10 border-accent text-accent hover:bg-accent/5 px-4 shadow-md" onClick={() => setIsFixedFormOpen(true)}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Nova Despesa Fixa</span>
                        </Button>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
                            <DialogHeader><DialogTitle>Adicionar Despesa Fixa</DialogTitle></DialogHeader>
                            <FixedExpenseForm onSave={handleSaveFixedExpense} onCancel={() => setIsFixedFormOpen(false)} />
                        </DialogContent>
                    </Dialog>
                )}
                <Button size="sm" className="bg-accent hover:bg-accent/90 h-10 w-9 sm:w-auto px-0 sm:px-4 shadow-md" disabled={!canEdit} onClick={() => handleOpenForm()}>
                    <DollarSign className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nova Transação</span>
                </Button>
                <Dialog open={isFormOpen} onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setPrefilledData(undefined);
                }}>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
                        <DialogHeader><DialogTitle>Registrar Transação</DialogTitle></DialogHeader>
                        <TransactionForm 
                            key={prefilledData ? JSON.stringify(prefilledData) : 'new'}
                            onSave={handleSaveTransaction} 
                            onCancel={() => setIsFormOpen(false)} 
                            students={students} 
                            defaultValues={prefilledData}
                        />
                    </DialogContent>
                </Dialog>
             </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 print-stack-grid">
            <div className="lg:col-span-2 space-y-4 sm:space-y-8">
                <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card 
                        className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-all card-print relative overflow-hidden",
                            filter === 'Entradas' && "ring-2 ring-primary border-primary bg-primary/5"
                        )} 
                        onClick={() => setFilter(prev => prev === 'Entradas' ? 'Todos' : 'Entradas')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 sm:pb-2">
                            <CardTitle className="text-[10px] sm:text-sm font-bold">Entradas</CardTitle>
                            <ArrowUpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                        </CardHeader>
                        <CardContent className="p-2 sm:p-3 pt-0">
                            <div className="text-sm sm:text-2xl font-black text-green-600 truncate">{formatCurrency(totals.income)}</div>
                        </CardContent>
                    </Card>
                    <Card 
                        className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-all card-print relative overflow-hidden",
                            filter === 'Saídas' && "ring-2 ring-primary border-primary bg-primary/5"
                        )} 
                        onClick={() => setFilter(prev => prev === 'Saídas' ? 'Todos' : 'Saídas')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 sm:pb-2">
                            <CardTitle className="text-[10px] sm:text-sm font-bold">Saídas</CardTitle>
                            <ArrowDownCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="p-2 sm:p-3 pt-0">
                            <div className="text-sm sm:text-2xl font-black text-red-600 truncate">{formatCurrency(totals.outcome)}</div>
                        </CardContent>
                    </Card>
                    <Card 
                        className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-all card-print relative overflow-hidden",
                            filter === 'Despesas Fixas' && "ring-2 ring-primary border-primary bg-primary/5"
                        )} 
                        onClick={() => setFilter(prev => prev === 'Despesas Fixas' ? 'Todos' : 'Despesas Fixas')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 sm:pb-2">
                            <CardTitle className="text-[10px] sm:text-sm font-bold">Despesas Fixas</CardTitle>
                            <MinusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent className="p-2 sm:p-3 pt-0">
                            <div className="text-sm sm:text-2xl font-black truncate">{formatCurrency(totals.fixed)}</div>
                        </CardContent>
                    </Card>
                    <Card 
                        className={cn(
                            "card-print relative overflow-hidden", 
                            totals.profit > 0 ? "border-green-500" : "border-red-500"
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:p-3 sm:pb-2">
                            <CardTitle className="text-[10px] sm:text-sm font-bold">Lucro</CardTitle>
                            <div className={cn("text-[10px] font-bold", totals.profit > 0 ? "text-green-500" : "text-red-500")}>$</div>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-3 pt-0">
                            <div className={`text-sm sm:text-2xl font-black truncate ${totals.profit > 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(totals.profit)}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="card-print">
                    <CardHeader className="p-3 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div>
                                    <CardTitle className="text-sm sm:text-lg">
                                        {filter === 'Despesas Fixas' ? 'Despesas Fixas' : 'Transações'}
                                    </CardTitle>
                                    <CardDescription className="text-[10px] sm:text-xs">
                                        Período: {months.find(m => m.value === currentMonth)?.label} / {currentYear}
                                    </CardDescription>
                                </div>
                                {filter !== 'Todos' && (
                                    <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-1 px-1.5" onClick={() => setFilter('Todos')}>
                                        <FilterX className="h-3 w-3" /> Limpar
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 no-print">
                                <Select value={String(currentMonth)} onValueChange={(v) => setCurrentMonth(Number(v))}>
                                    <SelectTrigger className="h-8 w-24 sm:w-32 border-accent/20 text-[10px] sm:text-sm">
                                        <CalendarIcon className="h-3.5 w-3.5 text-accent mr-1.5" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(Number(v))}>
                                    <SelectTrigger className="h-8 w-20 sm:w-24 border-accent/20 text-[10px] sm:text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        {filter === 'Despesas Fixas' ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[10px] sm:text-xs">Despesa</TableHead>
                                        <TableHead className="text-[10px] sm:text-xs">Vencimento</TableHead>
                                        <TableHead className="text-right text-[10px] sm:text-xs">Valor</TableHead>
                                        <TableHead className="text-center no-print text-[10px] sm:text-xs">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fixedExpenses.length > 0 ? fixedExpenses.map((f) => (
                                        <TableRow key={f.id}>
                                            <TableCell>
                                                <div className="font-bold text-[10px] sm:text-sm">{f.description}</div>
                                                {f.paymentMethod && <div className="text-[9px] text-muted-foreground flex items-center gap-1"><CreditCard className="h-2.5 w-2.5" /> {f.paymentMethod}</div>}
                                            </TableCell>
                                            <TableCell className="text-[10px] sm:text-xs">Dia {f.dueDate}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-[10px] sm:text-sm">{formatCurrency(f.value)}</TableCell>
                                            <TableCell className="no-print p-1 sm:p-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {f.status === 'Pago' ? (
                                                        <>
                                                            <Badge className="bg-green-500 text-white text-[9px] h-5">Pago</Badge>
                                                            {f.receiptUrl && (
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => handleViewReceipt(f.receiptUrl!)}>
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-7 text-[10px] px-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg"
                                                            onClick={() => { setPayingExpense(f); setIsPayFormOpen(true); }}
                                                        >
                                                            Pagar
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="text-center h-20 text-[10px] sm:text-xs italic text-muted-foreground">Sem registros.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[10px] sm:text-xs">Descrição</TableHead>
                                        <TableHead className="hidden sm:table-cell text-[10px] sm:text-xs">Tipo</TableHead>
                                        <TableHead className="text-right text-[10px] sm:text-xs">Valor</TableHead>
                                        <TableHead className="text-center no-print text-[10px] sm:text-xs">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    {t.type === 'Entrada' ? <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> : <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />}
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-[10px] sm:text-sm flex items-center gap-1 truncate">
                                                            {t.description}
                                                            {t.category === 'Despesa Fixa' && <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1 font-normal">Fixa</Badge>}
                                                        </div>
                                                        <div className="text-[9px] sm:text-xs text-muted-foreground truncate">{t.name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge className={cn('text-[9px] h-5', t.type === 'Entrada' ? 'bg-green-500 text-white' : 'bg-red-500 text-white')}>{t.type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-[10px] sm:text-sm">{formatCurrency(t.value)}</TableCell>
                                            <TableCell className="no-print p-1 sm:p-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {t.receiptUrl && (
                                                        <Button variant="ghost" size="icon" className="text-accent h-7 w-7" onClick={() => handleViewReceipt(t.receiptUrl!)}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={4} className="text-center h-20 text-[10px] sm:text-xs italic text-muted-foreground">Sem registros para este período.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card className="card-print">
                    <CardHeader className="p-3 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-lg"><AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" /> Pendências Alunos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        {pendingStudents.length > 0 ? (
                             <ul className="space-y-2 sm:space-y-4">
                                {pendingStudents.map(student => (
                                    <li key={student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 border">
                                        <div className="min-w-0"><p className="font-bold text-[10px] sm:text-sm truncate">{student.name}</p><p className="text-[8px] sm:text-xs text-muted-foreground">Vence dia {student.dueDate}</p></div>
                                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 rounded-lg" onClick={() => handleOpenForm(student)} disabled={!canEdit}>Pagar</Button>
                                    </li>
                                ))}
                             </ul>
                        ) : (
                             <div className="text-center text-[10px] sm:text-sm text-muted-foreground py-6 sm:py-8">
                                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-green-500 mb-2" /><p>Tudo em dia!</p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>

        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
                <DialogHeader><DialogTitle>Comprovante de Pagamento</DialogTitle></DialogHeader>
                <div className="flex justify-center p-4 bg-muted/20 rounded-lg border">
                    {selectedReceipt ? (
                        <Image 
                            src={getDisplayAvatarUrl(selectedReceipt)} 
                            alt="Comprovante" 
                            width={400} 
                            height={600} 
                            className="max-h-[70vh] object-contain rounded-md"
                            data-ai-hint="payment receipt"
                        />
                    ) : (
                        <div className="py-20 text-muted-foreground italic">Comprovante não disponível.</div>
                    )}
                </div>
                <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={() => setIsReceiptOpen(false)} className="rounded-xl h-10 px-8">Fechar</Button>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isPayFormOpen} onOpenChange={setIsPayFormOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
                <DialogHeader><DialogTitle>Confirmar Pagamento</DialogTitle></DialogHeader>
                {payingExpense && (
                    <PayFixedExpenseForm 
                        expense={payingExpense} 
                        onSave={handleConfirmFixedPayment} 
                        onCancel={() => setIsPayFormOpen(false)} 
                    />
                )}
            </DialogContent>
        </Dialog>
    </div>
  )
}
