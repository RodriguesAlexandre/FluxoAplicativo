import { FinancialState } from '@/types';

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

export const calculateProjections = (state: FinancialState): FinancialProjection => {
    const monthlyDetails = new Map<string, MonthlyDetail>();
    
    const allMonthsInvolved = new Set<string>();
    state.records.forEach(r => allMonthsInvolved.add(r.month));
    state.monthlyAdjustments.forEach(a => {
        allMonthsInvolved.add(a.startMonth);
        if (a.endMonth) allMonthsInvolved.add(a.endMonth);
    });

    const todayMonth = new Date().toISOString().slice(0, 7);
    // Project from 12 months ago to 24 months in the future to get a stable data set
    for (let i = -12; i < 24; i++) {
        allMonthsInvolved.add(addMonths(todayMonth, i));
    }
    
    if (allMonthsInvolved.size === 0) {
        allMonthsInvolved.add(todayMonth);
    }
    const sortedMonths = Array.from(allMonthsInvolved).sort((a, b) => a.localeCompare(b));
    const firstMonth = sortedMonths[0];
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    
    // Pre-calculate last known values from all records for efficiency
    const lastKnownValues = new Map<string, { value: number, month: string }>();
    state.records.forEach(r => {
        const existing = lastKnownValues.get(r.categoryId);
        if (!existing || r.month > existing.month) {
            lastKnownValues.set(r.categoryId, { value: r.value, month: r.month });
        }
    });


    let monthIterator = firstMonth;
    while(monthIterator <= lastMonth) {
        let monthIncome = 0;
        let monthExpense = 0;
        let monthConfirmedIncome = 0;
        let monthConfirmedExpense = 0;
        const projectedForMonth = new Map<string, number>();

        state.categories.forEach(cat => {
            const record = state.records.find(r => r.categoryId === cat.id && r.month === monthIterator);
            let value = 0;
            
            if (record) {
                value = record.value;
                if (record.status === 'confirmed') {
                    if (cat.type === 'income') monthConfirmedIncome += value;
                    else monthConfirmedExpense += value;
                }
            } else {
                // Use projected value only for current or future months
                if (monthIterator >= todayMonth) {
                    value = lastKnownValues.get(cat.id)?.value ?? 0;
                    projectedForMonth.set(cat.id, value);
                }
            }

            if (cat.type === 'income') monthIncome += value;
            else monthExpense += value;
        });

        state.monthlyAdjustments.forEach(adj => {
             if (monthIterator >= adj.startMonth && (!adj.endMonth || monthIterator <= adj.endMonth)) {
                if (adj.type === 'income') monthIncome += adj.value;
                else monthExpense += adj.value;
            }
        });

        monthlyDetails.set(monthIterator, { 
            income: monthIncome,
            expense: monthExpense,
            surplus: monthIncome - monthExpense,
            confirmedIncome: monthConfirmedIncome,
            confirmedExpense: monthConfirmedExpense,
            projectedPlaceholders: projectedForMonth,
        });
        
        monthIterator = addMonths(monthIterator, 1);
    }

    // Calculate average surplus and expense for the next 12 months for wealth projection
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
