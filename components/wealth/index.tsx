
import React, { useState, useMemo, useCallback } from 'react';
import { FinancialState, Asset, AppView, ManualTransaction, DeficitStrategy, SurplusAllocation } from '../../types';
import { Card, Button, Icon, Input, Modal } from '../common/index.tsx';
import { WealthProjectionChart } from '../charts/index.tsx';
import { calculateProjections } from '../../services/financialProjection';
import { WealthSettingsModal } from './WealthSettingsModal';
import { ContributionModal } from './ContributionModal';
import { CoverDeficitModal } from './CoverDeficitModal';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


// --- Sub-Components ---
const WealthMetricCard: React.FC<{ title: string; value: number; isBridge?: boolean; children?: React.ReactNode }> = ({ title, value, isBridge = false, children }) => {
    const valueColor = isBridge 
        ? (value >= 0 ? 'text-green-500' : 'text-red-500') 
        : 'text-gray-800 dark:text-gray-100';

    return (
        <Card className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className={`text-xl sm:text-2xl font-bold ${valueColor} mt-1`}>{formatCurrency(value)}</p>
            {children && <div className="mt-auto pt-4">{children}</div>}
        </Card>
    );
};


const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const ManualTransactionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    account: 'emergencyFund' | 'investments';
    type: 'deposit' | 'withdrawal';
    setState: React.Dispatch<React.SetStateAction<FinancialState>>;
}> = ({ isOpen, onClose, account, type, setState }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) return;

        setState(prev => {
            const newTransaction: ManualTransaction = {
                id: `manual_${new Date().getTime()}`,
                account,
                type,
                amount: numericAmount,
                date,
                description: description || `${type === 'deposit' ? 'Depósito' : 'Retirada'} em ${account === 'emergencyFund' ? 'Reserva' : 'Investimentos'}`
            };

            const newBalance = type === 'deposit'
                ? prev[account].balance + numericAmount
                : prev[account].balance - numericAmount;

            return {
                ...prev,
                manualTransactions: [newTransaction, ...prev.manualTransactions],
                [account]: {
                    ...prev[account],
                    balance: newBalance,
                }
            }
        });

        setAmount('');
        setDescription('');
        onClose();
    };
    
    const title = `${type === 'deposit' ? 'Adicionar' : 'Retirar'} de ${account === 'emergencyFund' ? 'Reserva de Emergência' : 'Investimentos'}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium">Valor (R$)</label>
                    <Input id="amount" type="number" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium">Descrição (Opcional)</label>
                    <Input id="description" type="text" placeholder="Ex: Aporte extra, Resgate para viagem" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium">Data</label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant={type === 'deposit' ? 'primary' : 'danger'}>{type === 'deposit' ? 'Adicionar' : 'Retirar'}</Button>
                </div>
             </form>
        </Modal>
    )
}

const AssetModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    setState: React.Dispatch<React.SetStateAction<FinancialState>>;
}> = ({ isOpen, onClose, setState }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericValue = parseFloat(value);
        if (name.trim() === '' || isNaN(numericValue) || numericValue < 0) return;

        setState(prev => {
            const newAsset: Asset = {
                id: `asset_${new Date().getTime()}`,
                name: name.trim(),
                value: numericValue,
            };
            return {
                ...prev,
                assets: [...prev.assets, newAsset],
            };
        });
        setName('');
        setValue('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Ativo">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="assetName" className="block text-sm font-medium">Nome do Ativo</label>
                    <Input id="assetName" type="text" placeholder="Ex: Carro, Apartamento" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="assetValue" className="block text-sm font-medium">Valor de Mercado (R$)</label>
                    <Input id="assetValue" type="number" placeholder="0,00" value={value} onChange={e => setValue(e.target.value)} required />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Adicionar Ativo</Button>
                </div>
            </form>
        </Modal>
    );
}

// --- Main View ---
interface WealthPlanningViewProps {
    state: FinancialState;
    setState: React.Dispatch<React.SetStateAction<FinancialState>>;
    setAppView: (view: AppView) => void;
}

export const WealthPlanningView: React.FC<WealthPlanningViewProps> = ({ state, setState, setAppView }) => {
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isAssetModalOpen, setAssetModalOpen] = useState(false);
    const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, account: 'emergencyFund' | 'investments', type: 'deposit' | 'withdrawal'}>({isOpen: false, account: 'investments', type: 'deposit'});
    const [projectionYears, setProjectionYears] = useState(20);
    const [projectionMode, setProjectionMode] = useState<'real' | 'projected'>('real');
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [isDeficitModalOpen, setIsDeficitModalOpen] = useState(false);


    const { averageFutureSurplus, averageFutureExpense } = useMemo(() => {
        if (!state) return { averageFutureSurplus: 0, averageFutureExpense: 0 };
        return calculateProjections(state);
    }, [state]);

    const wealthCalculations = useMemo(() => {
        const netWorth = state.emergencyFund.balance + state.investments.balance;
        const totalAssetsValue = state.assets.reduce((sum, asset) => sum + asset.value, 0);
        const totalPatrimony = netWorth + totalAssetsValue;
        
        const emergencyFundGoal = state.emergencyFund.settings.goalType === 'manual'
            ? state.emergencyFund.settings.manualGoal
            : (averageFutureExpense || 3000) * state.emergencyFund.settings.targetMonths;

        return { netWorth, totalPatrimony, emergencyFundGoal };
    }, [state, averageFutureExpense]);
    
    const wealthProjection = useMemo(() => {
        const projection: { year: number; aportes: number; growth: number }[] = [];
        let currentInvestments = state.investments.balance;
        let currentEmergency = state.emergencyFund.balance;
        let totalAportes = currentInvestments + currentEmergency;

        const monthlyPerformance = projectionMode === 'projected' ? averageFutureSurplus : 0;

        const invInterest = state.investments.settings.monthlyInterestRate / 100;
        const efInterest = state.emergencyFund.settings.monthlyInterestRate / 100;
        const efGoal = wealthCalculations.emergencyFundGoal;

        for (let year = 0; year <= projectionYears; year++) {
            if (year > 0) {
                 for(let month = 0; month < 12; month++) {
                    // 1. Accrue interest
                    currentEmergency *= (1 + efInterest);
                    currentInvestments *= (1 + invInterest);

                    // 2. Handle monthly surplus or deficit (only in projection mode)
                    if (monthlyPerformance >= 0) { // Surplus
                        const surplus = monthlyPerformance;
                        let surplusToEF = 0;
                        let surplusToInv = 0;

                        const neededForEF = Math.max(0, efGoal - currentEmergency);
                        
                        const allocationToEFForGoal = Math.min(surplus, neededForEF);
                        surplusToEF += allocationToEFForGoal;
                        
                        const remainingSurplus = surplus - allocationToEFForGoal;
                        if (remainingSurplus > 0) {
                            surplusToEF += remainingSurplus * (state.surplusAllocation.emergencyFund / 100);
                            surplusToInv = remainingSurplus * (state.surplusAllocation.investments / 100);
                        }
                        
                        currentEmergency += surplusToEF;
                        currentInvestments += surplusToInv;
                        totalAportes += surplus;

                    } else { // Deficit
                        let deficitToCover = Math.abs(monthlyPerformance);
                        
                        if (state.deficitStrategy === 'emergency_first') {
                            const fromEF = Math.min(currentEmergency, deficitToCover);
                            currentEmergency -= fromEF;
                            deficitToCover -= fromEF;
                            
                            const fromInv = Math.min(currentInvestments, deficitToCover);
                            currentInvestments -= fromInv;
                        } else { // 'investments_first'
                            const fromInv = Math.min(currentInvestments, deficitToCover);
                            currentInvestments -= fromInv;
                            deficitToCover -= fromInv;
                            
                            const fromEF = Math.min(currentEmergency, deficitToCover);
                            currentEmergency -= fromEF;
                        }
                    }
                 }
            }
            const totalValue = currentEmergency + currentInvestments;
            projection.push({
                year: year,
                aportes: totalAportes,
                growth: totalValue - totalAportes,
            });
        }
        return projection;
    }, [state, projectionYears, averageFutureSurplus, wealthCalculations.emergencyFundGoal, projectionMode]);
    
    const canCoverDeficit = state.emergencyFund.balance + state.investments.balance >= Math.abs(averageFutureSurplus);

    const handleOpenTransaction = (account: 'emergencyFund' | 'investments', type: 'deposit' | 'withdrawal') => {
        setTransactionModal({ isOpen: true, account, type });
    };

    const handleDeleteAsset = (id: string) => {
        setState(prev => ({...prev, assets: prev.assets.filter(a => a.id !== id)}));
    };
    
    const handleStrategyChange = (change: Partial<FinancialState>) => {
        setState(prev => ({ ...prev, ...change }));
        // Automatically switch to projection view to give immediate feedback
        setProjectionMode('projected');
    };
    
    const handleAllocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const efPercentage = parseInt(e.target.value, 10);
        handleStrategyChange({
            surplusAllocation: {
                emergencyFund: efPercentage,
                investments: 100 - efPercentage,
                checkingAccount: 0 // assuming it's always 0 for now
            }
        });
    };
    
    const handleDeficitStrategyChange = (strategy: DeficitStrategy) => {
        handleStrategyChange({ deficitStrategy: strategy });
    };

    const chartLabels = projectionMode === 'real'
        ? { principal: 'Patrimônio Inicial', growth: 'Crescimento (Juros)' }
        : { principal: 'Total Aportado', growth: 'Crescimento (Juros)' };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-2xl font-bold">Planejamento de Riqueza</h2>
                 <Button variant="accent" onClick={() => setSettingsModalOpen(true)}><Icon name="settings" className="w-5 h-5 mr-2"/>Ajustar Saldos e Metas</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <WealthMetricCard title="Patrimônio Total" value={wealthCalculations.totalPatrimony} />
                <WealthMetricCard title="Patrimônio Líquido" value={wealthCalculations.netWorth} />
                <WealthMetricCard
                    title={averageFutureSurplus >= 0 ? "Aporte Mensal Projetado" : "Déficit Mensal Projetado"}
                    value={averageFutureSurplus}
                    isBridge
                >
                    <div className="mt-auto pt-2 text-center text-xs text-gray-500 dark:text-gray-400 flex flex-col justify-between h-full">
                        <div>
                            <Icon name="simulate" className="w-4 h-4 mx-auto mb-1 text-blue-500"/>
                            <p>
                                Projeção com base no seu desempenho médio dos próximos 12 meses.
                            </p>
                        </div>
                        <div className="w-full mt-2">
                           {averageFutureSurplus > 0 ? (
                                <Button size="sm" variant="ghost" className="w-full" onClick={() => setIsContributionModalOpen(true)} disabled={state.checkingAccountBalance < averageFutureSurplus}>
                                    <Icon name="plus" className="w-4 h-4 mr-1"/>
                                    Realizar Aporte
                                </Button>
                            ) : (
                                <Button size="sm" variant="danger-ghost" className="w-full" onClick={() => setIsDeficitModalOpen(true)} disabled={!canCoverDeficit}>
                                    <Icon name="minus" className="w-4 h-4 mr-1"/>
                                    Cobrir Déficit
                                </Button>
                            )}
                        </div>
                    </div>
                </WealthMetricCard>
                <WealthMetricCard title="Reserva de Emergência" value={state.emergencyFund.balance}>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span>Meta: {formatCurrency(wealthCalculations.emergencyFundGoal)}</span>
                            <span>{Math.round((state.emergencyFund.balance / (wealthCalculations.emergencyFundGoal||1)) * 100)}%</span>
                        </div>
                        <ProgressBar value={state.emergencyFund.balance} max={wealthCalculations.emergencyFundGoal} />
                         {state.emergencyFund.balance < wealthCalculations.emergencyFundGoal && (
                            <div className="mt-2 flex items-start gap-2 text-xs p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                <Icon name="help" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span><strong>Foco aqui:</strong> Priorize completar sua reserva. Ela é a base para sua segurança e futuros investimentos.</span>
                            </div>
                        )}
                        <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="ghost" className="w-full text-green-600" onClick={() => handleOpenTransaction('emergencyFund', 'deposit')}><Icon name="plus" className="w-4 h-4 mr-1"/>Adicionar</Button>
                            <Button size="sm" variant="ghost" className="w-full text-red-600" onClick={() => handleOpenTransaction('emergencyFund', 'withdrawal')}><Icon name="minus" className="w-4 h-4 mr-1"/>Retirar</Button>
                        </div>
                    </div>
                </WealthMetricCard>
                <WealthMetricCard title="Investimentos" value={state.investments.balance}>
                     <div className="flex gap-2 mt-auto pt-2">
                        <Button size="sm" variant="ghost" className="w-full text-green-600" onClick={() => handleOpenTransaction('investments', 'deposit')}><Icon name="plus" className="w-4 h-4 mr-1"/>Aportar</Button>
                        <Button size="sm" variant="ghost" className="w-full text-red-600" onClick={() => handleOpenTransaction('investments', 'withdrawal')}><Icon name="minus" className="w-4 h-4 mr-1"/>Resgatar</Button>
                    </div>
                </WealthMetricCard>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2" data-tour-id="grafico-riqueza">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold">Projeção de Riqueza</h3>
                            <div className="flex gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg mt-2 inline-flex">
                                <button onClick={() => setProjectionMode('real')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${projectionMode === 'real' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'hover:bg-gray-300/50'}`}>Visão Real</button>
                                <button onClick={() => setProjectionMode('projected')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${projectionMode === 'projected' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'hover:bg-gray-300/50'}`}>Projeção com Aportes</button>
                            </div>
                        </div>
                        <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg mt-2 sm:mt-0">
                            {[
                                {label: '1 Ano', value: 1},
                                {label: '2 Anos', value: 2},
                                {label: '5 Anos', value: 5},
                                {label: '10 Anos', value: 10},
                                {label: '20 Anos', value: 20}
                            ].map(period => (
                                <button
                                    key={period.value}
                                    onClick={() => setProjectionYears(period.value)}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                        projectionYears === period.value
                                            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                                    }`}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <WealthProjectionChart 
                        data={wealthProjection} 
                        principalLabel={chartLabels.principal}
                        growthLabel={chartLabels.growth}
                    />
                </Card>
                 <div className="space-y-6">
                    <Card data-tour-id="estrategia-projecao">
                        <h3 className="text-lg font-bold mb-2">Estratégia de Projeção</h3>
                        <div className="space-y-4">
                            {/* Surplus Allocation */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Alocação de Superávit</label>
                                <p className="text-xs text-gray-500 mb-2">Como o superávit mensal projetado é dividido.</p>
                                <input id="surplusAllocation" type="range" min="0" max="100" step="5" value={state.surplusAllocation.emergencyFund} onChange={handleAllocationChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2" />
                                <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                                    <span>Reserva: {state.surplusAllocation.emergencyFund}%</span>
                                    <span>Investimentos: {state.surplusAllocation.investments}%</span>
                                </div>
                            </div>
                             {/* Deficit Strategy */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">Estratégia de Déficit</label>
                                 <p className="text-xs text-gray-500 mb-2">De onde o dinheiro é retirado para cobrir um déficit.</p>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        variant={state.deficitStrategy === 'emergency_first' ? 'primary' : 'secondary'}
                                        onClick={() => handleDeficitStrategyChange('emergency_first')}
                                    >
                                        Primeiro da Reserva
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={state.deficitStrategy === 'investments_first' ? 'primary' : 'secondary'}
                                        onClick={() => handleDeficitStrategyChange('investments_first')}
                                    >
                                        Primeiro dos Investimentos
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Outros Ativos</h3>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                            {state.assets.map(asset => (
                                <div key={asset.id} className="flex justify-between items-center group text-sm p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                    <span>{asset.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{formatCurrency(asset.value)}</span>
                                        <button onClick={() => handleDeleteAsset(asset.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Deletar ${asset.name}`}>
                                            <Icon name="trash" className="w-4 h-4 text-red-500 hover:text-red-700"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {state.assets.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">Nenhum ativo imobilizado registrado.</p>
                            )}
                        </div>
                        <Button variant="secondary" size="sm" className="w-full" onClick={() => setAssetModalOpen(true)}>
                            <Icon name="plus" className="w-4 h-4 mr-1"/> Adicionar Ativo
                        </Button>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-bold mb-4">Últimas Transações</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {state.manualTransactions.slice(0, 5).map(tx => (
                                <div key={tx.id} className="flex justify-between items-center text-sm p-1">
                                    <div>
                                        <p className="font-semibold">{tx.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.date+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <span className={`font-bold ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.type === 'deposit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                            {state.manualTransactions.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nenhuma transação manual registrada.</p>}
                        </div>
                    </Card>
                 </div>
             </div>

             <WealthSettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} state={state} setState={setState} />
             {transactionModal.isOpen && <ManualTransactionModal isOpen={transactionModal.isOpen} onClose={() => setTransactionModal(p => ({...p, isOpen: false}))} account={transactionModal.account} type={transactionModal.type} setState={setState} />}
             <AssetModal isOpen={isAssetModalOpen} onClose={() => setAssetModalOpen(false)} setState={setState} />
             {isContributionModalOpen && (
                <ContributionModal
                    isOpen={isContributionModalOpen}
                    onClose={() => setIsContributionModalOpen(false)}
                    state={state}
                    setState={setState}
                    projectedSurplus={averageFutureSurplus}
                    emergencyFundGoal={wealthCalculations.emergencyFundGoal}
                />
            )}
            {isDeficitModalOpen && (
                <CoverDeficitModal
                    isOpen={isDeficitModalOpen}
                    onClose={() => setIsDeficitModalOpen(false)}
                    state={state}
                    setState={setState}
                    projectedDeficit={averageFutureSurplus}
                />
            )}
        </div>
    );
};

export default WealthPlanningView;