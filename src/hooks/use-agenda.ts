"use client";

import { useMemo } from 'react';
import { format, getDay, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import type { User, DisplayEvent } from '@/types';
import { useData } from '@/hooks/use-data';
import { isBirthdayOnDay, areSamePerson } from '@/lib/utils';

const dayOfWeekMap: { [key: string]: number } = {
    'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6, 'dom': 0,
};

export const useAgenda = (date: Date | undefined, user: User | null, viewType: 'day' | 'week' = 'day', selectedOwner: string = "todos") => {
    const { manualEvents, classes, students, users } = useData();

    const agendaEvents: DisplayEvent[] = useMemo(() => {
        if (!date || !user) return [];

        const startDate = viewType === 'day' ? date : startOfWeek(date, { weekStartsOn: 0 });
        const endDate = viewType === 'day' ? date : endOfWeek(date, { weekStartsOn: 0 });
        const interval = eachDayOfInterval({ start: startDate, end: endDate });

        let allGeneratedEvents: DisplayEvent[] = [];

        interval.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayIdx = getDay(day);

            const manual = manualEvents
                .filter(e => {
                    if (e.type === 'Apagado') return false;
                    const eventDate = e.date instanceof Date ? e.date : (typeof (e.date as any)?.toDate === 'function' ? (e.date as any).toDate() : new Date(e.date as any));
                    return isSameDay(eventDate, day);
                })
                .map(e => ({
                    id: e.id || Math.random().toString(),
                    task: e.title,
                    time: e.time,
                    details: e.details,
                    type: e.type,
                    owners: e.owners || [],
                    recurrent: e.recurrent,
                    date: day,
                    completed: e.completed
                }));

            const classEvents = classes
                .filter(c => {
                    if (c.status === 'Apagado') return false;
                    const days = c.schedule.toLowerCase().split(' - ')[0].split(', ');
                    return days.some(d => dayOfWeekMap[d] === dayIdx) && c.status === 'Ativa';
                })
                .map(c => ({
                    id: `CLS-${c.id}-${dateKey}`,
                    task: c.name,
                    time: c.schedule.split(' - ')[1] || '00:00',
                    details: `Modalidade: ${c.modality}`,
                    type: 'class' as const,
                    owners: [c.teacher],
                    recurrent: true,
                    date: day,
                    completed: false,
                    classId: c.id
                }));

            // Aniversariantes do dia (com regra estrita: se for aluno e colaborador, exibe apenas UMA vez)
            const birthdayEvents: DisplayEvent[] = [];
            const handledStudentIds = new Set<string>();
            const handledUserIds = new Set<string>();

            // 1. Processa colaboradores cujo aniversário cai neste dia
            users
                .filter(u => u.role !== 'Apagado' && isBirthdayOnDay(u.dob, day))
                .forEach(u => {
                    const matchingStudent = students.find(s => 
                        s.status !== 'Apagado' && (
                            areSamePerson(s.name, u.nickname) ||
                            (Boolean(s.email) && Boolean(u.email) && s.email!.toLowerCase() === u.email!.toLowerCase())
                        )
                    );

                    if (matchingStudent) {
                        handledStudentIds.add(matchingStudent.id);
                    }
                    handledUserIds.add(u.id);

                    const displayName = matchingStudent?.name || u.nickname;
                    const avatar = u.avatar || matchingStudent?.avatarUrl;

                    birthdayEvents.push({
                        id: `BDAY-USER-${u.id}-${dateKey}`,
                        task: `Aniversário: ${displayName}`,
                        time: "00:00",
                        details: `Hoje é o aniversário de ${displayName} (${u.role})!`,
                        type: 'birthday' as const,
                        owners: ['Sistema'],
                        recurrent: true,
                        date: day,
                        completed: false,
                        avatarUrl: avatar,
                        personName: displayName,
                        userId: u.id,
                        studentId: matchingStudent?.id
                    });
                });

            // 2. Processa alunos cujo aniversário cai neste dia
            students
                .filter(s => s.status !== 'Apagado' && isBirthdayOnDay(s.dob, day))
                .forEach(s => {
                    // Se este aluno já foi incluído como colaborador acima, pula para não duplicar!
                    if (handledStudentIds.has(s.id)) {
                        return;
                    }

                    // Verifica se o aluno é também um colaborador
                    const matchingUser = users.find(u => 
                        u.role !== 'Apagado' && (
                            areSamePerson(s.name, u.nickname) ||
                            (Boolean(s.email) && Boolean(u.email) && s.email!.toLowerCase() === u.email!.toLowerCase())
                        )
                    );

                    if (matchingUser) {
                        // Se o colaborador já foi incluído, não duplica
                        if (handledUserIds.has(matchingUser.id)) {
                            return;
                        }
                        handledUserIds.add(matchingUser.id);
                        handledStudentIds.add(s.id);

                        const avatar = matchingUser.avatar || s.avatarUrl;
                        birthdayEvents.push({
                            id: `BDAY-USER-${matchingUser.id}-${dateKey}`,
                            task: `Aniversário: ${s.name}`,
                            time: "00:00",
                            details: `Hoje é o aniversário de ${s.name} (${matchingUser.role})!`,
                            type: 'birthday' as const,
                            owners: ['Sistema'],
                            recurrent: true,
                            date: day,
                            completed: false,
                            avatarUrl: avatar,
                            personName: s.name,
                            userId: matchingUser.id,
                            studentId: s.id
                        });
                        return;
                    }

                    // Aluno exclusivo (não é colaborador)
                    handledStudentIds.add(s.id);
                    birthdayEvents.push({
                        id: `BDAY-STUDENT-${s.id}-${dateKey}`,
                        task: `Aniversário: ${s.name}`,
                        time: "00:00",
                        details: `Hoje é o aniversário de ${s.name}!`,
                        type: 'birthday' as const,
                        owners: ['Sistema'],
                        recurrent: true,
                        date: day,
                        completed: false,
                        avatarUrl: s.avatarUrl,
                        personName: s.name,
                        studentId: s.id
                    });
                });

            allGeneratedEvents = [...allGeneratedEvents, ...manual, ...classEvents, ...birthdayEvents];
        });

        let filtered = allGeneratedEvents;

        // Safeguard extra: garante que nenhuma pessoa física apareça duplicada como aniversariante no mesmo dia
        const seenBirthdayKeys = new Set<string>();
        filtered = filtered.filter(e => {
            if (e.type !== 'birthday') return true;
            const dateStr = format(e.date, 'yyyy-MM-dd');
            const targetName = e.personName || e.task;

            for (const existingKey of seenBirthdayKeys) {
                const [existingDate, ...nameParts] = existingKey.split('_');
                const existingName = nameParts.join('_');
                if (existingDate === dateStr && areSamePerson(existingName, targetName)) {
                    return false;
                }
            }

            seenBirthdayKeys.add(`${dateStr}_${targetName}`);
            return true;
        });

        const canManageAgenda = user.role === 'Admin' || user.role === 'Secretaria';

        if (selectedOwner !== 'todos') {
            filtered = filtered.filter(e => e.owners.includes(selectedOwner) || e.owners.includes('Sistema'));
        } else if (!canManageAgenda) {
            filtered = filtered.filter(e => e.owners.includes(user.nickname) || e.owners.includes('Sistema'));
        }

        return filtered.sort((a, b) => {
            const dateCompare = a.date.getTime() - b.date.getTime();
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });
    }, [date, user, viewType, selectedOwner, manualEvents, classes, students, users]);

    return {
        events: agendaEvents,
        isLoading: false
    };
};
