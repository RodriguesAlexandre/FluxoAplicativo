
import React, { useState, useEffect } from 'react';
import { Modal, Spinner, Button, Icon } from '../common/index.tsx';
import { getFinancialAnalysis } from '../../services/geminiService';
import { FinancialState } from '../../types';

interface OracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: FinancialState;
}

// A simple markdown parser for bold and lists
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const sections = text.split('**').filter(s => s.trim() !== '');

    return (
        <div className="space-y-4">
            {sections.map((section, index) => {
                if (index % 2 === 0) {
                    // This is a title
                    return <h3 key={index} className="font-bold text-lg mt-3 mb-1 text-gray-800 dark:text-gray-100">{section.trim()}</h3>;
                } else {
                    // This is content for the previous title
                    const listItems = section.split(/\n-|\n\d\./).filter(s => s.trim() !== '');
                    return (
                        <ul key={index} className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-300">
                            {listItems.map((item, itemIndex) => (
                                <li key={itemIndex}>{item.trim()}</li>
                            ))}
                        </ul>
                    );
                }
            })}
        </div>
    );
};


export const OracleModal: React.FC<OracleModalProps> = ({ isOpen, onClose, state }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!state) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await getFinancialAnalysis(state);
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-48">
          <Spinner />
          <p className="mt-4 text-gray-500">Oráculo processando seus dados...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center text-red-500">
          <p><strong>Erro:</strong> {error}</p>
          <Button onClick={fetchAnalysis} className="mt-4">Tentar Novamente</Button>
        </div>
      );
    }
    if (analysis) {
      return <SimpleMarkdown text={analysis} />;
    }
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Oráculo Financeiro">
      <div className="min-h-[200px]">
        {renderContent()}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        {analysis && !isLoading && <Button variant="secondary" onClick={fetchAnalysis}>Analisar Novamente</Button>}
        <Button variant="primary" onClick={onClose}>Entendido!</Button>
      </div>
    </Modal>
  );
};