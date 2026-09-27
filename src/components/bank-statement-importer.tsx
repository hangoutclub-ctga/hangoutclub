"use client";

import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter, 
  X, 
  Loader2, 
  HelpCircle,
  Sparkles,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { useData } from "@/hooks/use-data";
import { Transaction } from "@/types";

export interface ImportedCandidate {
  id: string;
  selected: boolean;
  date: string; // YYYY-MM-DD
  description: string;
  value: number;
  type: 'Entrada' | 'Saída';
  category: 'Aluno' | 'Fornecedor' | 'Despesa Fixa' | 'Outros';
  name: string;
  isDuplicate?: boolean;
}

interface BankStatementImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function BankStatementImporter({ isOpen, onClose, onImportComplete }: BankStatementImporterProps) {
  const { transactions, addTransaction, students } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [parsedItems, setParsedItems] = useState<ImportedCandidate[]>([]);
  const [filterType, setFilterType] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetState = () => {
    setFileName("");
    setParsedItems([]);
    setFilterType("todos");
    setSearchTerm("");
    setIsLoading(false);
    setIsSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Sugere categoria baseando-se no texto do lançamento
  const autoDetectCategory = (desc: string, isIncome: boolean): 'Aluno' | 'Fornecedor' | 'Despesa Fixa' | 'Outros' => {
    const text = desc.toUpperCase();
    
    // Despesas fixas típicas de empresas
    if (
      text.includes("ENERGIA") || 
      text.includes("LUZ") || 
      text.includes("CEMIG") || 
      text.includes("COPASA") || 
      text.includes("AGUA") || 
      text.includes("TELEFONE") || 
      text.includes("INTERNET") || 
      text.includes("ALUGUEL") || 
      text.includes("TARIFA") || 
      text.includes("TAXA MANUT") || 
      text.includes("CONDOM") ||
      text.includes("SEGURO")
    ) {
      return 'Despesa Fixa';
    }

    if (isIncome) {
      return 'Aluno';
    }

    if (text.includes("FORNEC") || text.includes("PAPELARIA") || text.includes("MATERIAIS") || text.includes("MERCADO")) {
      return 'Fornecedor';
    }

    return 'Outros';
  };

  // Tenta associar o nome do aluno se encontrar o nome no histórico
  const autoDetectName = (desc: string, isIncome: boolean): string => {
    const text = desc.toUpperCase();
    if (isIncome) {
      // Procura nomes de alunos cadastrados no texto
      for (const st of students) {
        const parts = st.name.trim().toUpperCase().split(" ");
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
        if (firstName.length >= 3 && text.includes(firstName) && (lastName.length < 3 || text.includes(lastName))) {
          return st.name;
        }
      }
      return "Mensalidade / Aluno";
    }
    return "Fornecedor / Despesa";
  };

  // Parser para OFX
  const parseOFXContent = (content: string): ImportedCandidate[] => {
    const results: ImportedCandidate[] = [];
    const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const block = match[1];
      const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
      const amountMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
      const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i) || block.match(/<NAME>([^<\r\n]+)/i);

      if (dateMatch && amountMatch) {
        const rawAmt = parseFloat(amountMatch[1].trim());
        const dateStr = dateMatch[1];
        const y = dateStr.substring(0, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        const isoDate = `${y}-${m}-${d}`;
        const desc = memoMatch ? memoMatch[1].trim() : "Transação Bancária";
        const isIncome = rawAmt > 0;
        const absVal = Math.abs(rawAmt);

        results.push({
          id: `ofx-${Date.now()}-${results.length}-${Math.random().toString(36).substr(2, 4)}`,
          selected: true,
          date: isoDate,
          description: desc,
          value: absVal,
          type: isIncome ? 'Entrada' : 'Saída',
          category: autoDetectCategory(desc, isIncome),
          name: autoDetectName(desc, isIncome),
        });
      }
    }

    return results;
  };

  // Parser para Excel (.xlsx, .xls, .csv)
  const parseSpreadsheetContent = (buffer: ArrayBuffer): ImportedCandidate[] => {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawRows.length === 0) return [];

    // Localizar cabeçalho
    let headerIdx = -1;
    let colDate = -1;
    let colDesc = -1;
    let colValue = -1;
    let colType = -1; // Opcional (D/C)
    let colCredit = -1; // Opcional (coluna separada de crédito)
    let colDebit = -1; // Opcional (coluna separada de débito)

    for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
      const row = rawRows[i].map(c => String(c).trim().toLowerCase());
      const dIdx = row.findIndex(c => c.includes("data") || c === "dt" || c.includes("dia"));
      const descIdx = row.findIndex(c => c.includes("hist") || c.includes("descri") || c.includes("lançam") || c.includes("lancam") || c.includes("detalhe"));
      const valIdx = row.findIndex(c => c.includes("valor") || c === "vl" || c.includes("montante"));
      const credIdx = row.findIndex(c => c.includes("crédito") || c.includes("credito") || c === "entradas");
      const debIdx = row.findIndex(c => c.includes("débito") || c.includes("debito") || c === "saídas" || c === "saidas");
      const typeIdx = row.findIndex(c => c.includes("tipo") || c === "d/c" || c === "c/d");

      if (dIdx !== -1 && (descIdx !== -1 || valIdx !== -1 || credIdx !== -1)) {
        headerIdx = i;
        colDate = dIdx;
        colDesc = descIdx !== -1 ? descIdx : 1;
        colValue = valIdx;
        colType = typeIdx;
        colCredit = credIdx;
        colDebit = debIdx;
        break;
      }
    }

    // Se não encontrou cabeçalho explícito, assume colunas 0=Data, 1=Histórico, 2=Valor
    if (headerIdx === -1) {
      headerIdx = 0;
      colDate = 0;
      colDesc = 1;
      colValue = 2;
    }

    const results: ImportedCandidate[] = [];

    for (let r = headerIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;

      const rawDateCell = row[colDate];
      if (!rawDateCell) continue;

      // Tratar Data
      let parsedDate = "";
      if (rawDateCell instanceof Date && isValid(rawDateCell)) {
        parsedDate = format(rawDateCell, "yyyy-MM-dd");
      } else {
        const dateStr = String(rawDateCell).trim();
        // formatos comuns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
        const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
        if (dmyMatch) {
          const day = dmyMatch[1].padStart(2, '0');
          const month = dmyMatch[2].padStart(2, '0');
          let year = dmyMatch[3];
          if (year.length === 2) year = `20${year}`;
          parsedDate = `${year}-${month}-${day}`;
        } else if (dateStr.match(/^\d{4}\-\d{2}\-\d{2}/)) {
          parsedDate = dateStr.substring(0, 10);
        }
      }

      if (!parsedDate) continue;

      const desc = colDesc !== -1 && row[colDesc] ? String(row[colDesc]).trim() : "Lançamento Bancário";
      
      // Ignorar linhas de saldo ou totalizador
      const upperDesc = desc.toUpperCase();
      if (upperDesc.includes("SALDO ANTERIOR") || upperDesc.includes("SALDO ATUAL") || upperDesc.includes("SALDO DO DIA") || upperDesc.includes("TOTAL ")) {
        continue;
      }

      // Tratar Valor e Tipo
      let value = 0;
      let isIncome = true;

      if (colCredit !== -1 && colDebit !== -1) {
        const rawCred = row[colCredit];
        const rawDeb = row[colDebit];
        if (rawCred && parseFloat(String(rawCred).replace(/\./g, '').replace(',', '.')) > 0) {
          value = Math.abs(parseFloat(String(rawCred).replace(/\./g, '').replace(',', '.')));
          isIncome = true;
        } else if (rawDeb && parseFloat(String(rawDeb).replace(/\./g, '').replace(',', '.')) > 0) {
          value = Math.abs(parseFloat(String(rawDeb).replace(/\./g, '').replace(',', '.')));
          isIncome = false;
        }
      } else if (colValue !== -1) {
        const valCell = row[colValue];
        if (typeof valCell === 'number') {
          isIncome = valCell >= 0;
          value = Math.abs(valCell);
        } else if (valCell) {
          let str = String(valCell).replace(/R\$/g, '').trim();
          // Detectar sinal
          if (str.includes("(") && str.includes(")")) {
            isIncome = false;
            str = str.replace(/[()]/g, '');
          } else if (str.startsWith("-") || str.endsWith("-") || str.toUpperCase().endsWith("D")) {
            isIncome = false;
            str = str.replace(/[\-D]/gi, '');
          } else if (str.startsWith("+") || str.toUpperCase().endsWith("C")) {
            isIncome = true;
            str = str.replace(/[\+C]/gi, '');
          }

          // Converter formato brasileiro 1.250,50 para float
          if (str.includes(",") && str.includes(".")) {
            str = str.replace(/\./g, '').replace(',', '.');
          } else if (str.includes(",")) {
            str = str.replace(',', '.');
          }
          const num = parseFloat(str.trim());
          if (!isNaN(num)) {
            value = Math.abs(num);
          }
        }
      }

      // Checagem de coluna D/C
      if (colType !== -1 && row[colType]) {
        const typeStr = String(row[colType]).trim().toUpperCase();
        if (typeStr === 'D' || typeStr.includes("DEB")) isIncome = false;
        if (typeStr === 'C' || typeStr.includes("CRED")) isIncome = true;
      }

      if (value <= 0) continue;

      results.push({
        id: `row-${r}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        selected: true,
        date: parsedDate,
        description: desc,
        value: Number(value.toFixed(2)),
        type: isIncome ? 'Entrada' : 'Saída',
        category: autoDetectCategory(desc, isIncome),
        name: autoDetectName(desc, isIncome),
      });
    }

    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      let candidates: ImportedCandidate[] = [];
      const lower = file.name.toLowerCase();

      if (lower.endsWith('.ofx') || lower.endsWith('.xml')) {
        const text = await file.text();
        candidates = parseOFXContent(text);
      } else {
        const buffer = await file.arrayBuffer();
        candidates = parseSpreadsheetContent(buffer);
      }

      if (candidates.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhuma transação encontrada",
          description: "O arquivo foi lido, mas não encontramos registros válidos. Verifique se é um extrato do Sicoob."
        });
        setIsLoading(false);
        return;
      }

      // Cruzar com transações existentes no Supabase para alertar duplicatas
      const existingKeySet = new Set(
        transactions
          .filter(t => t.type !== 'Apagado')
          .map(t => `${t.date}_${t.value.toFixed(2)}_${t.type}`)
      );

      const flagged = candidates.map(c => {
        const key = `${c.date}_${c.value.toFixed(2)}_${c.type}`;
        const isDup = existingKeySet.has(key);
        return {
          ...c,
          isDuplicate: isDup,
          selected: !isDup // Por padrão desmarca possíveis duplicatas
        };
      });

      setParsedItems(flagged);
      toast({
        title: "Extrato processado com sucesso!",
        description: `${flagged.length} lançamentos encontrados no extrato.`
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erro ao processar arquivo",
        description: err.message || "Falha na leitura da planilha."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setParsedItems(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const toggleItem = (id: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const updateItemField = (id: string, field: keyof ImportedCandidate, value: any) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Filtragem dos itens exibidos na tabela de prévia
  const displayedItems = useMemo(() => {
    return parsedItems.filter(item => {
      if (filterType === 'entradas' && item.type !== 'Entrada') return false;
      if (filterType === 'saidas' && item.type !== 'Saída') return false;
      if (filterType === 'duplicadas' && !item.isDuplicate) return false;
      if (filterType === 'selecionadas' && !item.selected) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return item.description.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [parsedItems, filterType, searchTerm]);

  const summary = useMemo(() => {
    const selected = parsedItems.filter(i => i.selected);
    const incomeTotal = selected.filter(i => i.type === 'Entrada').reduce((a, b) => a + b.value, 0);
    const outcomeTotal = selected.filter(i => i.type === 'Saída').reduce((a, b) => a + b.value, 0);
    const duplicateCount = parsedItems.filter(i => i.isDuplicate).length;

    return {
      totalSelected: selected.length,
      incomeTotal,
      outcomeTotal,
      duplicateCount,
      net: incomeTotal - outcomeTotal,
    };
  }, [parsedItems]);

  const handleConfirmImport = async () => {
    const toImport = parsedItems.filter(i => i.selected);
    if (toImport.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum item selecionado",
        description: "Selecione ao menos um lançamento para importar."
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;

    try {
      for (const item of toImport) {
        await addTransaction({
          date: item.date,
          description: item.description,
          type: item.type,
          value: item.value,
          category: item.category,
          name: item.name,
          paymentMethod: 'Pix / Banco',
        });
        successCount++;
      }

      toast({
        title: "Importação concluída!",
        description: `${successCount} transações foram adicionadas ao financeiro do Hangout Club com sucesso.`
      });

      onImportComplete?.();
      handleClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: `Importados ${successCount} itens antes da falha: ${err.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-primary font-headline">
                  Importar Extrato Bancário (Sicoob / Excel / OFX)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Suba o extrato exportado do banco para lançar automaticamente suas receitas e despesas.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Seção de Upload */}
          {parsedItems.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 hover:border-primary/80 bg-primary/5 hover:bg-primary/10 transition-all rounded-3xl p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group"
            >
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".xlsx,.xls,.csv,.ofx,.xml" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {isLoading ? "Processando arquivo..." : "Clique ou arraste o arquivo do extrato"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Formatos aceitos: <strong>Excel (.xlsx, .xls)</strong>, <strong>CSV (.csv)</strong> ou <strong>OFX (.ofx)</strong> exportados do Sicoob ou de qualquer banco.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] bg-background">Sicoob Internet Banking</Badge>
                <Badge variant="outline" className="text-[10px] bg-background">Prevenção de Duplicadas</Badge>
                <Badge variant="outline" className="text-[10px] bg-background">Classificação com IA</Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo do Arquivo & Filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 sm:p-4 rounded-2xl border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary truncate max-w-[240px] sm:max-w-md">{fileName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {summary.totalSelected} selecionados de {parsedItems.length} transações
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="h-8 text-xs font-semibold"
                  >
                    Trocar Arquivo
                  </Button>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept=".xlsx,.xls,.csv,.ofx,.xml" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Cards de Métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Entradas</p>
                  <p className="text-base sm:text-lg font-black text-green-600 mt-0.5">
                    {formatCurrency(summary.incomeTotal)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Saídas</p>
                  <p className="text-base sm:text-lg font-black text-red-500 mt-0.5">
                    {formatCurrency(summary.outcomeTotal)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Saldo Líquido</p>
                  <p className={cn("text-base sm:text-lg font-black mt-0.5", summary.net >= 0 ? "text-green-600" : "text-red-500")}>
                    {formatCurrency(summary.net)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Duplicadas Evitadas</p>
                  <p className="text-base sm:text-lg font-black text-amber-600 mt-0.5">
                    {summary.duplicateCount}
                  </p>
                </div>
              </div>

              {/* Barra de Filtro e Busca */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-xs w-[140px] sm:w-[160px]">
                      <SelectValue placeholder="Filtro" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="todos">Todos ({parsedItems.length})</SelectItem>
                      <SelectItem value="selecionadas">Selecionadas ({summary.totalSelected})</SelectItem>
                      <SelectItem value="entradas">Entradas</SelectItem>
                      <SelectItem value="saidas">Saídas</SelectItem>
                      <SelectItem value="duplicadas">Duplicadas ({summary.duplicateCount})</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input 
                    placeholder="Buscar histórico..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 text-xs max-w-[200px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSelectAll(true)}
                    className="h-7 text-xs text-primary font-semibold"
                  >
                    Marcar Todas
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSelectAll(false)}
                    className="h-7 text-xs text-muted-foreground font-semibold"
                  >
                    Desmarcar Todas
                  </Button>
                </div>
              </div>

              {/* Tabela de Pré-visualização e Edição Rápida */}
              <div className="rounded-xl border overflow-hidden max-h-[46vh] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow className="text-[11px]">
                      <TableHead className="w-10 text-center">
                        <Checkbox 
                          checked={summary.totalSelected === parsedItems.length && parsedItems.length > 0} 
                          onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead className="w-24">Data</TableHead>
                      <TableHead>Histórico / Lançamento</TableHead>
                      <TableHead className="w-28">Tipo</TableHead>
                      <TableHead className="w-32">Categoria</TableHead>
                      <TableHead className="w-28 text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedItems.length > 0 ? (
                      displayedItems.map((item) => (
                        <TableRow 
                          key={item.id} 
                          className={cn(
                            "text-xs transition-colors",
                            item.isDuplicate && "bg-amber-500/5 hover:bg-amber-500/10",
                            !item.selected && "opacity-50"
                          )}
                        >
                          <TableCell className="text-center p-2">
                            <Checkbox 
                              checked={item.selected} 
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-[11px] p-2 whitespace-nowrap">
                            {format(parseISO(item.date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-primary truncate max-w-xs sm:max-w-md">{item.description}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.isDuplicate && (
                                  <Badge variant="outline" className="text-[9px] h-4 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                    Já existe no sistema
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground">{item.name}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <Select 
                              value={item.type} 
                              onValueChange={(val: 'Entrada' | 'Saída') => updateItemField(item.id, 'type', val)}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="text-xs">
                                <SelectItem value="Entrada">Entrada</SelectItem>
                                <SelectItem value="Saída">Saída</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Select 
                              value={item.category} 
                              onValueChange={(val) => updateItemField(item.id, 'category', val)}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="text-xs">
                                <SelectItem value="Aluno">Aluno</SelectItem>
                                <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                                <SelectItem value="Despesa Fixa">Despesa Fixa</SelectItem>
                                <SelectItem value="Outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-black p-2 whitespace-nowrap">
                            <span className={item.type === 'Entrada' ? "text-green-600" : "text-red-500"}>
                              {item.type === 'Entrada' ? '+' : '-'} {formatCurrency(item.value)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                          Nenhum lançamento corresponde ao filtro.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t bg-muted/10 flex flex-row items-center justify-between sm:justify-between">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleClose} 
            disabled={isSaving}
            className="text-xs"
          >
            Cancelar
          </Button>

          {parsedItems.length > 0 && (
            <Button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSaving || summary.totalSelected === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md shadow-emerald-600/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importando ({summary.totalSelected})...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmar Importação de {summary.totalSelected} itens</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
