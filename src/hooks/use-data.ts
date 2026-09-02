
"use client";

import { createContext, useContext } from 'react';
import { User, Student, Class, InventoryItem, Transaction, FixedExpense, ManualEvent, CommunicationTemplate } from '@/types';

export interface DataContextType {
    users: User[];
    students: Student[];
    classes: Class[];
    inventoryItems: InventoryItem[];
    transactions: Transaction[];
    fixedExpenses: Omit<FixedExpense, 'status' | 'month' | 'year' | 'receiptUrl'>[];
    manualEvents: ManualEvent[];
    categories: {
        studentConditions: string[];
        classModalities: string[];
        inventoryCategories: string[];
        userRoles: string[];
        communicationTemplates: CommunicationTemplate[];
    };
    isLoading: boolean;
    refetchData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
