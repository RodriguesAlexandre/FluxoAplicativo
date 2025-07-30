
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  order: number;
}

export interface Record {
  id:string;
  categoryId: string;
  month: string; // "YYYY-MM"
  value: number;
  status: 'pending' | 'confirmed';
}

export interface MonthlyAdjustment {
    id: string;
    description: string;
    value: number;
    startMonth: string; // "YYYY-MM"
    endMonth: string | null;
    type: 'income' | 'expense';
    status: 'pending' | 'confirmed';
    order: number;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
}

export interface SurplusAllocation {
    emergencyFund: number; // Percentage (0-100)
    investments: number; // Percentage (0-100)
    checkingAccount: number; // Percentage (0-100)
}

export type DeficitStrategy = 'emergency_first' | 'investments_first';

export interface ManualTransaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    account: 'emergencyFund' | 'investments';
    amount: number;
    date: string; // "YYYY-MM-DD"
    description: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  monthlyContribution: number;
}

export interface FinancialState {
    checkingAccountBalance: number;
    categories: Category[];
    records: Record[];
    monthlyAdjustments: MonthlyAdjustment[];
    emergencyFund: {
        balance: number;
        settings: {
            goalType: 'months_of_expense' | 'manual';
            targetMonths: number;
            manualGoal: number;
            monthlyInterestRate: number;
        };
    };
    investments: {
        balance: number;
        settings: {
            monthlyInterestRate: number;
        };
    };
    assets: Asset[];
    surplusAllocation: SurplusAllocation;
    deficitStrategy: DeficitStrategy;
    manualTransactions: ManualTransaction[];
    hasSeenWelcomeGuide: boolean;
    financialGoals: FinancialGoal[];
}

export type AppView = 'monthly' | 'wealth';