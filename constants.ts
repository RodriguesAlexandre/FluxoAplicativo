
import { FinancialState, Category } from './types';

const defaultCategories: Category[] = [
    { id: 'sal', name: 'Salário', type: 'income', order: 0 },
    { id: 'freela', name: 'Freelance', type: 'income', order: 1 },
    { id: 'rent', name: 'Aluguel', type: 'expense', order: 0 },
    { id: 'supermarket', name: 'Supermercado', type: 'expense', order: 1 },
    { id: 'transport', name: 'Transporte', type: 'expense', order: 2 },
    { id: 'leisure', name: 'Lazer', type: 'expense', order: 3 },
    { id: 'health', name: 'Saúde', type: 'expense', order: 4 },
    { id: 'utilities', name: 'Contas (Luz, Água, Net)', type: 'expense', order: 5 },
];

export const INITIAL_FINANCIAL_STATE: FinancialState = {
    checkingAccountBalance: 5000,
    categories: defaultCategories,
    records: [
        { id: 'rec1', categoryId: 'sal', month: new Date().toISOString().slice(0, 7), value: 7000, status: 'pending' },
        { id: 'rec2', categoryId: 'rent', month: new Date().toISOString().slice(0, 7), value: 2000, status: 'pending' },
        { id: 'rec3', categoryId: 'supermarket', month: new Date().toISOString().slice(0, 7), value: 1200, status: 'pending' },
    ],
    monthlyAdjustments: [],
    emergencyFund: {
        balance: 15000,
        settings: {
            goalType: 'months_of_expense',
            targetMonths: 6,
            manualGoal: 30000,
            monthlyInterestRate: 0.5,
        }
    },
    investments: {
        balance: 25000,
        settings: {
            monthlyInterestRate: 0.8,
        }
    },
    assets: [
        { id: 'asset1', name: 'Apartamento', value: 300000 }
    ],
    surplusAllocation: {
        emergencyFund: 50,
        investments: 50,
        checkingAccount: 0,
    },
    deficitStrategy: 'emergency_first',
    manualTransactions: [],
    hasSeenWelcomeGuide: false,
    financialGoals: [],
};


export const BLANK_FINANCIAL_STATE: FinancialState = {
    checkingAccountBalance: 0,
    categories: defaultCategories,
    records: [],
    monthlyAdjustments: [],
    emergencyFund: {
        balance: 0,
        settings: {
            goalType: 'months_of_expense',
            targetMonths: 6,
            manualGoal: 30000,
            monthlyInterestRate: 0.5,
        }
    },
    investments: {
        balance: 0,
        settings: {
            monthlyInterestRate: 0.8,
        }
    },
    assets: [],
    surplusAllocation: {
        emergencyFund: 50,
        investments: 50,
        checkingAccount: 0,
    },
    deficitStrategy: 'emergency_first',
    manualTransactions: [],
    hasSeenWelcomeGuide: true, // A user resetting has already seen the guide
    financialGoals: [],
};