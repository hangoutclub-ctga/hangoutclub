"use client";

import { createContext, useContext } from 'react';
import { User, Student, Class, InventoryItem, Transaction, FixedExpense, ManualEvent, CommunicationTemplate, StockMovement } from '@/types';

export interface DataContextType {
    users: User[];
    students: Student[];
    classes: Class[];
    inventoryItems: InventoryItem[];
    transactions: Transaction[];
    fixedExpenses: FixedExpense[];
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
    
    // Mutation helpers
    addStudent: (student: Partial<Student>) => Promise<Student>;
    updateStudent: (id: string, student: Partial<Student>) => Promise<Student>;
    deleteStudent: (id: string, soft?: boolean) => Promise<void>;

    addClass: (c: Partial<Class>) => Promise<Class>;
    updateClass: (id: string, c: Partial<Class>) => Promise<Class>;
    deleteClass: (id: string, soft?: boolean) => Promise<void>;

    addTransaction: (t: Partial<Transaction>) => Promise<Transaction>;
    deleteTransaction: (id: string) => Promise<void>;

    addFixedExpense: (fe: Partial<FixedExpense>) => Promise<FixedExpense>;
    updateFixedExpense: (id: string, fe: Partial<FixedExpense>) => Promise<FixedExpense>;
    deleteFixedExpense: (id: string) => Promise<void>;

    addInventoryItem: (item: Partial<InventoryItem>) => Promise<InventoryItem>;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<InventoryItem>;
    addStockMovement: (id: string, movement: StockMovement, newStock: number) => Promise<InventoryItem>;
    deleteInventoryItem: (id: string, soft?: boolean) => Promise<void>;

    addEvent: (e: Partial<ManualEvent>) => Promise<ManualEvent>;
    updateEvent: (id: string, e: Partial<ManualEvent>) => Promise<ManualEvent>;
    deleteEvent: (id: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
