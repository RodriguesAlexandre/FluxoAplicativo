import React, { useMemo } from 'react';
import { Modal, Button, Icon } from '@/components/common';
import { FinancialState, ManualTransaction } from '@/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface CoverDeficitModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FinancialState;
  setState: React.Dispatch<React.SetStateAction<FinancialState | null>>;
  projectedDeficit: number;
}

export const CoverDeficitModal: React.FC<CoverDeficitModalProps> = ({ isOpen, onClose, state, setState, projectedDeficit }) => {
    
    const { calculations, isCoverable } = useMemo(() => {
        const deficitToCover = Math.abs(projectedDeficit);
        const { emergencyFund, investments, deficitStrategy } = state;
        
        let withdrawalFromEF = 0;
        let withdrawalFromInv = 0;

        if (deficitStrategy === 'emergency_first') {
            withdrawalFromEF = Math.min(emergencyFund.balance, deficitToCover);
            const remainingDeficit = deficitToCover - withdrawalFromEF;
            withdrawalFromInv = Math.min(investments.balance, remainingDeficit);
        } else { // investments_first
            withdrawalFromInv = Math.min(investments.balance, deficitToCover);
            const remainingDeficit = deficitToCover - withdrawalFromInv;
            withdrawalFromEF = Math.min(emergencyFund.balance, remainingDeficit);
        }
        
        const totalWithdrawal = withdrawalFromEF + withdrawalFromInv;
        const isCoverable = totalWithdrawal >= deficitToCover;

        return {
            calculations: {
                deficitToCover,
                withdrawalFromEF,
                withdrawalFromInv,
                totalWithdrawal,
            },
            isCoverable,
        };
    }, [projectedDeficit, state]);

    const handleConfirm = () => {
        const { withdrawalFromEF, withdrawalFromInv, totalWithdrawal } = calculations;
        const newTransactions: ManualTransaction[] = [];
        const transactionDate = new Date().toISOString().slice(0, 10);
        
        // Use totalWithdrawal which might be less than deficitToCover if not fully coverable
        const amountToTransfer = totalWithdrawal; 

        if (withdrawalFromEF > 0) {
            newTransactions.push({
                id: `manual_${new Date().getTime()}_ef_def`,
                type: 'withdrawal',
                account: 'emergencyFund',
                amount: withdrawalFromEF,
                date: transactionDate,
                description: 'Cobertura de déficit mensal'
            });
        }
        if (withdrawalFromInv > 0) {
            newTransactions.push({
                id: `manual_${new Date().getTime()}_inv_def`,
                type: 'withdrawal',
                account: 'investments',
                amount: withdrawalFromInv,
                date: transactionDate,
                description: 'Cobertura de déficit mensal'
            });
        }

        setState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                checkingAccountBalance: prev.checkingAccountBalance + amountToTransfer,
                emergencyFund: { ...prev.emergencyFund, balance: prev.emergencyFund.balance - withdrawalFromEF },
                investments: { ...prev.investments, balance: prev.investments.balance - withdrawalFromInv },
                manualTransactions: [...newTransactions, ...prev.manualTransactions],
            }
        });

        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cobrir Déficit Projetado">
            <div className="space-y-6">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/40 text-center">
                    <p className="text-sm text-red-700 dark:text-red-200">Déficit projetado para o próximo mês</p>
                    <p className="text-3xl font-bold text-red-500">{formatCurrency(calculations.deficitToCover)}</p>
                </div>
                
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 space-y-3">
                    <h4 className="font-bold text-center">Plano de Cobertura (Estratégia: {state.deficitStrategy === 'emergency_first' ? 'Primeiro da Reserva' : 'Primeiro dos Investimentos'})</h4>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Retirar da Reserva de Emergência:</span>
                        <span className="font-semibold">{formatCurrency(calculations.withdrawalFromEF)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Retirar dos Investimentos:</span>
                        <span className="font-semibold">{formatCurrency(calculations.withdrawalFromInv)}</span>
                    </div>
                     <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span>TOTAL DA RETIRADA:</span>
                        <span>{formatCurrency(calculations.totalWithdrawal)}</span>
                    </div>
                </div>

                {!isCoverable && (
                    <div className="p-3 text-center text-sm rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 flex items-start gap-2">
                       <Icon name="warning" className="w-5 h-5 mt-0.5 flex-shrink-0" />
                       <span>Fundos insuficientes para cobrir o déficit total. Apenas {formatCurrency(calculations.totalWithdrawal)} serão transferidos.</span>
                    </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="danger" onClick={handleConfirm} disabled={calculations.totalWithdrawal <= 0}>Confirmar Cobertura</Button>
                </div>
            </div>
        </Modal>
    );
};