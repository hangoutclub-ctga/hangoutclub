
"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BookOpen, Wallet, LogOut, Settings, Calendar, Award, Loader2, Trash2, Send, Package, AlertTriangle, Printer, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Sidebar as NewSidebar, 
  SidebarBody as NewSidebarBody, 
  SidebarContent as NewSidebarContent, 
  SidebarHeader as NewSidebarHeader, 
  SidebarItem as NewSidebarItem, 
  SidebarLabel as NewSidebarLabel, 
  useSidebar,
} from "@/components/ui/sidebar-new";
import { NewLogo } from "@/components/new-logo";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useData } from "@/hooks/use-data";
import { GlobalSearch } from "@/components/global-search";

const LoadingContext = createContext<{ handleLinkClick: (href?: string) => void } | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) return { handleLinkClick: () => {} };
  return context;
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
);

const LowStockAlert = () => {
  const { user } = useAuth();
  const { inventoryItems } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const lowStockItems = inventoryItems.filter(item => item.status !== 'Apagado' && item.stock <= item.minStock);
  
  useEffect(() => {
    const hasSeenAlert = sessionStorage.getItem('low_stock_alert_seen');
    const canSeeAlert = user?.role === 'Admin' || user?.role === 'Secretaria';
    
    if (canSeeAlert && lowStockItems.length > 0 && !hasSeenAlert) {
      setIsOpen(true);
      sessionStorage.setItem('low_stock_alert_seen', 'true');
    }
  }, [user, lowStockItems.length]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md printable-area rounded-2xl w-[94vw]">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Alerta de Compras
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm font-medium text-muted-foreground no-print">
            Os seguintes itens do inventário atingiram o nível mínimo e precisam ser repostos:
          </p>
          
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-muted/50 p-2 border-b grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider">
              <span>Item</span>
              <span className="text-center">Mínimo</span>
              <span className="text-right">Atual</span>
            </div>
            <div className="divide-y max-h-[40vh] overflow-y-auto">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-3 grid grid-cols-3 items-center text-sm">
                  <span className="font-bold text-primary truncate pr-2">{item.name}</span>
                  <span className="text-center font-mono text-muted-foreground">{item.minStock}</span>
                  <span className="text-right font-mono font-bold text-red-600">{item.stock}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="hidden print:block pt-8 text-center border-t mt-12">
            <p className="text-xs text-muted-foreground italic">Lista gerada em: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="text-sm font-bold text-primary mt-2">Hangout Club - Gestão de Materiais</p>
          </div>
        </div>
        <DialogFooter className="no-print gap-2 flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none h-10">
            <Printer className="mr-2 h-4 w-4" /> Imprimir Lista
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="flex-1 sm:flex-none h-10">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const { handleLinkClick } = useLoading();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNavigate = (href: string) => {
    handleLinkClick(href);
    router.push(href);
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-background">
      <header className="flex h-12 sm:h-16 items-center justify-between border-b bg-card px-3 sm:px-6 no-print">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-10 w-10 p-1 hover:bg-accent/10" 
            onClick={() => setIsOpen(!isOpen)}
          >
            <NewLogo className="h-8 w-8" />
          </Button>
          
          <Button 
            variant="outline" 
            className="hidden md:flex h-9 w-64 items-center justify-between px-3 text-muted-foreground hover:text-accent border-accent/20 rounded-xl"
            onClick={() => setSearchOpen(true)}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="text-xs">Buscar aluno ou turma...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-9 w-9 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border">
                  <AvatarImage src={user?.avatar} alt={user?.nickname} />
                  <AvatarFallback>{user?.nickname?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>
                <p className="text-sm font-bold">{user?.nickname}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigate('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              {user?.role === 'Admin' && (
                <DropdownMenuItem onClick={() => handleNavigate('/dashboard/trash')}>
                  <Trash2 className="mr-2 h-4 w-4" /> Lixeira
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-2 sm:p-6 lg:p-8">
        <LowStockAlert />
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        {children}
      </main>
    </div>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    setNavLoading(false);
  }, [pathname]);

  const handleNav = (href: string) => {
    setIsOpen(false);
    if (pathname !== href) {
      setNavLoading(true);
      router.push(href);
    }
  };

  const handleLinkClick = (href?: string) => {
    if (!href || pathname !== href) {
      setNavLoading(true);
    }
  };

  if (authLoading || !isAuthenticated) return <LoadingOverlay />;

  const isAdmin = user?.role === 'Admin';
  const isSecretaria = user?.role === 'Secretaria';

  return (
    <LoadingContext.Provider value={{ handleLinkClick }}>
      <div className="flex h-screen w-full bg-background overflow-hidden relative">
          {navLoading && <LoadingOverlay />}
          <NewSidebar className="no-print">
            <NewSidebarHeader 
              className="flex items-center justify-center py-4 cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
            >
              <NewLogo className="h-10" />
            </NewSidebarHeader>
            <NewSidebarBody>
              <NewSidebarContent>
                <NewSidebarItem href="/dashboard" onClick={(e) => { e.preventDefault(); handleNav('/dashboard'); }} className={cn(pathname === '/dashboard' && "bg-accent/10 text-accent font-bold")}>
                  <Home className="mr-2 h-4 w-4" />
                  <NewSidebarLabel>Início</NewSidebarLabel>
                </NewSidebarItem>
                <NewSidebarItem href="/dashboard/agenda" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/agenda'); }} className={cn(pathname === '/dashboard/agenda' && "bg-accent/10 text-accent font-bold")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <NewSidebarLabel>Agenda</NewSidebarLabel>
                </NewSidebarItem>
                
                {!isSecretaria && (
                  <>
                    <NewSidebarItem href="/dashboard/students" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/students'); }} className={cn(pathname === '/dashboard/students' && "bg-accent/10 text-accent font-bold")}>
                      <Users className="mr-2 h-4 w-4" />
                      <NewSidebarLabel>Alunos</NewSidebarLabel>
                    </NewSidebarItem>
                    <NewSidebarItem href="/dashboard/classes" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/classes'); }} className={cn(pathname === '/dashboard/classes' && "bg-accent/10 text-accent font-bold")}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      <NewSidebarLabel>Turmas</NewSidebarLabel>
                    </NewSidebarItem>
                    <NewSidebarItem href="/dashboard/grades" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/grades'); }} className={cn(pathname === '/dashboard/grades' && "bg-accent/10 text-accent font-bold")}>
                      <Award className="mr-2 h-4 w-4" />
                      <NewSidebarLabel>Notas</NewSidebarLabel>
                    </NewSidebarItem>
                  </>
                )}
                
                {isAdmin && (
                  <NewSidebarItem href="/dashboard/finance" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/finance'); }} className={cn(pathname === '/dashboard/finance' && "bg-accent/10 text-accent font-bold")}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <NewSidebarLabel>Financeiro</NewSidebarLabel>
                  </NewSidebarItem>
                )}

                {(isAdmin || isSecretaria) && (
                  <>
                    <NewSidebarItem href="/dashboard/inventory" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/inventory'); }} className={cn(pathname === '/dashboard/inventory' && "bg-accent/10 text-accent font-bold")}>
                      <Package className="mr-2 h-4 w-4" />
                      <NewSidebarLabel>Inventário</NewSidebarLabel>
                    </NewSidebarItem>
                    <NewSidebarItem href="/dashboard/communication" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/communication'); }} className={cn(pathname === '/dashboard/communication' && "bg-accent/10 text-accent font-bold")}>
                      <Send className="mr-2 h-4 w-4" />
                      <NewSidebarLabel>Comunicação</NewSidebarLabel>
                    </NewSidebarItem>
                  </>
                )}
              </NewSidebarContent>
            </NewSidebarBody>
          </NewSidebar>
          <MainContent>{children}</MainContent>
      </div>
    </LoadingContext.Provider>
  );
}
