import type { Session } from 'next-auth';

export type Role = 'Admin' | 'Professor' | 'Secretaria' | 'Diarista';

export type User = {
  id: string;
  nickname: string;
  email: string;
  avatar: string;
  role: string;
  password?: string;
  permissions?: string[];
  dob?: string;
  phone?: string;
  cellphone?: string;
  isProvider?: string;
};

export interface CustomSession extends Session {
  accessToken?: string;
}

export type Grade = {
  subject: string;
  periodType: 'Semestre';
  periodNumber: number;
  grade: number;
  evaluationDate?: string;
};

export type Attendance = {
    date: string;
    status: 'present' | 'absent' | 'justified';
}

export type StudentDocument = {
  name: string;
  type: 'image' | 'pdf' | 'link';
  url: string;
  category: string;
};

export type Student = {
  id: string;
  name: string;
  avatarUrl?: string;
  dob: string;
  guardianName: string;
  guardianCpf: string;
  email?: string;
  phone?: string;
  cep?: string;
  address: string;
  addressNumber: string;
  addressComplement?: string;
  medicalInfo?: string;
  studentCondition: string;
  class: string;
  paymentHistory: { date: string; description: string; amount: number; status: 'Pago' | 'Parcial' | 'Não Pago' }[];
  grades: Grade[];
  status: 'Ativo' | 'Inativo' | 'Apagado';
  monthlyFee: number;
  dueDate: number; // Day of the month
  attendance: Attendance[];
  paymentStatus?: 'pago' | 'parcial' | 'nao_pago';
  partialAmount?: number;
  partialDate?: string;
  documents?: StudentDocument[];
};

export type Class = {
  id: string;
  name: string;
  teacherId: string;
  teacher: string;
  modality: string;
  schedule: string;
  studentIds: string[];
  status: 'Ativa' | 'Inativa' | 'Apagado';
};

export type Transaction = {
    id: string;
    type: 'Entrada' | 'Saída';
    description: string;
    category: 'Fornecedor' | 'Aluno' | 'Despesa Fixa' | 'Outros';
    name: string; // 'Fornecedor' or 'Cliente' name
    date: string;
    value: number;
    receiptUrl?: string;
    paymentMethod?: string;
};

export type FixedExpense = {
    id: string;
    description: string;
    value: number;
    status: 'Pago' | 'Pendente';
    month: number;
    year: number;
    dueDate: number; // Day of the month
    receiptUrl?: string;
    paymentMethod?: string;
}

export type StockMovement = {
    date: string;
    type: 'entrada' | 'saida';
    quantity: number;
    user: string;
    notes?: string;
}

export type InventoryItem = {
    id: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    maxStock: number;
    imageUrl: string;
    recentMovements: number;
    movements: StockMovement[];
    status: 'Ativo' | 'Apagado';
}

export type ManualEvent = {
    id?: string;
    title: string;
    date: import("firebase/firestore").Timestamp;
    time: string;
    details: string;
    type: 'task' | 'meeting' | 'trial' | 'test' | 'planning';
    owners: string[]; 
    recurrent: boolean;
    recurrenceDays?: string[];
    completed: boolean;
};

export type DisplayEvent = {
    id: string;
    task: string;
    time: string;
    details: string;
    type: string;
    owners: string[]; 
    recurrent: boolean;
    recurrenceDays?: string[];
    date: Date;
    completed?: boolean;
    classId?: string;
};

export type CommunicationTemplate = {
    id: string;
    label: string;
    subject: string;
    message: string;
}

export type Attachment = {
  name: string;
  type: string;
  size: number;
  dataUri: string;
};
