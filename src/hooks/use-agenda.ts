"use client";

import { useMemo } from 'react';
import { format, getDay, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import type { User, DisplayEvent } from '@/types';
import { useData } from '@/hooks/use-data';
import { isBirthdayOnDay } from '@/lib/utils';

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

            const studentBirthdays = students
                .filter(s => s.status !== 'Apagado' && isBirthdayOnDay(s.dob, day))
                .map(s => ({
                    id: `BDAY-STUDENT-${s.id}-${dateKey}`,
                    task: `Aniversário: ${s.name}`,
                    time: "00:00",
                    details: `Hoje é o aniversário de ${s.name}!`,
                    type: 'birthday' as const,
                    owners: ['Sistema'],
                    recurrent: true,
                    date: day,
                    completed: false
                }));

            const userBirthdays = users
                .filter(u => isBirthdayOnDay(u.dob, day))
                .map(u => ({
                    id: `BDAY-USER-${u.id}-${dateKey}`,
                    task: `Aniversário: ${u.nickname}`,
                    time: "00:00",
                    details: `Hoje é o aniversário de ${u.nickname} (${u.role})!`,
                    type: 'birthday' as const,
                    owners: ['Sistema'],
                    recurrent: true,
                    date: day,
                    completed: false
                }));

            allGeneratedEvents = [...allGeneratedEvents, ...manual, ...classEvents, ...studentBirthdays, ...userBirthdays];
        });

        let filtered = allGeneratedEvents;
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
