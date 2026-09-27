"use client";

import { createContext, useContext } from 'react';
import { User, Student, Class, InventoryItem, Transaction, FixedExpense, ManualEvent, CommunicationTemplate, StockMovement, EventType, SystemCategory, DeletionAudit } from '@/types';

export interface DataContextType {
    users: User[];
    students: Student[];
    classes: Class[];
    inventoryItems: InventoryItem[];
    transactions: Transaction[];
    fixedExpenses: FixedExpense[];
    manualEvents: ManualEvent[];
    eventTypes: EventType[];
    systemCategories: SystemCategory[];
    categories: {
        studentConditions: string[];
        classModalities: string[];
        inventoryCategories: string[];
        userRoles: string[];
        communicationTemplates: CommunicationTemplate[];
        eventTypes: EventType[];
        systemCategories: SystemCategory[];
    };
    isLoading: boolean;
    refetchData: () => Promise<void>;
    
    // Mutation helpers
    addStudent: (student: Partial<Student>) => Promise<Student>;
    updateStudent: (id: string, student: Partial<Student>) => Promise<Student>;
    deleteStudent: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    addClass: (c: Partial<Class>) => Promise<Class>;
    updateClass: (id: string, c: Partial<Class>) => Promise<Class>;
    deleteClass: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    addTransaction: (t: Partial<Transaction>) => Promise<Transaction>;
    updateTransaction: (id: string, t: Partial<Transaction>) => Promise<Transaction>;
    deleteTransaction: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    addFixedExpense: (fe: Partial<FixedExpense>) => Promise<FixedExpense>;
    updateFixedExpense: (id: string, fe: Partial<FixedExpense>) => Promise<FixedExpense>;
    deleteFixedExpense: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    addInventoryItem: (item: Partial<InventoryItem>) => Promise<InventoryItem>;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<InventoryItem>;
    addStockMovement: (id: string, movement: StockMovement, newStock: number) => Promise<InventoryItem>;
    deleteInventoryItem: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    addEvent: (e: Partial<ManualEvent>) => Promise<ManualEvent>;
    updateEvent: (id: string, e: Partial<ManualEvent>) => Promise<ManualEvent>;
    deleteEvent: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    addEventType: (item: Partial<EventType>) => Promise<EventType>;
    updateEventType: (id: string, item: Partial<EventType>) => Promise<EventType>;
    deleteEventType: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    addSystemCategory: (item: Partial<SystemCategory>) => Promise<SystemCategory>;
    updateSystemCategory: (id: string, item: Partial<SystemCategory>) => Promise<SystemCategory>;
    deleteSystemCategory: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;

    updateUser: (id: string, user: Partial<User>) => Promise<User>;
    deleteUser: (id: string, soft?: boolean, audit?: DeletionAudit) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
