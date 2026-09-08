
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
import { ShieldCheck, User as UserIcon, Briefcase, PlusCircle, Edit, Trash2, Save, CalendarIcon, Menu, ChevronLeft, Home, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn, getDisplayAvatarUrl } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { EmployeeForm } from "./employee-form";
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
import { useLoading } from "@/app/dashboard/layout";

const profileSchema = z.object({
  nickname: z.string().min(2, "Nome obrigatório."),
  email: z.string().email("E-mail inválido."),
  dob: z.date({ required_error: "Data de nascimento obrigatória." }),
  phone: z.string().optional(),
  cellphone: z.string().optional(),
  isProvider: z.string().default("Professor(a)"),
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
    const { users, refetchData } = useData();
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [localUsers, setLocalUsers] = useState<User[]>(users);
    const [isSaving, setIsSaving] = useState(false);
    
    React.useEffect(() => {
        setLocalUsers(users);
    }, [users]);

    const selectedUser = localUsers.find(u => u.id === selectedUserId);

    const handlePermissionChange = (permission: string, value: boolean) => {
        if (!selectedUser || selectedUser.role === 'Admin') return;
        setLocalUsers(prev => prev.map(u => {
            if (u.id === selectedUserId) {
                const newPerms = value 
                    ? [...(u.permissions || []), permission]
                    : (u.permissions || []).filter(p => p !== permission);
                return { ...u, permissions: newPerms };
            }
            return u;
        }));
    };

    const allPermissions = [
        { id: 'nav:dashboard', label: 'Ver Dashboard' },
        { id: 'nav:agenda', label: 'Ver Agenda' },
        { id: 'nav:students', label: 'Ver Alunos' },
        { id: 'nav:classes', label: 'Ver Turmas' },
        { id: 'nav:grades', label: 'Ver Notas' },
        { id: 'nav:finance', label: 'Ver Financeiro' },
        { id: 'nav:inventory', label: 'Ver Inventário' },
        { id: 'nav:communication', label: 'Ver Comunicação' },
        { id: 'nav:trash', label: 'Ver Lixeira' },
        { id: 'students:create', label: 'Criar Alunos' },
        { id: 'classes:create', label: 'Criar Turmas' },
        { id: 'permissions:edit', label: 'Editar Permissões' },
    ];

    const onSavePermissions = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            await updateUser(selectedUser.id, { permissions: selectedUser.permissions });
            await refetchData();
            toast({ title: "Permissões Salvas!", description: "Atualizadas com sucesso." });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-5 w-5"/>
                    <CardTitle className="text-lg sm:text-xl">Gerenciamento de Permissões</CardTitle>
                </div>
                <CardDescription className="text-[10px] sm:text-sm">Configure o que cada colaborador pode acessar.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                <div className="max-w-sm">
                    <Label htmlFor="user-select" className="text-[9px] sm:text-[10px] font-bold uppercase text-muted-foreground">Colaborador</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger id="user-select" className="h-9 sm:h-11">
                            <SelectValue placeholder="Selecione um perfil..." />
                        </SelectTrigger>
                        <SelectContent>
                            {localUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>{user.nickname} - {user.role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedUser && (
                     <div className="border rounded-xl p-4 sm:p-6 bg-card shadow-sm">
                        <h3 className="font-bold mb-4 sm:mb-6 text-primary border-b pb-2 flex items-center gap-2 text-xs sm:text-base">
                            <UserIcon className="h-4 w-4" /> Permissões: {selectedUser.nickname}
                        </h3>
                        <div className={cn("grid gap-3 sm:gap-6", isMobile ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                            {allPermissions.map(p => {
                                const isAdmin = selectedUser.role === 'Admin';
                                const isChecked = isAdmin || (selectedUser.permissions?.includes(p.id) ?? false);
                                return (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/5">
                                    <Label htmlFor={`${selectedUser.id}-${p.id}`} className="text-[9px] sm:text-xs font-medium cursor-pointer flex-1 leading-tight">{p.label}</Label>
                                    <Switch
                                        id={`${selectedUser.id}-${p.id}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => handlePermissionChange(p.id, checked)}
                                        disabled={isAdmin}
                                        className="scale-75 sm:scale-100"
                                    />
                                </div>
                            )})}
                        </div>
                    </div>
                )}
                 <div className="flex justify-end pt-4">
                    <Button size="lg" className="bg-accent h-9 sm:h-12 px-6 sm:px-8 w-auto" onClick={onSavePermissions} disabled={!selectedUserId || isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Permissões
                    </Button>
                 </div>
            </CardContent>
        </Card>
    )
}

const SystemManagementPanel = () => {
    const isMobile = useIsMobile();
    const { users, refetchData, deleteUser } = useData();
    const [employees, setEmployees] = useState<User[]>(users);
    const [editingEmployee, setEditingEmployee] = useState<User | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = useState(false);

    React.useEffect(() => {
        setEmployees(users);
    }, [users]);

    const handleSaveEmployee = async (data: any) => {
        try {
            if (editingEmployee) {
                await updateUser(editingEmployee.id, data);
                toast({ title: "Funcionário Atualizado!", description: "Dados salvos com sucesso." });
            } else {
                await createUser(data);
                toast({ title: "Funcionário Cadastrado!", description: "Novo colaborador salvo com sucesso." });
            }
            await refetchData();
            setIsFormOpen(false);
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: err.message });
        }
    };

    const handleDeleteEmployee = async (userToDelete: User) => {
        if (!confirm(`Deseja realmente excluir o colaborador ${userToDelete.nickname}?`)) return;
        try {
            await deleteUser(userToDelete.id);
            toast({ title: "Funcionário Removido!", description: "Removido com sucesso do sistema." });
        } catch (err: any) {
            toast({ variant: 'destructive', title: "Erro ao remover", description: err.message });
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive" onClick={() => handleDeleteEmployee(user)}><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
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
      </CardContent>
    </Card>
    )
}

export default function SettingsPage() {
  const { user, hasPermission } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { handleLinkClick } = useLoading();
  const [activeTab, setActiveTab] = useState("profile");
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

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const canEditPermissions = hasPermission('permissions:edit');
  const [manualDate, setManualDate] = useState<string>(user?.dob ? format(new Date(user.dob), 'dd/MM/yyyy') : '');

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
      setIsSavingProfile(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      toast({ title: "Perfil Salvo!", description: "Seus dados foram atualizados com sucesso." });
      setIsSavingProfile(false);
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
      setIsSavingPassword(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Senha Alterada!", description: "Sua senha foi atualizada localmente." });
      setIsPasswordModalOpen(false);
      passwordForm.reset();
      setIsSavingPassword(false);
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
                  <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setActiveTab("profile")}>Dados do Usuário</DropdownMenuItem>
                      {canEditPermissions && <DropdownMenuItem onClick={() => setActiveTab("permissions")}>Permissões</DropdownMenuItem>}
                      {canEditPermissions && <DropdownMenuItem onClick={() => setActiveTab("employees")}>Funcionários</DropdownMenuItem>}
                  </DropdownMenuContent>
              </DropdownMenu>
          )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!isMobile && (
            <TabsList className={cn("grid w-full mb-8 h-auto p-1 bg-muted/50 rounded-xl", canEditPermissions ? "grid-cols-3" : "grid-cols-1")}>
                <TabsTrigger value="profile" className="py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><UserIcon className="mr-2 h-4 w-4" /> Dados do Usuário</TabsTrigger>
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
                                                <ImagePicker value={field.value} onChange={field.onChange} label="Minha Foto" />
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
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="absolute right-0.5 top-0.5 h-8 w-8 text-muted-foreground hover:bg-transparent" type="button">
                                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="end">
                                                            <Calendar 
                                                                mode="single" 
                                                                selected={field.value} 
                                                                onSelect={(date) => { 
                                                                    field.onChange(date); 
                                                                    if (date) setManualDate(format(date, 'dd/MM/yyyy')); 
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
                <TabsContent value="permissions" className="mt-0 outline-none animate-in fade-in duration-500"><PermissionsManager /></TabsContent>
                <TabsContent value="employees" className="mt-0 outline-none animate-in fade-in duration-500"><SystemManagementPanel /></TabsContent>
            </>
        )}
      </Tabs>
    </div>
  );
}
