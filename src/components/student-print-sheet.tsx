"use client";

import React from "react";
import { Student, Grade, Attendance } from "@/types";
import { getDisplayAvatarUrl, formatCurrency } from "@/lib/utils";
import { differenceInYears, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Mail, 
  HeartPulse, 
  FileText, 
  CalendarDays, 
  Wallet, 
  ShieldCheck
} from "lucide-react";

export interface StudentPaymentRecord {
  date: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  receiptUrl?: string;
  status?: string;
}

interface StudentPrintSheetProps {
  student: Student;
  canViewFinance?: boolean;
  payments?: StudentPaymentRecord[];
}

export function StudentPrintSheet({ student, canViewFinance = false, payments: propPayments }: StudentPrintSheetProps) {
  if (!student) return null;

  const now = new Date();
  const emissionDate = format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  let birthDateFormatted = "-";
  let age = 0;
  try {
    const dobDate = new Date(student.dob);
    birthDateFormatted = format(dobDate, "dd/MM/yyyy", { locale: ptBR });
    age = differenceInYears(now, dobDate);
  } catch (e) {
    birthDateFormatted = student.dob || "-";
  }

  const isMinor = age > 0 ? age < 18 : true;
  const avatarUrl = getDisplayAvatarUrl(student.avatarUrl);
  const fullAddress = [
    student.address,
    student.addressNumber ? `nº ${student.addressNumber}` : "",
    student.addressComplement ? `(${student.addressComplement})` : "",
    student.cep ? `CEP: ${student.cep}` : ""
  ].filter(Boolean).join(", ");

  // Grades summary
  const grades = student.grades || [];
  const averageGrade = grades.length > 0 
    ? (grades.reduce((acc, g) => acc + (Number(g.grade) || 0), 0) / grades.length).toFixed(1)
    : null;

  // Attendance summary
  const attendances = student.attendance || [];
  const totalClasses = attendances.length;
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const justifiedCount = attendances.filter(a => a.status === 'justified').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  // Documents
  const documents = student.documents || [];

  // Payments
  const mock2023Dates = ['2023-08-05', '2023-09-05', '2023-10-05', '2023-09-10', '2023-10-10'];
  const payments: StudentPaymentRecord[] = propPayments && propPayments.length > 0
    ? propPayments
    : (student.paymentHistory || [])
        .filter(p => !mock2023Dates.includes(p.date))
        .map(p => ({
          date: p.date,
          description: p.description,
          amount: p.amount,
          status: p.status,
          paymentMethod: undefined,
          receiptUrl: undefined
        }));

  return (
    <div className="student-print-sheet text-slate-900 bg-white font-sans text-[12px] leading-relaxed max-w-[210mm] mx-auto p-0 print:p-0">
      {/* CABEÇALHO INSTITUCIONAL */}
      <header className="border-b-2 border-slate-900 pb-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl tracking-tighter shadow-sm">
            HC
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase font-headline">
              Hangout Club
            </h1>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Sistema de Gestão & Desenvolvimento
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-slate-100 border border-slate-300 font-bold px-3 py-1 rounded-md text-[10px] uppercase tracking-wider text-slate-800">
            Ficha Oficial do Aluno
          </span>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            Emissão: {emissionDate}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            ID: #{student.id.slice(0, 8)}
          </p>
        </div>
      </header>

      {/* BLOCO 1: DADOS PESSOAIS & FOTO */}
      <section className="border border-slate-300 rounded-lg p-4 mb-4 bg-slate-50/50 print-avoid-break">
        <div className="flex items-start gap-4">
          {/* FOTO DO ALUNO / AVATAR 3x4 */}
          <div className="w-24 h-28 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 flex flex-col items-center justify-center relative shadow-sm">
            {avatarUrl && !avatarUrl.includes("placehold.co") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={avatarUrl} 
                alt={student.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center text-slate-500">
                <User className="h-8 w-8 text-slate-400 mb-1" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Foto 3x4</span>
              </div>
            )}
          </div>

          {/* DADOS CADASTRAIS DO ALUNO */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Nome do Aluno</span>
                <h2 className="text-base font-black text-slate-900 leading-snug">{student.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  student.status === 'Ativo' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  ● {student.status || 'Ativo'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Nascimento</span>
                <span className="font-semibold text-slate-800">{birthDateFormatted} ({age} anos)</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Telefone / Contato</span>
                <span className="font-semibold text-slate-800">{student.phone || "-"}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase block">E-mail</span>
                <span className="font-semibold text-slate-800 truncate block">{student.email || "-"}</span>
              </div>
            </div>

            <div className="pt-1 text-[11px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Endereço Residencial</span>
              <span className="font-semibold text-slate-800">{fullAddress || "Não informado"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 2: RESPONSÁVEL LEGAL & MATRÍCULA */}
      <div className="grid grid-cols-2 gap-4 mb-4 print-avoid-break">
        {/* RESPONSÁVEL LEGAL */}
        <section className="border border-slate-300 rounded-lg p-3 bg-white flex flex-col justify-between">
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
              Responsável Legal {isMinor && <span className="text-slate-500 font-normal">(Aluno Menor)</span>}
            </h3>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Nome do Responsável</span>
              <span className="font-semibold text-slate-800">{student.guardianName || "Próprio Aluno / Não informado"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">CPF do Responsável</span>
              <span className="font-semibold text-slate-800 font-mono">{student.guardianCpf || "-"}</span>
            </div>
          </div>
        </section>

        {/* DADOS DE MATRÍCULA */}
        <section className="border border-slate-300 rounded-lg p-3 bg-white flex flex-col justify-between">
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 mb-2">
            <GraduationCap className="h-4 w-4 text-slate-700" />
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
              Dados da Matrícula
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Turma Atual</span>
              <span className="font-bold text-slate-900">{student.class || "Sem turma vinculada"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">Condição / Regime</span>
              <span className="font-bold text-slate-800">{student.studentCondition || "Regular"}</span>
            </div>
          </div>
        </section>
      </div>

      {/* INFORMAÇÕES MÉDICAS / RESTRIÇÕES (SE HOUVER) */}
      {student.medicalInfo && (
        <section className="border border-amber-300 bg-amber-50/60 rounded-lg p-3 mb-4 print-avoid-break">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-[11px] uppercase tracking-wider mb-1">
            <HeartPulse className="h-4 w-4 text-amber-700" />
            <span>Ficha Médica & Observações de Saúde / Cuidados</span>
          </div>
          <p className="text-[11px] text-amber-950 whitespace-pre-line leading-relaxed">
            {student.medicalInfo}
          </p>
        </section>
      )}

      {/* BLOCO 3: BOLETIM DE DESEMPENHO PEDAGÓGICO */}
      <section className="border border-slate-300 rounded-lg overflow-hidden mb-4 print-avoid-break">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-700" />
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
              Desempenho Pedagógico (Boletim de Avaliações)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-slate-600 font-medium">Total: <strong>{grades.length}</strong> avaliações</span>
            {averageGrade && (
              <span className="bg-slate-200 border border-slate-400/50 px-2 py-0.5 rounded font-bold text-slate-900">
                Média Geral: {averageGrade}
              </span>
            )}
          </div>
        </div>

        {grades.length > 0 ? (
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                <th className="py-2 px-3">Disciplina / Avaliação</th>
                <th className="py-2 px-3 text-center">Período</th>
                <th className="py-2 px-3 text-right">Nota Obtida</th>
                <th className="py-2 px-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {grades.map((grade, idx) => {
                const isPassed = grade.grade >= 60;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-3 font-semibold text-slate-900">{grade.subject}</td>
                    <td className="py-1.5 px-3 text-center text-slate-700">{grade.periodNumber}º {grade.periodType}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                      {grade.grade.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isPassed 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPassed ? "Aprovado" : "Abaixo da Média"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-center text-slate-500 italic text-[11px]">
            Nenhuma avaliação ou nota registrada até o momento.
          </div>
        )}
      </section>

      {/* BLOCO 4: REGISTRO DE FREQUÊNCIA E ASSIDUIDADE */}
      <section className="border border-slate-300 rounded-lg overflow-hidden mb-4 print-avoid-break">
        <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-700" />
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
              Registro de Frequência & Assiduidade
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className={`px-2 py-0.5 rounded font-bold border ${
              attendanceRate >= 75 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              Assiduidade: {attendanceRate}%
            </span>
          </div>
        </div>

        <div className="p-3 bg-white border-b border-slate-200 grid grid-cols-4 gap-2 text-center text-[10px]">
          <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
            <span className="text-slate-500 block uppercase text-[8px] font-bold">Total Aulas</span>
            <span className="text-sm font-black text-slate-800">{totalClasses}</span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-200 p-1.5 rounded">
            <span className="text-emerald-700 block uppercase text-[8px] font-bold">Presenças</span>
            <span className="text-sm font-black text-emerald-800">{presentCount}</span>
          </div>
          <div className="bg-rose-50/50 border border-rose-200 p-1.5 rounded">
            <span className="text-rose-700 block uppercase text-[8px] font-bold">Faltas</span>
            <span className="text-sm font-black text-rose-800">{absentCount}</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-200 p-1.5 rounded">
            <span className="text-amber-700 block uppercase text-[8px] font-bold">Justificadas</span>
            <span className="text-sm font-black text-amber-800">{justifiedCount}</span>
          </div>
        </div>

        {attendances.length > 0 ? (
          <div className="p-2">
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {attendances.slice(0, 18).map((att, idx) => {
                let statusLabel = "Presente";
                let statusColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                if (att.status === 'absent') {
                  statusLabel = "Ausente";
                  statusColor = "bg-rose-50 text-rose-800 border-rose-200";
                } else if (att.status === 'justified') {
                  statusLabel = "Justificado";
                  statusColor = "bg-amber-50 text-amber-800 border-amber-200";
                }
                const formattedDate = new Date(att.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                return (
                  <div key={idx} className={`border rounded px-2 py-1 flex items-center justify-between ${statusColor}`}>
                    <span className="font-mono text-[9px] font-bold">{formattedDate}</span>
                    <span className="text-[8px] uppercase font-bold">{statusLabel}</span>
                  </div>
                );
              })}
            </div>
            {attendances.length > 18 && (
              <p className="text-[9px] text-slate-500 text-center mt-1 italic">
                (Exibindo as 18 presenças mais recentes de um total de {attendances.length})
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 text-center text-slate-500 italic text-[11px]">
            Nenhum registro de chamada ou frequência lançado.
          </div>
        )}
      </section>

      {/* BLOCO 5: DOCUMENTOS ARQUIVADOS */}
      {documents.length > 0 && (
        <section className="border border-slate-300 rounded-lg overflow-hidden mb-4 print-avoid-break">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
              Documentos & Comprovantes Arquivados
            </h3>
            <span className="text-[10px] text-slate-600">{documents.length} anexo(s)</span>
          </div>
          <div className="p-2.5 grid grid-cols-2 gap-2 text-[10px]">
            {documents.map((doc, idx) => (
              <div key={idx} className="border border-slate-200 bg-slate-50/50 p-2 rounded flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                  <span className="text-[8px] uppercase font-bold text-slate-500">Tipo: {doc.type}</span>
                </div>
                <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Arquivado
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BLOCO 6: HISTÓRICO FINANCEIRO (SE HOUVER PERMISSÃO) */}
      {canViewFinance && (
        <section className="border border-slate-300 rounded-lg overflow-hidden mb-5 print-avoid-break">
          <div className="bg-slate-100 border-b border-slate-300 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-700" />
              <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                Resumo Financeiro da Matrícula
              </h3>
            </div>
            <div className="text-[10px] font-bold text-slate-800">
              Mensalidade: {formatCurrency(student.monthlyFee || 0)} {student.dueDate ? `(Venc: dia ${student.dueDate})` : ""}
            </div>
          </div>

          {payments.length > 0 ? (
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[8px] tracking-wider">
                  <th className="py-1.5 px-3">Data</th>
                  <th className="py-1.5 px-3">Descrição do Pagamento</th>
                  <th className="py-1.5 px-3 text-right">Valor Pago</th>
                  <th className="py-1.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.slice(0, 10).map((pay, idx) => (
                  <tr key={idx}>
                    <td className="py-1 px-3 font-mono text-slate-700">
                      {new Date(pay.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td className="py-1 px-3 font-medium text-slate-800">
                      {pay.description} {pay.paymentMethod ? <span className="text-[8px] text-slate-500">({pay.paymentMethod})</span> : ''}
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(pay.amount)}
                    </td>
                    <td className="py-1 px-3 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase">
                        Confirmado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-3 text-center text-slate-500 italic text-[10px]">
              Nenhum pagamento registrado no histórico deste aluno.
            </div>
          )}
        </section>
      )}

      {/* BLOCO 7: TERMO DE DECLARAÇÃO & ASSINATURAS */}
      <section className="mt-8 pt-4 border-t-2 border-slate-900 print-avoid-break">
        <p className="text-[9px] text-slate-500 text-center mb-8 leading-relaxed max-w-lg mx-auto">
          Declaro que as informações constantes neste documento são cópia fiel dos registros acadêmicos e cadastrais 
          da instituição na data de sua emissão.
        </p>

        <div className="grid grid-cols-2 gap-12 pt-4 px-6">
          <div className="text-center">
            <div className="border-t border-slate-800 pt-1.5">
              <p className="font-bold text-[11px] text-slate-900">
                {student.guardianName || student.name}
              </p>
              <p className="text-[9px] text-slate-500 uppercase">
                {isMinor ? "Assinatura do Responsável Legal" : "Assinatura do Aluno(a)"}
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="border-t border-slate-800 pt-1.5">
              <p className="font-bold text-[11px] text-slate-900">Hangout Club</p>
              <p className="text-[9px] text-slate-500 uppercase">Coordenação Pedagógica / Direção</p>
            </div>
          </div>
        </div>

        {/* RODAPÉ OFICIAL */}
        <div className="mt-8 pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400">
          <span>Hangout Club - Sistema de Gestão</span>
          <span>Ficha Individual do Aluno • Via Oficial</span>
          <span>{emissionDate}</span>
        </div>
      </section>
    </div>
  );
}
