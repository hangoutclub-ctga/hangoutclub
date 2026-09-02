'use server';

import { collection, getDocs, writeBatch, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { User, CommunicationTemplate } from "@/types";
import bcrypt from 'bcryptjs';


const mockUsers: Omit<User, 'role'> & { role: string }[] = [
    {
      id: "USR-001",
      nickname: "Hangout",
      email: "hangout@hangout.com",
      avatar: "https://i.imgur.com/LliS1J2.png",
      role: 'Admin',
      password: "1234",
      dob: '2023-01-01',
      permissions: [
        'nav:dashboard', 'nav:agenda', 'nav:students', 'nav:classes', 'nav:grades', 'nav:finance', 'nav:inventory', 'nav:communication', 'nav:trash',
        'students:create', 'classes:create', 'finance:edit', 'finance:view', 'inventory:edit', 'permissions:edit',
      ]
    },
    {
      id: "USR-002",
      nickname: "Sidney Xisto",
      email: "sidney@hangout.com",
      avatar: "https://i.imgur.com/8z6zJp7.jpeg",
      role: 'Professor',
      password: "1234",
      dob: '1985-03-10',
      permissions: [
         'nav:dashboard', 'nav:agenda', 'nav:students', 'nav:classes', 'nav:grades', 
      ]
    },
    {
      id: "USR-003",
      nickname: "Patricia lara",
      email: "patricia@hangout.com",
      avatar: "https://i.imgur.com/bE2j2p6.jpeg",
      role: 'Professor',
      password: "1234",
      dob: '1990-07-22',
      permissions: [
         'nav:dashboard', 'nav:agenda', 'nav:students', 'nav:classes', 'nav:grades', 
      ]
    },
    {
      id: "USR-004",
      nickname: "Maisa Gabriele",
      email: "maisa@hangout.com",
      avatar: "https://i.imgur.com/S21f92c.jpeg",
      role: 'Professor',
      password: "1234",
      dob: '1995-02-18',
      permissions: [
         'nav:dashboard', 'nav:agenda', 'nav:students', 'nav:classes', 'nav:grades', 
      ]
    },
     {
      id: "USR-005",
      nickname: "Celia Xisto",
      email: "celia@hangout.com",
      avatar: "https://i.imgur.com/Ipk1fVv.jpeg",
      role: 'Secretaria',
      password: "1234",
      dob: '1998-09-05',
      permissions: [
        'nav:dashboard', 'nav:agenda', 'nav:students', 'nav:classes', 'nav:grades', 'nav:finance', 'nav:inventory', 'nav:communication', 'nav:trash',
        'students:create', 'classes:create', 'finance:view', 'inventory:edit',
      ]
    },
    {
      id: "USR-006",
      nickname: "Adelia",
      email: "adelia@hangout.com",
      avatar: "https://i.imgur.com/7D7gQ5b.png",
      role: 'Diarista',
      password: "1245",
      dob: '1980-01-01',
      permissions: ['nav:agenda']
    }
  ];

const mockCommunicationTemplates: CommunicationTemplate[] = [
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
    },
    { 
        id: 'trial_class', 
        label: '🚀 Confirmação de Aula Experimental',
        subject: "Tudo pronto! Sua aula experimental está confirmada",
        message: "Olá! Estamos ansiosos para receber o(a) {student_name} para sua aula experimental.\n\nData: [Data]\nHorário: [Hora]\n\nRecomendamos chegar com 10 minutos de antecedência. Em caso de imprevisto, por favor nos avise.\n\nAté logo!\nEquipe Hangout Club"
    }
];
  

const defaultCategories = {
    studentConditions: ['Integral', 'Bolsa', 'Desconto'],
    classModalities: ['Regular', 'VIP', 'Acompanhamento'],
    inventoryCategories: ["Material Didático", "Material de Escritório", "Copa", "Limpeza", "Outros"],
    userRoles: ["Admin", "Professor", "Secretaria", "Diarista"],
    communicationTemplates: mockCommunicationTemplates
};

export const seedDatabase = async () => {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const existingUsers = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as User]));
    
    const batch = writeBatch(db);

    for (const mockUser of mockUsers) {
        const userRef = doc(db, "users", mockUser.id);
        const existingUser = existingUsers.get(mockUser.id);
        
        if (existingUser) {
            // User exists. Only restore if they were deleted.
            if(existingUser.role === 'Apagado') {
                batch.update(userRef, { role: mockUser.role });
            }
            // Do not touch the password or any other data of an existing user.
        } else {
            // User does not exist, create them with a hashed password.
            const hashedPassword = await bcrypt.hash(mockUser.password, 10);
            batch.set(userRef, { ...mockUser, password: hashedPassword });
        }
    }
    
    const categoriesDocRef = doc(db, "system", "categories");
    const categoriesDocSnap = await getDocs(collection(db, "system"));
    if (categoriesDocSnap.empty) {
        batch.set(categoriesDocRef, defaultCategories);
    }
    
    await batch.commit();
    console.log("Seed script finished. Users and categories are synchronized.");
};
