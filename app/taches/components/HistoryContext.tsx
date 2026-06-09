'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { firebaseDb } from '@/app/utilities/firebaseDb';
import { toast } from 'react-hot-toast';

export type ActionType = 'ADD' | 'UPDATE' | 'DELETE' | 'BATCH';

export interface Action {
    id?: string;
    type: ActionType;
    collection?: keyof typeof firebaseDb;
    oldData?: any;
    newData?: any;
    actions?: Omit<Action, 'timestamp'>[];
    label: string;
    timestamp: number;
}

interface HistoryContextType {
    undo: () => Promise<void>;
    redo: () => Promise<void>;
    recordAction: (action: Omit<Action, 'timestamp'>) => void;
    canUndo: boolean;
    canRedo: boolean;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
    const [past, setPast] = useState<Action[]>([]);
    const [future, setFuture] = useState<Action[]>([]);

    const recordAction = useCallback((action: Omit<Action, 'timestamp'>) => {
        const fullAction = { ...action, timestamp: Date.now() };
        setPast(prev => [...prev.slice(-19), fullAction]); // Keep last 20 actions
        setFuture([]);
    }, []);

    const undoAction = async (action: Omit<Action, 'timestamp'>) => {
        const { type, collection, id, oldData, actions } = action;
        if (type === 'BATCH' && actions) {
            // Undo in reverse order
            for (let i = actions.length - 1; i >= 0; i--) {
                await undoAction(actions[i]);
            }
            return;
        }

        const db = firebaseDb[collection!] as any;
        if (!db) throw new Error(`Collection ${collection} not found`);

        if (type === 'ADD') {
            await db.delete(id!);
        } else if (type === 'DELETE') {
            const { id: _, userId: __, ...dataWithoutId } = oldData;
            await db.add(dataWithoutId);
        } else if (type === 'UPDATE') {
            await db.update(id!, oldData);
        }
    };

    const redoAction = async (action: Omit<Action, 'timestamp'>) => {
        const { type, collection, id, newData, actions } = action;
        if (type === 'BATCH' && actions) {
            for (const subAction of actions) {
                await redoAction(subAction);
            }
            return;
        }

        const db = firebaseDb[collection!] as any;
        if (!db) throw new Error(`Collection ${collection} not found`);

        if (type === 'ADD') {
            const { id: _, userId: __, ...dataWithoutId } = newData;
            await db.add(dataWithoutId);
        } else if (type === 'DELETE') {
            await db.delete(id!);
        } else if (type === 'UPDATE') {
            await db.update(id!, newData);
        }
    };

    const undo = useCallback(async () => {
        if (past.length === 0) return;

        const action = past[past.length - 1];

        try {
            await undoAction(action);
            setPast(prev => prev.slice(0, -1));
            setFuture(prev => [...prev, action]);
            toast.success(`Annulé : ${action.label}`);
        } catch (error) {
            console.error('Undo failed:', error);
            toast.error('Échec de l\'annulation');
        }
    }, [past]);

    const redo = useCallback(async () => {
        if (future.length === 0) return;

        const action = future[future.length - 1];

        try {
            await redoAction(action);
            setFuture(prev => prev.slice(0, -1));
            setPast(prev => [...prev, action]);
            toast.success(`Rétabli : ${action.label}`);
        } catch (error) {
            console.error('Redo failed:', error);
            toast.error('Échec du rétablissement');
        }
    }, [future]);

    // Handle Ctrl+Z / Ctrl+Y
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return (
        <HistoryContext.Provider value={{ undo, redo, recordAction, canUndo: past.length > 0, canRedo: future.length > 0 }}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    const context = useContext(HistoryContext);
    if (context === undefined) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
}
