
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

type UnifiedEntry = {
    id: string;
    item: Category | MonthlyAdjustment;
    type: 'category' | 'adjustment';
};

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
            <div className="text-gray-400 cursor-grab touch-none" aria-label="Arraste para reordenar">
                <Icon name="grip-vertical" className="w-5 h-5"/>
            </div>
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

const AdjustmentRow: React.FC<{
    adj: MonthlyAdjustment;
    isEditing: boolean;
    editingDesc: string;
    onDescChange: (newDesc: string) => void;
    onStartEdit: (adj: MonthlyAdjustment) => void;
    onUpdateDesc: (id: string) => void;
    onCancelEdit: () => void;
    onUpdateValue: (id: string, value: number) => void;
    onToggleConfirmation: (id: string) => void;
    onDelete: (id: string) => void;
    onOpenAdvancedEdit: (adj: MonthlyAdjustment) => void;
    currentMonth: string;
}> = ({ adj, isEditing, editingDesc, onDescChange, onStartEdit, onUpdateDesc, onCancelEdit, onUpdateValue, onToggleConfirmation, onDelete, onOpenAdvancedEdit, currentMonth }) => {
    const [inputValue, setInputValue] = useState(adj.value.toString());

    useEffect(() => {
        setInputValue(adj.value.toString());
    }, [adj.value]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };
    
    const handleBlur = () => {
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue)) {
            onUpdateValue(adj.id, numericValue);
        } else if (inputValue === '') {
             onUpdateValue(adj.id, 0);
        }
    };

    const toggleStatus = () => {
        onToggleConfirmation(adj.id);
    };
    
    const isConfirmed = (adj.confirmedMonths || []).includes(currentMonth);

    const EndDatePart: React.FC = () => {
        if (!adj.endMonth) return null;
        const endDate = new Date(adj.endMonth + '-02');
        const formattedDate = endDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        return (
            <button 
                onClick={() => onOpenAdvancedEdit(adj)} 
                className="ml-1 text-gray-400 text-xs hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 disabled:cursor-not-allowed disabled:no-underline"
                aria-label={`Editar detalhes avançados de ${adj.description}`}
                disabled={isConfirmed}
            >
                (até {formattedDate})
            </button>
        );
    };

    return (
        <div className={`group flex items-center gap-2 p-2 rounded-lg transition-colors ${isConfirmed ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
            <div className="text-gray-400 cursor-grab touch-none" aria-label="Arraste para reordenar">
                <Icon name="grip-vertical" className="w-5 h-5"/>
            </div>
            <button 
                onClick={toggleStatus} 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isConfirmed ? 'bg-green-500 border-green-500' : 'border-gray-400'}`} 
                aria-label={isConfirmed ? 'Marcar como pendente' : 'Marcar como confirmado'}
            >
                {isConfirmed && <Icon name="check" className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1 flex items-baseline">
                {isEditing ? (
                    <Input
                        value={editingDesc}
                        onChange={(e) => onDescChange(e.target.value)}
                        onBlur={() => onUpdateDesc(adj.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') onUpdateDesc(adj.id); if (e.key === 'Escape') onCancelEdit(); }}
                        autoFocus
                        className="py-1 h-8"
                    />
                ) : (
                    <>
                        <span className={`flex-shrink-0 ${isConfirmed ? 'opacity-60' : ''} italic`}>{adj.description}</span>
                        <EndDatePart />
                    </>
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
                    className={`w-full text-right bg-transparent outline-none font-semibold ${isConfirmed ? 'opacity-60' : ''}`}
                    aria-label={`Valor para ${adj.description}`}
                    disabled={isEditing}
                />
            </div>
             <div className="flex items-center gap-1 w-12 justify-end">
                {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onStartEdit(adj)} aria-label={`Editar ${adj.description}`} disabled={isConfirmed}>
                            <Icon name="edit" className="w-4 h-4 text-blue-500 hover:text-blue-700"/>
                        </button>
                        <button onClick={() => onDelete(adj.id)} aria-label={`Deletar ${adj.description}`}>
                            <Icon name="trash" className="w-4 h-4 text-red-500 hover:text-red-700"/>
                        </button>
                    </div>
                )}
            </div>
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
    
    // --- State for inline editing ---
    const [newIncomeCatName, setNewIncomeCatName] = useState('');
    const [newExpenseCatName, setNewExpenseCatName] = useState('');
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editingCatName, setEditingCatName] = useState('');
    const [editingAdjId, setEditingAdjId] = useState<string | null>(null);
    const [editingAdjDesc, setEditingAdjDesc] = useState('');
    
    // --- State for Drag and Drop ---
    const [draggedEntry, setDraggedEntry] = useState<UnifiedEntry | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);


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

    const { incomeEntries, expenseEntries } = useMemo(() => {
        if (!state) return { incomeEntries: [], expenseEntries: [] };

        const filterAndMap = (type: 'income' | 'expense') => {
            const cats: UnifiedEntry[] = state.categories
                .filter(c => c.type === type)
                .map(c => ({ id: c.id, item: c, type: 'category' }));

            const adjs: UnifiedEntry[] = state.monthlyAdjustments
                .filter(a => a.type === type && a.startMonth <= currentMonth && (!a.endMonth || a.endMonth >= currentMonth))
                .map(a => ({ id: a.id, item: a, type: 'adjustment' }));
            
            return [...cats, ...adjs].sort((a, b) => a.item.order - b.item.order);
        };

        return { incomeEntries: filterAndMap('income'), expenseEntries: filterAndMap('expense') };
    }, [state.categories, state.monthlyAdjustments, currentMonth]);
    
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

    const handleUpdateAdjustmentValue = useCallback((adjustmentId: string, value: number) => {
        setState(prev => {
            if (!prev) return prev;
            const adj = prev.monthlyAdjustments.find(a => a.id === adjustmentId);
            if (!adj) return prev;

            let balanceChange = 0;
            if ((adj.confirmedMonths || []).includes(currentMonth)) {
                const oldValue = adj.value;
                const sign = adj.type === 'income' ? 1 : -1;
                balanceChange = (value - oldValue) * sign;
            }
            
            const finalAdjustments = prev.monthlyAdjustments.map(a => 
                a.id === adjustmentId ? { ...a, value } : a
            );

            return {
                ...prev,
                monthlyAdjustments: finalAdjustments,
                checkingAccountBalance: prev.checkingAccountBalance + balanceChange,
            };
        });
    }, [setState, currentMonth]);

    const handleToggleAdjustmentConfirmation = useCallback((adjustmentId: string) => {
        setState(prev => {
            if (!prev) return prev;
            
            const newAdjustments = [...prev.monthlyAdjustments];
            const adjIndex = newAdjustments.findIndex(a => a.id === adjustmentId);
            if (adjIndex === -1) return prev;

            const originalAdj = newAdjustments[adjIndex];
            const confirmedMonths = originalAdj.confirmedMonths || [];
            const wasConfirmed = confirmedMonths.includes(currentMonth);
            const newConfirmedMonths = wasConfirmed 
                ? confirmedMonths.filter(m => m !== currentMonth)
                : [...confirmedMonths, currentMonth];
            
            let balanceChange = 0;
            const sign = originalAdj.type === 'income' ? 1 : -1;
            if (wasConfirmed) { // it becomes un-confirmed
                balanceChange = -originalAdj.value * sign;
            } else { // it becomes confirmed
                balanceChange = originalAdj.value * sign;
            }
            
            newAdjustments[adjIndex] = { ...originalAdj, confirmedMonths: newConfirmedMonths };

            return {
                ...prev,
                monthlyAdjustments: newAdjustments,
                checkingAccountBalance: prev.checkingAccountBalance + balanceChange,
            };
        });
    }, [setState, currentMonth]);
    
    // --- Category Management Handlers ---
    const handleAddCategory = (type: 'income' | 'expense') => {
        const name = (type === 'income' ? newIncomeCatName : newExpenseCatName).trim();
        if (!name) return;

        setState(prev => {
            if (!prev) return prev;
            if (prev.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                alert(`A categoria "${name}" já existe.`);
                return prev;
            }

            const newOrder = Math.max(
                ...prev.categories.filter(c => c.type === type).map(c => c.order),
                ...prev.monthlyAdjustments.filter(a => a.type === type).map(a => a.order),
                -1
            ) + 1;

            const newCategory: Category = { id: `cat_${new Date().getTime()}`, name, type, order: newOrder };
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
        setEditingAdjId(null); // Close other editor
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

    // --- Adjustment (Variable) Management Handlers ---
    const handleSaveAdjustment = (data: Omit<MonthlyAdjustment, 'id' | 'startMonth' | 'confirmedMonths'>, id?: string) => {
        setState(prev => {
            if (!prev) return prev;

            const newDesc = data.description.toLowerCase();
            const isDuplicate = prev.monthlyAdjustments.some(adj => 
                (id ? adj.id !== id : true) && adj.description.toLowerCase() === newDesc
            );

            if (isDuplicate) {
                alert(`Já existe um ajuste com a descrição "${data.description}".`);
                return prev;
            }

            if (id) { // Editing existing
                 const newAdjustments = prev.monthlyAdjustments.map(adj => adj.id === id ? {...adj, ...data} : adj);
                 return { ...prev, monthlyAdjustments: newAdjustments };
            } else { // Creating new
                 const newOrder = Math.max(
                    ...prev.categories.filter(c => c.type === data.type).map(c => c.order),
                    ...prev.monthlyAdjustments.filter(a => a.type === data.type).map(a => a.order),
                    -1
                ) + 1;
                const newAdjustment: MonthlyAdjustment = { ...data, id: `adj_${new Date().getTime()}`, startMonth: currentMonth, confirmedMonths: [], order: newOrder };
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
            if ((adjToDelete.confirmedMonths || []).includes(currentMonth)) {
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

    const handleStartEditAdj = (adj: MonthlyAdjustment) => {
        setEditingAdjId(adj.id);
        setEditingAdjDesc(adj.description);
        setEditingCatId(null); // Close other editor
    };

    const handleCancelEditAdj = () => {
        setEditingAdjId(null);
        setEditingAdjDesc('');
    };

    const handleUpdateAdjDescription = (adjustmentId: string) => {
        const newDescription = editingAdjDesc.trim();
        if (!newDescription) {
            handleCancelEditAdj();
            return;
        }

        setState(prev => {
            if (!prev) return prev;
            if (prev.monthlyAdjustments.some(a => a.id !== adjustmentId && a.description.toLowerCase() === newDescription.toLowerCase())) {
                alert(`Já existe um ajuste com a descrição "${newDescription}".`);
                return prev;
            }
            return {
                ...prev,
                monthlyAdjustments: prev.monthlyAdjustments.map(adj => adj.id === adjustmentId ? { ...adj, description: newDescription } : adj),
            };
        });
        handleCancelEditAdj();
    };

    const handleMonthChange = (e: React.MouseEvent<HTMLButtonElement>, direction: 'prev' | 'next') => {
        const newMonth = addMonths(currentMonth, direction === 'prev' ? -1 : 1);
        setCurrentMonth(newMonth);
        e.currentTarget.blur();
    };
    
    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, entry: UnifiedEntry) => {
        setDraggedEntry(entry);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', entry.id); // Necessary for Firefox
    };

    const handleDragEnd = () => {
        setDraggedEntry(null);
        setDragOverId(null);
    };
    
    const handleDrop = (e: React.DragEvent, dropTargetEntry: UnifiedEntry, listType: 'income' | 'expense') => {
        e.preventDefault();
        if (!draggedEntry || draggedEntry.id === dropTargetEntry.id) {
             handleDragEnd();
             return;
        }

        const list = listType === 'income' ? incomeEntries : expenseEntries;
        
        const reorderedList = [...list];
        const draggedIndex = reorderedList.findIndex(item => item.id === draggedEntry.id);
        let targetIndex = reorderedList.findIndex(item => item.id === dropTargetEntry.id);
        
        // Remove dragged item and insert it at the target position
        const [movedItem] = reorderedList.splice(draggedIndex, 1);
        reorderedList.splice(targetIndex, 0, movedItem);

        // Update state with new orders
        setState(prev => {
            if (!prev) return prev;
            const newCategories = [...prev.categories];
            const newAdjustments = [...prev.monthlyAdjustments];

            reorderedList.forEach((entry, index) => {
                const itemToUpdate = entry.item;
                if (entry.type === 'category') {
                    const catIndex = newCategories.findIndex(c => c.id === itemToUpdate.id);
                    if (catIndex > -1) newCategories[catIndex].order = index;
                } else { // adjustment
                    const adjIndex = newAdjustments.findIndex(a => a.id === itemToUpdate.id);
                    if (adjIndex > -1) newAdjustments[adjIndex].order = index;
                }
            });

            return { ...prev, categories: newCategories, monthlyAdjustments: newAdjustments };
        });

        handleDragEnd();
    };

    const renderEntryList = (entries: UnifiedEntry[], type: 'income' | 'expense') => (
        <div className="space-y-1">
            {entries.map((entry, index) => {
                const isDragging = draggedEntry?.id === entry.id;
                const showDropIndicator = dragOverId === entry.id && !isDragging;

                const wrapperProps = {
                    key: entry.id,
                    draggable: !isSimulating,
                    onDragStart: (e: React.DragEvent) => handleDragStart(e, entry),
                    onDragEnd: handleDragEnd,
                    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOverId(entry.id); },
                    onDrop: (e: React.DragEvent) => handleDrop(e, entry, type),
                    className: `relative transition-opacity ${isDragging ? 'opacity-40' : ''}`
                };

                const commonProps = {
                    isFirst: index === 0 && type === 'income',
                };
                
                return (
                    <div {...wrapperProps}>
                        {showDropIndicator && <div className="absolute -top-1 left-2 right-2 h-1 bg-blue-500 rounded-full z-10" />}
                        {entry.type === 'category' ? (
                            <FixedCategoryRow
                                {...commonProps}
                                cat={entry.item as Category}
                                record={state.records.find(r => r.categoryId === entry.id && r.month === currentMonth)}
                                projectedValue={derivedData.projectedPlaceholders.get(entry.id) || 0}
                                isEditing={editingCatId === entry.id}
                                editingName={editingCatName}
                                onNameChange={setEditingCatName}
                                onStartEdit={handleStartEdit}
                                onCancelEdit={handleCancelEdit}
                                onUpdateName={handleUpdateCategoryName}
                                onDelete={handleDeleteCategory}
                                onUpdateRecord={handleUpdateRecord}
                            />
                        ) : (
                            <AdjustmentRow
                                adj={entry.item as MonthlyAdjustment}
                                isEditing={editingAdjId === entry.id}
                                editingDesc={editingAdjDesc}
                                onDescChange={setEditingAdjDesc}
                                onStartEdit={handleStartEditAdj}
                                onCancelEdit={handleCancelEditAdj}
                                onUpdateDesc={handleUpdateAdjDescription}
                                onUpdateValue={handleUpdateAdjustmentValue}
                                onToggleConfirmation={handleToggleAdjustmentConfirmation}
                                onDelete={handleDeleteAdjustment}
                                onOpenAdvancedEdit={(adjToEdit) => setAdjustmentModalState({isOpen: true, type, adjustmentToEdit: adjToEdit})}
                                currentMonth={currentMonth}
                            />
                        )}
                    </div>
                );
            })}
        </div>
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
                            {renderEntryList(incomeEntries, 'income')}
                            <div className="mt-2 pt-2 px-2 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700">
                                <Input
                                    icon={<Icon name="plus" className="w-4 h-4 text-gray-400"/>}
                                    placeholder="Nova categoria fixa"
                                    value={newIncomeCatName}
                                    onChange={e => setNewIncomeCatName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && newIncomeCatName.trim()) handleAddCategory('income'); }}
                                    className="!p-1 !pl-8 bg-transparent border-0 focus:ring-0 w-full h-auto text-sm flex-1"
                                />
                                {newIncomeCatName.trim() && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleAddCategory('income')}
                                        aria-label="Adicionar nova categoria de entrada"
                                        className="animate-[fade-in_150ms_ease-in] shrink-0"
                                    >
                                        Adicionar
                                    </Button>
                                )}
                            </div>
                             <Button size="sm" variant="ghost" className="w-full mt-2" onClick={() => setAdjustmentModalState({isOpen: true, type: 'income'})}>
                                <Icon name="plus" className="w-4 h-4 mr-1"/> Adicionar Variável
                            </Button>
                        </Card>
                        <Card className="flex flex-col flex-grow">
                             <h3 className="text-lg font-bold mb-2 text-red-600">Saídas</h3>
                            {renderEntryList(expenseEntries, 'expense')}
                             <div className="mt-2 pt-2 px-2 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700">
                                <Input
                                    icon={<Icon name="plus" className="w-4 h-4 text-gray-400"/>}
                                    placeholder="Nova categoria fixa"
                                    value={newExpenseCatName}
                                    onChange={e => setNewExpenseCatName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && newExpenseCatName.trim()) handleAddCategory('expense'); }}
                                    className="!p-1 !pl-8 bg-transparent border-0 focus:ring-0 w-full h-auto text-sm flex-1"
                                />
                                 {newExpenseCatName.trim() && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleAddCategory('expense')}
                                        aria-label="Adicionar nova categoria de saída"
                                        className="animate-[fade-in_150ms_ease-in] shrink-0"
                                    >
                                        Adicionar
                                    </Button>
                                )}
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