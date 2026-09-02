"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Student, Class, InventoryItem, Transaction, FixedExpense, ManualEvent, CommunicationTemplate } from '@/types';
import { DataContext } from '@/hooks/use-data';
import { mockUsers, mockStudents, mockClasses, mockInventoryItems, mockTransactions } from '@/lib/mock-data';

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState({
    users: mockUsers,
    students: mockStudents,
    classes: mockClasses,
    inventoryItems: mockInventoryItems, 
    transactions: mockTransactions,
    fixedExpenses: [] as FixedExpense[],
    manualEvents: [] as ManualEvent[],
    categories: {
        studentConditions: ['Integral', 'Bolsa', 'Desconto'],
        classModalities: ['Regular', 'VIP', 'Acompanhamento'],
        inventoryCategories: ["Material Didático", "Escritório", "Limpeza"],
        userRoles: ["Admin", "Professor", "Secretaria"],
        communicationTemplates: [
            { 
                id: 'payment_reminder', 
                label: '💰 Lembrete de Pagamento',
                subject: "Lembrete: Mensalidade Próxima ao Vencimento",
                message: "Olá, {guardian_name}!\n\nPassando para lembrar que a mensalidade do(a) aluno(a) {student_name} referente ao mês de [Mês] está próxima do vencimento (dia [Data]).\n\nCaso já tenha realizado o pagamento, por favor desconsidere este aviso ou nos envie o comprovante por aqui.\n\nQualquer dúvida, estamos à disposição!\n\nAtenciosamente,\nHangout Club"
            },
            { 
                id: 'event_notice', 
                label: '📅 Aviso de Evento / Reunião',
                subject: "Convite Especial: [Nome do Evento/Reunião]",
                message: "Olá, comunidade Hangout!\n\nGostaríamos de convidá-los para o nosso próximo encontro: [Nome do Evento], que acontecerá no dia [Data] às [Hora].\n\nA participação de vocês é fundamental para o desenvolvimento dos nossos alunos.\n\nContamos com a presença de todos!\n\nAtenciosamente,\nHangout Club"
            },
            { 
                id: 'performance_feedback', 
                label: '🌟 Feedback de Desempenho',
                subject: "Acompanhamento Pedagógico: {student_name}",
                message: "Prezados pais,\n\nGostaríamos de compartilhar um breve feedback sobre o desempenho do(a) {student_name} nas últimas aulas. [Inserir detalhes sobre evolução, pontos positivos ou pontos de atenção].\n\nEstamos muito felizes com o progresso demonstrado!\n\nAtenciosamente,\nEquipe Pedagógica Hangout Club"
            },
            { 
                id: 'holiday_notice', 
                label: '🎈 Comunicado de Feriado / Recesso',
                subject: "Informativo: Recesso Escolar [Nome do Feriado]",
                message: "Prezados pais e responsáveis,\n\nInformamos que em virtude do feriado de [Nome do Feriado], não haverá aulas nos dias [Datas].\n\nAs atividades retornarão normalmente no dia [Data de Retorno].\n\nDesejamos a todos um ótimo descanso!\n\nAtenciosamente,\nHangout Club"
            }
        ] as CommunicationTemplate[],
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // Simulação de carregamento de dados mockados
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return (
    <DataContext.Provider value={{ ...data, isLoading, refetchData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};
