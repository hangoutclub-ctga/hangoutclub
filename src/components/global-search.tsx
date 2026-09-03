
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useData } from "@/hooks/use-data";
import { Users, BookOpen, UserCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getDisplayAvatarUrl } from "@/lib/utils";

interface SearchResult {
    type: 'student' | 'class' | 'user';
    id: string;
    name: string;
    details?: string;
    avatarUrl?: string;
    path: string;
}

export const GlobalSearch = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void}) => {
    const router = useRouter();
    const { users, students, classes } = useData();
    const [queryValue, setQueryValue] = useState("");
    const debouncedQuery = useDebounce(queryValue, 300);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const performSearch = useCallback((searchQuery: string) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        const searchResults: SearchResult[] = [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        // Students Search
        students
            .filter(s => s.status !== 'Apagado' && s.name.toLowerCase().includes(lowerCaseQuery))
            .forEach(s => {
                searchResults.push({ type: 'student', id: s.id, name: s.name, details: `Resp: ${s.guardianName}`, avatarUrl: s.avatarUrl, path: '/dashboard/students' });
            });

        // Classes Search
        classes
            .filter(c => c.status !== 'Apagado' && c.name.toLowerCase().includes(lowerCaseQuery))
            .forEach(c => {
                searchResults.push({ type: 'class', id: c.id, name: c.name, details: `Prof: ${c.teacher}`, path: '/dashboard/classes' });
            });

        // Users Search
        users
            .filter(u => u.nickname.toLowerCase().includes(lowerCaseQuery))
            .forEach(u => {
                searchResults.push({ type: 'user', id: u.id, name: u.nickname, details: u.role, avatarUrl: u.avatar, path: '/dashboard/settings' });
            });

        setResults(searchResults.slice(0, 10));
        setIsLoading(false);
    }, [users, students, classes]);

    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery, performSearch]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Buscar alunos, turmas ou funcionários..." value={queryValue} onValueChange={setQueryValue} />
            <CommandList>
                {isLoading ? (
                    <div className="p-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : results.length === 0 && queryValue.length >= 2 ? (
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                ) : (
                    <CommandGroup heading="Resultados Encontrados">
                        {results.map(res => (
                            <CommandItem key={`${res.type}-${res.id}`} onSelect={() => { router.push(res.path); onOpenChange(false); }} className="cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={getDisplayAvatarUrl(res.avatarUrl)} />
                                        <AvatarFallback>{res.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">{res.name}</span>
                                        <span className="text-xs text-muted-foreground">{res.details}</span>
                                    </div>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
