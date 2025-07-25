import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input, Icon } from '@/components/common';
import { FinancialState, ManualTransaction } from '@/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface DistributeBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FinancialState;
  setState: React.Dispatch<React.SetStateAction<FinancialState>>;
  actualBalance: number;
  realizedPerformance?: number;
}

export const DistributeBalanceModal: React.FC<DistributeBalanceModalProps> = ({ isOpen, onClose, state, setState, actualBalance, realizedPerformance = 0 }) => {
    const [toEmergency, setToEmergency] = useState('');
    const [toInvestments, setToInvestments] = useState('');
    const [toWithdrawal, setToWithdrawal] = useState('');

    // Reset fields when modal opens
    useEffect(() => {
        if (isOpen) {
            setToInvestments('');
            setToEmergency('');
            setToWithdrawal('');
        }
    }, [isOpen]);
    
    const { amountEF, amountInv, amountWithdraw, totalDistribution, remainingBalance, isInvalid } = useMemo(() => {
        const amountEF = parseFloat(toEmergency) || 0;
        const amountInv = parseFloat(toInvestments) || 0;
        const amountWithdraw = parseFloat(toWithdrawal) || 0;
        const totalDistribution = amountEF + amountInv + amountWithdraw;
        const remainingBalance = actualBalance - totalDistribution;
        const isInvalid = remainingBalance < 0;
        return { amountEF, amountInv, amountWithdraw, totalDistribution, remainingBalance, isInvalid };
    }, [toEmergency, toInvestments, toWithdrawal, actualBalance]);


    const handleSave = () => {
        if (isInvalid || totalDistribution <= 0) {
            alert("O valor total a distribuir não pode ser maior que o saldo em conta.");
            return;
        }

        const newTransactions: ManualTransaction[] = [];
        const transactionDate = new Date().toISOString().slice(0, 10);

        if (amountEF > 0) {
            newTransactions.push({
                id: `manual_${new Date().getTime()}_ef`,
                type: 'deposit',
                account: 'emergencyFund',
                amount: amountEF,
                date: transactionDate,
                description: 'Transferência da Conta Corrente'
            });
        }
        if (amountInv > 0) {
            newTransactions.push({
                id: `manual_${new Date().getTime()}_inv`,
                type: 'deposit',
                account: 'investments',
                amount: amountInv,
                date: transactionDate,
                description: 'Transferência da Conta Corrente'
            });
        }

        setState(prev => ({
            ...prev,
            checkingAccountBalance: prev.checkingAccountBalance - totalDistribution,
            emergencyFund: { ...prev.emergencyFund, balance: prev.emergencyFund.balance + amountEF },
            investments: { ...prev.investments, balance: prev.investments.balance + amountInv },
            manualTransactions: [...newTransactions, ...prev.manualTransactions],
        }));

        onClose();
    };

    const handleAllocateResult = () => {
        if (realizedPerformance > 0 && actualBalance > 0) {
            const amountToAllocate = Math.min(realizedPerformance, actualBalance);
            setToInvestments(amountToAllocate > 0 ? amountToAllocate.toFixed(2) : '');
            setToEmergency('');
            setToWithdrawal('');
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Distribuir Saldo da Conta Corrente">
            <div className="space-y-6">
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Saldo atual em conta</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(actualBalance)}</p>
                </div>
                
                 {realizedPerformance > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Resultado do Mês (Realizado)</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(realizedPerformance)}</p>
                        </div>
                        <Button size="sm" onClick={handleAllocateResult} disabled={actualBalance <= 0}>
                            <Icon name="plus" className="w-4 h-4 mr-1"/>
                            Alocar Resultado
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="to-ef" className="block text-sm font-medium mb-1">Para Reserva de Emergência</label>
                        <Input id="to-ef" type="number" placeholder="0.00" value={toEmergency} onChange={e => setToEmergency(e.target.value)} icon={<Icon name="warning" className="w-5 h-5 text-gray-400"/>} />
                    </div>
                     <div>
                        <label htmlFor="to-inv" className="block text-sm font-medium mb-1">Para Investimentos</label>
                        <Input id="to-inv" type="number" placeholder="0.00" value={toInvestments} onChange={e => setToInvestments(e.target.value)} icon={<Icon name="database" className="w-5 h-5 text-gray-400"/>} />
                    </div>
                     <div>
                        <label htmlFor="to-w" className="block text-sm font-medium mb-1">Retirar / Outras Saídas</label>
                        <Input id="to-w" type="number" placeholder="0.00" value={toWithdrawal} onChange={e => setToWithdrawal(e.target.value)} icon={<Icon name="minus" className="w-5 h-5 text-gray-400"/>} />
                         <p className="text-xs text-gray-500 mt-1">Para registrar gastos não categorizados ou saques.</p>
                    </div>
                </div>
                
                <div className={`p-4 rounded-lg transition-colors ${isInvalid ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Total a distribuir:</span>
                        <span className="font-semibold">{formatCurrency(totalDistribution)}</span>
                    </div>
                    <div className={`flex justify-between items-center mt-2 font-bold ${isInvalid ? 'text-red-600' : 'text-green-700 dark:text-green-300'}`}>
                        <span className="text-base">Saldo Restante:</span>
                        <span className="text-lg">{formatCurrency(remainingBalance)}</span>
                    </div>
                    {isInvalid && <p className="text-xs text-red-600 mt-2 text-center">O total distribuído não pode ser maior que o saldo em conta.</p>}
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isInvalid || totalDistribution <= 0}>Confirmar Distribuição</Button>
                </div>
            </div>
        </Modal>
    );
};