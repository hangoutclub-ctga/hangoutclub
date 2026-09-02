
import { Student, Class, Transaction, User, ManualEvent, InventoryItem } from "@/types";

export const mockUsers: User[] = [
  { id: "USR-001", nickname: "Hangout", email: "admin@hangout.com", role: "Admin", avatar: "https://picsum.photos/seed/admin/100/100", permissions: ['nav:dashboard', 'nav:agenda', 'nav:students', 'nav:classes', 'nav:grades', 'nav:finance', 'nav:inventory', 'nav:communication', 'nav:trash'] },
  { id: "USR-002", nickname: "Sidney Xisto", email: "sidney@hangout.com", role: "Professor", avatar: "https://picsum.photos/seed/sidney/100/100" },
  { id: "USR-003", nickname: "Patricia Lara", email: "patricia@hangout.com", role: "Professor", avatar: "https://picsum.photos/seed/patricia/100/100" },
  { id: "USR-004", nickname: "Maisa Gabriele", email: "maisa@hangout.com", role: "Professor", avatar: "https://picsum.photos/seed/maisa/100/100" },
  { id: "USR-005", nickname: "Celia Xisto", email: "celia@hangout.com", role: "Secretaria", avatar: "https://picsum.photos/seed/celia/100/100" },
];

export const mockStudents: Student[] = [
  { 
    id: "STU-001", 
    name: "João Pedro Silva", 
    dob: "2015-05-10", 
    guardianName: "Maria Silva", 
    guardianCpf: "123.456.789-00", 
    email: "joao.pedro.silva@exemplo.com",
    phone: "(11) 98888-7777", 
    address: "Rua das Flores", 
    addressNumber: "123", 
    class: "Regular - Tarde", 
    studentCondition: "Integral", 
    status: "Ativo", 
    monthlyFee: 450, 
    dueDate: 5, 
    attendance: [
        { date: "2023-10-01", status: "present" },
        { date: "2023-10-03", status: "present" },
        { date: "2023-10-05", status: "present" },
        { date: "2023-10-08", status: "absent" },
        { date: "2023-10-10", status: "present" }
    ], 
    grades: [
        { subject: "Escrita 1", periodType: "Semestre", periodNumber: 1, grade: 85, evaluationDate: "2023-10-01" },
        { subject: "Oral", periodType: "Semestre", periodNumber: 1, grade: 92, evaluationDate: "2023-10-15" }
    ], 
    paymentHistory: [
        { date: "2023-08-05", description: "Mensalidade Agosto", amount: 450, status: "Pago" },
        { date: "2023-09-05", description: "Mensalidade Setembro", amount: 450, status: "Pago" },
        { date: "2023-10-05", description: "Mensalidade Outubro", amount: 450, status: "Pago" }
    ],
    documents: [
      { name: "Certificado de Matrícula", type: "pdf", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", category: "Geral" },
      { name: "Foto do RG", type: "image", url: "https://picsum.photos/seed/rg/400/300", category: "Geral" }
    ]
  },
  { 
    id: "STU-002", 
    name: "Ana Beatriz Rocha", 
    dob: "2016-08-22", 
    guardianName: "Carlos Rocha", 
    guardianCpf: "234.567.890-11", 
    email: "ana.be.rocha@exemplo.com",
    phone: "(11) 97777-6666", 
    address: "Av. Paulista", 
    addressNumber: "1500", 
    class: "VIP - Manhã", 
    studentCondition: "Desconto", 
    status: "Ativo", 
    monthlyFee: 600, 
    dueDate: 10, 
    attendance: [
        { date: "2023-10-02", status: "present" },
        { date: "2023-10-04", status: "justified" },
        { date: "2023-10-06", status: "present" }
    ], 
    grades: [
        { subject: "Escrita 1", periodType: "Semestre", periodNumber: 1, grade: 78, evaluationDate: "2023-10-02" }
    ], 
    paymentHistory: [
        { date: "2023-09-10", description: "Mensalidade Setembro", amount: 600, status: "Pago" },
        { date: "2023-10-10", description: "Mensalidade Outubro", amount: 600, status: "Pago" }
    ] 
  },
  { 
    id: "STU-003", 
    name: "Lucas Mendes", 
    dob: "2014-12-05", 
    guardianName: "Fernanda Mendes", 
    guardianCpf: "345.678.901-22", 
    email: "lucas.mendes.edu@exemplo.com",
    phone: "(11) 96666-5555", 
    address: "Rua do Porto", 
    addressNumber: "45", 
    class: "Regular - Tarde", 
    studentCondition: "Integral", 
    status: "Ativo", 
    monthlyFee: 450, 
    dueDate: 5, 
    attendance: [
        { date: "2023-10-01", status: "present" },
        { date: "2023-10-03", status: "present" }
    ], 
    grades: [], 
    paymentHistory: [
        { date: "2023-10-05", description: "Mensalidade Outubro", amount: 450, status: "Pago" }
    ] 
  },
  { 
    id: "STU-004", 
    name: "Mariana Costa", 
    dob: "2017-02-14", 
    guardianName: "Paulo Costa", 
    guardianCpf: "456.789.012-33", 
    email: "mari.costa@exemplo.com",
    phone: "(11) 95555-4444", 
    address: "Rua das Palmeiras", 
    addressNumber: "88", 
    class: "", // Sem turma
    studentCondition: "Integral", 
    status: "Ativo", 
    monthlyFee: 450, 
    dueDate: 15, 
    attendance: [], 
    grades: [], 
    paymentHistory: [] 
  },
];

export const mockClasses: Class[] = [
  { id: "CLS-001", name: "Regular - Tarde", teacherId: "USR-002", teacher: "Sidney Xisto", modality: "Regular", schedule: "seg, qua, sex - 14:00", studentIds: ["STU-001", "STU-003"], status: "Ativa" },
  { id: "CLS-002", name: "VIP - Manhã", teacherId: "USR-003", teacher: "Patricia Lara", modality: "VIP", schedule: "ter, qui, sab - 09:00", studentIds: ["STU-002"], status: "Ativa" },
];

export const mockTransactions: Transaction[] = [
  { id: "TRX-001", type: "Entrada", category: "Aluno", name: "João Pedro Silva", description: "Mensalidade Outubro", value: 450, date: "2024-10-05T10:00:00Z" },
  { id: "TRX-002", type: "Saída", category: "Fornecedor", name: "Papelaria ABC", description: "Material de Escritório", value: 120, date: "2024-10-12T14:00:00Z" },
  { id: "TRX-003", type: "Saída", category: "Despesa Fixa", name: "Imobiliária Regional", description: "Aluguel Sede", value: 1500, date: "2024-10-10T09:00:00Z" },
  { id: "TRX-004", type: "Entrada", category: "Aluno", name: "Ana Beatriz Rocha", description: "Mensalidade Setembro", value: 600, date: "2024-09-10T10:00:00Z" },
  { id: "TRX-005", type: "Saída", category: "Fornecedor", name: "Limpeza Total", description: "Produtos de Limpeza", value: 85, date: "2024-09-15T16:00:00Z" },
  { id: "TRX-006", type: "Entrada", category: "Outros", name: "Venda de Uniforme", description: "Camiseta G", value: 45, date: "2024-08-20T11:00:00Z" },
  { id: "TRX-007", type: "Saída", category: "Despesa Fixa", name: "CPFL", description: "Energia Elétrica", value: 340, date: "2024-08-15T09:00:00Z" },
  { id: "TRX-008", type: "Entrada", category: "Aluno", name: "Lucas Mendes", description: "Mensalidade Julho", value: 450, date: "2024-07-05T10:00:00Z" },
  { id: "TRX-009", type: "Entrada", category: "Aluno", name: "João Pedro Silva", description: "Mensalidade Novembro", value: 450, date: "2024-11-05T10:00:00Z" },
  { id: "TRX-010", type: "Saída", category: "Fornecedor", name: "Supermercado Extra", description: "Copa e Cozinha", value: 215, date: "2024-11-10T14:00:00Z" },
  { id: "TRX-011", type: "Entrada", category: "Outros", name: "Venda de Livro", description: "Livro Nível 1", value: 120, date: "2024-12-01T09:00:00Z" },
  { id: "TRX-012", type: "Saída", category: "Despesa Fixa", name: "Internet Fibra", description: "Assinatura Mensal", value: 120, date: "2024-12-05T10:00:00Z" },
];

export const mockEvents: ManualEvent[] = [
  { id: "EVT-001", title: "Reunião de Planejamento", date: new Date() as any, time: "08:00", details: "Alinhamento semanal", type: "meeting", owners: ["Hangout"], recurrent: true, recurrenceDays: ['seg'], completed: false },
  { id: "EVT-002", title: "Aula Experimental - Maria", date: new Date() as any, time: "15:00", details: "Interessada na Turma VIP", type: "trial", owners: ["Sidney Xisto"], recurrent: false, completed: false },
];

export const mockInventoryItems: InventoryItem[] = [
  { 
    id: "INV-001", 
    name: "Livro Nível 1", 
    category: "Material Didático", 
    stock: 15, 
    minStock: 5, 
    maxStock: 50, 
    imageUrl: "https://picsum.photos/seed/book/200/200", 
    recentMovements: 2, 
    movements: [
        { date: "2023-10-01", type: "entrada", quantity: 20, user: "Celia Xisto", notes: "Compra fornecedor" },
        { date: "2023-10-05", type: "saida", quantity: 5, user: "Sidney Xisto", notes: "Uso Turma Regular" }
    ], 
    status: "Ativo" 
  },
  { 
    id: "INV-002", 
    name: "Folha Sulfite A4", 
    category: "Material de Escritório", 
    stock: 2, 
    minStock: 10, 
    maxStock: 100, 
    imageUrl: "https://picsum.photos/seed/paper/200/200", 
    recentMovements: 0, 
    movements: [
        { date: "2023-09-15", type: "entrada", quantity: 50, user: "Celia Xisto", notes: "Reposição mensal" },
        { date: "2023-10-10", type: "saida", quantity: 48, user: "Sistema", notes: "Consumo geral secretaria" }
    ], 
    status: "Ativo" 
  },
  { 
    id: "INV-003", 
    name: "Detergente 500ml", 
    category: "Limpeza", 
    stock: 1, 
    minStock: 4, 
    maxStock: 20, 
    imageUrl: "https://picsum.photos/seed/soap/200/200", 
    recentMovements: 0, 
    movements: [], 
    status: "Ativo" 
  },
];
