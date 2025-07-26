import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Icon } from '../common/index.tsx';
import { FinancialGoal } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: FinancialGoal) => void;
  goalToEdit?: FinancialGoal;
  averageFutureSurplus: number;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, goalToEdit, averageFutureSurplus }) => {
    const [name, setName] = useState('');
    const [targetValue, setTargetValue] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [monthlyContribution, setMonthlyContribution] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (goalToEdit) {
                setName(goalToEdit.name);
                setTargetValue(goalToEdit.targetValue.toString());
                setCurrentValue(goalToEdit.currentValue.toString());
                setMonthlyContribution(goalToEdit.monthlyContribution.toString());
            } else {
                setName('');
                setTargetValue('');
                setCurrentValue('0');
                setMonthlyContribution(averageFutureSurplus > 0 ? averageFutureSurplus.toFixed(2) : '100');
            }
        }
    }, [isOpen, goalToEdit, averageFutureSurplus]);

    const handleSave = () => {
        const numTarget = parseFloat(targetValue);
        const numCurrent = parseFloat(currentValue);
        const numContribution = parseFloat(monthlyContribution);

        if (!name.trim() || isNaN(numTarget) || numTarget <= 0 || isNaN(numCurrent) || isNaN(numContribution)) {
            alert("Por favor, preencha todos os campos com valores válidos.");
            return;
        }

        onSave({
            id: goalToEdit?.id || `goal_${new Date().getTime()}`,
            name: name.trim(),
            targetValue: numTarget,
            currentValue: numCurrent,
            monthlyContribution: numContribution,
        });
    };

    const title = goalToEdit ? 'Editar Meta Financeira' : 'Adicionar Nova Meta';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                    <label htmlFor="goal-name" className="block text-sm font-medium">Nome da Meta</label>
                    <Input id="goal-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Comprar um Carro" required/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="goal-target" className="block text-sm font-medium">Valor da Meta (R$)</label>
                        <Input id="goal-target" type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="100000" required/>
                    </div>
                     <div>
                        <label htmlFor="goal-current" className="block text-sm font-medium">Valor Inicial (R$)</label>
                        <Input id="goal-current" type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="0" required/>
                    </div>
                </div>
                <div>
                    <label htmlFor="goal-contribution" className="block text-sm font-medium">Aporte Mensal (R$)</label>
                    <Input id="goal-contribution" type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} required/>
                    <p className="text-xs text-gray-500 mt-1">Sugerido com base no seu superávit projetado de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageFutureSurplus)}.</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Meta</Button>
                </div>
            </form>
        </Modal>
    );
};