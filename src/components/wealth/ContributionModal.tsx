import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Input, Icon } from '@/components/common';
import { FinancialState, ManualTransaction } from '@/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FinancialState;
  setState: React.Dispatch<React.SetStateAction<FinancialState | null>>;
  projectedSurplus: number;
  emergencyFundGoal: number;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({ isOpen, onClose, state, setState, projectedSurplus, emergencyFundGoal }) => {
    const [amount, setAmount] = useState(projectedSurplus.toFixed(2));

    useEffect(() => {
        if (isOpen) {
            setAmount(projectedSurplus > 0 ? projectedSurplus.toFixed(2) : '0.00');
        }
    }, [isOpen, projectedSurplus]);

    const { allocation, isValid } = useMemo(() => {
        const contributionAmount = parseFloat(amount) || 0;
        
        const neededForEF = Math.max(0, emergencyFundGoal - state.emergencyFund.balance);
        const toEmergencyForGoal = Math.min(contributionAmount, neededForEF);
        
        const remainingAfterGoal = contributionAmount - toEmergencyForGoal;
        
        const toEmergencyFromSplit = remainingAfterGoal > 0 ? remainingAfterGoal * (state.surplusAllocation.emergencyFund / 100) : 0;
        const toInvestmentsFromSplit = remainingAfterGoal > 0 ? remainingAfterGoal * (state.surplusAllocation.investments / 100) : 0;
        
        const finalToEmergency = toEmergencyForGoal + toEmergencyFromSplit;
        const finalToInvestments = toInvestmentsFromSplit;
        
        return {
            allocation: {
                toEmergency: finalToEmergency,
                toInvestments: finalToInvestments,
                total: contributionAmount,
            },
            isValid: contributionAmount > 0 && contributionAmount <= state.checkingAccountBalance
        };
    }, [amount, state, emergencyFundGoal]);
    
    const handleSave = () => {
        if (!isValid) {
            alert("O valor do aporte é inválido ou excede o saldo em conta.");
            return;
        }

        const { toEmergency, toInvestments, total } = allocation;
        const newTransactions: ManualTransaction[] = [];
        const transactionDate = new Date().toISOString().slice(0, 10);

        if (toEmergency > 0) {
            newTransactions.push({
                id: `manual_${new Date().getTime()}_ef`,
                type: 'deposit',
                account: 'emergencyFund',
                amount: toEmergency,
                date: transactionDate,
                description: 'Aporte Mensal Automático'
            });
        }
        if (toInvestments > 0) {
             newTransactions.push({
                id: `manual_${new Date().getTime()}_inv`,
                type: 'deposit',
                account: 'investments',
                amount: toInvestments,
                date: transactionDate,
                description: 'Aporte Mensal Automático'
            });
        }

        setState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                checkingAccountBalance: prev.checkingAccountBalance - total,
                emergencyFund: { ...prev.emergencyFund, balance: prev.emergencyFund.balance + toEmergency },
                investments: { ...prev.investments, balance: prev.investments.balance + toInvestments },
                manualTransactions: [...newTransactions, ...prev.manualTransactions],
            };
        });
        
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Realizar Aporte Mensal">
            <div className="space-y-6">
                <div>
                    <label htmlFor="aporte-amount" className="block text-sm font-medium">Valor do Aporte (R$)</label>
                    <Input id="aporte-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                    <p className="text-xs text-gray-500 mt-1">Sugerido com base no seu superávit projetado. Seu saldo em conta é de {formatCurrency(state.checkingAccountBalance)}.</p>
                </div>
                
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 space-y-3">
                    <h4 className="font-bold text-center">Prévia da Distribuição</h4>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Para Reserva de Emergência:</span>
                        <span className="font-semibold">{formatCurrency(allocation.toEmergency)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Para Investimentos:</span>
                        <span className="font-semibold">{formatCurrency(allocation.toInvestments)}</span>
                    </div>
                     <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span>TOTAL DO APORTE:</span>
                        <span>{formatCurrency(allocation.total)}</span>
                    </div>
                </div>

                {!isValid && allocation.total > 0 && (
                    <div className="p-3 text-center text-sm rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200">
                       Valor inválido. O aporte não pode ser maior que seu saldo em conta.
                    </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!isValid}>Confirmar Aporte</Button>
                </div>
            </div>
        </Modal>
    );
};