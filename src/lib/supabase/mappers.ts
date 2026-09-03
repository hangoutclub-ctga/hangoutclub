import { Database } from '@/types/database.types';
import { Student, Class, User, Transaction, FixedExpense, InventoryItem, ManualEvent, CommunicationTemplate, Grade, Attendance, StudentDocument, StockMovement } from '@/types';

type Tables = Database['public']['Tables'];

// ========================
// PROFILES / USERS
// ========================
export function toUser(row: Tables['profiles']['Row']): User {
  return {
    id: row.id,
    nickname: row.nickname,
    email: row.email,
    avatar: row.avatar || '',
    role: row.role,
    permissions: row.permissions || [],
    dob: row.dob || undefined,
    phone: row.phone || undefined,
    cellphone: row.cellphone || undefined,
    isProvider: row.is_provider ? 'Sim' : 'Não',
  };
}

export function toUserInsert(user: Partial<User>): Tables['profiles']['Insert'] {
  return {
    id: user.id,
    nickname: user.nickname || '',
    email: user.email || '',
    avatar: user.avatar || null,
    role: user.role || 'Professor',
    permissions: user.permissions || [],
    dob: user.dob || null,
    phone: user.phone || null,
    cellphone: user.cellphone || null,
    is_provider: user.isProvider === 'Sim',
  };
}

// ========================
// STUDENTS
// ========================
export function toStudent(row: Tables['students']['Row']): Student {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url || undefined,
    dob: row.dob || '',
    guardianName: row.guardian_name,
    guardianCpf: row.guardian_cpf,
    email: row.email || undefined,
    phone: row.phone || undefined,
    cep: row.cep || undefined,
    address: row.address,
    addressNumber: row.address_number,
    addressComplement: row.address_complement || undefined,
    medicalInfo: row.medical_info || undefined,
    studentCondition: row.student_condition || 'Integral',
    class: row.class_name || '',
    paymentHistory: Array.isArray(row.payment_history) ? (row.payment_history as any) : [],
    grades: Array.isArray(row.grades) ? (row.grades as Grade[]) : [],
    attendance: Array.isArray(row.attendance) ? (row.attendance as Attendance[]) : [],
    documents: Array.isArray(row.documents) ? (row.documents as StudentDocument[]) : [],
    status: (row.status as 'Ativo' | 'Inativo' | 'Apagado') || 'Ativo',
    monthlyFee: Number(row.monthly_fee) || 0,
    dueDate: row.due_date ?? 5,
    paymentStatus: (row.payment_status as any) || 'nao_pago',
    partialAmount: row.partial_amount ? Number(row.partial_amount) : undefined,
    partialDate: row.partial_date || undefined,
  };
}

export function toStudentInsert(student: Partial<Student>): Tables['students']['Insert'] {
  return {
    id: student.id,
    name: student.name || '',
    avatar_url: student.avatarUrl || null,
    dob: student.dob || '',
    guardian_name: student.guardianName || '',
    guardian_cpf: student.guardianCpf || '',
    email: student.email || null,
    phone: student.phone || null,
    cep: student.cep || null,
    address: student.address || '',
    address_number: student.addressNumber || '',
    address_complement: student.addressComplement || null,
    medical_info: student.medicalInfo || null,
    student_condition: student.studentCondition || 'Integral',
    class_name: student.class || '',
    payment_history: (student.paymentHistory as any) || [],
    grades: (student.grades as any) || [],
    attendance: (student.attendance as any) || [],
    documents: (student.documents as any) || [],
    status: student.status || 'Ativo',
    monthly_fee: student.monthlyFee ?? 0,
    due_date: student.dueDate ?? 5,
    payment_status: student.paymentStatus || 'nao_pago',
    partial_amount: student.partialAmount ?? null,
    partial_date: student.partialDate || null,
  };
}

// ========================
// CLASSES
// ========================
export function toClass(row: Tables['classes']['Row']): Class {
  return {
    id: row.id,
    name: row.name,
    teacherId: row.teacher_id || '',
    teacher: row.teacher || '',
    modality: row.modality || '',
    schedule: row.schedule || '',
    studentIds: row.student_ids || [],
    status: (row.status as 'Ativa' | 'Inativa' | 'Apagado') || 'Ativa',
  };
}

export function toClassInsert(c: Partial<Class>): Tables['classes']['Insert'] {
  return {
    id: c.id,
    name: c.name || '',
    teacher_id: c.teacherId || null,
    teacher: c.teacher || null,
    modality: c.modality || null,
    schedule: c.schedule || null,
    student_ids: c.studentIds || [],
    status: c.status || 'Ativa',
  };
}

// ========================
// TRANSACTIONS
// ========================
export function toTransaction(row: Tables['transactions']['Row']): Transaction {
  return {
    id: row.id,
    type: row.type as 'Entrada' | 'Saída',
    category: row.category as any,
    name: row.name,
    description: row.description,
    value: Number(row.value) || 0,
    date: row.date,
    receiptUrl: row.receipt_url || undefined,
    paymentMethod: row.payment_method || undefined,
  };
}

export function toTransactionInsert(t: Partial<Transaction>): Tables['transactions']['Insert'] {
  return {
    id: t.id,
    type: t.type || 'Entrada',
    category: t.category || 'Outros',
    name: t.name || '',
    description: t.description || '',
    value: t.value ?? 0,
    date: t.date || new Date().toISOString(),
    receipt_url: t.receiptUrl || null,
    payment_method: t.paymentMethod || null,
  };
}

// ========================
// FIXED EXPENSES
// ========================
export function toFixedExpense(row: Tables['fixed_expenses']['Row']): FixedExpense {
  return {
    id: row.id,
    description: row.description,
    value: Number(row.value) || 0,
    status: (row.status as 'Pago' | 'Pendente') || 'Pendente',
    month: row.month,
    year: row.year,
    dueDate: row.due_date,
    receiptUrl: row.receipt_url || undefined,
    paymentMethod: row.payment_method || undefined,
  };
}

export function toFixedExpenseInsert(fe: Partial<FixedExpense>): Tables['fixed_expenses']['Insert'] {
  return {
    id: fe.id,
    description: fe.description || '',
    value: fe.value ?? 0,
    status: fe.status || 'Pendente',
    month: fe.month ?? (new Date().getMonth() + 1),
    year: fe.year ?? new Date().getFullYear(),
    due_date: fe.dueDate ?? 10,
    receipt_url: fe.receiptUrl || null,
    payment_method: fe.paymentMethod || null,
  };
}

// ========================
// INVENTORY
// ========================
export function toInventoryItem(row: Tables['inventory_items']['Row']): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    stock: row.stock,
    minStock: row.min_stock,
    maxStock: row.max_stock,
    imageUrl: row.image_url || '',
    recentMovements: row.recent_movements || 0,
    movements: Array.isArray(row.movements) ? (row.movements as StockMovement[]) : [],
    status: (row.status as 'Ativo' | 'Apagado') || 'Ativo',
  };
}

export function toInventoryItemInsert(item: Partial<InventoryItem>): Tables['inventory_items']['Insert'] {
  return {
    id: item.id,
    name: item.name || '',
    category: item.category || 'Geral',
    stock: item.stock ?? 0,
    min_stock: item.minStock ?? 0,
    max_stock: item.maxStock ?? 100,
    image_url: item.imageUrl || null,
    recent_movements: item.recentMovements ?? 0,
    movements: (item.movements as any) || [],
    status: item.status || 'Ativo',
  };
}

// ========================
// EVENTS / AGENDA
// ========================
export function toEvent(row: Tables['events']['Row']): ManualEvent {
  return {
    id: row.id,
    title: row.title,
    date: new Date(row.date) as any,
    time: row.time || '00:00',
    details: row.details || '',
    type: (row.type as any) || 'task',
    owners: row.owners || [],
    recurrent: row.recurrent || false,
    recurrenceDays: row.recurrence_days || undefined,
    completed: row.completed || false,
  };
}

export function toEventInsert(e: Partial<ManualEvent>): Tables['events']['Insert'] {
  const eventDate = e.date instanceof Date 
    ? e.date.toISOString() 
    : (e.date ? new Date(e.date as any).toISOString() : new Date().toISOString());

  return {
    id: e.id,
    title: e.title || '',
    date: eventDate,
    time: e.time || '00:00',
    details: e.details || '',
    type: e.type || 'task',
    owners: e.owners || [],
    recurrent: e.recurrent ?? false,
    recurrence_days: e.recurrenceDays || null,
    completed: e.completed ?? false,
  };
}

// ========================
// COMMUNICATION TEMPLATES
// ========================
export function toCommunicationTemplate(row: Tables['communication_templates']['Row']): CommunicationTemplate {
  return {
    id: row.id,
    label: row.label,
    subject: row.subject,
    message: row.message,
  };
}
