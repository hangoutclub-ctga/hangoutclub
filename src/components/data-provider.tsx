"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Student, Class, InventoryItem, Transaction, FixedExpense, ManualEvent, CommunicationTemplate, StockMovement, EventType, SystemCategory } from '@/types';
import { DataContext } from '@/hooks/use-data';
import * as services from '@/services';

const defaultEventTypes: EventType[] = [
  { id: 'class', name: 'Aula', color: '#3b82f6', description: 'Aulas regulares ou individuais' },
  { id: 'task', name: 'Tarefa', color: '#10b981', description: 'Tarefas internas e rotinas administrativas' },
  { id: 'meeting', name: 'Reunião', color: '#8b5cf6', description: 'Reuniões com pais, equipe ou fornecedores' },
  { id: 'trial', name: 'Aula Experimental', color: '#f59e0b', description: 'Aulas demonstrativas ou de nivelamento com novos alunos' },
  { id: 'test', name: 'Prova', color: '#ef4444', description: 'Avaliações e testes de proficiência' },
  { id: 'planning', name: 'Planejamento de Aula', color: '#6366f1', description: 'Horário reservado para preparo de aulas e materiais' },
];

const defaultSystemCategories: SystemCategory[] = [
  { id: 'cond_integral', type: 'student_condition', name: 'Integral', color: '#3b82f6', description: 'Aluno com plano de período integral' },
  { id: 'cond_bolsa', type: 'student_condition', name: 'Bolsa', color: '#10b981', description: 'Aluno bolsista com desconto institucional' },
  { id: 'cond_desconto', type: 'student_condition', name: 'Desconto', color: '#f59e0b', description: 'Aluno com percentual de desconto comercial' },
  { id: 'mod_regular', type: 'class_modality', name: 'Regular', color: '#3b82f6', description: 'Turma padrão com múltiplos alunos' },
  { id: 'mod_vip', type: 'class_modality', name: 'VIP', color: '#8b5cf6', description: 'Turma individual ou atendimento exclusivo' },
  { id: 'mod_acompanhamento', type: 'class_modality', name: 'Acompanhamento', color: '#10b981', description: 'Aulas de suporte pedagógico e reforço' },
  { id: 'inv_didatico', type: 'inventory_category', name: 'Material Didático', color: '#3b82f6', description: 'Apostilas, livros, cadernos e materiais pedagógicos' },
  { id: 'inv_escritorio', type: 'inventory_category', name: 'Material de Escritório', color: '#6366f1', description: 'Papelaria, impressos e suprimentos administrativos' },
  { id: 'inv_limpeza', type: 'inventory_category', name: 'Limpeza', color: '#14b8a6', description: 'Produtos e materiais de limpeza e higiene' },
];

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [manualEvents, setManualEvents] = useState<ManualEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>(defaultEventTypes);
  const [systemCategories, setSystemCategories] = useState<SystemCategory[]>(defaultSystemCategories);
  const [isLoading, setIsLoading] = useState(true);

  const categories = {
    studentConditions: systemCategories.filter(c => c.type === 'student_condition').map(c => c.name),
    classModalities: systemCategories.filter(c => c.type === 'class_modality').map(c => c.name),
    inventoryCategories: systemCategories.filter(c => c.type === 'inventory_category').map(c => c.name),
    userRoles: ["Admin", "Professor", "Secretaria"],
    eventTypes,
    systemCategories,
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
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [u, s, c, inv, trx, fx, ev, et, sc] = await Promise.all([
        services.fetchUsers().catch(() => []),
        services.fetchStudents().catch(() => []),
        services.fetchClasses().catch(() => []),
        services.fetchInventory().catch(() => []),
        services.fetchTransactions().catch(() => []),
        services.fetchFixedExpenses().catch(() => []),
        services.fetchEvents().catch(() => []),
        services.fetchEventTypes().catch(() => defaultEventTypes),
        services.fetchSystemCategories().catch(() => defaultSystemCategories),
      ]);

      setUsers(u);
      setStudents(s);
      setClasses(c);
      setInventoryItems(inv);
      setTransactions(trx);
      setFixedExpenses(fx);
      setManualEvents(ev);
      if (et && et.length > 0) {
        setEventTypes(et);
      } else {
        setEventTypes(defaultEventTypes);
      }
      if (sc && sc.length > 0) {
        setSystemCategories(sc);
      } else {
        setSystemCategories(defaultSystemCategories);
      }
    } catch (err) {
      console.error("Failed to load data from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ========================
  // STUDENTS MUTATIONS
  // ========================
  const addStudent = async (student: Partial<Student>): Promise<Student> => {
    const created = await services.createStudent(student);
    setStudents(prev => [created, ...prev]);
    return created;
  };

  const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
    const prevStudent = students.find(s => s.id === id);
    const updated = await services.updateStudent(id, student);
    setStudents(prev => prev.map(s => s.id === id ? updated : s));

    if (student.name && prevStudent && student.name !== prevStudent.name) {
      const matchingTxs = transactions.filter(t => t.name === prevStudent.name);
      for (const tx of matchingTxs) {
        try {
          await services.updateTransaction(tx.id, { name: student.name });
        } catch (e) {
          console.error("Failed to sync transaction name:", e);
        }
      }
      if (matchingTxs.length > 0) {
        setTransactions(prev => prev.map(t => t.name === prevStudent.name ? { ...t, name: student.name! } : t));
      }
    }

    return updated;
  };

  const deleteStudent = async (id: string, soft: boolean = true): Promise<void> => {
    await services.deleteStudent(id, soft);
    if (soft) {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'Apagado' } : s));
    } else {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  // ========================
  // CLASSES MUTATIONS
  // ========================
  const addClass = async (c: Partial<Class>): Promise<Class> => {
    const created = await services.createClass(c);
    setClasses(prev => [...prev, created]);
    return created;
  };

  const updateClass = async (id: string, c: Partial<Class>): Promise<Class> => {
    const updated = await services.updateClass(id, c);
    setClasses(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  };

  const deleteClass = async (id: string, soft: boolean = true): Promise<void> => {
    await services.deleteClass(id, soft);
    if (soft) {
      setClasses(prev => prev.map(c => c.id === id ? { ...c, status: 'Apagado' } : c));
    } else {
      setClasses(prev => prev.filter(c => c.id !== id));
    }
  };

  // ========================
  // TRANSACTIONS MUTATIONS
  // ========================
  const addTransaction = async (t: Partial<Transaction>): Promise<Transaction> => {
    const created = await services.createTransaction(t);
    setTransactions(prev => [created, ...prev]);
    return created;
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>): Promise<Transaction> => {
    const updated = await services.updateTransaction(id, t);
    setTransactions(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    await services.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ========================
  // FIXED EXPENSES MUTATIONS
  // ========================
  const addFixedExpense = async (fe: Partial<FixedExpense>): Promise<FixedExpense> => {
    const created = await services.createFixedExpense(fe);
    setFixedExpenses(prev => [...prev, created]);
    return created;
  };

  const updateFixedExpense = async (id: string, fe: Partial<FixedExpense>): Promise<FixedExpense> => {
    const updated = await services.updateFixedExpense(id, fe);
    setFixedExpenses(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  };

  const deleteFixedExpense = async (id: string): Promise<void> => {
    await services.deleteFixedExpense(id);
    setFixedExpenses(prev => prev.filter(item => item.id !== id));
  };

  // ========================
  // INVENTORY MUTATIONS
  // ========================
  const addInventoryItem = async (item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const created = await services.createInventoryItem(item);
    setInventoryItems(prev => [created, ...prev]);
    return created;
  };

  const updateInventoryItem = async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const updated = await services.updateInventoryItem(id, item);
    setInventoryItems(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const addStockMovement = async (id: string, movement: StockMovement, newStock: number): Promise<InventoryItem> => {
    const updated = await services.addStockMovement(id, movement, newStock);
    setInventoryItems(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const deleteInventoryItem = async (id: string, soft: boolean = true): Promise<void> => {
    await services.deleteInventoryItem(id, soft);
    if (soft) {
      setInventoryItems(prev => prev.map(i => i.id === id ? { ...i, status: 'Apagado' } : i));
    } else {
      setInventoryItems(prev => prev.filter(i => i.id !== id));
    }
  };

  // ========================
  // EVENTS MUTATIONS
  // ========================
  const addEvent = async (e: Partial<ManualEvent>): Promise<ManualEvent> => {
    const created = await services.createEvent(e);
    setManualEvents(prev => [...prev, created]);
    return created;
  };

  const updateEvent = async (id: string, e: Partial<ManualEvent>): Promise<ManualEvent> => {
    const updated = await services.updateEvent(id, e);
    setManualEvents(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  };

  const deleteEvent = async (id: string): Promise<void> => {
    await services.deleteEvent(id);
    setManualEvents(prev => prev.filter(item => item.id !== id));
  };

  // ========================
  // EVENT TYPES MUTATIONS
  // ========================
  const addEventType = async (item: Partial<EventType>): Promise<EventType> => {
    const created = await services.createEventType(item);
    setEventTypes(prev => [...prev, created]);
    return created;
  };

  const updateEventType = async (id: string, item: Partial<EventType>): Promise<EventType> => {
    const updated = await services.updateEventType(id, item);
    setEventTypes(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteEventType = async (id: string): Promise<void> => {
    await services.deleteEventType(id);
    setEventTypes(prev => prev.filter(t => t.id !== id));
  };

  // ========================
  // SYSTEM CATEGORIES MUTATIONS
  // ========================
  const addSystemCategory = async (item: Partial<SystemCategory>): Promise<SystemCategory> => {
    const created = await services.createSystemCategory(item);
    setSystemCategories(prev => [...prev, created]);
    return created;
  };

  const updateSystemCategory = async (id: string, item: Partial<SystemCategory>): Promise<SystemCategory> => {
    const updated = await services.updateSystemCategory(id, item);
    setSystemCategories(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  const deleteSystemCategory = async (id: string): Promise<void> => {
    await services.deleteSystemCategory(id);
    setSystemCategories(prev => prev.filter(c => c.id !== id));
  };

  const deleteUser = async (id: string): Promise<void> => {
    setUsers(prev => prev.filter(item => item.id !== id));
    await services.deleteUser(id);
  };

  return (
    <DataContext.Provider
      value={{
        users,
        students,
        classes,
        inventoryItems,
        transactions,
        fixedExpenses,
        manualEvents,
        eventTypes,
        systemCategories,
        categories,
        isLoading,
        refetchData: fetchData,
        addStudent,
        updateStudent,
        deleteStudent,
        addClass,
        updateClass,
        deleteClass,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addFixedExpense,
        updateFixedExpense,
        deleteFixedExpense,
        addInventoryItem,
        updateInventoryItem,
        addStockMovement,
        deleteInventoryItem,
        addEvent,
        updateEvent,
        deleteEvent,
        addEventType,
        updateEventType,
        deleteEventType,
        addSystemCategory,
        updateSystemCategory,
        deleteSystemCategory,
        deleteUser,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
