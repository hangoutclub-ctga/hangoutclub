"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { InventoryItem } from "@/types";

interface StockAlertContextType {
  openStockAlert: () => void;
  closeStockAlert: () => void;
  isStockAlertOpen: boolean;
  setIsStockAlertOpen: (open: boolean) => void;
  lowStockItems: InventoryItem[];
  lowStockCount: number;
  canSeeAlert: boolean;
}

const StockAlertContext = createContext<StockAlertContextType>({
  openStockAlert: () => {},
  closeStockAlert: () => {},
  isStockAlertOpen: false,
  setIsStockAlertOpen: () => {},
  lowStockItems: [],
  lowStockCount: 0,
  canSeeAlert: false,
});

export const useStockAlert = () => useContext(StockAlertContext);

export const StockAlertProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { inventoryItems } = useData();
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const isSecretaria = user?.role === 'Secretaria';
  const canSeeAlert = isAdmin || isSecretaria;

  const lowStockItems = React.useMemo(() => {
    return inventoryItems.filter(item => item.status !== 'Apagado' && item.stock <= item.minStock);
  }, [inventoryItems]);

  const lowStockCount = lowStockItems.length;

  // Disparo automático do alerta quando novos itens atingirem estoque crítico
  useEffect(() => {
    if (!canSeeAlert || lowStockCount === 0) return;
    const lastSeenSignature = sessionStorage.getItem('low_stock_signature');
    const currentSignature = lowStockItems.map(i => `${i.id}-${i.stock}`).join('|');
    if (currentSignature !== lastSeenSignature) {
      setIsStockAlertOpen(true);
      sessionStorage.setItem('low_stock_signature', currentSignature);
    }
  }, [canSeeAlert, lowStockCount, lowStockItems]);

  const openStockAlert = () => setIsStockAlertOpen(true);
  const closeStockAlert = () => setIsStockAlertOpen(false);

  return (
    <StockAlertContext.Provider
      value={{
        openStockAlert,
        closeStockAlert,
        isStockAlertOpen,
        setIsStockAlertOpen,
        lowStockItems,
        lowStockCount,
        canSeeAlert,
      }}
    >
      {children}
    </StockAlertContext.Provider>
  );
};
