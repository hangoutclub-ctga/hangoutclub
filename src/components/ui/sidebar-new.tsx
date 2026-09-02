
"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Menu } from "lucide-react";

const SidebarContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};

export const SidebarRoot = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSidebar();
  
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Overlay para Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        ref={ref}
        className={cn(
          "fixed md:relative z-50 h-full border-r bg-card transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col shadow-2xl md:shadow-none",
          // Mobile: Toggle via tradução e fixo. Desktop: Toggle via largura e relativo.
          isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </aside>
    </>
  );
});
Sidebar.displayName = "Sidebar";

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSidebar();
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-16 shrink-0 items-center border-b transition-all duration-300 ease-in-out",
        isOpen ? "px-4 justify-start" : "px-0 justify-center",
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

export const SidebarBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className="flex-1 overflow-y-auto" {...props} />
));
SidebarBody.displayName = "SidebarBody";

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar();
  return (
    <nav ref={ref} className={cn(
      "grid gap-1", 
      isOpen ? "p-2" : "p-2 justify-items-center", 
      className
    )} {...props} />
  )
});
SidebarContent.displayName = "SidebarContent";

export const SidebarItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<typeof Link>
>(({ className, children, ...props }, ref) => {
  const { isOpen } = useSidebar();
  return (
    <Link
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent",
        !isOpen && "justify-center",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
});
SidebarItem.displayName = "SidebarItem";

export const SidebarLabel = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>((props, ref) => {
    const { isOpen } = useSidebar();
    return <span ref={ref} className={cn(!isOpen && "hidden")} {...props} />
});
SidebarLabel.displayName = "SidebarLabel";
