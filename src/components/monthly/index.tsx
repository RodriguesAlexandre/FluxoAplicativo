import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FinancialState, Category, Record as RecordType, AppView, MonthlyAdjustment } from '@/types';
import { Card, Button, Icon, Input, Modal } from '@/components/common';
import { MonthlyCashflowChart } from '@/components/charts';
import { calculateProjections, addMonths } from '@/services/financialProjection';
import { DistributeBalanceModal } from '@/components/monthly/DistributeBalanceModal';
import { WealthSettingsModal } from '@/components/wealth/WealthSettingsModal';

// --- Helper Functions ---
const getMonthName = (monthStr: string) => new Date(monthStr + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


// --- Sub-Components ---
const SimulationBar: React.FC<{onSave: () => void; onDiscard: () => void}> = ({ onSave, onDiscard }) => (
    <div className="bg-yellow-400 dark:bg-yellow-500 text-gray-900 p-2 text-center text-sm flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 fixed top-16 left-0 right-0 z-20 shadow-lg">
        <div className="flex items-center gap-2 font-bold">
            <Icon name="simulate" className="w-5 h-5"/>
            <span>Você está em modo de simulação.</span>
        </div>
        <span className="hidden sm:inline">Suas alterações não serão salvas até que você confirme.</span>
        <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onDiscard}>Descartar</Button>
            <Button variant="primary" size="sm" onClick={onSave}>Salvar Alterações</Button>
        </div>
    </div>
);

const MetricCard: React.FC<{ title: string; value: number; isProjected?: boolean; children?: React.ReactNode, "data-tour-id"?: string }> = ({ title, value, isProjected = false, children, ...props }) => (
    <Card className="flex-1 min-w-[150px] flex flex-col" {...props}>
        <div className="flex-grow">
            <h3 className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isProjected ? 'opacity-70' : ''}`}>{title}</h3>
            <p className={`text-xl sm:text-2xl font-bold ${isProjected ? 'opacity-70' : ''} ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(value)}
            </p>
        </div>
        {children && <div className="mt-auto pt-2">{children}</div>}
    </Card>
);

const BridgeCard: React.FC<{ value: number }> = ({ value }) => (
    <Card className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex flex-col justify-center">
        <div className="flex items-start gap-3">
            <Icon name="simulate" className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
            <div>
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200">Conexão com Planejamento</h3>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Seu superávit médio projetado para os próximos 12 meses é de <strong className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(value)}
                    </strong>. É este valor que usamos para projetar sua riqueza.
                </p>
            </div>
        </div>
    </Card>
);


const RecordRow: React.FC<{
    category: Category;
    record: RecordType | undefined;
    projectedValue: number;
    onUpdate: (categoryId: string, value: number, status: 'pending' | 'confirmed') => void;
    isFirst: boolean;
}> = ({ category, record, projectedValue, onUpdate, isFirst }) => {
    const [inputValue, setInputValue] = useState(record?.value?.toString() ?? '');

    useEffect(() => {
        setInputValue(record?.value?.toString() ?? '');
    }, [record]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };
    
    const handleBlur = () => {
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue)) {
            onUpdate(category.id, numericValue, record?.status ?? 'pending');
        } else if (inputValue === '' && record) {
             onUpdate(category.id, 0, record.status);
        }
    };

    const toggleStatus = () => {
        onUpdate(category.id, record?.value ?? projectedValue ?? 0, record?.status === 'confirmed' ? 'pending' : 'confirmed');
    };
    
    const isProjected = !record && projectedValue > 0;
    const isConfirmed = record?.status === 'confirmed';

    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isConfirmed ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
            <button 
                onClick={toggleStatus} 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isConfirmed ? 'bg-green-500 border-green-500' : 'border-gray-400'}`} 
                aria-label={isConfirmed ? 'Marcar como pendente' : 'Marcar como confirmado'}
                data-tour-id={isFirst ? 'confirmar-transacao' : undefined}
            >
                {isConfirmed && <Icon name="check" className="w-4 h-4 text-white" />}
            </button>
            <span className={`flex-1 ${isConfirmed ? 'opacity-60' : ''}`}>{category.name}</span>
            <div className="flex items-center gap-2 w-32">
                 <span className={`text-sm ${isConfirmed ? 'opacity-60' : 'text-gray-500 dark:text-gray-400'}`}>R$</span>
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    placeholder={(projectedValue || 0).toFixed(2)}
                    className={`w-full text-right bg-transparent outline-none font-semibold ${isProjected ? 'text-gray-400 italic' : ''} ${isConfirmed ? 'opacity-60' : ''}`}
                    aria-label={`Valor para ${category.name}`}
                />
            </div>
        </div>
    );
};

const AdjustmentRow: React.FC<{
    adjustment: MonthlyAdjustment;
    onDelete: (id: string) => void;
    isSimulating: boolean;
}> = ({ adjustment, onDelete, isSimulating }) => {
    return (
         <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 group">
            <div className="flex-1 text-sm italic">
                {adjustment.description}
                {adjustment.endMonth && <span className="text-xs text-gray-400 ml-2">(até {getMonthName(adjustment.endMonth)})</span>}
            </div>
            <span className={`font-semibold w-32 text-right pr-2 ${adjustment.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(adjustment.value)}
            </span>
             <button onClick={() => onDelete(adjustment.id)} aria-label={`Deletar ajuste ${adjustment.description}`} className="opacity-0 group-hover:opacity-100 transition-opacity" disabled={isSimulating}>
                <Icon name="trash" className="w-4 h-4 text-red-500 hover:text-red-700"/>
            </button>
        </div>
    );
};

const CategorySettingsModal: React.FC<{
    categories: Category[];
    onUpdate: (newCategories: Category[]) => void;
    isOpen: boolean;
    onClose: () => void;
}> = ({ categories: initialCategories, onUpdate, isOpen, onClose }) => {
    const [categories, setCategories] = useState(initialCategories);
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');

    React.useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories, isOpen]);

    const handleSave = () => {
        onUpdate(categories);
        onClose();
    };

    const addCategory = () => {
        if (newCatName.trim() === '') return;
        const newCategory: Category = {
            id: `cat_${new Date().getTime()}`,
            name: newCatName.trim(),
            type: newCatType,
        };
        setCategories([...categories, newCategory]);
        setNewCatName('');
    };
    
    const removeCategory = (id: string) => {
        setCategories(categories.filter(c => c.id !== id));
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <Modal title="Gerenciar Categorias" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <h3 className="font-bold text-lg">Adicionar Nova Categoria</h3>
                <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ex: Educação, Investimentos" />
                <div className="flex gap-2">
                    <Button onClick={() => setNewCatType('income')} variant={newCatType === 'income' ? 'primary' : 'secondary'} className="flex-1">Receita</Button>
                    <Button onClick={() => setNewCatType('expense')} variant={newCatType === 'expense' ? 'primary' : 'secondary'} className="flex-1">Despesa</Button>
                </div>
                <Button onClick={addCategory} className="w-full">Adicionar</Button>
            </div>
            <hr className="my-6 border-gray-200 dark:border-gray-700"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="font-bold text-lg text-green-600">Entradas</h3>
                    {incomeCategories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span>{cat.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeCategory(cat.id)}><Icon name="trash" className="w-4 h-4 text-red-500"/></Button>
                        </div>
                    ))}
                </div>
                 <div className="space-y-2">
                    <h3 className="font-bold text-lg text-red-600">Saídas</h3>
                    {expenseCategories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span>{cat.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeCategory(cat.id)}><Icon name="trash" className="w-4 h-4 text-red-500"/></Button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
        </Modal>
    );
};

const AdjustmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<MonthlyAdjustment, 'id' | 'startMonth'>) => void;
    type: 'income' | 'expense';
    currentMonth: string;
}> = ({ isOpen, onClose, onSave, type, currentMonth }) => {
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [endMonth, setEndMonth] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDescription('');
            setValue('');
            setEndMonth('');
        }
    }, [isOpen]);

    const handleSave = () => {
        const numericValue = parseFloat(value);
        if (!description.trim() || isNaN(numericValue) || numericValue <= 0) {
            alert("Por favor, preencha a descrição e um valor válido.");
            return;
        }

        onSave({
            description: description.trim(),
            value: Math.abs(numericValue),
            endMonth: endMonth || null,
            type,
        });
        
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Adicionar ${type === 'income' ? 'Entrada' : 'Saída'} Variável`}>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                    <label htmlFor="adj-desc" className="block text-sm font-medium">Descrição</label>
                    <Input id="adj-desc" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Parcela do Notebook" required/>
                </div>
                <div>
                    <label htmlFor="adj-value" className="block text-sm font-medium">Valor (R$)</label>
                    <Input id="adj-value" type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="150.00" required/>
                </div>
                <div>
                    <label htmlFor="adj-end" className="block text-sm font-medium">Mês de Término (Opcional)</label>
                    <Input id="adj-end" type="month" value={endMonth} onChange={e => setEndMonth(e.target.value)} min={currentMonth}/>
                    <p className="text-xs text-gray-500 mt-1">Deixe em branco se for um lançamento único para este mês.</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main View ---
interface MonthlyControlViewProps {
    state: FinancialState;
    setState: React.Dispatch<React.SetStateAction<FinancialState | null>>;
    setAppView: (view: AppView) => void;
    onOpenOracle: () => void;
    isSimulating: boolean;
    onStartSimulation: () => void;
    onSaveChanges: () => void;
    onDiscardChanges: () => void;
}
export const MonthlyControlView: React.FC<MonthlyControlViewProps> = ({ state, setState, onOpenOracle, isSimulating, onStartSimulation, onSaveChanges, onDiscardChanges }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isDistributeModalOpen, setDistributeModalOpen] = useState(false);
    const [isWealthSettingsModalOpen, setWealthSettingsModalOpen] = useState(false);
    const [adjustmentModal, setAdjustmentModal] = useState<{ isOpen: boolean; type: 'income' | 'expense' }>({ isOpen: false, type: 'income' });

    const derivedData = useMemo(() => {
        if (!state) return {
            performanceRealizada: 0,
            performanceProjetada: 0,
            projectedIncome: 0,
            savingsRate: 0,
            savingsRateStatus: { label: '', color: '' },
            projectedPlaceholders: new Map(),
            cashflowProjection: [],
            averageFutureSurplus: 0,
        };

        const { monthlyDetails, averageFutureSurplus } = calculateProjections(state);

        const currentMonthData = monthlyDetails.get(currentMonth) || {
            income: 0, expense: 0, surplus: 0, confirmedIncome: 0, confirmedExpense: 0, projectedPlaceholders: new Map()
        };

        const performanceRealizada = currentMonthData.confirmedIncome - currentMonthData.confirmedExpense;
        const performanceProjetada = currentMonthData.income - currentMonthData.expense;
        
        const projectedIncome = currentMonthData.income;
        const savingsRate = projectedIncome > 0 ? (performanceProjetada / projectedIncome) * 100 : 0;
        
        let savingsRateStatus = { label: 'Ruim', color: 'text-red-500' };
        if (savingsRate >= 30) savingsRateStatus = { label: 'Excelente', color: 'text-green-500' };
        else if (savingsRate >= 15) savingsRateStatus = { label: 'Bom', color: 'text-yellow-500' };

        const cashflowProjectionData = [];
        let lastMonthBalance = state.checkingAccountBalance;
        for (let i = 0; i < 12; i++) {
            const monthStr = addMonths(currentMonth, i);
            const monthData = monthlyDetails.get(monthStr) || { income: 0, expense: 0, surplus: 0 };
            const endOfMonthBalance = lastMonthBalance + monthData.surplus;
            cashflowProjectionData.push({
                month: monthStr,
                balance: endOfMonthBalance,
                income: monthData.income,
                expense: monthData.expense,
            });
            lastMonthBalance = endOfMonthBalance;
        }

        return { 
            performanceRealizada,
            performanceProjetada,
            projectedIncome,
            savingsRate,
            savingsRateStatus,
            projectedPlaceholders: currentMonthData.projectedPlaceholders,
            cashflowProjection: cashflowProjectionData,
            averageFutureSurplus,
        };

    }, [state, currentMonth]);
    
    const handleUpdateRecord = useCallback((categoryId: string, value: number, status: 'pending' | 'confirmed') => {
        setState(prev => {
            if (!prev) return prev;

            const newRecords = [...prev.records];
            const recordIndex = newRecords.findIndex(r => r.categoryId === categoryId && r.month === currentMonth);
            const category = prev.categories.find(c => c.id === categoryId);
            if (!category) return prev;

            let balanceChange = 0;
            const originalRecord = recordIndex > -1 ? prev.records[recordIndex] : null;
            const wasConfirmed = originalRecord?.status === 'confirmed';
            const isConfirmed = status === 'confirmed';
            const originalValue = originalRecord?.value ?? 0;
            const sign = category.type === 'income' ? 1 : -1;

            if (wasConfirmed && !isConfirmed) {
                // Un-confirmed: reverse original value impact
                balanceChange = -originalValue * sign;
            } else if (!wasConfirmed && isConfirmed) {
                // Just confirmed: add new value impact
                balanceChange = value * sign;
            } else if (wasConfirmed && isConfirmed) {
                // Value changed on a confirmed record: adjust by the difference
                balanceChange = (value - originalValue) * sign;
            }

            // Update record in the array
            if (recordIndex > -1) {
                newRecords[recordIndex] = { ...newRecords[recordIndex], value, status };
            } else {
                newRecords.push({ id: `rec_${new Date().getTime()}`, categoryId, month: currentMonth, value, status });
            }
            
            return { 
                ...prev, 
                records: newRecords,
                checkingAccountBalance: prev.checkingAccountBalance + balanceChange
            };
        });
    }, [setState, currentMonth]);
    
    const handleUpdateCategories = (newCategories: Category[]) => {
        setState(prev => prev ? ({...prev, categories: newCategories}) : prev);
    };
    
    const handleAddAdjustment = (data: Omit<MonthlyAdjustment, 'id' | 'startMonth'>) => {
        setState(prev => prev ? ({
            ...prev,
            monthlyAdjustments: [
                ...prev.monthlyAdjustments,
                { ...data, id: `adj_${new Date().getTime()}`, startMonth: currentMonth }
            ]
        }) : prev)
    };
    
    const handleDeleteAdjustment = (id: string) => {
        setState(prev => prev ? ({
            ...prev,
            monthlyAdjustments: prev.monthlyAdjustments.filter(a => a.id !== id)
        }) : prev)
    }

    const handleMonthChange = (e: React.MouseEvent<HTMLButtonElement>, direction: 'prev' | 'next') => {
        const newMonth = addMonths(currentMonth, direction === 'prev' ? -1 : 1);
        setCurrentMonth(newMonth);
        e.currentTarget.blur();
    };

    const incomeCategories = state.categories.filter(c => c.type === 'income');
    const expenseCategories = state.categories.filter(c => c.type === 'expense');
    
    const currentAdjustments = state.monthlyAdjustments.filter(a => a.startMonth === currentMonth);
    const recurringAdjustments = state.monthlyAdjustments.filter(a => a.startMonth < currentMonth && (!a.endMonth || a.endMonth >= currentMonth));


    return (
        <div className="flex-1 flex flex-col">
            {isSimulating && <SimulationBar onSave={onSaveChanges} onDiscard={onDiscardChanges} />}
            <div className={`p-4 sm:p-6 space-y-4 ${isSimulating ? 'pt-24 sm:pt-16' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={(e) => handleMonthChange(e, 'prev')} aria-label="Mês anterior">
                            <Icon name="chevron-left" />
                        </Button>
                        <span className="text-lg font-bold w-44 text-center">{getMonthName(currentMonth)}</span>
                        <Button variant="secondary" onClick={(e) => handleMonthChange(e, 'next')} aria-label="Próximo mês">
                            <Icon name="chevron-right" />
                        </Button>
                    </div>
                     <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                        <Button variant="accent" onClick={() => setWealthSettingsModalOpen(true)} className="flex-1 sm:flex-none">
                            <Icon name="settings" className="w-5 h-5 sm:mr-2"/>
                            <span className="hidden sm:inline">Saldos e Metas</span>
                        </Button>
                        <Button variant="secondary" onClick={() => setCategoryModalOpen(true)} className="flex-1 sm:flex-none">
                             <Icon name="edit" className="w-5 h-5 sm:mr-2"/>
                             <span className="hidden sm:inline">Categorias</span>
                        </Button>
                        <Button variant="secondary" onClick={onOpenOracle} className="flex-1 sm:flex-none">
                            <Icon name="oracle" className="w-5 h-5 sm:mr-2"/>
                            <span className="hidden sm:inline">Oráculo</span>
                        </Button>
                        <Button variant="secondary" onClick={onStartSimulation} className="flex-1 sm:flex-none" disabled={isSimulating}>
                            <Icon name="simulate" className="w-5 h-5 sm:mr-2"/>
                             <span className="hidden sm:inline">Simular</span>
                        </Button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="flex flex-wrap gap-4">
                    <MetricCard title="Saldo em Conta (Atual)" value={state.checkingAccountBalance} data-tour-id="saldo-conta">
                        <Button size="sm" variant="secondary" className="w-full mt-2" onClick={() => setDistributeModalOpen(true)} data-tour-id="distribuir-saldo">
                            <Icon name="wallet" className="w-4 h-4 mr-2" />
                            Distribuir Saldo
                       </Button>
                    </MetricCard>
                    <MetricCard title="Performance Realizada" value={derivedData.performanceRealizada} data-tour-id="performance-realizada" />
                    <MetricCard title="Performance Projetada (Este Mês)" value={derivedData.performanceProjetada} isProjected>
                         <div className="flex justify-between items-baseline text-xs mt-1">
                             <span className="text-gray-500 dark:text-gray-400">Taxa de Poupança</span>
                             <span className={`font-bold ${derivedData.savingsRateStatus.color}`}>{derivedData.savingsRate.toFixed(0)}% ({derivedData.savingsRateStatus.label})</span>
                         </div>
                    </MetricCard>
                    <BridgeCard value={derivedData.averageFutureSurplus} />
                </div>

                {/* Categories & Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <h3 className="text-lg font-bold mb-2 text-green-600">Entradas</h3>
                            <div className="space-y-1">
                                {incomeCategories.map((cat, index) => (
                                    <RecordRow key={cat.id} category={cat} record={state.records.find(r => r.categoryId === cat.id && r.month === currentMonth)} projectedValue={derivedData.projectedPlaceholders.get(cat.id) || 0} onUpdate={handleUpdateRecord} isFirst={index === 0}/>
                                ))}
                            </div>
                             <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setAdjustmentModal({isOpen: true, type: 'income'})}>
                                <Icon name="plus" className="w-4 h-4 mr-1"/> Adicionar Variável
                            </Button>
                        </Card>
                        <Card>
                             <h3 className="text-lg font-bold mb-2 text-red-600">Saídas</h3>
                            <div className="space-y-1">
                                {expenseCategories.map((cat, index) => (
                                    <RecordRow key={cat.id} category={cat} record={state.records.find(r => r.categoryId === cat.id && r.month === currentMonth)} projectedValue={derivedData.projectedPlaceholders.get(cat.id) || 0} onUpdate={handleUpdateRecord} isFirst={false}/>
                                ))}
                            </div>
                            <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setAdjustmentModal({isOpen: true, type: 'expense'})}>
                                <Icon name="plus" className="w-4 h-4 mr-1"/> Adicionar Variável
                            </Button>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="lg:col-span-2 flex flex-col">
                        <h3 className="text-lg font-bold mb-4">Projeção do Fluxo de Caixa (Próximos 12 meses)</h3>
                        <div className="flex-grow flex items-center justify-center">
                            {derivedData.cashflowProjection.length > 0 ? (
                                <MonthlyCashflowChart data={derivedData.cashflowProjection} />
                            ) : (
                                <p className="text-gray-500">Sem dados para exibir o gráfico.</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Monthly Adjustments */}
                {(currentAdjustments.length > 0 || recurringAdjustments.length > 0) && (
                    <Card>
                         <h3 className="text-lg font-bold mb-2">Ajustes do Mês</h3>
                         <div className="space-y-1">
                            {recurringAdjustments.map(adj => (
                                <div key={adj.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex-1 text-sm italic opacity-70">
                                        {adj.description} (recorrente)
                                    </div>
                                    <span className={`font-semibold w-32 text-right pr-2 opacity-70 ${adj.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatCurrency(adj.value)}
                                    </span>
                                    <div className="w-10" /> {/* Spacer */}
                                </div>
                            ))}
                            {currentAdjustments.map(adj => (
                                <AdjustmentRow key={adj.id} adjustment={adj} onDelete={handleDeleteAdjustment} isSimulating={isSimulating} />
                            ))}
                        </div>
                    </Card>
                )}

            </div>

            {/* Modals */}
            <CategorySettingsModal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} categories={state.categories} onUpdate={handleUpdateCategories} />
            <DistributeBalanceModal isOpen={isDistributeModalOpen} onClose={() => setDistributeModalOpen(false)} state={state} setState={setState} actualBalance={state.checkingAccountBalance} realizedPerformance={derivedData.performanceRealizada} />
            <WealthSettingsModal isOpen={isWealthSettingsModalOpen} onClose={() => setWealthSettingsModalOpen(false)} state={state} setState={setState} />
            <AdjustmentModal isOpen={adjustmentModal.isOpen} onClose={() => setAdjustmentModal({ isOpen: false, type: 'income'})} onSave={handleAddAdjustment} type={adjustmentModal.type} currentMonth={currentMonth} />
        </div>
    );
};

export default MonthlyControlView;