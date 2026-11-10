
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionForm } from "@/components/transaction-form";
import { FixedExpenseForm } from "@/components/fixed-expense-form";
import { PayFixedExpenseForm } from "@/components/pay-fixed-expense-form";
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Printer, AlertCircle, CheckCircle, Trash2, FilterX, Calendar as CalendarIcon, DollarSign, PlusCircle, Eye, CreditCard, ChevronLeft, Home, ShieldAlert, FileSpreadsheet, Paperclip, Download, Pencil, Check, CheckCheck, Loader2, Users } from 'lucide-react';
import { Transaction, Student, FixedExpense, normalizeTransactionCategory, TransactionCategory } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { cn, formatCurrency, getDisplayAvatarUrl, isTransactionInMonth } from "@/lib/utils";
import { useData } from "@/hooks/use-data";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLoading } from "@/hooks/use-loading";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { BankStatementImporter } from "@/components/bank-statement-importer";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function FinancePage() {
    const { hasPermission } = useAuth();
    const router = useRouter();
    const { handleLinkClick } = useLoading();
    const { 
        transactions, 
        fixedExpenses, 
        students, 
        updateStudent,
        addTransaction, 
        updateTransaction,
        deleteTransaction, 
        addFixedExpense, 
        updateFixedExpense,
        deleteFixedExpense
    } = useData();

    const [isQuittingStudent, setIsQuittingStudent] = useState(false);
    const [isBatchSettleOpen, setIsBatchSettleOpen] = useState(false);

    const [confirmedDate, setConfirmedDate] = useState<Date>(new Date());
    const [tempDate, setTempDate] = useState<Date>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const currentMonth = confirmedDate.getMonth() + 1;
    const currentYear = confirmedDate.getFullYear();
    const [filter, setFilter] = useState<string>("Todos");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFixedFormOpen, setIsFixedFormOpen] = useState(false);
    const [isPayFormOpen, setIsPayFormOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [payingExpense, setPayingExpense] = useState<FixedExpense | null>(null);
    const [prefilledData, setPrefilledData] = useState<any>(undefined);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [fixedExpenseToDelete, setFixedExpenseToDelete] = useState<FixedExpense | null>(null);
    const [isImporterOpen, setIsImporterOpen] = useState(false);

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
    const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
    const [viewingFixedExpense, setViewingFixedExpense] = useState<FixedExpense | null>(null);

    const canEdit = hasPermission('finance:edit');
    const canView = hasPermission('nav:finance');
    
    const months = [
        { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
    ];

    const currentSystemYear = new Date().getFullYear();
    const years = useMemo(() => {
        const yearSet = new Set([2023, 2024, 2025, 2026, currentSystemYear, currentSystemYear + 1]);
        return Array.from(yearSet).sort((a, b) => a - b);
    }, [currentSystemYear]);

    const activeFixedExpenses = useMemo(() => {
        return fixedExpenses.filter(fe => fe.status !== 'Apagado');
    }, [fixedExpenses]);

    const filteredByDate = useMemo(() => {
        return transactions.filter(t => {
            if (t.type === 'Apagado') return false;
            return isTransactionInMonth(t.date, currentYear, currentMonth);
        });
    }, [transactions, currentMonth, currentYear]);

    const totals = useMemo(() => {
        const income = filteredByDate.filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.value, 0);
        const outcome = filteredByDate.filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.value, 0);
        const pendingFixed = activeFixedExpenses.filter(f => f.status === 'Pendente').reduce((acc, f) => acc + f.value, 0);
        return { income, outcome, fixed: pendingFixed, profit: income - outcome };
    }, [filteredByDate, activeFixedExpenses]);

    const categoryTotals = useMemo(() => {
        let receitas = 0;
        let custos = 0;
        let despesas = 0;
        let investimentos = 0;
        let gastos = 0;

        for (const t of filteredByDate) {
            const cat = normalizeTransactionCategory(t.category, t.type);
            if (cat === 'Receita') receitas += t.value;
            else if (cat === 'Custo') custos += t.value;
            else if (cat === 'Investimento') investimentos += t.value;
            else if (cat === 'Gasto') gastos += t.value;
            else despesas += t.value;
        }

        return { receitas, custos, despesas, investimentos, gastos };
    }, [filteredByDate]);

    const filteredTransactions = useMemo(() => {
        if (filter === "Todos") return filteredByDate;
        if (filter === "Entradas") return filteredByDate.filter(t => t.type === "Entrada");
        if (filter === "Saídas") return filteredByDate.filter(t => t.type === "Saída");
        if (filter === "Receitas") return filteredByDate.filter(t => normalizeTransactionCategory(t.category, t.type) === "Receita");
        if (filter === "Custos") return filteredByDate.filter(t => normalizeTransactionCategory(t.category, t.type) === "Custo");
        if (filter === "Despesas") return filteredByDate.filter(t => normalizeTransactionCategory(t.category, t.type) === "Despesa");
        if (filter === "Investimentos") return filteredByDate.filter(t => normalizeTransactionCategory(t.category, t.type) === "Investimento");
        if (filter === "Gastos") return filteredByDate.filter(t => normalizeTransactionCategory(t.category, t.type) === "Gasto");
        return filteredByDate;
    }, [filteredByDate, filter]);

    const renderCategoryBadge = (category?: string, type?: 'Entrada' | 'Saída' | string) => {
        const cat = normalizeTransactionCategory(category, type);
        switch (cat) {
            case 'Receita':
                return (
                    <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1.5 font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 shrink-0">
                        Receita
                    </Badge>
                );
            case 'Custo':
                return (
                    <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1.5 font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30 shrink-0">
                        Custo
                    </Badge>
                );
            case 'Despesa':
                return (
                    <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1.5 font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0">
                        Despesa
                    </Badge>
                );
            case 'Investimento':
                return (
                    <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1.5 font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 shrink-0">
                        Investimento
                    </Badge>
                );
            case 'Gasto':
                return (
                    <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1.5 font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 shrink-0">
                        Gasto
                    </Badge>
                );
            default:
                return <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1.5 font-semibold shrink-0">{cat}</Badge>;
        }
    };

    // Localiza se há anexo de extrato bancário importado para este mês
    const statementAttachmentUrl = useMemo(() => {
        const tx = filteredByDate.find(t => 
            t.receiptUrl && (
                t.receiptUrl.toLowerCase().includes('.xlsx') || 
                t.receiptUrl.toLowerCase().includes('.xls') || 
                t.receiptUrl.toLowerCase().includes('.csv') || 
                t.receiptUrl.toLowerCase().includes('.ofx') || 
                t.receiptUrl.toLowerCase().includes('/extratos/')
            )
        );
        return tx?.receiptUrl;
    }, [filteredByDate]);

    const handleSaveTransaction = async (data: any) => {
        try {
            const isIncome = data.type.includes('Entrada');
            const chosenCategory = data.category || (isIncome ? 'Receita' : 'Despesa');
            const normalizedCat = normalizeTransactionCategory(chosenCategory, isIncome ? 'Entrada' : 'Saída');

            if (editingTransaction) {
                await updateTransaction(editingTransaction.id, {
                    type: isIncome ? 'Entrada' : 'Saída',
                    category: normalizedCat,
                    name: data.name,
                    description: data.description,
                    value: data.value,
                    date: data.date.toISOString(),
                    receiptUrl: data.receiptUrl,
                    paymentMethod: data.paymentMethod
                });
                toast({ title: "Transação Atualizada!", description: "Alterações salvas com sucesso." });
            } else {
                await addTransaction({
                    type: isIncome ? 'Entrada' : 'Saída',
                    category: normalizedCat,
                    name: data.name,
                    description: data.description,
                    value: data.value,
                    date: data.date.toISOString(),
                    receiptUrl: data.receiptUrl,
                    paymentMethod: data.paymentMethod
                });
                toast({ title: "Transação Registrada!", description: "Salva com sucesso." });
            }
            setIsFormOpen(false);
            setEditingTransaction(null);
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

            toast({ title: "Pagamento Confirmado!", description: "Despesa fixa registrada como saída." });
            setIsPayFormOpen(false);
            setPayingExpense(null);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao registrar pagamento", description: err.message });
        }
    };

    const handleSaveFixedExpense = async (data: any) => {
        try {
            if (editingFixedExpense) {
                await updateFixedExpense(editingFixedExpense.id, {
                    description: data.description,
                    value: data.value,
                    dueDate: data.dueDate
                });
                toast({ title: "Despesa Fixa Atualizada!", description: "Alterações salvas com sucesso." });
            } else {
                await addFixedExpense({
                    description: data.description,
                    value: data.value,
                    status: 'Pendente',
                    month: currentMonth,
                    year: currentYear,
                    dueDate: data.dueDate
                });
                toast({ title: "Despesa Fixa Adicionada!", description: "Salva com sucesso." });
            }
            setIsFixedFormOpen(false);
            setEditingFixedExpense(null);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao salvar despesa fixa", description: err.message });
        }
    };

    const pendingStudents = useMemo(() => {
        const monthLabel = months.find(m => m.value === currentMonth)?.label || '';

        return students
            .filter(s => s.status === 'Ativo' && s.studentCondition !== 'Bolsa' && (s.monthlyFee || 0) > 0)
            .map(student => {
                const studentName = student.name.trim().toLowerCase();
                
                // 1. Pagamentos no Fluxo de Caixa (Transações como PIX, dinheiro, etc.)
                const studentTransactions = filteredByDate.filter(t => {
                    if (t.type !== 'Entrada') return false;
                    const txName = (t.name || '').trim().toLowerCase();
                    return txName === studentName ||
                           studentName.startsWith(txName) ||
                           txName.startsWith(studentName);
                });
                const txPaid = studentTransactions.reduce((acc, t) => acc + t.value, 0);

                // 2. Pagamentos no Histórico do Aluno (Quitados via Boleto Sicoob)
                const historyPaid = (student.paymentHistory || [])
                    .filter(p => {
                        if (p.status && p.status !== 'Pago') return false;
                        const matchDate = isTransactionInMonth(p.date, currentYear, currentMonth);
                        const matchDesc = p.description && (
                            p.description.toLowerCase().includes(monthLabel.toLowerCase()) &&
                            p.description.includes(String(currentYear))
                        );
                        return matchDate || matchDesc;
                    })
                    .reduce((acc, p) => acc + (p.amount || 0), 0);

                const totalPaid = txPaid + historyPaid;
                const monthlyFee = student.monthlyFee || 0;
                const remaining = Math.max(0, monthlyFee - totalPaid);
                const isPaid = totalPaid >= monthlyFee;

                return {
                    ...student,
                    totalPaid,
                    remaining,
                    isPaid,
                    paidViaBoleto: historyPaid > 0 && txPaid === 0
                };
            })
            .filter(s => !s.isPaid);
    }, [students, filteredByDate, currentMonth, currentYear, months]);

    const handleSettleBoleto = async (student: any) => {
        setIsQuittingStudent(true);
        try {
            const monthLabel = months.find(m => m.value === currentMonth)?.label || '';
            const feeAmount = student.remaining > 0 ? student.remaining : (student.monthlyFee || 0);
            const dueDay = String(student.dueDate || 10).padStart(2, '0');
            const settleDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${dueDay}`;

            const newPaymentEntry = {
                date: settleDate,
                description: `Mensalidade ${monthLabel}/${currentYear} (Boleto Sicoob)`,
                amount: feeAmount,
                status: 'Pago' as const,
                method: 'Boleto Sicoob'
            };

            const updatedHistory = [...(student.paymentHistory || []), newPaymentEntry];
            await updateStudent(student.id, { paymentHistory: updatedHistory });

            toast({
                title: "Mensalidade Quitada!",
                description: `Baixa via Boleto registrada no perfil de ${student.name} sem duplicar no caixa.`
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: "Erro ao quitar mensalidade",
                description: err.message
            });
        } finally {
            setIsQuittingStudent(false);
        }
    };

    const handleBatchSettleAll = async () => {
        if (pendingStudents.length === 0) return;
        setIsQuittingStudent(true);
        const monthLabel = months.find(m => m.value === currentMonth)?.label || '';
        try {
            let count = 0;
            for (const st of pendingStudents) {
                const feeAmount = st.remaining > 0 ? st.remaining : (st.monthlyFee || 0);
                const dueDay = String(st.dueDate || 10).padStart(2, '0');
                const settleDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${dueDay}`;

                const newPaymentEntry = {
                    date: settleDate,
                    description: `Mensalidade ${monthLabel}/${currentYear} (Boleto Sicoob)`,
                    amount: feeAmount,
                    status: 'Pago' as const,
                    method: 'Boleto Sicoob'
                };

                const updatedHistory = [...(st.paymentHistory || []), newPaymentEntry];
                await updateStudent(st.id, { paymentHistory: updatedHistory });
                count++;
            }

            toast({
                title: "Baixa em Lote Concluída!",
                description: `${count} mensalidades quitadas via Boleto para ${monthLabel}/${currentYear}.`
            });
            setIsBatchSettleOpen(false);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: "Erro na baixa em lote",
                description: err.message
            });
        } finally {
            setIsQuittingStudent(false);
        }
    };

    const handleOpenEditTransaction = (t: Transaction) => {
        setEditingTransaction(t);
        const formType = t.type === 'Entrada' 
            ? (t.category === 'Aluno' ? 'Entrada (Aluno)' : 'Entrada (Outros)')
            : 'Saída';

        let parsedDate = new Date();
        try {
            const d = new Date(t.date);
            if (!isNaN(d.getTime())) parsedDate = d;
        } catch {}

        setPrefilledData({
            type: formType,
            category: normalizeTransactionCategory(t.category, t.type as any),
            name: t.name || '',
            description: t.description || '',
            value: t.value || 0,
            date: parsedDate,
            paymentMethod: t.paymentMethod || 'Dinheiro',
            receiptUrl: t.receiptUrl || ''
        });
        setIsFormOpen(true);
    };

    const handleOpenEditFixedExpense = (f: FixedExpense) => {
        setEditingFixedExpense(f);
        setIsFixedFormOpen(true);
    };

    const handleOpenForm = (student?: any) => {
        setEditingTransaction(null);
        if (student) {
            setPrefilledData({
                type: 'Entrada (Aluno)',
                category: 'Receita',
                name: student.name,
                value: student.remaining > 0 ? student.remaining : (student.monthlyFee || 0),
                description: `Mensalidade ${months.find(m => m.value === currentMonth)?.label || ''}`,
                date: new Date(),
                paymentMethod: 'PIX',
                receiptUrl: ''
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

    if (!canView) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl bg-card">
                <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h2 className="text-xl font-bold text-primary">Acesso Restrito</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Você não possui permissão para visualizar o módulo Financeiro. Solicite acesso ao administrador.</p>
                <Button className="mt-4 bg-accent" onClick={() => router.push('/dashboard')}>Voltar ao Início</Button>
            </div>
        );
    }

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
                <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-10 w-10 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shadow-sm" 
                    disabled={!canEdit} 
                    onClick={() => setIsImporterOpen(true)}
                    title="Importar Extrato Bancário (Sicoob / Excel / OFX)"
                >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </Button>

                {statementAttachmentUrl && (
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-10 border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5 shadow-sm font-semibold"
                        onClick={() => handleViewReceipt(statementAttachmentUrl)}
                        title="Consultar anexo do extrato bancário importado para este mês"
                    >
                        <Paperclip className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden sm:inline">Anexo do Extrato</span>
                    </Button>
                )}

                {filter === "Despesas Fixas" && (
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-10 border-accent text-accent hover:bg-accent/5 px-4 shadow-md" 
                        disabled={!canEdit}
                        onClick={() => {
                            setEditingFixedExpense(null);
                            setIsFixedFormOpen(true);
                        }}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Nova Despesa Fixa</span>
                    </Button>
                )}
                <Button size="sm" className="bg-accent hover:bg-accent/90 h-10 w-9 sm:w-auto px-0 sm:px-4 shadow-md" disabled={!canEdit} onClick={() => handleOpenForm()}>
                    <DollarSign className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nova Transação</span>
                </Button>
                <Dialog open={isFormOpen} onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) {
                        setEditingTransaction(null);
                        setPrefilledData(undefined);
                    }
                }}>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
                        <DialogHeader>
                            <DialogTitle>{editingTransaction ? "Editar Transação" : "Registrar Transação"}</DialogTitle>
                        </DialogHeader>
                        <TransactionForm 
                            key={editingTransaction ? `edit-${editingTransaction.id}` : (prefilledData ? JSON.stringify(prefilledData) : 'new')}
                            onSave={handleSaveTransaction} 
                            onCancel={() => {
                                setIsFormOpen(false);
                                setEditingTransaction(null);
                                setPrefilledData(undefined);
                            }} 
                            students={students} 
                            defaultValues={prefilledData}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={isFixedFormOpen} onOpenChange={(open) => {
                    setIsFixedFormOpen(open);
                    if (!open) setEditingFixedExpense(null);
                }}>
                    <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
                        <DialogHeader>
                            <DialogTitle>{editingFixedExpense ? "Editar Despesa Fixa" : "Adicionar Despesa Fixa"}</DialogTitle>
                        </DialogHeader>
                        <FixedExpenseForm 
                            key={editingFixedExpense ? `edit-${editingFixedExpense.id}` : 'new'}
                            defaultValues={editingFixedExpense ? {
                                id: editingFixedExpense.id,
                                description: editingFixedExpense.description,
                                value: editingFixedExpense.value,
                                dueDate: editingFixedExpense.dueDate,
                                paymentMethod: editingFixedExpense.paymentMethod
                            } : undefined}
                            onSave={handleSaveFixedExpense} 
                            onCancel={() => {
                                setIsFixedFormOpen(false);
                                setEditingFixedExpense(null);
                            }} 
                        />
                    </DialogContent>
                </Dialog>

                <BankStatementImporter 
                    isOpen={isImporterOpen} 
                    onClose={() => setIsImporterOpen(false)} 
                />
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
                            <CardTitle className="text-[10px] sm:text-sm font-bold">Líquido</CardTitle>
                            <div className={cn("text-[10px] font-bold", totals.profit > 0 ? "text-green-500" : "text-red-500")}>$</div>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-3 pt-0">
                            <div className={`text-sm sm:text-2xl font-black truncate ${totals.profit > 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(totals.profit)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Divisão Gerencial: Receitas, Custos, Despesas, Investimentos, Gastos */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-print">
                    <Button 
                        variant={filter === 'Todos' ? 'default' : 'outline'} 
                        size="sm" 
                        className={cn("h-7 text-[10px] sm:text-[11px] rounded-lg px-2.5", filter === 'Todos' ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground")}
                        onClick={() => setFilter('Todos')}
                    >
                        Todos
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                            "h-7 text-[10px] sm:text-[11px] rounded-lg px-2.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 gap-1.5 font-medium transition-all shrink-0",
                            filter === 'Receitas' ? "bg-emerald-500/20 ring-1 ring-emerald-500 font-bold" : "hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        )}
                        onClick={() => setFilter(prev => prev === 'Receitas' ? 'Todos' : 'Receitas')}
                    >
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        Receitas: <strong className="font-mono">{formatCurrency(categoryTotals.receitas)}</strong>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                            "h-7 text-[10px] sm:text-[11px] rounded-lg px-2.5 border-orange-500/40 text-orange-700 dark:text-orange-400 gap-1.5 font-medium transition-all shrink-0",
                            filter === 'Custos' ? "bg-orange-500/20 ring-1 ring-orange-500 font-bold" : "hover:bg-orange-50 dark:hover:bg-orange-950/30"
                        )}
                        onClick={() => setFilter(prev => prev === 'Custos' ? 'Todos' : 'Custos')}
                    >
                        <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                        Custos: <strong className="font-mono">{formatCurrency(categoryTotals.custos)}</strong>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                            "h-7 text-[10px] sm:text-[11px] rounded-lg px-2.5 border-amber-500/40 text-amber-700 dark:text-amber-400 gap-1.5 font-medium transition-all shrink-0",
                            filter === 'Despesas' ? "bg-amber-500/20 ring-1 ring-amber-500 font-bold" : "hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        )}
                        onClick={() => setFilter(prev => prev === 'Despesas' ? 'Todos' : 'Despesas')}
                    >
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        Despesas: <strong className="font-mono">{formatCurrency(categoryTotals.despesas)}</strong>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                            "h-7 text-[10px] sm:text-[11px] rounded-lg px-2.5 border-blue-500/40 text-blue-700 dark:text-blue-400 gap-1.5 font-medium transition-all shrink-0",
                            filter === 'Investimentos' ? "bg-blue-500/20 ring-1 ring-blue-500 font-bold" : "hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        )}
                        onClick={() => setFilter(prev => prev === 'Investimentos' ? 'Todos' : 'Investimentos')}
                    >
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        Investimentos: <strong className="font-mono">{formatCurrency(categoryTotals.investimentos)}</strong>
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                            "h-7 text-[10px] sm:text-[11px] rounded-lg px-2.5 border-purple-500/40 text-purple-700 dark:text-purple-400 gap-1.5 font-medium transition-all shrink-0",
                            filter === 'Gastos' ? "bg-purple-500/20 ring-1 ring-purple-500 font-bold" : "hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        )}
                        onClick={() => setFilter(prev => prev === 'Gastos' ? 'Todos' : 'Gastos')}
                    >
                        <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                        Gastos: <strong className="font-mono">{formatCurrency(categoryTotals.gastos)}</strong>
                    </Button>
                </div>

                <Card className="card-print">
                    <CardHeader className="p-3 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div>
                                    <CardTitle className="text-sm sm:text-lg">
                                        {filter === 'Despesas Fixas' ? 'Despesas Fixas' : 'Transações'}
                                    </CardTitle>
                                    <CardDescription className="text-[10px] sm:text-xs capitalize">
                                        Período: {format(confirmedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                                    </CardDescription>
                                </div>
                                {filter !== 'Todos' && (
                                    <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-1 px-1.5" onClick={() => setFilter('Todos')}>
                                        <FilterX className="h-3 w-3" /> Limpar
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 no-print">
                                <Popover open={isCalendarOpen} onOpenChange={(open) => {
                                    setIsCalendarOpen(open);
                                    if (open) setTempDate(confirmedDate);
                                }}>
                                    <PopoverTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-8 border-accent/20 text-[10px] sm:text-xs px-2.5 sm:px-3 gap-1.5 rounded-xl hover:bg-accent/5 shadow-sm"
                                        >
                                            <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                                            <span className="capitalize font-medium">
                                                {format(confirmedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-none" align="end">
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
                                        <TableHead className="text-[10px] sm:text-xs whitespace-nowrap w-[90px]">Vencimento</TableHead>
                                        <TableHead className="text-right text-[10px] sm:text-xs whitespace-nowrap w-[100px]">Valor</TableHead>
                                        <TableHead className="text-center no-print text-[10px] sm:text-xs whitespace-nowrap w-[110px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeFixedExpenses.length > 0 ? activeFixedExpenses.map((f) => (
                                        <TableRow key={f.id}>
                                            <TableCell className="max-w-[180px] sm:max-w-[260px] p-2 sm:p-4">
                                                <div className="font-bold text-[10px] sm:text-sm line-clamp-2 break-words" title={f.description}>{f.description}</div>
                                                {f.paymentMethod && <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5"><CreditCard className="h-2.5 w-2.5 shrink-0" /> {f.paymentMethod}</div>}
                                            </TableCell>
                                            <TableCell className="text-[10px] sm:text-xs whitespace-nowrap w-[90px]">Dia {f.dueDate}</TableCell>
                                            <TableCell className="text-right font-mono font-bold text-[10px] sm:text-sm whitespace-nowrap w-[100px] p-2 sm:p-4">{formatCurrency(f.value)}</TableCell>
                                            <TableCell className="no-print p-1 sm:p-4 text-center whitespace-nowrap w-[110px]">
                                                <div className="flex items-center justify-center gap-1">
                                                    {f.status === 'Pago' ? (
                                                        <Badge className="bg-green-500 text-white text-[9px] h-5">Pago</Badge>
                                                    ) : (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-7 text-[10px] px-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                                                            disabled={!canEdit}
                                                            onClick={() => { setPayingExpense(f); setIsPayFormOpen(true); }}
                                                        >
                                                            Pagar
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 text-muted-foreground hover:text-accent" 
                                                        title="Visualizar despesa fixa"
                                                        onClick={() => setViewingFixedExpense(f)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {canEdit && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-muted-foreground hover:text-primary" 
                                                            title="Editar despesa fixa"
                                                            onClick={() => handleOpenEditFixedExpense(f)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    {canEdit && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                                                            title="Excluir despesa fixa"
                                                            onClick={() => setFixedExpenseToDelete(f)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
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
                                        <TableHead className="hidden sm:table-cell text-[10px] sm:text-xs w-[80px]">Tipo</TableHead>
                                        <TableHead className="text-right text-[10px] sm:text-xs whitespace-nowrap w-[100px]">Valor</TableHead>
                                        <TableHead className="text-center no-print text-[10px] sm:text-xs whitespace-nowrap w-[90px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="max-w-[160px] sm:max-w-[240px] md:max-w-[320px] p-2 sm:p-4">
                                                <div className="flex items-start gap-1.5 min-w-0">
                                                    {t.type === 'Entrada' ? (
                                                        <ArrowUpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <ArrowDownCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-bold text-[10px] sm:text-sm flex items-center gap-1.5 flex-wrap">
                                                            <span className="truncate">{t.description}</span>
                                                            {renderCategoryBadge(t.category, t.type)}
                                                        </div>
                                                        {t.name && (
                                                            <div 
                                                                className="text-[9px] sm:text-xs text-muted-foreground line-clamp-2 break-words leading-tight mt-0.5" 
                                                                title={t.name}
                                                            >
                                                                {t.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell whitespace-nowrap w-[80px]">
                                                <Badge className={cn('text-[9px] h-5', t.type === 'Entrada' ? 'bg-green-500 text-white' : 'bg-red-500 text-white')}>{t.type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-[10px] sm:text-sm whitespace-nowrap w-[100px] p-2 sm:p-4">
                                                {formatCurrency(t.value)}
                                            </TableCell>
                                            <TableCell className="no-print p-1 sm:p-4 whitespace-nowrap w-[90px]">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-muted-foreground hover:text-accent h-7 w-7" 
                                                        title="Visualizar detalhes"
                                                        onClick={() => setViewingTransaction(t)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {canEdit && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-muted-foreground hover:text-primary h-7 w-7" 
                                                            title="Editar transação"
                                                            onClick={() => handleOpenEditTransaction(t)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    {canEdit && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-destructive hover:bg-destructive/10 h-7 w-7" 
                                                            title="Excluir transação"
                                                            onClick={() => setTransactionToDelete(t)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
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
                 <Card className="card-print shadow-sm">
                    <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold">
                                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" /> 
                                    Pendências Alunos
                                </CardTitle>
                                <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">
                                    {months.find(m => m.value === currentMonth)?.label} de {currentYear}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {pendingStudents.length > 0 && (
                                    <>
                                        <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 h-6">
                                            {pendingStudents.length}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[10px] px-2 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium gap-1"
                                            disabled={!canEdit || isQuittingStudent}
                                            onClick={() => setIsBatchSettleOpen(true)}
                                            title="Dar baixa via Boleto em todos os alunos pendentes deste mês"
                                        >
                                            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                            <span className="hidden sm:inline">Quitar Todos</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                        {pendingStudents.length > 0 ? (
                            <ScrollArea className="h-[490px] pr-2.5">
                                <ul className="space-y-2">
                                    {pendingStudents.map(student => (
                                        <li key={student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 border bg-card/60 transition-colors">
                                            <div className="min-w-0 pr-2">
                                                <p className="font-bold text-[10px] sm:text-sm truncate" title={student.name}>{student.name}</p>
                                                <p className="text-[8px] sm:text-xs text-muted-foreground truncate">
                                                    Vence dia {student.dueDate} {student.totalPaid > 0 ? `• Restante: ${formatCurrency(student.remaining)} (Pago: ${formatCurrency(student.totalPaid)})` : `• ${formatCurrency(student.monthlyFee)}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button 
                                                    size="sm" 
                                                    className="h-7 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1 shadow-sm rounded-lg" 
                                                    onClick={() => handleSettleBoleto(student)} 
                                                    disabled={!canEdit || isQuittingStudent}
                                                    title="Quitar via Boleto Sicoob (Salva no perfil sem duplicar no fluxo de caixa)"
                                                >
                                                    <Check className="h-3 w-3" />
                                                    Quitar
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-muted-foreground hover:text-accent rounded-lg" 
                                                    onClick={() => handleOpenForm(student)} 
                                                    disabled={!canEdit}
                                                    title="Lançar entrada manual no caixa (PIX / Dinheiro / Balcão)"
                                                >
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        ) : (
                             <div className="text-center text-[10px] sm:text-sm text-muted-foreground py-6 sm:py-8">
                                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-green-500 mb-2" /><p>Tudo em dia!</p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>

        <Dialog open={!!viewingTransaction} onOpenChange={(open) => !open && setViewingTransaction(null)}>
            <DialogContent className="sm:max-w-[480px] rounded-2xl w-[94vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Eye className="h-5 w-5 text-accent" />
                        Detalhes da Transação
                    </DialogTitle>
                </DialogHeader>
                {viewingTransaction && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                            <div>
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Valor</span>
                                <div className={cn("text-xl sm:text-2xl font-black font-mono", viewingTransaction.type === 'Entrada' ? 'text-green-600' : 'text-red-600')}>
                                    {viewingTransaction.type === 'Entrada' ? '+' : '-'} {formatCurrency(viewingTransaction.value)}
                                </div>
                            </div>
                            <Badge className={cn("text-xs px-2.5 py-1", viewingTransaction.type === 'Entrada' ? 'bg-green-500 text-white' : 'bg-red-500 text-white')}>
                                {viewingTransaction.type}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-2.5 rounded-lg border bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Descrição</span>
                                <span className="font-bold text-foreground text-xs sm:text-sm">{viewingTransaction.description}</span>
                            </div>
                            <div className="p-2.5 rounded-lg border bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Favorecido / Nome</span>
                                <span className="font-bold text-foreground text-xs sm:text-sm">{viewingTransaction.name || "—"}</span>
                            </div>
                            <div className="p-2.5 rounded-lg border bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Data</span>
                                <span className="font-medium text-foreground text-xs sm:text-sm">
                                    {(() => {
                                        try {
                                            const d = new Date(viewingTransaction.date);
                                            return isNaN(d.getTime()) ? viewingTransaction.date : format(d, "dd/MM/yyyy", { locale: ptBR });
                                        } catch {
                                            return viewingTransaction.date || "—";
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg border bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Categoria Gerencial</span>
                                <div className="mt-1">
                                    {renderCategoryBadge(viewingTransaction.category, viewingTransaction.type as any)}
                                </div>
                            </div>
                            <div className="p-2.5 rounded-lg border bg-card col-span-2">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Forma de Pagamento</span>
                                <span className="font-medium text-foreground text-xs sm:text-sm">{viewingTransaction.paymentMethod || "Não informado"}</span>
                            </div>
                        </div>

                        {viewingTransaction.receiptUrl && (
                            <div className="pt-2">
                                <Button 
                                    variant="outline" 
                                    className="w-full gap-2 border-accent text-accent hover:bg-accent/10 rounded-xl"
                                    onClick={() => {
                                        const url = viewingTransaction.receiptUrl!;
                                        setViewingTransaction(null);
                                        handleViewReceipt(url);
                                    }}
                                >
                                    <Paperclip className="h-4 w-4" />
                                    Visualizar Comprovante / Anexo
                                </Button>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            {canEdit && (
                                <Button 
                                    variant="outline" 
                                    className="gap-1.5 rounded-xl text-xs" 
                                    onClick={() => {
                                        const tx = viewingTransaction;
                                        setViewingTransaction(null);
                                        handleOpenEditTransaction(tx);
                                    }}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar
                                </Button>
                            )}
                            <Button variant="default" className="rounded-xl text-xs px-5" onClick={() => setViewingTransaction(null)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        <Dialog open={!!viewingFixedExpense} onOpenChange={(open) => !open && setViewingFixedExpense(null)}>
            <DialogContent className="sm:max-w-[460px] rounded-2xl w-[94vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Eye className="h-5 w-5 text-accent" />
                        Detalhes da Despesa Fixa
                    </DialogTitle>
                </DialogHeader>
                {viewingFixedExpense && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                            <div>
                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Valor</span>
                                <div className="text-xl sm:text-2xl font-black font-mono text-red-600">
                                    {formatCurrency(viewingFixedExpense.value)}
                                </div>
                            </div>
                            <Badge className={cn("text-xs px-2.5 py-1", viewingFixedExpense.status === 'Pago' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white')}>
                                {viewingFixedExpense.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-2.5 rounded-lg border bg-card col-span-2">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Descrição</span>
                                <span className="font-bold text-foreground text-xs sm:text-sm">{viewingFixedExpense.description}</span>
                            </div>
                            <div className="p-2.5 rounded-lg border bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Vencimento</span>
                                <span className="font-medium text-foreground text-xs sm:text-sm">Dia {viewingFixedExpense.dueDate} de cada mês</span>
                            </div>
                            <div className="p-2.5 rounded-lg border bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Competência</span>
                                <span className="font-medium text-foreground text-xs sm:text-sm">{months.find(m => m.value === viewingFixedExpense.month)?.label || viewingFixedExpense.month} / {viewingFixedExpense.year}</span>
                            </div>
                            {viewingFixedExpense.paymentMethod && (
                                <div className="p-2.5 rounded-lg border bg-card col-span-2">
                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Forma de Pagamento</span>
                                    <span className="font-medium text-foreground text-xs sm:text-sm">{viewingFixedExpense.paymentMethod}</span>
                                </div>
                            )}
                        </div>

                        {viewingFixedExpense.receiptUrl && (
                            <div className="pt-2">
                                <Button 
                                    variant="outline" 
                                    className="w-full gap-2 border-accent text-accent hover:bg-accent/10 rounded-xl"
                                    onClick={() => {
                                        const url = viewingFixedExpense.receiptUrl!;
                                        setViewingFixedExpense(null);
                                        handleViewReceipt(url);
                                    }}
                                >
                                    <Paperclip className="h-4 w-4" />
                                    Visualizar Comprovante / Anexo
                                </Button>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            {canEdit && (
                                <Button 
                                    variant="outline" 
                                    className="gap-1.5 rounded-xl text-xs" 
                                    onClick={() => {
                                        const fx = viewingFixedExpense;
                                        setViewingFixedExpense(null);
                                        handleOpenEditFixedExpense(fx);
                                    }}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar
                                </Button>
                            )}
                            <Button variant="default" className="rounded-xl text-xs px-5" onClick={() => setViewingFixedExpense(null)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl w-[94vw]">
                <DialogHeader><DialogTitle>Comprovante / Anexo</DialogTitle></DialogHeader>
                <div className="flex justify-center p-4 bg-muted/20 rounded-lg border">
                    {selectedReceipt ? (
                        (() => {
                            const lower = selectedReceipt.toLowerCase();
                            const isDoc = lower.includes('.xlsx') || lower.includes('.xls') || lower.includes('.csv') || lower.includes('.ofx') || lower.includes('.xml') || lower.includes('/extratos/');
                            const isPdf = lower.includes('.pdf');

                            if (isDoc) {
                                const rawName = selectedReceipt.split('/').pop()?.split('?')[0] || "extrato-bancario";
                                const cleanName = decodeURIComponent(rawName);
                                return (
                                    <div className="flex flex-col items-center justify-center p-6 text-center gap-4">
                                        <div className="p-4 rounded-2xl bg-emerald-600/10 text-emerald-600">
                                            <FileSpreadsheet className="h-16 w-16" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground truncate max-w-[320px]">{cleanName}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Extrato / Planilha bancária original anexada.</p>
                                        </div>
                                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl shadow-md">
                                            <a href={selectedReceipt} target="_blank" rel="noopener noreferrer" download>
                                                <Download className="h-4 w-4" /> Baixar Planilha / Extrato
                                            </a>
                                        </Button>
                                    </div>
                                );
                            }

                            if (isPdf) {
                                return (
                                    <div className="flex flex-col items-center gap-3 w-full">
                                        <iframe src={selectedReceipt} className="w-full h-[60vh] rounded-md border" />
                                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                                            <a href={selectedReceipt} target="_blank" rel="noopener noreferrer" download>
                                                <Download className="h-4 w-4 mr-1.5" /> Baixar PDF
                                            </a>
                                        </Button>
                                    </div>
                                );
                            }

                            return (
                                <Image 
                                    src={getDisplayAvatarUrl(selectedReceipt)} 
                                    alt="Comprovante" 
                                    width={400} 
                                    height={600} 
                                    className="max-h-[70vh] object-contain rounded-md"
                                    data-ai-hint="payment receipt"
                                />
                            );
                        })()
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

        <DeleteConfirmDialog
            open={!!transactionToDelete}
            onOpenChange={(open) => !open && setTransactionToDelete(null)}
            itemName={transactionToDelete?.description}
            itemType="a transação"
            title="Confirmar Exclusão de Transação"
            onConfirm={async (audit) => {
                if (!transactionToDelete) return;
                try {
                    await deleteTransaction(transactionToDelete.id, true, audit);
                    toast({ title: "Movido para a Lixeira", description: "Transação movida para a Lixeira com sucesso." });
                    setTransactionToDelete(null);
                } catch (err: any) {
                    toast({ variant: 'destructive', title: "Erro ao remover", description: err.message });
                }
            }}
        />

        <DeleteConfirmDialog
            open={!!fixedExpenseToDelete}
            onOpenChange={(open) => !open && setFixedExpenseToDelete(null)}
            itemName={fixedExpenseToDelete?.description}
            itemType="a despesa fixa"
            title="Confirmar Exclusão de Despesa Fixa"
            onConfirm={async (audit) => {
                if (!fixedExpenseToDelete) return;
                try {
                    await deleteFixedExpense(fixedExpenseToDelete.id, true, audit);
                    toast({ title: "Movido para a Lixeira", description: "Despesa fixa movida para a Lixeira com sucesso." });
                    setFixedExpenseToDelete(null);
                } catch (err: any) {
                    toast({ variant: 'destructive', title: "Erro ao remover", description: err.message });
                }
            }}
        />

        {/* Modal de Confirmação de Baixa em Lote via Boleto */}
        <Dialog open={isBatchSettleOpen} onOpenChange={setIsBatchSettleOpen}>
            <DialogContent className="sm:max-w-[420px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <CheckCheck className="h-5 w-5 text-emerald-600" />
                        Quitar Mensalidades em Lote
                    </DialogTitle>
                </DialogHeader>
                <div className="text-xs text-muted-foreground space-y-2 py-2">
                    <p>
                        Deseja marcar como <strong>PAGA (Boleto Sicoob)</strong> a mensalidade de todos os <strong>{pendingStudents.length} alunos</strong> pendentes referentes a <strong>{months.find(m => m.value === currentMonth)?.label} de {currentYear}</strong>?
                    </p>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-emerald-600" />
                            Sem duplicidade de faturamento
                        </p>
                        <p>O histórico de cada aluno será atualizado com a mensalidade quitada, sem lançar novas entradas no fluxo de caixa (ideal para compensação em lote do extrato bancário).</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setIsBatchSettleOpen(false)} disabled={isQuittingStudent}>
                        Cancelar
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5" onClick={handleBatchSettleAll} disabled={isQuittingStudent}>
                        {isQuittingStudent ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                        Confirmar Baixa em Lote
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}
