"use client";

import React, { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PieChart as PieIcon, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers
} from "lucide-react";

interface FinanceInfographicProps {
  categoryTotals: {
    receitas: number;
    custos: number;
    despesas: number;
    investimentos: number;
    gastos: number;
  };
  totals: {
    income: number;
    outcome: number;
    fixed: number;
    initialBalance: number;
    finalBalance: number;
    profit: number;
  };
  periodLabel: string;
}

export function FinanceInfographic({ categoryTotals, totals, periodLabel }: FinanceInfographicProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { receitas, custos, despesas, investimentos, gastos } = categoryTotals;
  const totalSaidas = custos + despesas + investimentos + gastos;

  // Percentuais em relação ao total de saídas
  const pctCustos = totalSaidas > 0 ? (custos / totalSaidas) * 100 : 0;
  const pctDespesas = totalSaidas > 0 ? (despesas / totalSaidas) * 100 : 0;
  const pctInvestimentos = totalSaidas > 0 ? (investimentos / totalSaidas) * 100 : 0;
  const pctGastos = totalSaidas > 0 ? (gastos / totalSaidas) * 100 : 0;

  // Margem Líquida Operacional (Sobra sobre o faturamento)
  const margemLiquida = receitas > 0 ? ((receitas - totalSaidas) / receitas) * 100 : 0;

  // Índice de Cobertura (Receitas / Saídas)
  const indiceCobertura = totalSaidas > 0 ? receitas / totalSaidas : 0;

  // Cálculo dos arcos para o gráfico Donut SVG
  const segments = [
    { name: "Custos", value: custos, pct: pctCustos, color: "#f97316", textClass: "text-orange-500", bgClass: "bg-orange-500" },
    { name: "Despesas", value: despesas, pct: pctDespesas, color: "#f59e0b", textClass: "text-amber-500", bgClass: "bg-amber-500" },
    { name: "Investimentos", value: investimentos, pct: pctInvestimentos, color: "#3b82f6", textClass: "text-blue-500", bgClass: "bg-blue-500" },
    { name: "Gastos", value: gastos, pct: pctGastos, color: "#a855f7", textClass: "text-purple-500", bgClass: "bg-purple-500" },
  ];

  // Coordenadas para Donut SVG (raio 40, centro 50, 50)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let strokeDashOffsetAccumulator = 0;

  return (
    <Card className="card-print border-accent/20 bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm transition-all print:border-none print:shadow-none print:m-0">
      <CardHeader className="p-3 sm:p-4 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
            <PieIcon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
              Infográfico Gerencial de Desempenho
              <span className="text-[10px] font-normal text-muted-foreground">({periodLabel})</span>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs text-muted-foreground">
              Composição orçamentária das 5 categorias e indicadores de saúde financeira.
            </CardDescription>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] sm:text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <>
              <span>Recolher</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <span>Expandir</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </CardHeader>

      {/* Conteúdo do Infográfico (sempre visível na impressão; toggleável na tela) */}
      <div className={cn("p-3 sm:p-5 space-y-4 print:p-2 print:space-y-2", !isOpen && "hidden print:block")}>
        {/* 1. RÉGUA DE DISTRIBUIÇÃO ORÇAMENTÁRIA VISUAL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-accent" /> Distribuição das Saídas
            </span>
            <span className="font-mono text-muted-foreground">
              Total Saídas: <strong>{formatCurrency(totalSaidas)}</strong>
            </span>
          </div>

          {/* Barra de Progresso Segmentada */}
          <div className="h-3.5 sm:h-4 w-full rounded-full overflow-hidden flex bg-muted/40 p-0.5 border shadow-inner">
            {totalSaidas > 0 ? (
              <>
                {pctCustos > 0 && (
                  <div
                    style={{ width: `${pctCustos}%` }}
                    className="h-full bg-orange-500 rounded-l-full transition-all duration-500 relative group"
                    title={`Custos: ${formatCurrency(custos)} (${pctCustos.toFixed(1)}%)`}
                  />
                )}
                {pctDespesas > 0 && (
                  <div
                    style={{ width: `${pctDespesas}%` }}
                    className="h-full bg-amber-500 transition-all duration-500 relative group"
                    title={`Despesas: ${formatCurrency(despesas)} (${pctDespesas.toFixed(1)}%)`}
                  />
                )}
                {pctInvestimentos > 0 && (
                  <div
                    style={{ width: `${pctInvestimentos}%` }}
                    className="h-full bg-blue-500 transition-all duration-500 relative group"
                    title={`Investimentos: ${formatCurrency(investimentos)} (${pctInvestimentos.toFixed(1)}%)`}
                  />
                )}
                {pctGastos > 0 && (
                  <div
                    style={{ width: `${pctGastos}%` }}
                    className="h-full bg-purple-500 rounded-r-full transition-all duration-500 relative group"
                    title={`Gastos: ${formatCurrency(gastos)} (${pctGastos.toFixed(1)}%)`}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center text-[9px] text-muted-foreground">
                Sem saídas registradas neste período
              </div>
            )}
          </div>

          {/* Legenda com percentuais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] sm:text-[11px]">
            <div className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                <span className="font-semibold text-orange-700 dark:text-orange-400">Custos</span>
              </div>
              <span className="font-mono font-bold text-orange-700 dark:text-orange-400">
                {pctCustos.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold text-amber-700 dark:text-amber-400">Despesas</span>
              </div>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                {pctDespesas.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span className="font-semibold text-blue-700 dark:text-blue-400">Investimentos</span>
              </div>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                {pctInvestimentos.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                <span className="font-semibold text-purple-700 dark:text-purple-400">Gastos</span>
              </div>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                {pctGastos.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. GRID DE DIAGNÓSTICO E SAÚDE OPERACIONAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          {/* Card A: Margem Líquida */}
          <div className="p-3 rounded-xl border bg-card/80 flex items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Margem Líquida Operacional
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn(
                  "text-lg sm:text-xl font-black font-mono",
                  margemLiquida >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
                )}>
                  {margemLiquida >= 0 ? `+${margemLiquida.toFixed(1)}%` : `${margemLiquida.toFixed(1)}%`}
                </span>
                <span className="text-[10px] text-muted-foreground">do faturamento</span>
              </div>
              <p className="text-[9.5px] text-muted-foreground mt-0.5">
                {margemLiquida >= 20 ? "Operação altamente sustentável" : margemLiquida >= 0 ? "Caixa positivo no período" : "Atenção: saídas superaram entradas"}
              </p>
            </div>
            <div className={cn(
              "p-2.5 rounded-xl shrink-0",
              margemLiquida >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
            )}>
              {margemLiquida >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>

          {/* Card B: Índice de Cobertura */}
          <div className="p-3 rounded-xl border bg-card/80 flex items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Cobertura de Saídas
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn(
                  "text-lg sm:text-xl font-black font-mono",
                  indiceCobertura >= 1 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"
                )}>
                  {indiceCobertura.toFixed(2)}x
                </span>
                <span className="text-[10px] text-muted-foreground">Receitas / Saídas</span>
              </div>
              <p className="text-[9.5px] text-muted-foreground mt-0.5">
                {indiceCobertura >= 1.2 ? "Margem de segurança confortável" : indiceCobertura >= 1 ? "Cobriu integralmente as contas" : "Déficit operacional no período"}
              </p>
            </div>
            <div className={cn(
              "p-2.5 rounded-xl shrink-0",
              indiceCobertura >= 1 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
            )}>
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          {/* Card C: Patrimônio em Investimentos */}
          <div className="p-3 rounded-xl border bg-card/80 flex items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Investimentos Patrimoniais
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-lg sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {formatCurrency(investimentos)}
                </span>
              </div>
              <p className="text-[9.5px] text-muted-foreground mt-0.5">
                Aplicações, reformas e bens duráveis
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

