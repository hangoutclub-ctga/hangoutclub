"use client";

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Package, CheckSquare } from "lucide-react";

export interface ShoppingPrintItem {
  id: string;
  name: string;
  category?: string;
  stock: number;
  minStock: number;
  unit?: string;
}

interface ShoppingPrintSheetProps {
  items: ShoppingPrintItem[];
}

export function ShoppingPrintSheet({ items }: ShoppingPrintSheetProps) {
  const now = new Date();
  const emissionDate = format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  const totalSuggestedQuantity = items.reduce((acc, item) => {
    const diff = (item.minStock || 0) - (item.stock || 0);
    return acc + Math.max(1, diff);
  }, 0);

  return (
    <div className="shopping-print-sheet text-slate-900 bg-white font-sans text-[12px] leading-relaxed max-w-[210mm] mx-auto p-0 print:p-0">
      {/* CABEÇALHO INSTITUCIONAL */}
      <header className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl tracking-tighter shadow-sm">
            HC
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase font-headline">
              Hangout Club
            </h1>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Gestão de Materiais & Inventário
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-slate-100 border border-slate-300 font-bold px-3 py-1 rounded-md text-[10px] uppercase tracking-wider text-slate-800">
            Lista de Compras & Reposição
          </span>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            Emissão: {emissionDate}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Itens Críticos: {items.length}
          </p>
        </div>
      </header>

      {/* BANNER DE STATUS */}
      <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-between text-xs text-slate-700 mb-4 print-avoid-break">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>Relação oficial de itens que atingiram ou estão abaixo do estoque mínimo operacional.</span>
        </div>
        <span className="font-bold text-red-800 uppercase text-[10px] tracking-wider bg-red-100/80 border border-red-300 px-2.5 py-0.5 rounded">
          Prioridade de Reposição
        </span>
      </div>

      {/* TABELA DE COMPRAS */}
      <div className="border border-slate-300 rounded-lg overflow-hidden mb-4 print-avoid-break">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold uppercase text-[9px] tracking-wider">
              <th className="py-2 px-2.5 text-center border-r border-slate-300 w-8">#</th>
              <th className="py-2 px-3 border-r border-slate-300">Item / Descrição</th>
              <th className="py-2 px-3 border-r border-slate-300 text-center w-28">Categoria</th>
              <th className="py-2 px-3 border-r border-slate-300 text-center w-20">Est. Mínimo</th>
              <th className="py-2 px-3 border-r border-slate-300 text-center w-20">Est. Atual</th>
              <th className="py-2 px-3 border-r border-slate-300 text-center w-24">Qtd Sugerida</th>
              <th className="py-2 px-3 text-center w-24">Conferência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, idx) => {
              const diff = (item.minStock || 0) - (item.stock || 0);
              const suggested = Math.max(1, diff);
              return (
                <tr key={item.id || idx} className="even:bg-slate-50/60">
                  <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[10px] border-r border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                    {item.name}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-600 text-[10px] border-r border-slate-200">
                    {item.category || "-"}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-700 border-r border-slate-200">
                    {item.minStock}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-red-700 bg-red-50/40 border-r border-slate-200">
                    {item.stock}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 bg-amber-50/60 border-r border-slate-200">
                    +{suggested}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-block w-4 h-4 border border-slate-400 rounded-sm"></span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* RESUMO DE CONTROLE */}
      <div className="grid grid-cols-2 gap-4 mb-6 print-avoid-break">
        <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">Total de Itens Listados:</span>
          <span className="font-mono font-black text-sm text-slate-900">{items.length} itens</span>
        </div>
        <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">Total de Unidades a Adquirir:</span>
          <span className="font-mono font-black text-sm text-amber-900">+{totalSuggestedQuantity} unidades</span>
        </div>
      </div>

      {/* BLOCO DE ASSINATURAS E CONTROLE */}
      <div className="pt-4 border-t-2 border-slate-900 print-avoid-break">
        <div className="grid grid-cols-2 gap-10 mb-8 pt-4">
          <div>
            <p className="font-bold text-[11px] text-slate-800 mb-8">Responsável pela Compra / Aquisição:</p>
            <div className="border-b border-slate-400 w-full mb-1"></div>
            <p className="text-[9px] text-slate-500 uppercase">Nome Legível / Assinatura / Data</p>
          </div>
          <div>
            <p className="font-bold text-[11px] text-slate-800 mb-8">Conferência no Recebimento / Almoxarifado:</p>
            <div className="border-b border-slate-400 w-full mb-1"></div>
            <p className="text-[9px] text-slate-500 uppercase">Nome Legível / Assinatura / Data</p>
          </div>
        </div>

        {/* RODAPÉ INSTITUCIONAL */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400">
          <span>Hangout Club • Sistema de Gestão de Materiais & Inventário</span>
          <span>Lista Oficial de Reposição de Estoque</span>
          <span>{emissionDate}</span>
        </div>
      </div>
    </div>
  );
}
