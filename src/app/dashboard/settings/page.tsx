
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, User as UserIcon, Briefcase, PlusCircle, Edit, Trash2, Save, CalendarIcon, Menu, ChevronLeft, Home, Loader2, Tags, RotateCcw, Users, Info, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn, getDisplayAvatarUrl } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { EmployeeForm } from "./employee-form";
import { CategoryManager } from "./category-manager";
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES, DEFAULT_ROLE_PERMISSIONS, getDefaultPermissionsForRole } from "@/lib/permissions";
import { useData } from "@/hooks/use-data";
import { updateUser, createUser } from "@/services/users.service";
import { ImagePicker } from "@/components/image-picker";
import { format, parse, isValid } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useLoading } from "@/hooks/use-loading";
import { createClient } from "@/lib/supabase/client";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

const profileSchema = z.object({
  nickname: z.string().min(2, "Nome obrigatório."),
  email: z.string().email("E-mail inválido."),
  dob: z.date().optional().nullable(),
  phone: z.string().optional(),
  cellphone: z.string().optional(),
  isProvider: z.string().optional().default("Professor(a)"),
  avatar: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória."),
  newPassword: z.string().min(4, "A nova senha deve ter pelo menos 4 caracteres."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const PermissionsManager = () => {
    const isMobile = useIsMobile();
    const { users, refetchData, categories } = useData();
    const { user: authUser, refreshUser } = useAuth();
    
    // Mode: 'role' (Por Cargo) | 'user' (Por Colaborador)
    const [permMode, setPermMode] = useState<'role' | 'user'>('role');
    
    // State for Role Mode
    const rolesList = React.useMemo(() => {
        const defaultRoles = ["Admin", "Professor", "Secretaria"];
        const custom = categories.userRoles || [];
        return Array.from(new Set([...defaultRoles, ...custom]));
    }, [categories.userRoles]);

    const [selectedRole, setSelectedRole] = useState<string>("Professor");
    const [rolePermsMap, setRolePermsMap] = useState<Record<string, string[]>>({});

    // State for User Mode
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [localUsers, setLocalUsers] = useState<User[]>([]);

    const [isSaving, setIsSaving] = useState(false);

    // Initialize state from existing users
    React.useEffect(() => {
        const activeUsers = users.filter(u => u.role !== 'Apagado');
        setLocalUsers(activeUsers);

        // Build role permissions map: prefer what existing users of this role have, fallback to system defaults
        const newMap: Record<string, string[]> = {};
        rolesList.forEach(role => {
            if (role === 'Admin') {
                newMap[role] = ALL_PERMISSIONS.map(p => p.id);
            } else {
                const roleUsersWithPerms = activeUsers.filter(u => u.role === role && u.permissions && u.permissions.length > 0);
                if (roleUsersWithPerms.length > 0) {
                    newMap[role] = [...roleUsersWithPerms[0].permissions!];
                } else {
                    newMap[role] = getDefaultPermissionsForRole(role);
                }
            }
        });
        setRolePermsMap(prev => ({ ...newMap, ...prev }));
    }, [users, rolesList]);

    const selectedUser = localUsers.find(u => u.id === selectedUserId);
    const activeRolePerms = rolePermsMap[selectedRole] || getDefaultPermissionsForRole(selectedRole);
    const targetUsersForRole = localUsers.filter(u => u.role === selectedRole);

    // Handlers for Role Mode
    const handleRolePermChange = (permissionId: string, checked: boolean) => {
        if (selectedRole === 'Admin') return;
        setRolePermsMap(prev => {
            const current = prev[selectedRole] || getDefaultPermissionsForRole(selectedRole);
            const updated = checked 
                ? Array.from(new Set([...current, permissionId])) 
                : current.filter(p => p !== permissionId);
            return { ...prev, [selectedRole]: updated };
        });
    };

    const handleResetRoleDefaults = () => {
        setRolePermsMap(prev => ({
            ...prev,
            [selectedRole]: getDefaultPermissionsForRole(selectedRole)
        }));
        toast({ title: "Padrão restaurado", description: `Permissões padrão de ${selectedRole} restauradas na tela.` });
    };

    const onSaveRolePermissions = async () => {
        if (selectedRole === 'Admin') {
            toast({ title: "Informação", description: "O perfil de Administrador possui todas as permissões permanentemente." });
            return;
        }
        setIsSaving(true);
        try {
            const permsToApply = rolePermsMap[selectedRole] || getDefaultPermissionsForRole(selectedRole);
            const targetUsers = localUsers.filter(u => u.role === selectedRole);

            // Apply to all users with this role in Supabase
            await Promise.all(
                targetUsers.map(u => updateUser(u.id, { permissions: permsToApply }))
            );

            // Update local memory state
            setLocalUsers(prev => prev.map(u => u.role === selectedRole ? { ...u, permissions: permsToApply } : u));

            // Refresh current user session if affected
            if (authUser?.role === selectedRole) {
                await refreshUser();
            }
            await refetchData();

            toast({ 
                title: "Permissões de Cargo Salvas!", 
                description: `Permissões atualizadas e propagadas para ${targetUsers.length} colaborador(es) com o cargo ${selectedRole}.` 
            });
        } catch (err: any) {
            console.error("Erro ao salvar permissões do cargo:", err);
            toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    // Handlers for User Mode
    const handleUserPermChange = (permissionId: string, checked: boolean) => {
        if (!selectedUser || selectedUser.role === 'Admin') return;
        setLocalUsers(prev => prev.map(u => {
            if (u.id === selectedUserId) {
                const current = u.permissions || [];
                const updated = checked
                    ? Array.from(new Set([...current, permissionId]))
                    : current.filter(p => p !== permissionId);
                return { ...u, permissions: updated };
            }
            return u;
        }));
    };

    const handleResetUserToRoleDefault = () => {
        if (!selectedUser) return;
        const roleDefault = rolePermsMap[selectedUser.role] || getDefaultPermissionsForRole(selectedUser.role);
        setLocalUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, permissions: roleDefault } : u));
        toast({ title: "Padrão aplicado", description: `Permissões de ${selectedUser.nickname} redefinidas para o padrão do cargo (${selectedUser.role}).` });
    };

    const onSaveUserPermissions = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            await updateUser(selectedUser.id, { permissions: selectedUser.permissions });
            if (authUser?.id === selectedUser.id) {
                await refreshUser();
            }
            await refetchData();
            toast({ title: "Permissões Salvas!", description: `Permissões de ${selectedUser.nickname} atualizadas com sucesso.` });
        } catch (err: any) {
            console.error("Erro ao salvar permissões do usuário:", err);
            toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pb-4">
                <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-5 w-5 text-accent"/>
                    <CardTitle className="text-lg sm:text-xl">Gerenciamento de Permissões</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                    Configure os acessos por tipo de funcionário (cargo) ou personalize perfis individuais.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                {/* Seletor de Modo: Por Cargo vs Por Colaborador */}
                <div className="flex flex-wrap gap-2 p-1 bg-muted/60 rounded-xl max-w-md border">
                    <Button
                        type="button"
                        variant={permMode === 'role' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPermMode('role')}
                        className={cn("flex-1 text-xs h-9 font-bold", permMode === 'role' && "bg-accent text-white shadow-sm")}
                    >
                        <Briefcase className="h-4 w-4 mr-2" /> Por Cargo (Tipo de Funcionário)
                    </Button>
                    <Button
                        type="button"
                        variant={permMode === 'user' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPermMode('user')}
                        className={cn("flex-1 text-xs h-9 font-bold", permMode === 'user' && "bg-accent text-white shadow-sm")}
                    >
                        <UserIcon className="h-4 w-4 mr-2" /> Por Colaborador
                    </Button>
                </div>

                {/* ============================================================== */}
                {/* MODO 1: CONFIGURAÇÃO POR CARGO (TIPO DE FUNCIONÁRIO)           */}
                {/* ============================================================== */}
                {permMode === 'role' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Seletor de Cargos */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Escolha o Tipo de Funcionário (Cargo)
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {rolesList.map(role => {
                                    const count = localUsers.filter(u => u.role === role).length;
                                    const isSelected = selectedRole === role;
                                    return (
                                        <Button
                                            key={role}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => setSelectedRole(role)}
                                            className={cn(
                                                "h-10 text-xs sm:text-sm font-semibold transition-all",
                                                isSelected && "bg-accent text-white ring-2 ring-accent/30 shadow-sm"
                                            )}
                                        >
                                            {role}
                                            <Badge variant={isSelected ? "secondary" : "outline"} className={cn("ml-2 text-[10px]", isSelected ? "bg-white/20 text-white border-none" : "text-muted-foreground")}>
                                                {count} {count === 1 ? 'colaborador' : 'colaboradores'}
                                            </Badge>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bloco de Informações / Permissões do Cargo */}
                        <div className="border rounded-2xl p-4 sm:p-6 bg-card shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-4">
                                <div>
                                    <h3 className="font-bold text-base sm:text-lg text-primary flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-accent" /> Permissões do Cargo: {selectedRole}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        As alterações salvas aqui serão aplicadas a todos os {targetUsersForRole.length} colaborador(es) com o cargo <strong>{selectedRole}</strong>.
                                    </p>
                                </div>
                                {selectedRole !== 'Admin' && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleResetRoleDefaults}
                                        className="h-8 text-xs text-muted-foreground hover:text-primary self-start sm:self-auto"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restaurar Padrão do Cargo
                                    </Button>
                                )}
                            </div>

                            {selectedRole === 'Admin' && (
                                <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3 text-xs sm:text-sm text-primary">
                                    <Info className="h-5 w-5 text-accent shrink-0" />
                                    <span>O cargo de <strong>Administrador</strong> possui acesso total e irrestrito a todas as funcionalidades do sistema por padrão.</span>
                                </div>
                            )}

                            {/* Grupos de Permissões */}
                            <div className="space-y-6">
                                {PERMISSION_CATEGORIES.map(category => {
                                    const permsInCategory = ALL_PERMISSIONS.filter(p => p.category === category.id);
                                    if (permsInCategory.length === 0) return null;

                                    return (
                                        <div key={category.id} className="space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {category.label}
                                            </h4>
                                            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                                {permsInCategory.map(p => {
                                                    const isAdmin = selectedRole === 'Admin';
                                                    const isChecked = isAdmin || activeRolePerms.includes(p.id);

                                                    return (
                                                        <div 
                                                            key={p.id} 
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-xl border transition-colors",
                                                                isChecked ? "bg-accent/5 border-accent/30" : "bg-muted/10 border-border/60 hover:bg-muted/20"
                                                            )}
                                                        >
                                                            <Label 
                                                                htmlFor={`role-${selectedRole}-${p.id}`} 
                                                                className="text-xs font-medium cursor-pointer flex-1 leading-snug pr-2"
                                                            >
                                                                {p.label}
                                                            </Label>
                                                            <Switch
                                                                id={`role-${selectedRole}-${p.id}`}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => handleRolePermChange(p.id, checked)}
                                                                disabled={isAdmin}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Ações do Cargo */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Users className="h-4 w-4 text-accent" />
                                    <span>Impacta <strong>{targetUsersForRole.length}</strong> colaborador(es) no sistema.</span>
                                </div>
                                <Button 
                                    size="lg" 
                                    className="bg-accent hover:bg-accent/90 h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto font-bold shadow-md shadow-accent/20"
                                    onClick={onSaveRolePermissions} 
                                    disabled={selectedRole === 'Admin' || isSaving}
                                >
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                                    Salvar e Aplicar a Todos os {selectedRole}s
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* MODO 2: CONFIGURAÇÃO POR COLABORADOR INDIVIDUAL                */}
                {/* ============================================================== */}
                {permMode === 'user' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="max-w-md">
                            <Label htmlFor="user-select" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Selecione o Colaborador
                            </Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger id="user-select" className="h-11">
                                    <SelectValue placeholder="Escolha um colaborador para personalizar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {localUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.nickname} - Cargo: {user.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedUser ? (
                            <div className="border rounded-2xl p-4 sm:p-6 bg-card shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-4">
                                    <div>
                                        <h3 className="font-bold text-base sm:text-lg text-primary flex items-center gap-2">
                                            <UserIcon className="h-5 w-5 text-accent" /> Permissões Individuais: {selectedUser.nickname}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Cargo Atual: <strong className="text-primary">{selectedUser.role}</strong> &bull; E-mail: {selectedUser.email}
                                        </p>
                                    </div>
                                    {selectedUser.role !== 'Admin' && (
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={handleResetUserToRoleDefault}
                                            className="h-8 text-xs text-muted-foreground hover:text-primary self-start sm:self-auto"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restaurar Padrão do Cargo ({selectedUser.role})
                                        </Button>
                                    )}
                                </div>

                                {selectedUser.role === 'Admin' && (
                                    <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3 text-xs sm:text-sm text-primary">
                                        <Info className="h-5 w-5 text-accent shrink-0" />
                                        <span>Este usuário é Administrador e possui acesso irrestrito a todo o sistema.</span>
                                    </div>
                                )}

                                {/* Grupos de Permissões */}
                                <div className="space-y-6">
                                    {PERMISSION_CATEGORIES.map(category => {
                                        const permsInCategory = ALL_PERMISSIONS.filter(p => p.category === category.id);
                                        if (permsInCategory.length === 0) return null;

                                        return (
                                            <div key={category.id} className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {category.label}
                                                </h4>
                                                <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                                    {permsInCategory.map(p => {
                                                        const isAdmin = selectedUser.role === 'Admin';
                                                        const isChecked = isAdmin || (selectedUser.permissions?.includes(p.id) ?? false);

                                                        return (
                                                            <div 
                                                                key={p.id} 
                                                                className={cn(
                                                                    "flex items-center justify-between p-3 rounded-xl border transition-colors",
                                                                    isChecked ? "bg-accent/5 border-accent/30" : "bg-muted/10 border-border/60 hover:bg-muted/20"
                                                                )}
                                                            >
                                                                <Label 
                                                                    htmlFor={`user-${selectedUser.id}-${p.id}`} 
                                                                    className="text-xs font-medium cursor-pointer flex-1 leading-snug pr-2"
                                                                >
                                                                    {p.label}
                                                                </Label>
                                                                <Switch
                                                                    id={`user-${selectedUser.id}-${p.id}`}
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) => handleUserPermChange(p.id, checked)}
                                                                    disabled={isAdmin}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                    <Button 
                                        size="lg" 
                                        className="bg-accent hover:bg-accent/90 h-10 sm:h-12 px-6 sm:px-8 w-full sm:w-auto font-bold shadow-md shadow-accent/20"
                                        onClick={onSaveUserPermissions} 
                                        disabled={selectedUser.role === 'Admin' || isSaving}
                                    >
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                                        Salvar Permissões de {selectedUser.nickname}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center border rounded-2xl bg-muted/10 space-y-2">
                                <UserIcon className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                                <p className="text-sm font-semibold text-primary">Nenhum colaborador selecionado</p>
                                <p className="text-xs text-muted-foreground">Escolha um colaborador no seletor acima para ver e editar suas permissões específicas.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const SystemManagementPanel = () => {
    const isMobile = useIsMobile();
    const { users, refetchData, deleteUser } = useData();
    const { user: authUser, refreshUser } = useAuth();
    const [employees, setEmployees] = useState<User[]>([]);
    const [editingEmployee, setEditingEmployee] = useState<User | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    React.useEffect(() => {
        setEmployees(users.filter(u => u.role !== 'Apagado'));
    }, [users]);

    const handleSaveEmployee = async (data: any) => {
        try {
            if (editingEmployee) {
                const roleChanged = data.role && data.role !== editingEmployee.role;
                const updatePayload: any = { ...data };
                if (roleChanged) {
                    updatePayload.permissions = getDefaultPermissionsForRole(data.role);
                }
                await updateUser(editingEmployee.id, updatePayload);
                if (authUser?.id === editingEmployee.id) {
                    await refreshUser();
                }
                toast({ title: "Funcionário Atualizado!", description: "Dados salvos com sucesso." });
            } else {
                const defaultPerms = getDefaultPermissionsForRole(data.role || 'Professor');
                const created = await createUser({ ...data, permissions: defaultPerms });
                if (created && created.id) {
                    await updateUser(created.id, { permissions: defaultPerms });
                }
                toast({ title: "Funcionário Cadastrado!", description: "Novo colaborador salvo com permissões padrão do cargo." });
            }
            await refetchData();
            setIsFormOpen(false);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
        }
    };

    return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl text-primary">Equipe Hangout Club</CardTitle>
            <Button size="sm" onClick={() => { setEditingEmployee(undefined); setIsFormOpen(true); }} className="bg-accent h-9 sm:h-10 text-[10px] sm:text-sm">
                <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4"/> Novo
            </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow>
                        <TableHead className="font-bold text-[10px] sm:text-sm">Colaborador</TableHead>
                        <TableHead className="font-bold text-[10px] sm:text-sm">Cargo</TableHead>
                        <TableHead className="text-right font-bold text-[10px] sm:text-sm">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map(user => (
                        <TableRow key={user.id} className="hover:bg-muted/5">
                            <TableCell className="p-2 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
                                        <img src={getDisplayAvatarUrl(user.avatar)} alt={user.nickname} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-[10px] sm:text-sm truncate">{user.nickname}</span>
                                        <span className="text-[8px] sm:text-[10px] text-muted-foreground truncate">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4">
                                <span className="text-[8px] sm:text-xs font-medium px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">{user.role}</span>
                            </TableCell>
                            <TableCell className="text-right p-2 sm:p-4">
                                <div className="flex justify-end gap-0.5 sm:gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-primary" onClick={() => { setEditingEmployee(user); setIsFormOpen(true); }}><Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive" onClick={() => setUserToDelete(user)}><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle></DialogHeader>
                <EmployeeForm employee={editingEmployee} onSave={handleSaveEmployee} onCancel={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
            open={!!userToDelete}
            onOpenChange={(open) => !open && setUserToDelete(null)}
            itemName={userToDelete?.nickname || userToDelete?.email}
            itemType="o colaborador"
            title="Confirmar Exclusão de Colaborador"
            onConfirm={async (audit) => {
                if (!userToDelete) return;
                try {
                    await deleteUser(userToDelete.id, true, audit);
                    toast({ title: "Funcionário movido para a Lixeira!", description: "Você pode restaurá-lo ou excluí-lo definitivamente na Lixeira." });
                    await refetchData();
                    setUserToDelete(null);
                } catch (err: any) {
                    toast({ variant: 'destructive', title: "Erro ao remover", description: err.message });
                }
            }}
        />
      </CardContent>
    </Card>
    )
}

export default function SettingsPage() {
  const { user, hasPermission, refreshUser } = useAuth();
  const { refetchData } = useData();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
        nickname: user?.nickname || "", 
        avatar: user?.avatar || "",
        email: user?.email || "",
        dob: user?.dob ? new Date(user.dob) : undefined,
        phone: user?.phone || "",
        cellphone: user?.cellphone || "",
        isProvider: user?.isProvider || "Professor(a)"
    }, 
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        nickname: user.nickname || "",
        avatar: user.avatar || "",
        email: user.email || "",
        dob: user.dob ? new Date(user.dob) : undefined,
        phone: user.phone || "",
        cellphone: user.cellphone || "",
        isProvider: user.isProvider || "Professor(a)"
      });
      if (user.dob) {
        setManualDate(format(new Date(user.dob), 'dd/MM/yyyy'));
      }
    }
  }, [user, profileForm]);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const canEditPermissions = hasPermission('permissions:edit');
  const [manualDate, setManualDate] = useState<string>(user?.dob ? format(new Date(user.dob), 'dd/MM/yyyy') : '');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
    setManualDate(value);
    if (value.length === 10) {
        const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) profileForm.setValue('dob', parsedDate, { shouldValidate: true });
    }
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
      if (!user?.id) {
        toast({ variant: 'destructive', title: "Erro", description: "Usuário não autenticado." });
        return;
      }
      setIsSavingProfile(true);
      try {
        await updateUser(user.id, {
          nickname: data.nickname,
          avatar: data.avatar,
          dob: data.dob ? format(data.dob, 'yyyy-MM-dd') : undefined,
          phone: data.phone,
          cellphone: data.cellphone,
          isProvider: data.isProvider,
        });
        await refreshUser();
        await refetchData();
        toast({ title: "Perfil Salvo!", description: "Seus dados foram atualizados com sucesso." });
      } catch (err: any) {
        console.error("Erro ao salvar perfil:", err);
        toast({ variant: 'destructive', title: "Erro ao salvar perfil", description: err.message });
      } finally {
        setIsSavingProfile(false);
      }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
      setIsSavingPassword(true);
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          password: data.newPassword,
        });
        if (error) {
          throw error;
        }
        toast({ title: "Senha Alterada!", description: "Sua senha foi atualizada com sucesso." });
        setIsPasswordModalOpen(false);
        passwordForm.reset();
      } catch (err: any) {
        toast({ variant: 'destructive', title: "Erro ao alterar senha", description: err.message });
      } finally {
        setIsSavingPassword(false);
      }
  };

  const handleBack = () => {
    handleLinkClick();
    router.back();
  };

  const handleHome = () => {
    handleLinkClick('/dashboard');
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto pb-20 px-2 sm:px-0">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={handleHome}>
                  <Home className="h-4 w-4" />
                </Button>
              </div>
              <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-headline text-primary leading-none">Configurações</h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-1">Gerencie sua conta e equipe.</p>
              </div>
          </div>
          
          {isMobile && (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 border-accent/20">
                          <Menu className="h-6 w-6 text-accent" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setActiveTab("profile")}>Dados do Usuário</DropdownMenuItem>
                      {canEditPermissions && <DropdownMenuItem onClick={() => setActiveTab("categories")}>Cadastro de Categorias</DropdownMenuItem>}
                      {canEditPermissions && <DropdownMenuItem onClick={() => setActiveTab("permissions")}>Permissões</DropdownMenuItem>}
                      {canEditPermissions && <DropdownMenuItem onClick={() => setActiveTab("employees")}>Funcionários</DropdownMenuItem>}
                  </DropdownMenuContent>
              </DropdownMenu>
          )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!isMobile && (
            <TabsList className={cn("grid w-full mb-8 h-auto p-1 bg-muted/50 rounded-xl", canEditPermissions ? "grid-cols-4" : "grid-cols-1")}>
                <TabsTrigger value="profile" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><UserIcon className="mr-2 h-4 w-4" /> Dados do Usuário</TabsTrigger>
                {canEditPermissions && <TabsTrigger value="categories" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><Tags className="mr-2 h-4 w-4" /> Cadastro de Categorias</TabsTrigger>}
                {canEditPermissions && <TabsTrigger value="permissions" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><ShieldCheck className="mr-2 h-4 w-4" /> Permissões</TabsTrigger>}
                {canEditPermissions && <TabsTrigger value="employees" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><Briefcase className="mr-2 h-4 w-4" /> Funcionários</TabsTrigger>}
            </TabsList>
        )}

        <TabsContent value="profile" className="mt-0 outline-none">
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardContent className="p-0 space-y-6 sm:space-y-8">
                            <div className="flex flex-col items-center sm:items-start">
                                <FormField
                                    control={profileForm.control}
                                    name="avatar"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <ImagePicker 
                                                    value={field.value} 
                                                    onChange={async (newAvatarUrl) => {
                                                        field.onChange(newAvatarUrl);
                                                        if (user?.id && newAvatarUrl) {
                                                            try {
                                                                await updateUser(user.id, { avatar: newAvatarUrl });
                                                                await refreshUser();
                                                                await refetchData();
                                                                toast({ title: "Foto Atualizada!", description: "Sua foto de perfil foi salva com sucesso." });
                                                            } catch (err: any) {
                                                                console.error("Erro ao salvar foto de perfil:", err);
                                                                toast({ variant: 'destructive', title: "Erro ao salvar foto", description: err.message });
                                                            }
                                                        }
                                                    }} 
                                                    label="Minha Foto" 
                                                    folder="avatars" 
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-8 sm:gap-y-6">
                                    <FormField
                                        control={profileForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Login*</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl><Input {...field} readOnly className="h-9 sm:h-11 bg-muted/20 text-xs sm:text-sm" /></FormControl>
                                                    <Button 
                                                        type="button" 
                                                        variant="secondary" 
                                                        className="h-9 sm:h-11 bg-accent text-white hover:bg-accent/90 shrink-0 text-[10px] sm:text-xs"
                                                        onClick={() => setIsPasswordModalOpen(true)}
                                                    >
                                                        Senha
                                                    </Button>
                                                </div>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="nickname"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Nome Completo*</FormLabel>
                                                <FormControl><Input {...field} className="h-9 sm:h-11 text-xs sm:text-sm" /></FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="dob"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2 sm:col-span-1">
                                                <FormLabel className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1 sm:mb-2">Data de Nascimento</FormLabel>
                                                <div className="relative">
                                                    <FormControl><Input placeholder="DD/MM/AAAA" value={manualDate} onChange={handleManualDateChange} className="h-9 sm:h-11 pr-8 text-xs sm:text-sm"/></FormControl>
                                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="absolute right-0.5 top-0.5 h-8 w-8 text-muted-foreground hover:bg-transparent" type="button">
                                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="end">
                                                            <Calendar 
                                                                mode="single" 
                                                                selected={field.value || undefined} 
                                                                onSelect={(date) => { 
                                                                    field.onChange(date); 
                                                                    if (date) setManualDate(format(date, 'dd/MM/yyyy')); 
                                                                }} 
                                                                onOk={() => {
                                                                    if (field.value) setManualDate(format(field.value, 'dd/MM/yyyy'));
                                                                    setIsCalendarOpen(false);
                                                                }}
                                                                disabled={(date) => date > new Date()} 
                                                                locale={ptBR}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1">
                                                <FormLabel className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Residencial</FormLabel>
                                                <FormControl><Input placeholder="(00) 0000-0000" {...field} className="h-9 sm:h-11 text-xs sm:text-sm" /></FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="cellphone"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1">
                                                <FormLabel className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">WhatsApp</FormLabel>
                                                <FormControl><Input placeholder="(00) 90000-0000" {...field} className="h-9 sm:h-11 text-xs sm:text-sm" /></FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={profileForm.control}
                                        name="isProvider"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Cargo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="h-9 sm:h-11 text-xs sm:text-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Admin">Admin</SelectItem>
                                                        <SelectItem value="Professor(a)">Professor(a)</SelectItem>
                                                        <SelectItem value="Secretaria">Secretaria</SelectItem>
                                                        <SelectItem value="Auxiliar Administrativo">Auxiliar Administrativo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                            </div>
                        </CardContent>
                        <CardFooter className="px-0 pt-4 flex justify-end mt-4">
                            <Button type="submit" size="lg" className="w-auto px-6 sm:px-12 h-9 sm:h-12 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 text-xs sm:text-sm" disabled={isSavingProfile}>
                                {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>Para sua segurança, escolha uma senha forte.</DialogDescription>
                    </DialogHeader>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Senha Atual</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Nova Senha</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs uppercase font-bold text-muted-foreground">Confirmar Nova Senha</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" className="h-9" onClick={() => setIsPasswordModalOpen(false)} disabled={isSavingPassword}>Cancelar</Button>
                                <Button type="submit" className="bg-accent h-9" disabled={isSavingPassword}>
                                    {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Atualizar Senha
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </TabsContent>

        {canEditPermissions && (
            <>
                <TabsContent value="categories" className="mt-0 outline-none animate-in fade-in duration-500"><CategoryManager /></TabsContent>
                <TabsContent value="permissions" className="mt-0 outline-none animate-in fade-in duration-500"><PermissionsManager /></TabsContent>
                <TabsContent value="employees" className="mt-0 outline-none animate-in fade-in duration-500"><SystemManagementPanel /></TabsContent>
            </>
        )}
      </Tabs>
    </div>
  );
}
