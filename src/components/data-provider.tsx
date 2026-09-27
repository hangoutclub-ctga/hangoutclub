"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { User, Student, Class, InventoryItem, Transaction, FixedExpense, ManualEvent, CommunicationTemplate, StockMovement, EventType, SystemCategory, DeletionAudit } from '@/types';
import { DataContext } from '@/hooks/use-data';
import { buildAuditTag, cleanAuditTag } from '@/lib/audit-utils';
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
    eventTypes: eventTypes.filter(et => !et.name.startsWith('[Apagado]')),
    systemCategories: systemCategories.filter(c => c.type !== 'Apagado'),
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

      // Reconciliação automática de dados inconsistentes entre turmas e alunos
      const updatedStudents = [...s];
      const updatedClasses = [...c];
      let hasStudentChanges = false;
      let hasClassChanges = false;

      const activeClasses = updatedClasses.filter(cls => cls.status !== 'Apagado');

      // 1. Limpa alunos apagados das turmas e garante que cada aluno ativo tenha student.class preenchido com o nome da turma
      for (const cls of activeClasses) {
        if (cls.studentIds && cls.studentIds.length > 0) {
          const validStudentIds: string[] = [];
          for (const sId of cls.studentIds) {
            const student = updatedStudents.find(st => st.id === sId);
            // Se o aluno não existe ou está apagado, remove do array da turma
            if (!student || student.status === 'Apagado') {
              hasClassChanges = true;
              continue;
            }
            validStudentIds.push(sId);

            if (student.status === 'Ativo' && (!student.class || student.class.trim() !== cls.name.trim())) {
              try {
                await services.updateStudent(sId, { class: cls.name });
                student.class = cls.name;
                hasStudentChanges = true;
              } catch (e) {
                console.error(`Erro na reconciliação de aluno ${sId}:`, e);
              }
            }
          }

          if (validStudentIds.length !== cls.studentIds.length) {
            try {
              await services.updateClass(cls.id, { studentIds: validStudentIds });
              cls.studentIds = validStudentIds;
              hasClassChanges = true;
            } catch (e) {
              console.error(`Erro ao limpar alunos apagados da turma ${cls.id}:`, e);
            }
          }
        }
      }

      // 2. Se o aluno tem student.class preenchido, garante que a turma tenha o ID dele em studentIds
      for (const student of updatedStudents) {
        if (student.status !== 'Apagado' && student.class && student.class.trim() !== '') {
          const matchingClass = activeClasses.find(cls => 
            cls.name.trim().toLowerCase() === student.class.trim().toLowerCase() || cls.id === student.class
          );
          if (matchingClass) {
            const currentIds = matchingClass.studentIds || [];
            if (!currentIds.includes(student.id)) {
              const newIds = [...currentIds, student.id];
              try {
                await services.updateClass(matchingClass.id, { studentIds: newIds });
                matchingClass.studentIds = newIds;
                hasClassChanges = true;
              } catch (e) {
                console.error(`Erro na reconciliação de turma ${matchingClass.id}:`, e);
              }
            }
          }
        }
      }

      setStudents(hasStudentChanges ? [...updatedStudents] : s);
      setClasses(hasClassChanges ? [...updatedClasses] : c);

      setUsers(u);
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

    // Se o aluno foi criado com uma turma vinculada, adiciona o ID do aluno na turma correspondente
    if (created.class && created.class.trim() !== '') {
      const targetClass = classes.find(c => 
        c.status !== 'Apagado' && (
          c.name.trim().toLowerCase() === created.class.trim().toLowerCase() || c.id === created.class
        )
      );
      if (targetClass) {
        const currentStudentIds = targetClass.studentIds || [];
        if (!currentStudentIds.includes(created.id)) {
          const updatedStudentIds = [...currentStudentIds, created.id];
          try {
            await services.updateClass(targetClass.id, { studentIds: updatedStudentIds });
            setClasses(prev => prev.map(c => c.id === targetClass.id ? { ...c, studentIds: updatedStudentIds } : c));
          } catch (e) {
            console.error(`Falha ao sincronizar turma ${targetClass.id} ao adicionar aluno:`, e);
          }
        }
      }
    }

    return created;
  };

  const updateStudent = async (id: string, student: Partial<Student>): Promise<Student> => {
    const prevStudent = students.find(s => s.id === id);
    const updated = await services.updateStudent(id, student);
    setStudents(prev => prev.map(s => s.id === id ? updated : s));

    // Sincronização de turma: se o campo student.class foi modificado
    if (student.class !== undefined) {
      const oldClassName = prevStudent?.class?.trim() || '';
      const newClassName = student.class?.trim() || '';

      if (oldClassName !== newClassName) {
        // 1. Remove o aluno da turma antiga
        if (oldClassName) {
          const oldClass = classes.find(c => 
            c.name.trim().toLowerCase() === oldClassName.toLowerCase() || c.id === oldClassName
          );
          if (oldClass && oldClass.studentIds?.includes(id)) {
            const updatedStudentIds = oldClass.studentIds.filter(sId => sId !== id);
            try {
              await services.updateClass(oldClass.id, { studentIds: updatedStudentIds });
              setClasses(prev => prev.map(c => c.id === oldClass.id ? { ...c, studentIds: updatedStudentIds } : c));
            } catch (e) {
              console.error(`Erro ao desvincular aluno ${id} da turma antiga:`, e);
            }
          }
        }

        // 2. Adiciona o aluno na nova turma
        if (newClassName) {
          const newClass = classes.find(c => 
            c.status !== 'Apagado' && (
              c.name.trim().toLowerCase() === newClassName.toLowerCase() || c.id === newClassName
            )
          );
          if (newClass) {
            const currentStudentIds = newClass.studentIds || [];
            if (!currentStudentIds.includes(id)) {
              const updatedStudentIds = [...currentStudentIds, id];
              try {
                await services.updateClass(newClass.id, { studentIds: updatedStudentIds });
                setClasses(prev => prev.map(c => c.id === newClass.id ? { ...c, studentIds: updatedStudentIds } : c));
              } catch (e) {
                console.error(`Erro ao vincular aluno ${id} na nova turma:`, e);
              }
            }
          }
        }
      }
    }

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

  const deleteStudent = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = students.find(s => s.id === id);
      const cleanMed = cleanAuditTag(prev?.medicalInfo);
      const newMed = audit ? `${buildAuditTag(audit)}${cleanMed}` : prev?.medicalInfo;
      await services.updateStudent(id, { status: 'Apagado', medicalInfo: newMed });
      setStudents(prevList => prevList.map(s => s.id === id ? { ...s, status: 'Apagado', medicalInfo: newMed } : s));
    } else {
      await services.deleteStudent(id, false);
      setStudents(prev => prev.filter(s => s.id !== id));
    }

    // Remove o aluno de qualquer turma em que ele esteja vinculado
    const affectedClasses = classes.filter(c => c.studentIds?.includes(id));
    for (const cls of affectedClasses) {
      const updatedIds = cls.studentIds.filter(sId => sId !== id);
      try {
        await services.updateClass(cls.id, { studentIds: updatedIds });
      } catch (err) {
        console.error(`Erro ao remover aluno ${id} da turma ${cls.id}:`, err);
      }
    }
    if (affectedClasses.length > 0) {
      setClasses(prev => prev.map(c => 
        c.studentIds?.includes(id)
          ? { ...c, studentIds: c.studentIds.filter(sId => sId !== id) }
          : c
      ));
    }
  };

  // ========================
  // CLASSES MUTATIONS
  // ========================
  const addClass = async (c: Partial<Class>): Promise<Class> => {
    const created = await services.createClass(c);
    setClasses(prev => [...prev, created]);

    // Para todos os alunos selecionados na turma: vincula o nome da turma ao perfil do aluno
    if (created.studentIds && created.studentIds.length > 0 && created.name) {
      for (const sId of created.studentIds) {
        try {
          await services.updateStudent(sId, { class: created.name });
        } catch (err) {
          console.error(`Erro ao atualizar turma do aluno ${sId}:`, err);
        }
      }
      setStudents(prev => prev.map(s => 
        created.studentIds.includes(s.id) ? { ...s, class: created.name } : s
      ));
    }

    return created;
  };

  const updateClass = async (id: string, c: Partial<Class>): Promise<Class> => {
    const prevClass = classes.find(item => item.id === id);
    const updated = await services.updateClass(id, c);
    setClasses(prev => prev.map(item => item.id === id ? updated : item));

    const oldStudentIds = prevClass?.studentIds || [];
    const newStudentIds = c.studentIds !== undefined ? (c.studentIds || []) : oldStudentIds;
    const oldName = prevClass?.name || '';
    const newName = c.name || oldName;

    // Alunos desmarcados da turma
    const removedStudentIds = oldStudentIds.filter(sId => !newStudentIds.includes(sId));
    // Alunos recém-adicionados à turma
    const addedStudentIds = newStudentIds.filter(sId => !oldStudentIds.includes(sId));
    // O nome da turma mudou?
    const nameChanged = oldName.trim() !== newName.trim();

    // 1. Limpa a turma dos alunos removidos
    for (const sId of removedStudentIds) {
      try {
        await services.updateStudent(sId, { class: '' });
      } catch (err) {
        console.error(`Erro ao desvincular aluno ${sId} da turma:`, err);
      }
    }

    // 2. Atualiza os alunos adicionados (ou todos os alunos da turma se o nome mudou)
    const studentsToUpdate = nameChanged ? newStudentIds : addedStudentIds;
    for (const sId of studentsToUpdate) {
      try {
        await services.updateStudent(sId, { class: newName });
      } catch (err) {
        console.error(`Erro ao atualizar turma do aluno ${sId}:`, err);
      }
    }

    setStudents(prev => prev.map(s => {
      if (removedStudentIds.includes(s.id)) {
        return { ...s, class: '' };
      }
      if (studentsToUpdate.includes(s.id)) {
        return { ...s, class: newName };
      }
      return s;
    }));

    return updated;
  };

  const deleteClass = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    const targetClass = classes.find(c => c.id === id);
    if (soft) {
      const cleanSched = cleanAuditTag(targetClass?.schedule);
      const newSched = audit ? `${buildAuditTag(audit)}${cleanSched}` : (targetClass?.schedule || '');
      await services.updateClass(id, { status: 'Apagado', schedule: newSched });
      setClasses(prev => prev.map(c => c.id === id ? { ...c, status: 'Apagado', schedule: newSched } : c));
    } else {
      await services.deleteClass(id, false);
      setClasses(prev => prev.filter(c => c.id !== id));
    }

    // Desvincula alunos que pertenciam a essa turma excluída
    if (targetClass && targetClass.studentIds && targetClass.studentIds.length > 0) {
      for (const sId of targetClass.studentIds) {
        try {
          await services.updateStudent(sId, { class: '' });
        } catch (err) {
          console.error(`Erro ao desvincular aluno ${sId} de turma excluída:`, err);
        }
      }
      setStudents(prev => prev.map(s => 
        targetClass.studentIds.includes(s.id) ? { ...s, class: '' } : s
      ));
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

  const deleteTransaction = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = transactions.find(t => t.id === id);
      const prevType = prev?.type || 'Entrada';
      const cleanDesc = prev?.description ? cleanAuditTag(prev.description.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, '')) : '';
      const auditTag = audit ? buildAuditTag(audit) : '';
      const newDesc = `[ORIG_TYPE:${prevType}]${auditTag}${cleanDesc}`;
      const updated = await services.updateTransaction(id, { type: 'Apagado' as any, description: newDesc });
      setTransactions(prevList => prevList.map(t => t.id === id ? updated : t));
    } else {
      await services.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
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

  const deleteFixedExpense = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = fixedExpenses.find(fe => fe.id === id);
      const cleanDesc = cleanAuditTag(prev?.description);
      const auditTag = audit ? buildAuditTag(audit) : '';
      const newDesc = `${auditTag}${cleanDesc}`;
      const updated = await services.updateFixedExpense(id, { status: 'Apagado' as any, description: newDesc });
      setFixedExpenses(prev => prev.map(item => item.id === id ? updated : item));
    } else {
      await services.deleteFixedExpense(id);
      setFixedExpenses(prev => prev.filter(item => item.id !== id));
    }
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

  const deleteInventoryItem = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = inventoryItems.find(i => i.id === id);
      const cleanCat = cleanAuditTag(prev?.category);
      const auditTag = audit ? buildAuditTag(audit) : '';
      const newCat = `${auditTag}${cleanCat}`;
      const newMovements = audit ? [
        ...(prev?.movements || []),
        {
          date: audit.deletedAt,
          type: 'saida' as const,
          quantity: 0,
          user: audit.deletedBy,
          notes: `[EXCLUSÃO] ${audit.reason}`,
        },
      ] : (prev?.movements || []);
      const updated = await services.updateInventoryItem(id, { status: 'Apagado', category: newCat, movements: newMovements });
      setInventoryItems(prevList => prevList.map(i => i.id === id ? updated : i));
    } else {
      await services.deleteInventoryItem(id, false);
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

  const deleteEvent = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = manualEvents.find(e => e.id === id);
      const prevType = prev?.type || 'task';
      const cleanDetails = prev?.details ? cleanAuditTag(prev.details.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, '')) : '';
      const auditTag = audit ? buildAuditTag(audit) : '';
      const newDetails = `[ORIG_TYPE:${prevType}]${auditTag}${cleanDetails}`;
      const updated = await services.updateEvent(id, { type: 'Apagado' as any, details: newDetails });
      setManualEvents(prevList => prevList.map(e => e.id === id ? updated : e));
    } else {
      await services.deleteEvent(id);
      setManualEvents(prev => prev.filter(item => item.id !== id));
    }
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

  const deleteEventType = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = eventTypes.find(t => t.id === id);
      const cleanName = prev?.name ? prev.name.replace(/^\[Apagado\]\s*/, '') : '';
      const cleanDesc = cleanAuditTag(prev?.description);
      const auditTag = audit ? buildAuditTag(audit) : '';
      const newDesc = `${auditTag}${cleanDesc}`;
      const updated = await services.updateEventType(id, { name: `[Apagado] ${cleanName}`, description: newDesc });
      setEventTypes(prevList => prevList.map(t => t.id === id ? updated : t));
    } else {
      await services.deleteEventType(id);
      setEventTypes(prev => prev.filter(t => t.id !== id));
    }
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

  const deleteSystemCategory = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = systemCategories.find(c => c.id === id);
      const prevType = prev?.type || 'student_condition';
      const cleanDesc = prev?.description ? cleanAuditTag(prev.description.replace(/\[ORIG_TYPE:[^\]]+\]\s*/g, '')) : '';
      const auditTag = audit ? buildAuditTag(audit) : '';
      const newDesc = `[ORIG_TYPE:${prevType}]${auditTag}${cleanDesc}`;
      const updated = await services.updateSystemCategory(id, { type: 'Apagado' as any, description: newDesc });
      setSystemCategories(prevList => prevList.map(c => c.id === id ? updated : c));
    } else {
      await services.deleteSystemCategory(id);
      setSystemCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const deleteUser = async (id: string, soft: boolean = true, audit?: DeletionAudit): Promise<void> => {
    if (soft) {
      const prev = users.find(u => u.id === id);
      const prevRole = prev?.role || 'Professor';
      const perms = (prev?.permissions || []).filter(p => !p.startsWith('PREV_ROLE:') && !p.startsWith('DELETION_AUDIT:'));
      const auditPerm = audit ? [`DELETION_AUDIT:${JSON.stringify(audit)}`] : [];
      const newPerms = [`PREV_ROLE:${prevRole}`, ...auditPerm, ...perms];
      const updated = await services.updateUser(id, { role: 'Apagado', permissions: newPerms });
      setUsers(prevList => prevList.map(u => u.id === id ? updated : u));
    } else {
      await services.deleteUser(id);
      setUsers(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateUser = async (id: string, user: Partial<User>): Promise<User> => {
    const updated = await services.updateUser(id, user);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    return updated;
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
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
