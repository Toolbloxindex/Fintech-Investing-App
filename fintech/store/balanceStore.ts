import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkv-storage';

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  title: string;
}

export interface BalanceState {
    transactions: Array<Transaction>;
    runTransaction: (transaction: Transaction) => void;
    balance: () => number;
    clearTransactions: () => void;
}

export const useBalanceStore = create<BalanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            runTransaction: (transaction: Transaction) => {
                set((state) => ({transactions: [...state.transactions, transaction]}))
            },
            balance: () => get().transactions.reduce((acc, transaction) => acc + transaction.amount, 0),
            clearTransactions: () => {
                set({transactions: []})
            },
        }),
        {
            name: 'balance',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);