import React, { useState, useEffect } from 'react';
import { FinancialState } from '../../types';
import { Modal, Button, Input } from '../common/index.tsx';

export const WealthSettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    state: FinancialState;
    setState: React.Dispatch<React.SetStateAction<FinancialState>>;
}> = ({isOpen, onClose, state: initialState, setState}) => {
    const [localState, setLocalState] = useState(initialState);

    useEffect(() => {
        if(isOpen) {
            setLocalState(initialState);
        }
    }, [isOpen, initialState]);

    const handleSave = () => {
        setState(localState);
        onClose();
    };
    
    const Separator = () => <hr className="border-gray-200 dark:border-gray-600" />;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajustar Saldos e Metas">
            <div className="space-y-6">
                
                {/* Saldos Iniciais */}
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Saldos Iniciais</h3>
                     <div>
                        <label htmlFor="checkingAccountBalance" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Saldo em Conta Corrente (R$)</label>
                        <Input id="checkingAccountBalance" type="number" value={localState.checkingAccountBalance} onChange={e => setLocalState(p => ({...p, checkingAccountBalance: Number(e.target.value)}))} className="mt-1" />
                     </div>
                      <div>
                        <label htmlFor="emergencyFundBalance" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Saldo na Reserva de Emergência (R$)</label>
                        <Input id="emergencyFundBalance" type="number" value={localState.emergencyFund.balance} onChange={e => setLocalState(p => ({...p, emergencyFund: {...p.emergencyFund, balance: Number(e.target.value)} }))} className="mt-1" />
                     </div>
                      <div>
                        <label htmlFor="investmentsBalance" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Saldo em Investimentos (R$)</label>
                        <Input id="investmentsBalance" type="number" value={localState.investments.balance} onChange={e => setLocalState(p => ({...p, investments: {...p.investments, balance: Number(e.target.value)} }))} className="mt-1" />
                     </div>
                </div>

                <Separator />

                {/* Meta da Reserva de Emergência */}
                <div className="space-y-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Meta da Reserva de Emergência</h3>
                    <div className="flex items-stretch gap-2">
                        <Button
                            variant={localState.emergencyFund.settings.goalType === 'months_of_expense' ? 'primary' : 'secondary'}
                            onClick={() => setLocalState(p => ({...p, emergencyFund: {...p.emergencyFund, settings: {...p.emergencyFund.settings, goalType: 'months_of_expense'}}}))}
                            className="flex-1"
                        >
                            Meses de Despesa
                        </Button>
                        <Button
                            variant={localState.emergencyFund.settings.goalType === 'manual' ? 'primary' : 'secondary'}
                            onClick={() => setLocalState(p => ({...p, emergencyFund: {...p.emergencyFund, settings: {...p.emergencyFund.settings, goalType: 'manual'}}}))}
                            className="flex-1"
                        >
                            Valor Manual
                        </Button>
                    </div>
                    {localState.emergencyFund.settings.goalType === 'months_of_expense' ? (
                        <div>
                            <label htmlFor="targetMonths" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Meses de despesa</label>
                            <Input id="targetMonths" type="number" value={localState.emergencyFund.settings.targetMonths} onChange={e => setLocalState(p => ({...p, emergencyFund: {...p.emergencyFund, settings: {...p.emergencyFund.settings, targetMonths: Number(e.target.value)}}}))} className="mt-1"/>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="manualGoal" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Meta Manual (R$)</label>
                            <Input id="manualGoal" type="number" value={localState.emergencyFund.settings.manualGoal} onChange={e => setLocalState(p => ({...p, emergencyFund: {...p.emergencyFund, settings: {...p.emergencyFund.settings, manualGoal: Number(e.target.value)}}}))} className="mt-1"/>
                        </div>
                    )}
                </div>
                
                <Separator />

                {/* Configurações de Rendimento */}
                <div className="space-y-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Configurações de Rendimento</h3>
                     <p className="text-sm text-gray-500">Taxa de juros mensal esperada para cada conta.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="efInterest" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Reserva (%)</label>
                            <Input id="efInterest" type="number" step="0.01" value={localState.emergencyFund.settings.monthlyInterestRate} onChange={e => setLocalState(p => ({...p, emergencyFund: {...p.emergencyFund, settings: {...p.emergencyFund.settings, monthlyInterestRate: Number(e.target.value)}}}))} className="mt-1" />
                        </div>
                        <div>
                            <label htmlFor="invInterest" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Investimentos (%)</label>
                            <Input id="invInterest" type="number" step="0.01" value={localState.investments.settings.monthlyInterestRate} onChange={e => setLocalState(p => ({...p, investments: {...p.investments, settings: {...p.investments.settings, monthlyInterestRate: Number(e.target.value)}}}))} className="mt-1"/>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600 mt-6">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                </div>
            </div>
        </Modal>
    )
};