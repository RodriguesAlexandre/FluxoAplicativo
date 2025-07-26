import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FinancialState, Category, Record as RecordType, AppView, MonthlyAdjustment } from '../../types';
import { Card, Button, Icon, Input, Modal } from '../common/index.tsx';
import { MonthlyCashflowChart } from '../charts/index.tsx';
import { calculateProjections, addMonths } from '../../services/financialProjection';
import { DistributeBalanceModal } from './DistributeBalanceModal';
import { WealthSettingsModal } from '../wealth/WealthSettingsModal';
import { AdjustmentModal } from './AdjustmentModal';

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


const FixedCategoryRow: React.FC<{
    cat: Category;
    record: RecordType | undefined;
    isEditing: boolean;
    editingName: string;
    onNameChange: (newName: string) => void;
    onStartEdit: (cat: Category) => void;
    onUpdateName: (id: string) => void;
    onCancelEdit: () => void;
    onDelete: (id: string) => void;
    onUpdateRecord: (id: string, value: number, status: 'pending' | 'confirmed') => void;
    isFirst: boolean;
    projectedValue: number;
}> = ({ cat, record, isEditing, editingName, onNameChange, onStartEdit, onUpdateName, onCancelEdit, onDelete, onUpdateRecord, isFirst, projectedValue }) => {
    
    const valueToDisplay = record ? record.value : projectedValue;
    const [inputValue, setInputValue] = useState(valueToDisplay.toString());

    useEffect(() => {
        setInputValue(valueToDisplay.toString());
    }, [valueToDisplay]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleBlur = () => {
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue)) {
            onUpdateRecord(cat.id, numericValue, record?.status ?? 'pending');
        } else if (inputValue === '') {
            onUpdateRecord(cat.id, 0, record?.status ?? 'pending');
        }
    };

    const toggleStatus = () => {
        onUpdateRecord(cat.id, valueToDisplay, (record?.status ?? 'pending') === 'confirmed' ? 'pending' : 'confirmed');
    };

    const isConfirmed = record?.status === 'confirmed';

    return (
        <div className={`group flex items-center gap-2 p-2 rounded-lg transition-colors ${isConfirmed ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
            <button
                onClick={toggleStatus}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isConfirmed ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}
                aria-label={isConfirmed ? 'Marcar como pendente' : 'Marcar como confirmado'}
                data-tour-id={isFirst ? 'confirmar-transacao' : undefined}
            >
                {isConfirmed && <Icon name="check" className="w-4 h-4 text-white" />}
            </button>

            <div className="flex-1">
                {isEditing ? (
                    <Input
                        value={editingName}
                        onChange={(e) => onNameChange(e.target.value)}
                        onBlur={() => onUpdateName(cat.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') onUpdateName(cat.id); if (e.key === 'Escape') onCancelEdit(); }}
                        autoFocus
                        className="py-1 h-8"
                    />
                ) : (
                    <span className={`flex-1 ${isConfirmed ? 'opacity-60' : ''}`}>{cat.name}</span>
                )}
            </div>

            <div className="flex items-center gap-2 w-32">
                <span className={`text-sm ${isConfirmed ? 'opacity-60' : 'text-gray-500 dark:text-gray-400'}`}>R$</span>
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    className={`w-full text-right bg-transparent outline-none font-semibold ${!record && !isConfirmed ? 'text-gray-400 italic' : ''} ${isConfirmed ? 'opacity-60' : ''}`}
                    aria-label={`Valor para ${cat.name}`}
                    disabled={isEditing}
                />
            </div>

            <div className="flex items-center gap-1 w-12 justify-end">
                {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onStartEdit(cat)} aria-label={`Editar ${cat.name}`}>
                            <Icon name="edit" className="w-4 h-4 text-blue-500 hover:text-blue-700"/>
                        </button>
                        <button onClick={() => onDelete(cat.id)} aria-label={`Deletar ${cat.name}`}>
                            <Icon name="trash" className="w-4 h-4 text-red-500 hover:text-red-700"/>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const RecordRow: React.FC<{
    id: string;
    label: string;
    value: number;
    status: 'pending' | 'confirmed';
    onUpdate: (id: string, value: number, status: 'pending' | 'confirmed') => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    isProjected: boolean;
    isFirst: boolean;
    isVariable: boolean;
}> = ({ id, label, value, status, onUpdate, onDelete, onEdit, isProjected, isFirst, isVariable }) => {
    const [inputValue, setInputValue] = useState(value.toString());

    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };
    
    const handleBlur = () => {
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue)) {
            onUpdate(id, numericValue, status);
        } else if (inputValue === '') {
             onUpdate(id, 0, status);
        }
    };

    const toggleStatus = () => {
        onUpdate(id, value, status === 'confirmed' ? 'pending' : 'confirmed');
    };
    
    const isConfirmed = status === 'confirmed';

    return (
        <div className={`group flex items-center gap-2 p-2 rounded-lg transition-colors ${isConfirmed ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
            <button 
                onClick={toggleStatus} 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isConfirmed ? 'bg-green-500 border-green-500' : 'border-gray-400'}`} 
                aria-label={isConfirmed ? 'Marcar como pendente' : 'Marcar como confirmado'}
                data-tour-id={isFirst ? 'confirmar-transacao' : undefined}
            >
                {isConfirmed && <Icon name="check" className="w-4 h-4 text-white" />}
            </button>
            <span className={`flex-1 ${isConfirmed ? 'opacity-60' : ''} ${isVariable ? 'italic' : ''}`} dangerouslySetInnerHTML={{ __html: label }}></span>
            <div className="flex items-center gap-2 w-32">
                 <span className={`text-sm ${isConfirmed ? 'opacity-60' : 'text-gray-500 dark:text-gray-400'}`}>R$</span>
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleValueChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    className={`w-full text-right bg-transparent outline-none font-semibold ${isProjected && !isConfirmed ? 'text-gray-400 italic' : ''} ${isConfirmed ? 'opacity-60' : ''}`}
                    aria-label={`Valor para ${label}`}
                />
            </div>
            {(onDelete || onEdit) && (
                 <div className="flex items-center gap-1 w-10 justify-end">
                    {onEdit && (
                        <button onClick={() => onEdit(id)} aria-label={`Editar ${label}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Icon name="edit" className="w-4 h-4 text-blue-500 hover:text-blue-700"/>
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={() => onDelete(id)} aria-label={`Deletar ${label}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Icon name="trash" className="w-4 h-4 text-red-500 hover:text-red-700"/>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Main View ---
interface MonthlyControlViewProps {
    state: FinancialState;
    setState: React.Dispatch<React.SetStateAction<FinancialState>>;
    setAppView: (view: AppView) => void;
    onOpenOracle: () => void;
    isSimulating: boolean;
    onStartSimulation: () => void;
    onSaveChanges: () => void;
    onDiscardChanges: () => void;
}
export const MonthlyControlView: React.FC<MonthlyControlViewProps> = ({ state, setState, onOpenOracle, isSimulating, onStartSimulation, onSaveChanges, onDiscardChanges }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isDistributeModalOpen, setDistributeModalOpen] = useState(false);
    const [isWealthSettingsModalOpen, setWealthSettingsModalOpen] = useState(false);
    const [adjustmentModalState, setAdjustmentModalState] = useState<{ isOpen: boolean; type: 'income' | 'expense', adjustmentToEdit?: MonthlyAdjustment }>({ isOpen: false, type: 'income' });
    
    // State for inline category management
    const [newIncomeCatName, setNewIncomeCatName] = useState('');
    const [newExpenseCatName, setNewExpenseCatName] = useState('');
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editingCatName, setEditingCatName] = useState('');


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

            if (wasConfirmed) {
                balanceChange -= originalValue * sign;
            }
            if (isConfirmed) {
                balanceChange += value * sign;
            }

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

    const handleUpdateAdjustment = useCallback((adjustmentId: string, value: number, status: 'pending' | 'confirmed') => {
        setState(prev => {
            if (!prev) return prev;

            const newAdjustments = [...prev.monthlyAdjustments];
            const adjIndex = newAdjustments.findIndex(a => a.id === adjustmentId);
            if (adjIndex === -1) return prev;

            const originalAdj = newAdjustments[adjIndex];
            
            let balanceChange = 0;
            const wasConfirmed = originalAdj.status === 'confirmed';
            const isConfirmed = status === 'confirmed';
            const originalValue = originalAdj.value;
            const sign = originalAdj.type === 'income' ? 1 : -1;

            if (wasConfirmed) {
                balanceChange -= originalValue * sign;
            }
            if (isConfirmed) {
                balanceChange += value * sign;
            }
            
            newAdjustments[adjIndex] = { ...originalAdj, value, status };

            return {
                ...prev,
                monthlyAdjustments: newAdjustments,
                checkingAccountBalance: prev.checkingAccountBalance + balanceChange,
            };
        });
    }, [setState]);
    
    // --- New Category Management Handlers ---

    const handleAddCategory = (type: 'income' | 'expense') => {
        const name = (type === 'income' ? newIncomeCatName : newExpenseCatName).trim();
        if (!name) return;

        setState(prev => {
            if (!prev) return prev;
            if (prev.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                alert(`A categoria "${name}" já existe.`);
                return prev;
            }

            const newCategory: Category = { id: `cat_${new Date().getTime()}`, name, type };
            return { ...prev, categories: [...prev.categories, newCategory] };
        });

        if (type === 'income') setNewIncomeCatName('');
        else setNewExpenseCatName('');
    };
    
    const handleDeleteCategory = (categoryId: string) => {
        setState(prev => {
            if (!prev) return prev;
            const categoryToDelete = prev.categories.find(c => c.id === categoryId);
            if (!categoryToDelete) return prev;

            const confirmation = window.confirm(`Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"?\n\nTODOS os registros financeiros associados a ela (em todos os meses) serão permanentemente removidos. Esta ação não pode ser desfeita.`);
            if (!confirmation) return prev;

            const recordsToDelete = prev.records.filter(r => r.categoryId === categoryId);
            let balanceAdjustment = 0;
            recordsToDelete.forEach(rec => {
                if (rec.status === 'confirmed') {
                    const sign = categoryToDelete.type === 'income' ? 1 : -1;
                    balanceAdjustment -= rec.value * sign;
                }
            });

            return {
                ...prev,
                categories: prev.categories.filter(c => c.id !== categoryId),
                records: prev.records.filter(r => r.categoryId !== categoryId),
                checkingAccountBalance: prev.checkingAccountBalance + balanceAdjustment,
            };
        });
    };
    
    const handleStartEdit = (cat: Category) => {
        setEditingCatId(cat.id);
        setEditingCatName(cat.name);
    };

    const handleCancelEdit = () => {
        setEditingCatId(null);
        setEditingCatName('');
    };

    const handleUpdateCategoryName = (categoryId: string) => {
        const newName = editingCatName.trim();
        if (!newName) {
            handleCancelEdit();
            return;
        }

        setState(prev => {
            if (!prev) return prev;
            if (prev.categories.some(c => c.id !== categoryId && c.name.toLowerCase() === newName.toLowerCase())) {
                alert(`A categoria "${newName}" já existe.`);
                return prev;
            }
            return {
                ...prev,
                categories: prev.categories.map(c => c.id === categoryId ? { ...c, name: newName } : c),
            };
        });
        handleCancelEdit();
    };


    const handleSaveAdjustment = (data: Omit<MonthlyAdjustment, 'id' | 'startMonth' | 'status'>, id?: string) => {
        setState(prev => {
            if (!prev) return prev;
            if (id) { // Editing existing
                 const newAdjustments = prev.monthlyAdjustments.map(adj => adj.id === id ? {...adj, ...data} : adj);
                 return { ...prev, monthlyAdjustments: newAdjustments };
            } else { // Creating new
                const newAdjustment: MonthlyAdjustment = { ...data, id: `adj_${new Date().getTime()}`, startMonth: currentMonth, status: 'pending' };
                return { ...prev, monthlyAdjustments: [...prev.monthlyAdjustments, newAdjustment] };
            }
        })
    };
    
    const handleDeleteAdjustment = (id: string) => {
        setState(prev => {
            if (!prev) return prev;
            
            const adjToDelete = prev.monthlyAdjustments.find(a => a.id === id);
            if (!adjToDelete) return prev;

            let balanceChange = 0;
            if (adjToDelete.status === 'confirmed') {
                const sign = adjToDelete.type === 'income' ? 1 : -1;
                balanceChange = - (adjToDelete.value * sign);
            }

            return {
                ...prev,
                monthlyAdjustments: prev.monthlyAdjustments.filter(a => a.id !== id),
                checkingAccountBalance: prev.checkingAccountBalance + balanceChange,
            };
        })
    }

    const handleMonthChange = (e: React.MouseEvent<HTMLButtonElement>, direction: 'prev' | 'next') => {
        const newMonth = addMonths(currentMonth, direction === 'prev' ? -1 : 1);
        setCurrentMonth(newMonth);
        e.currentTarget.blur();
    };

    const getAdjustmentLabel = (adj: MonthlyAdjustment) => {
        let label = adj.description;
        if (adj.endMonth) {
            const endDate = new Date(adj.endMonth + '-02');
            const formattedDate = endDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            label += ` <span class="text-gray-400 text-xs">(até ${formattedDate})</span>`;
        }
        return label;
    };

    const incomeCategories = state.categories.filter(c => c.type === 'income');
    const expenseCategories = state.categories.filter(c => c.type === 'expense');
    
    const currentMonthAdjustments = state.monthlyAdjustments.filter(a => 
        a.startMonth <= currentMonth && (!a.endMonth || a.endMonth >= currentMonth)
    );

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
                    <div className="lg:col-span-1 space-y-4 flex flex-col">
                        <Card>
                            <h3 className="text-lg font-bold mb-2 text-green-600">Entradas</h3>
                            <div className="space-y-1">
                                {incomeCategories.map((cat, index) => {
                                    const record = state.records.find(r => r.categoryId === cat.id && r.month === currentMonth);
                                    const projectedValue = derivedData.projectedPlaceholders.get(cat.id) || 0;
                                    return (
                                        <FixedCategoryRow
                                            key={cat.id}
                                            cat={cat}
                                            record={record}
                                            projectedValue={projectedValue}
                                            isEditing={editingCatId === cat.id}
                                            editingName={editingCatName}
                                            onNameChange={setEditingCatName}
                                            onStartEdit={handleStartEdit}
                                            onCancelEdit={handleCancelEdit}
                                            onUpdateName={handleUpdateCategoryName}
                                            onDelete={handleDeleteCategory}
                                            onUpdateRecord={handleUpdateRecord}
                                            isFirst={index === 0}
                                        />
                                    );
                                })}
                                {currentMonthAdjustments.filter(adj => adj.type === 'income').map(adj => (
                                    <RecordRow
                                        key={adj.id}
                                        id={adj.id}
                                        label={getAdjustmentLabel(adj)}
                                        value={adj.value}
                                        status={adj.status}
                                        isProjected={false}
                                        onUpdate={handleUpdateAdjustment}
                                        onDelete={handleDeleteAdjustment}
                                        onEdit={() => setAdjustmentModalState({isOpen: true, type: 'income', adjustmentToEdit: adj})}
                                        isFirst={false}
                                        isVariable={true}
                                    />
                                ))}
                            </div>
                            <div className="mt-2 px-2">
                                <Input
                                    icon={<Icon name="plus" className="w-4 h-4 text-gray-400"/>}
                                    placeholder="Adicionar entrada e pressionar Enter"
                                    value={newIncomeCatName}
                                    onChange={e => setNewIncomeCatName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddCategory('income'); }}
                                    className="!p-1 !pl-8 bg-transparent border-0 focus:ring-0 w-full h-auto text-sm"
                                />
                            </div>
                             <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setAdjustmentModalState({isOpen: true, type: 'income'})}>
                                <Icon name="plus" className="w-4 h-4 mr-1"/> Adicionar Variável
                            </Button>
                        </Card>
                        <Card className="flex flex-col flex-grow">
                             <h3 className="text-lg font-bold mb-2 text-red-600">Saídas</h3>
                            <div className="space-y-1 flex-grow">
                                {expenseCategories.map((cat) => {
                                    const record = state.records.find(r => r.categoryId === cat.id && r.month === currentMonth);
                                    const projectedValue = derivedData.projectedPlaceholders.get(cat.id) || 0;
                                    return (
                                        <FixedCategoryRow
                                            key={cat.id}
                                            cat={cat}
                                            record={record}
                                            projectedValue={projectedValue}
                                            isEditing={editingCatId === cat.id}
                                            editingName={editingCatName}
                                            onNameChange={setEditingCatName}
                                            onStartEdit={handleStartEdit}
                                            onCancelEdit={handleCancelEdit}
                                            onUpdateName={handleUpdateCategoryName}
                                            onDelete={handleDeleteCategory}
                                            onUpdateRecord={handleUpdateRecord}
                                            isFirst={false}
                                        />
                                    );
                                })}
                                {currentMonthAdjustments.filter(adj => adj.type === 'expense').map(adj => (
                                    <RecordRow
                                        key={adj.id}
                                        id={adj.id}
                                        label={getAdjustmentLabel(adj)}
                                        value={adj.value}
                                        status={adj.status}
                                        isProjected={false}
                                        onUpdate={handleUpdateAdjustment}
                                        onDelete={handleDeleteAdjustment}
                                        onEdit={() => setAdjustmentModalState({isOpen: true, type: 'expense', adjustmentToEdit: adj})}
                                        isFirst={false}
                                        isVariable={true}
                                    />
                                ))}
                            </div>
                             <div className="mt-2 px-2">
                                <Input
                                    icon={<Icon name="plus" className="w-4 h-4 text-gray-400"/>}
                                    placeholder="Adicionar saída e pressionar Enter"
                                    value={newExpenseCatName}
                                    onChange={e => setNewExpenseCatName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddCategory('expense'); }}
                                    className="!p-1 !pl-8 bg-transparent border-0 focus:ring-0 w-full h-auto text-sm"
                                />
                            </div>
                            <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setAdjustmentModalState({isOpen: true, type: 'expense'})}>
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
            </div>

            {/* Modals */}
            <DistributeBalanceModal isOpen={isDistributeModalOpen} onClose={() => setDistributeModalOpen(false)} state={state} setState={setState} actualBalance={state.checkingAccountBalance} />
            <WealthSettingsModal isOpen={isWealthSettingsModalOpen} onClose={() => setWealthSettingsModalOpen(false)} state={state} setState={setState} />
            {adjustmentModalState.isOpen && (
              <AdjustmentModal
                  isOpen={adjustmentModalState.isOpen}
                  onClose={() => setAdjustmentModalState({ isOpen: false, type: 'income' })}
                  onSave={handleSaveAdjustment}
                  type={adjustmentModalState.type}
                  currentMonth={currentMonth}
                  adjustmentToEdit={adjustmentModalState.adjustmentToEdit}
              />
            )}
        </div>
    );
};

export default MonthlyControlView;