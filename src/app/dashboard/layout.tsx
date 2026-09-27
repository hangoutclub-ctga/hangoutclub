
"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import ReactDOM from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { Home, Users, BookOpen, Wallet, LogOut, Settings, Calendar, Award, Loader2, Trash2, Send, Package, AlertTriangle, Printer, X, Search, CheckCircle2 } from "lucide-react";
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

import { StockAlertProvider, useStockAlert } from "@/hooks/use-stock-alert";
import { LoadingContext, useLoading } from "@/hooks/use-loading";

import { ShoppingPrintSheet } from "@/components/shopping-print-sheet";

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Carregando...</p>
    </div>
  </div>
);

const LowStockAlert = ({
  open,
  onOpenChange,
  lowStockItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lowStockItems: any[];
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md md:max-w-lg rounded-2xl w-[94vw] p-6 text-slate-900">
          {/* VISUALIZAÇÃO INTERATIVA EM TELA (OCULTA NA IMPRESSÃO) */}
          <div className="no-print space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> Alerta de Compras
              </DialogTitle>
            </DialogHeader>

            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Os seguintes itens do inventário atingiram o nível mínimo e precisam ser repostos:
                </p>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-700 sticky top-0 bg-background/95 backdrop-blur">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-center w-20">Mínimo</th>
                        <th className="p-2.5 text-right w-20">Atual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {lowStockItems.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-bold text-primary">{item.name}</td>
                          <td className="p-2.5 text-center font-mono text-muted-foreground">{item.minStock}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-red-600">{item.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                <p className="font-bold text-base text-primary">Estoque Regular</p>
                <p className="text-xs text-muted-foreground">
                  Nenhum item do inventário atingiu o nível mínimo no momento.
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 flex-row sm:justify-end pt-2">
              {lowStockItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none h-10">
                  <Printer className="mr-2 h-4 w-4" /> Imprimir Lista
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none h-10">
                Fechar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* FOLHA DE IMPRESSÃO: Renderizada via createPortal diretamente no body,
          fora de qualquer ancestral no-print ou overflow:hidden */}
      {mounted && open && lowStockItems.length > 0 && ReactDOM.createPortal(
        <div className="shopping-print-sheet print-only">
          <ShoppingPrintSheet items={lowStockItems} />
        </div>,
        document.body
      )}
    </>
  );
};

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, hasPermission } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const { handleLinkClick } = useLoading();
  const { openStockAlert, lowStockCount, canSeeAlert, isStockAlertOpen, setIsStockAlertOpen, lowStockItems } = useStockAlert();
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
          {canSeeAlert && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-colors",
                lowStockCount > 0 
                  ? "text-red-600 hover:text-red-700 hover:bg-red-500/10" 
                  : "text-muted-foreground hover:text-primary"
              )}
              title={lowStockCount > 0 ? `${lowStockCount} ${lowStockCount === 1 ? 'item com estoque crítico' : 'itens com estoque crítico'}` : "Alerta de Estoque: Tudo em dia"}
              onClick={openStockAlert}
            >
              <AlertTriangle className={cn("h-4 w-4 sm:h-5 sm:w-5", lowStockCount > 0 && "animate-pulse text-red-600")} />
              {lowStockCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] sm:text-[10px] font-bold text-white shadow-sm">
                  {lowStockCount}
                </span>
              )}
            </Button>
          )}

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
              {(user?.role === 'Admin' || hasPermission('nav:trash')) && (
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
        <LowStockAlert 
          open={isStockAlertOpen} 
          onOpenChange={setIsStockAlertOpen} 
          lowStockItems={lowStockItems} 
        />
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        {children}
      </main>
    </div>
  );
};

const DashboardInner = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const { lowStockCount } = useStockAlert();
  const { handleLinkClick } = useLoading();

  const handleNav = (href: string) => {
    setIsOpen(false);
    if (pathname !== href) {
      handleLinkClick(href);
      router.push(href);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <NewSidebar className="no-print">
        <NewSidebarHeader 
          className="flex items-center justify-center py-4 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <NewLogo className="h-10" />
        </NewSidebarHeader>
        <NewSidebarBody>
          <NewSidebarContent>
            {hasPermission('nav:dashboard') && (
              <NewSidebarItem href="/dashboard" onClick={(e) => { e.preventDefault(); handleNav('/dashboard'); }} className={cn(pathname === '/dashboard' && "bg-accent/10 text-accent font-bold")}>
                <Home className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Início</NewSidebarLabel>
              </NewSidebarItem>
            )}

            {hasPermission('nav:agenda') && (
              <NewSidebarItem href="/dashboard/agenda" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/agenda'); }} className={cn(pathname === '/dashboard/agenda' && "bg-accent/10 text-accent font-bold")}>
                <Calendar className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Agenda</NewSidebarLabel>
              </NewSidebarItem>
            )}
            
            {hasPermission('nav:students') && (
              <NewSidebarItem href="/dashboard/students" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/students'); }} className={cn(pathname === '/dashboard/students' && "bg-accent/10 text-accent font-bold")}>
                <Users className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Alunos</NewSidebarLabel>
              </NewSidebarItem>
            )}

            {hasPermission('nav:classes') && (
              <NewSidebarItem href="/dashboard/classes" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/classes'); }} className={cn(pathname === '/dashboard/classes' && "bg-accent/10 text-accent font-bold")}>
                <BookOpen className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Turmas</NewSidebarLabel>
              </NewSidebarItem>
            )}

            {hasPermission('nav:grades') && (
              <NewSidebarItem href="/dashboard/grades" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/grades'); }} className={cn(pathname === '/dashboard/grades' && "bg-accent/10 text-accent font-bold")}>
                <Award className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Notas</NewSidebarLabel>
              </NewSidebarItem>
            )}
            
            {hasPermission('nav:finance') && (
              <NewSidebarItem href="/dashboard/finance" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/finance'); }} className={cn(pathname === '/dashboard/finance' && "bg-accent/10 text-accent font-bold")}>
                <Wallet className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Financeiro</NewSidebarLabel>
              </NewSidebarItem>
            )}

            {hasPermission('nav:inventory') && (
              <NewSidebarItem href="/dashboard/inventory" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/inventory'); }} className={cn(pathname === '/dashboard/inventory' && "bg-accent/10 text-accent font-bold", "relative")}>
                <Package className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Inventário</NewSidebarLabel>
                {lowStockCount > 0 && (
                  <>
                    <span className={cn("ml-auto bg-red-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5", !isOpen && "hidden")}>
                      {lowStockCount}
                    </span>
                    {!isOpen && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-card" />
                    )}
                  </>
                )}
              </NewSidebarItem>
            )}

            {hasPermission('nav:communication') && (
              <NewSidebarItem href="/dashboard/communication" onClick={(e) => { e.preventDefault(); handleNav('/dashboard/communication'); }} className={cn(pathname === '/dashboard/communication' && "bg-accent/10 text-accent font-bold")}>
                <Send className="mr-2 h-4 w-4" />
                <NewSidebarLabel>Comunicação</NewSidebarLabel>
              </NewSidebarItem>
            )}
          </NewSidebarContent>
        </NewSidebarBody>
      </NewSidebar>
      <MainContent>{children}</MainContent>
    </div>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    setNavLoading(false);
  }, [pathname]);

  const handleLinkClick = (href?: string) => {
    if (!href || href !== pathname) {
      setNavLoading(true);
      // Timeout de segurança para evitar travamento em caso de cancelamento de rota
      const timer = setTimeout(() => {
        setNavLoading(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  };

  if (authLoading || !isAuthenticated) return <LoadingOverlay />;

  return (
    <LoadingContext.Provider value={{ handleLinkClick }}>
      <StockAlertProvider>
        {navLoading && <LoadingOverlay />}
        <DashboardInner>{children}</DashboardInner>
      </StockAlertProvider>
    </LoadingContext.Provider>
  );
}
