import { FinancialState, Record as RecordType, FinancialGoal } from './types';

export const addMonths = (dateStr: string, months: number): string => {
    const date = new Date(dateStr + '-02T00:00:00Z'); // Use UTC to avoid timezone issues
    date.setUTCMonth(date.getUTCMonth() + months);
    return date.toISOString().slice(0, 7);
};

export interface MonthlyDetail {
    income: number;
    expense: number;
    surplus: number;
    confirmedIncome: number;
    confirmedExpense: number;
    projectedPlaceholders: Map<string, number>;
}

export interface FinancialProjection {
    monthlyDetails: Map<string, MonthlyDetail>;
    averageFutureSurplus: number;
    averageFutureExpense: number;
}

const getMonthRange = (state: FinancialState): string[] => {
    const allMonths = new Set<string>();
    const todayMonth = new Date().toISOString().slice(0, 7);
    
    state.records.forEach(r => allMonths.add(r.month));
    state.monthlyAdjustments.forEach(a => {
        allMonths.add(a.startMonth);
        if (a.endMonth) allMonths.add(a.endMonth);
    });

    // Add a buffer of 12 months past and 24 months future to ensure full projection
    for (let i = -12; i < 24; i++) {
        allMonths.add(addMonths(todayMonth, i));
    }

    if (allMonths.size === 0) {
        allMonths.add(todayMonth);
    }
    
    return Array.from(allMonths).sort((a, b) => a.localeCompare(b));
}


export const calculateProjections = (state: FinancialState): FinancialProjection => {
    const monthlyDetails = new Map<string, MonthlyDetail>();
    
    const sortedMonths = getMonthRange(state);

    const recordsByMonth = new Map<string, RecordType[]>();
    state.records.forEach(record => {
        if (!recordsByMonth.has(record.month)) {
            recordsByMonth.set(record.month, []);
        }
        recordsByMonth.get(record.month)!.push(record);
    });

    // A map to hold the running latest value for each fixed category.
    const runningCategoryValues = new Map<string, number>();
    state.categories.forEach(cat => runningCategoryValues.set(cat.id, 0));
    
    for (const month of sortedMonths) {
        const projectedForMonth = new Map<string, number>();
        const recordsForThisMonth = recordsByMonth.get(month) || [];

        // Update running values with any explicit records for the current month
        recordsForThisMonth.forEach(record => {
            runningCategoryValues.set(record.categoryId, record.value);
        });

        let monthIncome = 0;
        let monthExpense = 0;
        let monthConfirmedIncome = 0;
        let monthConfirmedExpense = 0;

        state.categories.forEach(cat => {
            const recordForThisMonth = recordsForThisMonth.find(r => r.categoryId === cat.id);
            const value = runningCategoryValues.get(cat.id) || 0;

            if (cat.type === 'income') monthIncome += value;
            else monthExpense += value;

            // If there is no explicit record for this month, it's a projection.
            if (!recordForThisMonth && value !== 0) {
                projectedForMonth.set(cat.id, value);
            }

            // Handle confirmed status from explicit record
            if (recordForThisMonth?.status === 'confirmed') {
                if (cat.type === 'income') monthConfirmedIncome += recordForThisMonth.value;
                else monthConfirmedExpense += recordForThisMonth.value;
            }
        });

        // Add adjustments for the month
        state.monthlyAdjustments.forEach(adj => {
            if (month >= adj.startMonth && (!adj.endMonth || month <= adj.endMonth)) {
                const value = adj.value;
                if (adj.type === 'income') {
                    monthIncome += value;
                    if (adj.status === 'confirmed') monthConfirmedIncome += value;
                } else {
                    monthExpense += value;
                    if (adj.status === 'confirmed') monthConfirmedExpense += value;
                }
            }
        });
        
        monthlyDetails.set(month, { 
            income: monthIncome,
            expense: monthExpense,
            surplus: monthIncome - monthExpense,
            confirmedIncome: monthConfirmedIncome,
            confirmedExpense: monthConfirmedExpense,
            projectedPlaceholders: projectedForMonth,
        });
    }

    // Calculate average surplus and expense for the next 12 months for wealth projection
    const todayMonth = new Date().toISOString().slice(0, 7);
    let futureSurplusSum = 0;
    let futureExpenseSum = 0;
    for (let i = 0; i < 12; i++) {
        const futureMonth = addMonths(todayMonth, i);
        const details = monthlyDetails.get(futureMonth);
        if(details) {
            futureSurplusSum += details.surplus;
            futureExpenseSum += details.expense;
        }
    }
    
    const averageFutureSurplus = futureSurplusSum / 12;
    const averageFutureExpense = futureExpenseSum / 12;

    return { monthlyDetails, averageFutureSurplus, averageFutureExpense };
};

export const calculateGoalProjection = (
    goal: FinancialGoal,
    investmentRate: number
): number | null => {
    if (goal.targetValue <= goal.currentValue) {
        return 0; // Goal already reached
    }
    if (goal.monthlyContribution <= 0) {
        return null; // Goal will never be reached without contributions
    }

    let months = 0;
    let currentValue = goal.currentValue;
    const monthlyInterestRate = investmentRate / 100;

    while (currentValue < goal.targetValue) {
        // Add contribution at the beginning of the month
        currentValue += goal.monthlyContribution;
        // Accrue interest on the new total
        currentValue *= (1 + monthlyInterestRate);
        
        months++;

        // Safety break to prevent infinite loops, e.g., 100 years
        if (months > 1200) {
            return null;
        }
    }

    return months;
};