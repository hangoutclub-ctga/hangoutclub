"use client";

import React, { useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Sparkles,
  Activity,
  Zap,
  Target,
  Crosshair,
  RotateCcw
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
  hideCollapseButton?: boolean;
}

export function FinanceInfographic({ categoryTotals, totals, periodLabel, hideCollapseButton = false }: FinanceInfographicProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { receitas, custos, despesas, investimentos, gastos } = categoryTotals;
  const totalSaidas = custos + despesas + investimentos + gastos;

  // Percentuais em relação ao total de saídas
  const pctCustos = totalSaidas > 0 ? (custos / totalSaidas) * 100 : 0;
  const pctDespesas = totalSaidas > 0 ? (despesas / totalSaidas) * 100 : 0;
  const pctInvestimentos = totalSaidas > 0 ? (investimentos / totalSaidas) * 100 : 0;
  const pctGastos = totalSaidas > 0 ? (gastos / totalSaidas) * 100 : 0;

  // Margem Líquida Operacional (Receitas - Saídas) / Receitas
  const margemLiquida = receitas > 0 ? ((receitas - totalSaidas) / receitas) * 100 : 0;

  // Índice de Cobertura de Saídas
  const indiceCobertura = totalSaidas > 0 ? receitas / totalSaidas : 0;

  // Reinvestimento em relação ao faturamento
  const taxaInvestimento = receitas > 0 ? (investimentos / receitas) * 100 : 0;

  // Definição dos segmentos do Donut Holográfico
  const segments = [
    {
      id: "custos",
      name: "Custos",
      subtitle: "Equipe & Pró-labore",
      items: "Sidney, Patricia, Maisa, Gabriela, Celia",
      value: custos,
      pct: pctCustos,
      color: "#f97316", // Electric Orange
      glowColor: "rgba(249, 115, 22, 0.4)",
      borderColor: "border-orange-500/30",
      bgClass: "bg-orange-500/10",
      textClass: "text-orange-500",
      badgeClass: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30"
    },
    {
      id: "despesas",
      name: "Despesas",
      subtitle: "Estruturais & ADM",
      items: "Contador, Sistema, Aluguel, Luz, Internet, Marketing",
      value: despesas,
      pct: pctDespesas,
      color: "#eab308", // Cyber Amber Gold
      glowColor: "rgba(234, 179, 8, 0.4)",
      borderColor: "border-amber-500/30",
      bgClass: "bg-amber-500/10",
      textClass: "text-amber-500",
      badgeClass: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
    },
    {
      id: "investimentos",
      name: "Investimentos",
      subtitle: "Patrimônio & Futuro",
      items: "Aplicações financeiras, Reformas, Equipamentos",
      value: investimentos,
      pct: pctInvestimentos,
      color: "#06b6d4", // Neon Cyan
      glowColor: "rgba(6, 182, 212, 0.4)",
      borderColor: "border-cyan-500/30",
      bgClass: "bg-cyan-500/10",
      textClass: "text-cyan-500",
      badgeClass: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
    },
    {
      id: "gastos",
      name: "Gastos",
      subtitle: "Insumos & Rotina",
      items: "Alimentação, Pão, Lanches, Embalagens, Papelaria, Limpeza",
      value: gastos,
      pct: pctGastos,
      color: "#a855f7", // Cyber Purple
      glowColor: "rgba(168, 85, 247, 0.4)",
      borderColor: "border-purple-500/30",
      bgClass: "bg-purple-500/10",
      textClass: "text-purple-500",
      badgeClass: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30"
    }
  ];

  // Geometria do Donut SVG Futurista
  const radius = 80;
  const strokeWidth = 18;
  const activeStrokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Acumulador de offsets angulares
  let offsetAccumulator = 0;
  const arcSegments = segments.map((seg) => {
    const fraction = totalSaidas > 0 ? seg.value / totalSaidas : 0;
    const arcLength = fraction * circumference;
    const offset = -offsetAccumulator;
    offsetAccumulator += arcLength;

    // Espaçamento visual fino de 2px entre arcos se houver mais de uma categoria
    const gap = totalSaidas > 0 && fraction < 1 ? 2.5 : 0;
    const dashLength = Math.max(0, arcLength - gap);
    const spaceLength = circumference - dashLength;

    return {
      ...seg,
      arcLength,
      dasharray: `${dashLength} ${spaceLength}`,
      dashoffset: offset
    };
  });

  // Categoria ativa selecionada ou destacada
  const currentInspect = segments.find(s => s.id === activeCategory);

  return (
    <div className="card-print overflow-hidden print:m-0 relative">
      {/* Corpo do Infográfico */}
      <div className="space-y-4 print:p-2 print:space-y-3">
        
        {/* SEÇÃO PRINCIPAL: DONUT HOLOGRÁFICO + PAINEL DE TELEMETRIA DAS 5 CATEGORIAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-4 print:gap-3 items-center">
          
          {/* COLUNA 1: O GRÁFICO DE PIZZA / ROSCA HOLOGRÁFICO (SVG INTERATIVO) */}
          <div className="lg:col-span-5 print:col-span-5 flex flex-col items-center justify-center p-2 print:p-0 relative">
            <div className="relative w-[240px] h-[240px] sm:w-[270px] sm:h-[270px] print:w-[200px] print:h-[200px] flex items-center justify-center">
              
              {/* Efeito radial de fundo */}
              <div 
                className="absolute inset-4 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-700"
                style={{
                  background: currentInspect 
                    ? currentInspect.glowColor 
                    : margemLiquida >= 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"
                }}
              />

              {/* SVG Principal do Gráfico Donut Futurista */}
              <svg 
                viewBox="0 0 240 240" 
                className="w-full h-full transform -rotate-90 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
              >
                {/* Defs para filtros e gradientes */}
                <defs>
                  <filter id="cyber-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Radar: Grade circular concêntrica de marcação cibernética */}
                <circle cx="120" cy="120" r="108" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/15 stroke-dasharray-[2_6]" />
                <circle cx="120" cy="120" r="62" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/15" />

                {/* Linhas cruzadas cibernéticas (crosshairs em 0, 90, 180, 270 graus) */}
                <line x1="120" y1="4" x2="120" y2="14" stroke="currentColor" strokeWidth="1" className="text-accent/40" />
                <line x1="120" y1="226" x2="120" y2="236" stroke="currentColor" strokeWidth="1" className="text-accent/40" />
                <line x1="4" y1="120" x2="14" y2="120" stroke="currentColor" strokeWidth="1" className="text-accent/40" />
                <line x1="226" y1="120" x2="236" y2="120" stroke="currentColor" strokeWidth="1" className="text-accent/40" />

                {/* Trilha base do Donut (caso sem saídas) */}
                <circle
                  cx="120"
                  cy="120"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-muted/30"
                />

                {/* Arcos Segmentados de Cada Categoria de Saída */}
                {totalSaidas > 0 ? (
                  arcSegments.map((seg) => {
                    const isSelected = activeCategory === seg.id;
                    const isOtherSelected = activeCategory && activeCategory !== seg.id;

                    return (
                      <circle
                        key={seg.id}
                        cx="120"
                        cy="120"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={isSelected ? activeStrokeWidth : strokeWidth}
                        strokeDasharray={seg.dasharray}
                        strokeDashoffset={seg.dashoffset}
                        strokeLinecap="round"
                        className={cn(
                          "cursor-pointer transition-all duration-300 hover:opacity-100",
                          isOtherSelected ? "opacity-30" : "opacity-95"
                        )}
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 6px ${seg.color})` : undefined
                        }}
                        onMouseEnter={() => setActiveCategory(seg.id)}
                        onMouseLeave={() => setActiveCategory(null)}
                        onClick={() => setActiveCategory(prev => prev === seg.id ? null : seg.id)}
                      />
                    );
                  })
                ) : (
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} 0`}
                    opacity={0.3}
                  />
                )}
              </svg>

              {/* NÚCLEO CENTRAL DO HUD (Informações Dinâmicas de Alto Impacto) */}
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-auto cursor-pointer"
                onClick={() => setActiveCategory(null)}
                title="Clique para alternar visão geral"
              >
                {currentInspect ? (
                  /* Exibição quando uma categoria está sob mira/hover */
                  <div className="space-y-0.5 animate-in fade-in zoom-in-95 duration-200">
                    <span 
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full font-mono inline-block mb-0.5"
                      style={{ backgroundColor: currentInspect.color + '20', color: currentInspect.color }}
                    >
                      {currentInspect.name}
                    </span>
                    <div className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground">
                      {formatCurrency(currentInspect.value)}
                    </div>
                    <div className="text-[11px] font-black font-mono" style={{ color: currentInspect.color }}>
                      {currentInspect.pct.toFixed(1)}% das saídas
                    </div>
                    <span className="text-[8.5px] text-muted-foreground block max-w-[120px] truncate mx-auto">
                      {currentInspect.subtitle}
                    </span>
                  </div>
                ) : (
                  /* Exibição Geral Padrão (Saldo Líquido / Margem Operacional) */
                  <div className="space-y-0.5 animate-in fade-in duration-200">
                    <span className="text-[8.5px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
                      <Crosshair className="h-2.5 w-2.5 text-accent" />
                      Margem Líquida
                    </span>
                    <div className={cn(
                      "text-lg sm:text-2xl font-black font-mono tracking-tight",
                      margemLiquida >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {margemLiquida >= 0 ? `+${margemLiquida.toFixed(1)}%` : `${margemLiquida.toFixed(1)}%`}
                    </div>
                    <div className="text-[9.5px] font-mono text-muted-foreground">
                      Sobra: <strong className={margemLiquida >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                        {formatCurrency(receitas - totalSaidas)}
                      </strong>
                    </div>
                    <div className="pt-0.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md",
                        margemLiquida >= 20 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                        margemLiquida >= 0 ? "bg-sky-500/10 text-sky-600 border border-sky-500/20" :
                        "bg-red-500/10 text-red-600 border border-red-500/20"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0 animate-pulse",
                          margemLiquida >= 0 ? "bg-emerald-500" : "bg-red-500"
                        )} />
                        {margemLiquida >= 20 ? "Caixa Blindado" : margemLiquida >= 0 ? "Operação Estável" : "Déficit Operacional"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subtítulo auxiliar do Donut / Reset */}
            <div className="mt-1 text-center no-print">
              {activeCategory ? (
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="inline-flex items-center gap-1 text-[9.5px] font-mono text-accent hover:underline px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 cursor-pointer"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Voltar à visão geral
                </button>
              ) : (
                <p className="text-[9.5px] font-mono text-muted-foreground">
                  Passe o mouse ou toque nos arcos para inspecionar
                </p>
              )}
            </div>
          </div>

          {/* COLUNA 2: PAINEL HOLOGRÁFICO DETALHADO DAS 5 CATEGORIAS */}
          <div className="lg:col-span-7 print:col-span-7 space-y-2 print:space-y-1.5">
            
            {/* Card Hero: RECEITAS (A fonte motriz) */}
            <div 
              className={cn(
                "p-2.5 sm:p-3 rounded-xl border transition-all duration-200 relative overflow-hidden flex items-center justify-between gap-3",
                "bg-emerald-500/[0.04] border-emerald-500/30 hover:border-emerald-500/60"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black font-headline text-emerald-800 dark:text-emerald-300">
                      Receitas
                    </span>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-mono">
                      Faturamento Total
                    </Badge>
                  </div>
                  <p className="text-[9.5px] text-muted-foreground truncate max-w-[280px]">
                    Mensalidades escolares, matrículas e entradas financeiras
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(receitas)}
                </div>
                <span className="text-[9px] font-mono text-muted-foreground block">
                  100% da arrecadação
                </span>
              </div>
            </div>

            {/* Grid com os 4 Pilares de Saída (Custos, Despesas, Investimentos, Gastos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-1.5">
              {segments.map((seg) => {
                const isSelected = activeCategory === seg.id;

                return (
                  <div
                    key={seg.id}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all duration-200 cursor-pointer relative group",
                      seg.borderColor,
                      isSelected ? `${seg.bgClass} ring-2 ring-accent scale-[1.01] shadow-md` : "bg-card/70 hover:bg-muted/30"
                    )}
                    onMouseEnter={() => setActiveCategory(seg.id)}
                    onMouseLeave={() => setActiveCategory(null)}
                    onClick={() => setActiveCategory(prev => prev === seg.id ? null : seg.id)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-xs font-bold leading-tight">
                          {seg.name}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono" style={{ color: seg.color }}>
                        {formatCurrency(seg.value)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                      <span className="truncate max-w-[130px]">{seg.subtitle}</span>
                      <strong className="font-mono">{seg.pct.toFixed(1)}% das saídas</strong>
                    </div>

                    {/* Mini barra de preenchimento cyber */}
                    <div className="h-1.5 w-full rounded-full bg-muted/40 mt-1.5 overflow-hidden p-0.5 border border-border/30">
                      <div
                        style={{ width: `${Math.min(100, seg.pct)}%`, backgroundColor: seg.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>

                    <p className="text-[8px] text-muted-foreground/80 line-clamp-1 mt-1 font-mono italic">
                      {seg.items}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: COCKPIT DE TELEMETRIA E DIAGNÓSTICO OPERACIONAL (4 MÓDULOS) */}
        <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-2 pt-1 border-t border-border/50 print:gap-1.5 print:pt-1.5">
          
          {/* Módulo 1: Margem Líquida */}
          <div className="p-2.5 rounded-xl border bg-card/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Margem Líquida
              </span>
              <Activity className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={cn(
                "text-base sm:text-lg font-black font-mono",
                margemLiquida >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
              )}>
                {margemLiquida >= 0 ? `+${margemLiquida.toFixed(1)}%` : `${margemLiquida.toFixed(1)}%`}
              </span>
            </div>
            <p className="text-[8.5px] text-muted-foreground mt-0.5 truncate">
              {margemLiquida >= 20 ? "Alta rentabilidade" : margemLiquida >= 0 ? "Saldo positivo" : "Atenção: déficit"}
            </p>
          </div>

          {/* Módulo 2: Cobertura de Saídas */}
          <div className="p-2.5 rounded-xl border bg-card/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Cobertura
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={cn(
                "text-base sm:text-lg font-black font-mono",
                indiceCobertura >= 1 ? "text-sky-600 dark:text-sky-400" : "text-amber-500"
              )}>
                {indiceCobertura.toFixed(2)}x
              </span>
            </div>
            <p className="text-[8.5px] text-muted-foreground mt-0.5 truncate">
              {indiceCobertura >= 1.2 ? "Margem confortável" : indiceCobertura >= 1 ? "Contas em dia" : "Saídas > Receitas"}
            </p>
          </div>

          {/* Módulo 3: Taxa de Reinvestimento */}
          <div className="p-2.5 rounded-xl border bg-card/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Reinvestimento
              </span>
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base sm:text-lg font-black font-mono text-cyan-600 dark:text-cyan-400">
                {taxaInvestimento.toFixed(1)}%
              </span>
              <span className="text-[8.5px] text-muted-foreground">da receita</span>
            </div>
            <p className="text-[8.5px] text-muted-foreground mt-0.5 truncate">
              {formatCurrency(investimentos)} em bens
            </p>
          </div>

          {/* Módulo 4: Peso de Custos Fixos (Custos + Despesas) */}
          <div className="p-2.5 rounded-xl border bg-card/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Comprometimento
              </span>
              <Target className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base sm:text-lg font-black font-mono text-orange-600 dark:text-orange-400">
                {receitas > 0 ? (((custos + despesas) / receitas) * 100).toFixed(1) : 0}%
              </span>
              <span className="text-[8.5px] text-muted-foreground">fixos/rec.</span>
            </div>
            <p className="text-[8.5px] text-muted-foreground mt-0.5 truncate">
              Equipe + Estrutura
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
