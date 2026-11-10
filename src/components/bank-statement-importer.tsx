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
import { Transaction, FixedExpense } from "@/types";
import { uploadFileToStorage } from "@/lib/supabase/storage";

export interface ImportedCandidate {
  id: string;
  selected: boolean;
  date: string; // YYYY-MM-DD
  description: string;
  complementaryInfo?: string; // Informações complementares da planilha/extrato
  documentNumber?: string;
  value: number;
  type: 'Entrada' | 'Saída';
  category: 'Receita' | 'Custo' | 'Despesa' | 'Investimento' | 'Gasto';
  name: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  matchedFixedExpenseId?: string; // ID da despesa fixa vinculada para dar baixa
  originalFixedExpenseValue?: number; // Valor previsto cadastrado antes do extrato
}

interface BankStatementImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function BankStatementImporter({ isOpen, onClose, onImportComplete }: BankStatementImporterProps) {
  const { transactions, addTransaction, students, fixedExpenses, updateFixedExpense, users } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ImportedCandidate[]>([]);
  const [filterType, setFilterType] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Lista de despesas fixas pendentes no sistema para facilitar seleção de vínculo
  const pendingFixedExpenses = useMemo(() => {
    return (fixedExpenses || []).filter(f => f.status === 'Pendente');
  }, [fixedExpenses]);

  const resetState = () => {
    setFileName("");
    setSelectedFile(null);
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

  // Localiza automaticamente se um débito corresponde a uma despesa fixa cadastrada
  const findMatchingFixedExpense = (
    desc: string,
    complement: string = "",
    dateStr: string,
    excludedIds?: Set<string>
  ): FixedExpense | undefined => {
    if (!fixedExpenses || fixedExpenses.length === 0) return undefined;

    const [yStr, mStr] = dateStr.split('-');
    const itemYear = parseInt(yStr, 10);
    const itemMonth = parseInt(mStr, 10);

    const fullText = `${desc} ${complement}`.toUpperCase();

    // 1. Prioriza despesas fixas cadastradas para o mês correspondente
    const monthExpenses = fixedExpenses.filter(f => 
      f.status !== 'Apagado' && f.month === itemMonth && f.year === itemYear
    );

    const pool = monthExpenses.length > 0 
      ? monthExpenses 
      : fixedExpenses.filter(f => f.status !== 'Apagado');

    for (const fe of pool) {
      // Pula despesas fixas que já foram vinculadas a outro item nesta importação
      if (excludedIds?.has(fe.id)) continue;

      const feUpper = fe.description.toUpperCase().trim();
      // Remove termos genéricos para encontrar a palavra-chave (ex: "Salário Maria" -> "MARIA")
      const keyword = feUpper
        .replace(/\b(SALÁRIO|SALARIO|PGTO|PAGAMENTO|DESPESA|FIXA|DE|DA|DO|CONTA|TAXA|MENSAL)\b/gi, '')
        .trim();

      if (keyword.length >= 3 && fullText.includes(keyword)) {
        return fe;
      }

      if (feUpper.length >= 3 && fullText.includes(feUpper)) {
        return fe;
      }

      // Concessionárias e contas comuns
      if (
        (fullText.includes("CEMIG") && feUpper.includes("CEMIG")) ||
        (fullText.includes("COPASA") && feUpper.includes("COPASA")) ||
        (fullText.includes("ALUGUEL") && feUpper.includes("ALUGUEL")) ||
        (fullText.includes("INTERNET") && feUpper.includes("INTERNET")) ||
        (fullText.includes("ENERGIA") && (feUpper.includes("ENERGIA") || feUpper.includes("LUZ"))) ||
        (fullText.includes("TELEFONE") && feUpper.includes("TELEFONE"))
      ) {
        return fe;
      }
    }

    return undefined;
  };

  // Sugere categoria gerencial inteligente: Receita, Custo, Despesa, Investimento, Gasto
  const autoDetectCategory = (
    desc: string, 
    complement: string, 
    isIncome: boolean,
    hasMatchedFixed: boolean = false
  ): 'Receita' | 'Custo' | 'Despesa' | 'Investimento' | 'Gasto' => {
    if (isIncome) {
      return 'Receita';
    }

    if (hasMatchedFixed) {
      return 'Despesa';
    }

    const text = `${desc} ${complement}`.toUpperCase();

    // 1. Aplicações Financeiras, Reformas e Equipamentos/Móveis -> Sempre INVESTIMENTO
    // Ex: "Aplicação RDC", "RDC", "CDB", "LCI", "Fundo", reformas, obras, móveis, tatames, computadores
    const isInvestment = (
      text.includes("APLICACAO") ||
      text.includes("APLICAÇÃO") ||
      text.includes("RDC") ||
      text.includes("CDB") ||
      text.includes("LCI") ||
      text.includes("LCA") ||
      text.includes("INVESTIMENTO") ||
      text.includes("REFORMA") ||
      text.includes("EQUIPAMENTO") ||
      text.includes("QUADRO") ||
      text.includes("TATAME") ||
      text.includes("COMPUTADOR") ||
      text.includes("NOTEBOOK") ||
      text.includes("AR CONDICIONADO") ||
      text.includes("AR-CONDICIONADO") ||
      text.includes("MOBILIA") ||
      /\bM[OÓ]VEIS\b/.test(text) ||
      /\bM[OÓ]VEL\b/.test(text) ||
      (/\bOBRAS?\b/.test(text) && !text.includes("COBRANCA") && !text.includes("COBRANÇA")) ||
      text.includes("CONSTRUCAO") ||
      text.includes("CONSTRUÇÃO") ||
      text.includes("PATRIMONIO") ||
      text.includes("PATRIMÔNIO")
    );

    if (isInvestment) {
      return 'Investimento';
    }

    // 2. Custos Operacionais / Pessoal Direto -> CUSTO
    // - Marketing (Pagamentos Marketing, Meta, Instagram, Google Ads, Nina Turbinar)
    // - Pró-labore dos sócios (Transferência Intercredis, Sidney Xisto, Patrícia Lara)
    // - Professores (Maisa, Gabriela, etc.)
    // - Secretaria (Célia)
    const isCusto = (
      text.includes("MARKETING") ||
      text.includes("META PLATFORMS") ||
      text.includes("FACEBOOK") ||
      text.includes("INSTAGRAM") ||
      text.includes("GOOGLE ADS") ||
      text.includes("TURBINAR REDE") ||
      text.includes("ANA CAROLINA") ||
      text.includes("NINA") ||
      text.includes("INTERCREDIS") ||
      text.includes("SIDNEY") ||
      text.includes("PATRICIA") ||
      text.includes("PATRÍCIA") ||
      text.includes("PROLABORE") ||
      text.includes("PRO-LABORE") ||
      text.includes("PRÓ-LABORE") ||
      text.includes("PRO LABORE") ||
      text.includes("MAISA") ||
      text.includes("MAÍSA") ||
      text.includes("GABRIEL") ||
      text.includes("GABI") ||
      text.includes("GABRILA") ||
      text.includes("CELIA") ||
      text.includes("CÉLIA") ||
      text.includes("SECRETARIA") ||
      text.includes("SECRETÁRIA") ||
      text.includes("PROFESSOR") ||
      text.includes("INSTRUTOR") ||
      text.includes("AULA") ||
      text.includes("APOSTILA") ||
      text.includes("DIDATICO") ||
      text.includes("DIDÁTICO") ||
      text.includes("UNIFORME") ||
      text.includes("SALARIO PROF") ||
      text.includes("SALÁRIO PROF")
    ) && !text.includes("BOLO P/MAISA");

    if (isCusto) {
      return 'Custo';
    }

    // 3. Gastos de Consumo, Lanches e Materiais -> GASTO
    // Pão, bala, bolo e paçocas, Copos, Guardanapo, Suco, milho, Sabão, Açúcar, Resma, Papelaria, Detergente, produtos de limpeza e Comidas
    const isGasto = (
      text.includes("PAO") ||
      text.includes("PÃO") ||
      text.includes("PADARIA") ||
      text.includes("CENTER PAO") ||
      text.includes("ALESSANDRA FERREIRA") ||
      text.includes("BALA") ||
      text.includes("BALAS") ||
      text.includes("BOLO") ||
      text.includes("BOLOS") ||
      text.includes("PACOCA") ||
      text.includes("PAÇOCA") ||
      text.includes("BISCOITO") ||
      text.includes("PIPOCA") ||
      text.includes("BOMBOM") ||
      text.includes("DOCE") ||
      text.includes("DOCES") ||
      text.includes("PIRULITO") ||
      text.includes("COPO") ||
      text.includes("COPOS") ||
      text.includes("GUARDANAPO") ||
      text.includes("GUARD.") ||
      text.includes("SUCO") ||
      text.includes("SUCOS") ||
      text.includes("REFRI") ||
      text.includes("REFRIGERANTE") ||
      text.includes("MILHO") ||
      text.includes("SABAO") ||
      text.includes("SABÃO") ||
      text.includes("ACUCAR") ||
      text.includes("AÇUCAR") ||
      text.includes("AÇÚCAR") ||
      text.includes("RESMA") ||
      text.includes("PAPELARIA") ||
      text.includes("SÃO PAULO") ||
      text.includes("SAO PAULO") ||
      text.includes("INFOBOX") ||
      text.includes("SULFITE") ||
      text.includes("CARTOLINA") ||
      text.includes("EVA") ||
      text.includes("PINCEL") ||
      text.includes("TINTA") ||
      text.includes("CANETA") ||
      text.includes("ADESIVO") ||
      text.includes("FITA") ||
      text.includes("DETERGENTE") ||
      text.includes("LIMPEZA") ||
      text.includes("LIMPESA") ||
      text.includes("DESINFETANTE") ||
      text.includes("HIGIENICO") ||
      text.includes("HIGIÊNICO") ||
      text.includes("PAPEL TOALHA") ||
      text.includes("PAPELTOALHA") ||
      text.includes("SACO DE LIXO") ||
      text.includes("RODO") ||
      text.includes("COMIDA") ||
      text.includes("COMIDAS") ||
      text.includes("LANCHE") ||
      text.includes("ALIMENTACAO") ||
      text.includes("ALIMENTAÇÃO") ||
      text.includes("SUPERMERCADO") ||
      text.includes("SUPERM DO IRMAO") ||
      text.includes("FRUTAS") ||
      text.includes("SACOLAO") ||
      text.includes("SACOLÃO") ||
      text.includes("EMBALAGEM") ||
      text.includes("EMBALAGENS") ||
      text.includes("SALGADINHO") ||
      text.includes("MARGARINA") ||
      text.includes("LEITE") ||
      text.includes("ACHOCOL") ||
      text.includes("BISNAGA") ||
      text.includes("ROSQUINHA") ||
      text.includes("OVOS") ||
      text.includes("L.COND") ||
      text.includes("FARMACIA") ||
      text.includes("PRESENTE") ||
      text.includes("AVATIM") ||
      text.includes("EXTENSÃO")
    );

    if (isGasto) {
      return 'Gasto';
    }

    // 4. Outros colaboradores cadastrados (Professores -> Custo; Outros -> Custo/Despesa)
    for (const u of (users || [])) {
      const uName = (u.nickname || '').trim().toUpperCase();
      if (!uName) continue;
      const firstName = uName.split(' ')[0];
      if (firstName.length >= 3 && text.includes(firstName)) {
        return u.role === 'Professor' ? 'Custo' : 'Despesa';
      }
    }

    // 5. Despesas Operacionais, Contas, Sistema, Tarifas, Impostos -> DESPESA
    // Contador, Sistema, Aluguel, energia, internet, agua, condominio, Tarifas, FGTS
    return 'Despesa';
  };

  // Tenta associar o nome do aluno se encontrar o nome no histórico ou nas informações complementares
  const autoDetectName = (desc: string, complement: string, isIncome: boolean): string => {
    const text = `${desc} ${complement}`.toUpperCase();
    if (isIncome) {
      // Procura nomes de alunos ou responsáveis cadastrados no texto
      for (const st of students) {
        const parts = st.name.trim().toUpperCase().split(" ");
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
        if (firstName.length >= 3 && text.includes(firstName) && (lastName.length < 3 || text.includes(lastName))) {
          return st.name;
        }

        if (st.guardianName) {
          const gParts = st.guardianName.trim().toUpperCase().split(" ");
          const gFirst = gParts[0];
          const gLast = gParts.length > 1 ? gParts[gParts.length - 1] : "";
          if (gFirst.length >= 3 && text.includes(gFirst) && (gLast.length < 3 || text.includes(gLast))) {
            return st.name;
          }
        }
      }
      return complement || "Mensalidade / Aluno";
    }

    // Identificação inteligente de favorecidos para saídas:
    if (text.includes("SIDNEY")) {
      return "Pró-labore - Sidney Xisto";
    }
    if (text.includes("PATRICIA") || text.includes("PATRÍCIA")) {
      return "Pró-labore - Patrícia Lara";
    }
    if (text.includes("INTERCREDIS") || text.includes("TRANSF POUPANCA") || text.includes("TRANSF POUPANÇA")) {
      return "Pró-labore Sócios (Intercredis)";
    }
    if (text.includes("APLICACAO") || text.includes("APLICAÇÃO") || text.includes("RDC")) {
      return "Aplicação Financeira (RDC)";
    }
    if (text.includes("CONTADOR") || text.includes("CONTABIL")) {
      return "Contabilidade / Contador";
    }
    if (text.includes("FGTS")) {
      return "FGTS";
    }
    if (text.includes("SIMPLES")) {
      return "Simples Nacional";
    }
    if (text.includes("RECEITA") || text.includes("DARF")) {
      return "Receita Federal (Tributos)";
    }
    if (text.includes("CELIA") || text.includes("CÉLIA")) {
      return "Célia Xisto (Secretaria)";
    }
    if (text.includes("MAISA") || text.includes("MAÍSA")) {
      return "Maísa Gabriele (Professora)";
    }
    if (text.includes("GABRIEL") || text.includes("GABI")) {
      return "Gabriela (Professora)";
    }
    if (text.includes("CEMIG") || text.includes("LUZ") || text.includes("ENERGIA")) {
      return "Cemig (Energia Elétrica)";
    }
    if (text.includes("COPASA") || text.includes("AGUA") || text.includes("ÁGUA")) {
      return "Copasa (Água)";
    }

    // Para saídas gerais: se tiver informações complementares (ex: CENTER PAO LTDA CARATINGA BRA), usa como favorecido/fornecedor
    if (complement) {
      return complement;
    }

    return "Fornecedor / Despesa";
  };

  // Parser para OFX
  const parseOFXContent = (content: string): ImportedCandidate[] => {
    const results: ImportedCandidate[] = [];
    const matchedFixedIds = new Set<string>();
    const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const block = match[1];
      const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
      const amountMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
      const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
      const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);
      const checkNumMatch = block.match(/<CHECKNUM>([^<\r\n]+)/i);

      if (dateMatch && amountMatch) {
        const rawAmt = parseFloat(amountMatch[1].trim());
        const dateStr = dateMatch[1];
        const y = dateStr.substring(0, 4);
        const m = dateStr.substring(4, 6);
        const d = dateStr.substring(6, 8);
        const isoDate = `${y}-${m}-${d}`;

        const memoStr = memoMatch ? memoMatch[1].trim() : "";
        const nameStr = nameMatch ? nameMatch[1].trim() : "";
        let desc = nameStr || memoStr || "Transação Bancária";
        let comp = "";

        if (nameStr && memoStr && nameStr !== memoStr) {
          desc = nameStr;
          comp = memoStr;
        }

        const isIncome = rawAmt > 0;
        const absVal = Math.abs(rawAmt);
        const docNum = checkNumMatch ? checkNumMatch[1].trim() : undefined;
        const matchedFixed = !isIncome ? findMatchingFixedExpense(desc, comp, isoDate, matchedFixedIds) : undefined;
        if (matchedFixed) {
          matchedFixedIds.add(matchedFixed.id);
        }
        const detectedCat = autoDetectCategory(desc, comp, isIncome, !!matchedFixed);

        results.push({
          id: `ofx-${Date.now()}-${results.length}-${Math.random().toString(36).substr(2, 4)}`,
          selected: true,
          date: isoDate,
          description: desc,
          complementaryInfo: comp || undefined,
          documentNumber: docNum,
          value: absVal,
          type: isIncome ? 'Entrada' : 'Saída',
          category: detectedCat,
          name: autoDetectName(desc, comp, isIncome),
          matchedFixedExpenseId: matchedFixed?.id,
          originalFixedExpenseValue: matchedFixed?.value
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
    let colComplement = -1;
    let colDoc = -1;
    let colValue = -1;
    let colType = -1; // Opcional (D/C)
    let colCredit = -1; // Opcional (coluna separada de crédito)
    let colDebit = -1; // Opcional (coluna separada de débito)

    for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
      const row = rawRows[i].map(c => String(c).trim().toLowerCase());
      const dIdx = row.findIndex(c => c.includes("data") || c === "dt" || c.includes("dia"));
      
      const descIdx = row.findIndex(c => 
        (c.includes("histórico") || c.includes("historico") || c.includes("descri") || c.includes("lançam") || c.includes("lancam") || c === "hist") &&
        !c.includes("complem")
      );

      const compIdx = row.findIndex(c => 
        c.includes("complem") || 
        c.includes("informações") || 
        c.includes("informacoes") || 
        c.includes("info.") || 
        c.includes("info ") || 
        c === "info" ||
        c.includes("observa")
      );

      const docIdx = row.findIndex(c => 
        c.includes("doc") || c.includes("documento") || c.includes("número") || c.includes("numero")
      );

      const valIdx = row.findIndex(c => c.includes("valor") || c === "vl" || c.includes("montante"));
      const credIdx = row.findIndex(c => c.includes("crédito") || c.includes("credito") || c === "entradas");
      const debIdx = row.findIndex(c => c.includes("débito") || c.includes("debito") || c === "saídas" || c === "saidas");
      const typeIdx = row.findIndex(c => c.includes("tipo") || c === "d/c" || c === "c/d");

      if (dIdx !== -1 && (descIdx !== -1 || valIdx !== -1 || credIdx !== -1)) {
        headerIdx = i;
        colDate = dIdx;
        colDesc = descIdx !== -1 ? descIdx : 1;
        colComplement = compIdx;
        colDoc = docIdx;
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
    const matchedFixedIds = new Set<string>();

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
      const rawComplement = colComplement !== -1 && row[colComplement] ? String(row[colComplement]).trim() : "";
      const cleanComplement = rawComplement && rawComplement !== "-" ? rawComplement : "";
      const rawDoc = colDoc !== -1 && row[colDoc] ? String(row[colDoc]).trim() : "";
      const cleanDoc = rawDoc && rawDoc !== "-" ? rawDoc : "";
      
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

      const matchedFixed = !isIncome ? findMatchingFixedExpense(desc, cleanComplement, parsedDate, matchedFixedIds) : undefined;
      if (matchedFixed) {
        matchedFixedIds.add(matchedFixed.id);
      }
      const detectedCat = autoDetectCategory(desc, cleanComplement, isIncome, !!matchedFixed);

      results.push({
        id: `row-${r}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        selected: true,
        date: parsedDate,
        description: desc,
        complementaryInfo: cleanComplement || undefined,
        documentNumber: cleanDoc || undefined,
        value: Number(value.toFixed(2)),
        type: isIncome ? 'Entrada' : 'Saída',
        category: detectedCat,
        name: autoDetectName(desc, cleanComplement, isIncome),
        matchedFixedExpenseId: matchedFixed?.id,
        originalFixedExpenseValue: matchedFixed?.value
      });
    }

    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
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

      // Cruzar com transações existentes no Supabase e Despesas Fixas para alertar duplicatas
      const existingKeySet = new Set(
        transactions
          .filter(t => t.type !== 'Apagado')
          .map(t => `${t.date}_${t.value.toFixed(2)}_${t.type}`)
      );

      const flagged = candidates.map(c => {
        const key = `${c.date}_${c.value.toFixed(2)}_${c.type}`;
        const isTxDup = existingKeySet.has(key);

        // Se tem despesa fixa vinculada
        if (c.matchedFixedExpenseId) {
          const fe = (fixedExpenses || []).find(f => f.id === c.matchedFixedExpenseId);
          if (fe && fe.status === 'Pago') {
            return {
              ...c,
              category: 'Despesa' as const,
              isDuplicate: true,
              duplicateReason: `Despesa Fixa "${fe.description}" já foi quitada neste mês.`,
              selected: false // Previne duplicação de despesa fixa já paga
            };
          }
        }

        return {
          ...c,
          isDuplicate: isTxDup,
          duplicateReason: isTxDup ? "Já existe transação idêntica no sistema." : undefined,
          selected: !isTxDup
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

  const updateItemCategory = (id: string, category: 'Receita' | 'Custo' | 'Despesa' | 'Investimento' | 'Gasto') => {
    setParsedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newType: 'Entrada' | 'Saída' = category === 'Receita' ? 'Entrada' : 'Saída';
      return {
        ...item,
        category,
        type: newType,
        matchedFixedExpenseId: (category === 'Despesa' || category === 'Custo') ? item.matchedFixedExpenseId : undefined
      };
    }));
  };

  const updateItemFixedMatch = (id: string, fixedId?: string) => {
    const fe = (fixedExpenses || []).find(f => f.id === fixedId);
    setParsedItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        matchedFixedExpenseId: fixedId,
        originalFixedExpenseValue: fe?.value
      };
    }));
  };

  const updateItemField = (id: string, field: keyof ImportedCandidate, value: any) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Filtragem dos itens exibidos na tabela de prévia
  const displayedItems = useMemo(() => {
    return parsedItems.filter(item => {
      if (filterType === 'receitas' && item.category !== 'Receita') return false;
      if (filterType === 'custos' && item.category !== 'Custo') return false;
      if (filterType === 'despesas' && item.category !== 'Despesa') return false;
      if (filterType === 'investimentos' && item.category !== 'Investimento') return false;
      if (filterType === 'gastos' && item.category !== 'Gasto') return false;
      if (filterType === 'entradas' && item.type !== 'Entrada') return false;
      if (filterType === 'saidas' && item.type !== 'Saída') return false;
      if (filterType === 'fixas' && !item.matchedFixedExpenseId) return false;
      if (filterType === 'duplicadas' && !item.isDuplicate) return false;
      if (filterType === 'selecionadas' && !item.selected) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.description.toLowerCase().includes(q) || 
          item.name.toLowerCase().includes(q) ||
          (item.complementaryInfo ? item.complementaryInfo.toLowerCase().includes(q) : false)
        );
      }
      return true;
    });
  }, [parsedItems, filterType, searchTerm]);

  const summary = useMemo(() => {
    const selected = parsedItems.filter(i => i.selected);
    const incomeTotal = selected.filter(i => i.type === 'Entrada').reduce((a, b) => a + b.value, 0);
    const outcomeTotal = selected.filter(i => i.type === 'Saída').reduce((a, b) => a + b.value, 0);
    const duplicateCount = parsedItems.filter(i => i.isDuplicate).length;
    const fixedMatchCount = selected.filter(i => !!i.matchedFixedExpenseId).length;

    return {
      totalSelected: selected.length,
      incomeTotal,
      outcomeTotal,
      duplicateCount,
      fixedMatchCount,
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
    let fixedUpdatedCount = 0;
    let statementFileUrl: string | undefined = undefined;

    try {
      // 1. Faz upload do arquivo do extrato para o Supabase Storage para ficar disponível como anexo
      if (selectedFile) {
        try {
          const uploadRes = await uploadFileToStorage(
            selectedFile,
            'extratos',
            selectedFile.name
          );
          if (uploadRes?.url) {
            statementFileUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          console.error("Erro ao subir arquivo do extrato para o storage:", uploadErr);
        }
      }

      for (const item of toImport) {
        // Se o nome for o padrão genérico e tivermos a informação complementar da empresa/fornecedor, registra ela!
        const finalName = (item.name === "Fornecedor / Despesa" && item.complementaryInfo)
          ? item.complementaryInfo
          : item.name;

        // Se estiver vinculada a uma despesa fixa, dá baixa e ajusta o valor real pago pelo extrato!
        if (item.matchedFixedExpenseId) {
          try {
            await updateFixedExpense(item.matchedFixedExpenseId, {
              status: 'Pago',
              value: item.value, // Atualiza para o valor real que saiu no extrato!
              receiptUrl: statementFileUrl || undefined // Anexa o arquivo à despesa fixa quitada
            });
            fixedUpdatedCount++;
          } catch (e) {
            console.error("Erro ao atualizar despesa fixa:", e);
          }
        }

        await addTransaction({
          date: item.date,
          description: item.description,
          type: item.type,
          value: item.value,
          category: item.category,
          name: finalName,
          receiptUrl: statementFileUrl || undefined, // Anexa o arquivo à transação
          paymentMethod: 'Pix / Banco',
        });
        successCount++;
      }

      toast({
        title: "Importação concluída!",
        description: `${successCount} transações adicionadas (${fixedUpdatedCount} despesas fixas baixadas/atualizadas).`
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
                    <SelectTrigger className="h-8 text-xs w-[150px] sm:w-[170px]">
                      <SelectValue placeholder="Filtro" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="todos">Todos ({parsedItems.length})</SelectItem>
                      <SelectItem value="selecionadas">Selecionadas ({summary.totalSelected})</SelectItem>
                      <SelectItem value="receitas">Receitas</SelectItem>
                      <SelectItem value="custos">Custos</SelectItem>
                      <SelectItem value="despesas">Despesas</SelectItem>
                      <SelectItem value="investimentos">Investimentos</SelectItem>
                      <SelectItem value="gastos">Gastos</SelectItem>
                      <SelectItem value="fixas">Vinculadas a Fixas ({summary.fixedMatchCount})</SelectItem>
                      <SelectItem value="duplicadas">Duplicadas / Quitadas ({summary.duplicateCount})</SelectItem>
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
                      <TableHead className="w-48">Categoria / Vínculo</TableHead>
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
                          <TableCell className="p-2 min-w-0 max-w-[200px] sm:max-w-xs">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-primary text-xs sm:text-sm line-clamp-2 break-words" title={item.description}>
                                  {item.description}
                                </span>
                                {item.documentNumber && (
                                  <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 font-mono text-muted-foreground shrink-0">
                                    Doc: {item.documentNumber}
                                  </Badge>
                                )}
                                {item.isDuplicate && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] h-4 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-normal shrink-0"
                                    title={item.duplicateReason}
                                  >
                                    {item.duplicateReason || "Já existe no sistema"}
                                  </Badge>
                                )}
                              </div>

                              {item.complementaryInfo && (
                                <div className="flex items-start gap-1 text-[11px] text-slate-700 dark:text-slate-200 bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 font-medium max-w-full" title={item.complementaryInfo}>
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground shrink-0 mt-0.5">Info:</span>
                                  <span className="line-clamp-2 break-words leading-tight">
                                    {item.complementaryInfo}
                                  </span>
                                </div>
                              )}

                              {item.name && item.name !== item.complementaryInfo && (
                                <span className="text-[10px] text-muted-foreground line-clamp-2 break-words max-w-full leading-tight" title={item.name}>
                                  {item.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex flex-col gap-1.5">
                              <Select 
                                value={item.category} 
                                onValueChange={(val: 'Receita' | 'Custo' | 'Despesa' | 'Investimento' | 'Gasto') => updateItemCategory(item.id, val)}
                              >
                                <SelectTrigger className={cn(
                                  "h-7 text-[11px] font-bold w-36 shadow-sm",
                                  item.category === 'Receita' && "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300",
                                  item.category === 'Custo' && "text-orange-700 bg-orange-50 dark:bg-orange-950/40 border-orange-300",
                                  item.category === 'Despesa' && "text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300",
                                  item.category === 'Investimento' && "text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-300",
                                  item.category === 'Gasto' && "text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-300"
                                )}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="text-xs">
                                  <SelectItem value="Receita">
                                    <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Receita
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="Custo">
                                    <span className="flex items-center gap-1.5 font-semibold text-orange-600">
                                      <span className="h-2 w-2 rounded-full bg-orange-500" /> Custo
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="Despesa">
                                    <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Despesa
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="Investimento">
                                    <span className="flex items-center gap-1.5 font-semibold text-blue-600">
                                      <span className="h-2 w-2 rounded-full bg-blue-500" /> Investimento
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="Gasto">
                                    <span className="flex items-center gap-1.5 font-semibold text-purple-600">
                                      <span className="h-2 w-2 rounded-full bg-purple-500" /> Gasto
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              {item.type === 'Saída' && (
                                <div className="flex flex-col gap-0.5">
                                  <select
                                    value={item.matchedFixedExpenseId || ""}
                                    onChange={(e) => updateItemFixedMatch(item.id, e.target.value || undefined)}
                                    className="text-[10px] h-6 px-1.5 rounded-lg border border-amber-300/80 bg-background text-foreground max-w-[160px] truncate shadow-sm font-medium"
                                    title="Vincular a uma despesa fixa para dar baixa automática"
                                  >
                                    <option value="">Sem vínculo com fixa</option>
                                    {pendingFixedExpenses.map(fe => {
                                      const isClaimedByAnother = parsedItems.some(
                                        p => p.id !== item.id && p.matchedFixedExpenseId === fe.id
                                      );
                                      return (
                                        <option 
                                          key={fe.id} 
                                          value={fe.id}
                                          disabled={isClaimedByAnother}
                                          className={isClaimedByAnother ? "text-muted-foreground opacity-40 bg-muted/40 font-normal" : "font-medium"}
                                        >
                                          {fe.description} ({formatCurrency(fe.value)}){isClaimedByAnother ? " [Já vinculado]" : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  {item.matchedFixedExpenseId && item.originalFixedExpenseValue !== undefined && item.originalFixedExpenseValue !== item.value && (
                                    <span 
                                      className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold truncate max-w-[160px]"
                                      title={`Ajustará a despesa fixa de ${formatCurrency(item.originalFixedExpenseValue)} para ${formatCurrency(item.value)}`}
                                    >
                                      Ajusta: {formatCurrency(item.originalFixedExpenseValue)} → {formatCurrency(item.value)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
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
                        <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
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
