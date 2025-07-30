import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../common/index.tsx';
import { MonthlyAdjustment } from '../../types';

interface AdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<MonthlyAdjustment, 'id' | 'startMonth' | 'status'>, id?: string) => void;
    type: 'income' | 'expense';
    currentMonth: string;
    adjustmentToEdit?: MonthlyAdjustment;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ isOpen, onClose, onSave, type, currentMonth, adjustmentToEdit }) => {
    const [description, setDescription] = useState('');
    const [value, setValue] = useState('');
    const [endMonth, setEndMonth] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (adjustmentToEdit) {
                setDescription(adjustmentToEdit.description);
                setValue(adjustmentToEdit.value.toString());
                setEndMonth(adjustmentToEdit.endMonth || '');
            } else {
                setDescription('');
                setValue('');
                setEndMonth('');
            }
        }
    }, [isOpen, adjustmentToEdit]);

    const handleSave = () => {
        const numericValue = parseFloat(value);
        if (!description.trim() || isNaN(numericValue) || numericValue <= 0) {
            alert("Por favor, preencha a descrição e um valor válido.");
            return;
        }

        onSave(
            {
                description: description.trim(),
                value: Math.abs(numericValue),
                endMonth: endMonth || null,
                type,
                order: adjustmentToEdit?.order ?? 0,
            },
            adjustmentToEdit?.id
        );
        
        onClose();
    };
    
    const title = adjustmentToEdit
        ? `Editar ${type === 'income' ? 'Entrada' : 'Saída'} Variável`
        : `Adicionar ${type === 'income' ? 'Entrada' : 'Saída'} Variável`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
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