
import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Icon, Input, Spinner } from '../common/index.tsx';
import { getFeatureExplanation } from '../../services/geminiService';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <p>
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ?
                <strong key={i} className="font-bold text-gray-800 dark:text-gray-100">{part.slice(2, -2)}</strong> :
                part
            )}
        </p>
    );
};

// --- Tutorial Tab ---
const TutorialTab: React.FC<{ onStartTour: () => void; isNewUser: boolean }> = ({ onStartTour, isNewUser }) => {
    const helpItems = [
        {
            icon: 'check',
            iconBg: 'bg-blue-100 dark:bg-blue-900',
            iconColor: 'text-blue-500',
            title: 'Confirmando Transações',
            text: 'Na tela de "Controle Mensal", clique no círculo ao lado de uma receita ou despesa para confirmá-la. O valor é imediatamente refletido no seu "Saldo em Conta (Atual)".'
        },
        {
            icon: 'wallet',
            iconBg: 'bg-green-100 dark:bg-green-900',
            iconColor: 'text-green-500',
            title: 'Investindo o que Sobrou',
            text: 'Clique em "Distribuir Saldo". No modal, use o atalho "+ Alocar Resultado" para investir o valor exato da sua "Performance Realizada" do mês.'
        },
        {
            icon: 'simulate',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900',
            iconColor: 'text-yellow-500',
            title: 'Planejamento e Simulação',
            text: 'Na tela de "Planejamento", veja como seu patrimônio pode crescer. Use o seletor "Visão Real" vs. "Projeção" e ajuste as estratégias para ver o impacto em tempo real.'
        },
        {
            icon: 'oracle',
            iconBg: 'bg-purple-100 dark:bg-purple-900',
            iconColor: 'text-purple-500',
            title: 'Oráculo Financeiro',
            text: 'A qualquer momento, clique no botão "Oráculo" para receber uma análise completa e dicas da nossa Inteligência Artificial sobre sua saúde financeira.'
        },
    ];

    return (
        <div className="space-y-5">
            {isNewUser && (
                 <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-center border border-blue-200 dark:border-blue-700">
                    <h3 className="font-bold text-base">Bem-vindo(a) ao Fluxo!</h3>
                    <p className="text-sm mt-1">
                        Para começar, que tal configurar seus saldos iniciais? Use o botão roxo <strong className="font-semibold">"Saldos e Metas"</strong> para ajustar seus valores.
                    </p>
                </div>
            )}
            <div>
                 <Button onClick={onStartTour} className="w-full" variant="primary">
                    <Icon name="help" className="w-5 h-5 mr-2" />
                    Fazer Tour Guiado
                </Button>
                <p className="text-center text-xs text-gray-500 mt-2">A melhor forma de aprender é na prática!</p>
            </div>
           
            <div className="flex items-center gap-2">
                <hr className="flex-grow border-gray-200 dark:border-gray-700"/>
                <span className="text-xs text-gray-400">Dicas</span>
                <hr className="flex-grow border-gray-200 dark:border-gray-700"/>
            </div>

            {helpItems.map(item => (
                <div key={item.title} className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                        <Icon name={item.icon} className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">{item.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Ask the Guide Tab (AI Chat) ---
interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const AskTheGuideTab: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { role: 'user', text: userInput };
        setHistory(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await getFeatureExplanation(userInput);
            const modelMessage: ChatMessage = { role: 'model', text: response };
            setHistory(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'model', text: 'Desculpe, ocorreu um erro. Tente novamente.' };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[60vh] sm:h-[50vh]">
            <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                {history.length === 0 ? (
                    <div className="text-center p-6 text-gray-500">
                        <p className="font-semibold">Tem alguma dúvida sobre o app?</p>
                        <p className="text-sm mt-1">Pergunte como usar uma função. Ex: "Como eu confirmo uma despesa?"</p>
                    </div>
                ) : (
                    history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                <SimpleMarkdown text={msg.text} />
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700">
                           <Spinner className="w-5 h-5"/>
                        </div>
                    </div>
                )}
                 <div ref={chatEndRef} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <div className="flex-grow">
                    <Input 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Pergunte sobre uma função..."
                        disabled={isLoading}
                    />
                </div>
                <Button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()}>
                    Enviar
                </Button>
            </div>
        </div>
    );
};

// --- Contact Tab ---
const ContactTab: React.FC = () => {
    return (
        <div className="text-center space-y-4 py-8">
            <h3 className="text-lg font-bold">Entre em Contato</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Gostou do projeto ou tem alguma sugestão? Ficarei feliz em conversar! Me encontre nas redes abaixo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a href="https://api.whatsapp.com/send/?phone=5531987874252&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button variant="primary" className="w-full bg-green-500 hover:bg-green-600 focus:ring-green-500">
                        <Icon name="whatsapp" className="w-5 h-5 mr-2" /> WhatsApp
                    </Button>
                </a>
                <a href="https://www.linkedin.com/in/alexandrerodrigues-bim/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <Button variant="secondary" className="w-full">
                        <Icon name="linkedin" className="w-5 h-5 mr-2" /> LinkedIn
                    </Button>
                </a>
            </div>
        </div>
    );
};


// --- Main Guide Modal ---
interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  isNewUser: boolean;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onStartTour, isNewUser }) => {
    const [activeTab, setActiveTab] = useState<'tutorial' | 'ask' | 'contact'>('tutorial');
    
    const tabStyle = "px-4 py-2 font-semibold text-sm rounded-md transition-colors flex-1";
    const activeTabStyle = "bg-white dark:bg-gray-700 text-blue-600 shadow-sm";
    const inactiveTabStyle = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900/50";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Guia Interativo do Fluxo">
            <div className="space-y-4">
                <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg flex items-center gap-1 mb-4">
                    <button onClick={() => setActiveTab('tutorial')} className={`${tabStyle} ${activeTab === 'tutorial' ? activeTabStyle : inactiveTabStyle}`}>
                        Primeiros Passos
                    </button>
                    <button onClick={() => setActiveTab('ask')} className={`${tabStyle} ${activeTab === 'ask' ? activeTabStyle : inactiveTabStyle}`}>
                        <span className="flex items-center justify-center gap-2">
                            <Icon name="message-circle" className="w-4 h-4" /> Pergunte ao Guia
                        </span>
                    </button>
                    <button onClick={() => setActiveTab('contact')} className={`${tabStyle} ${activeTab === 'contact' ? activeTabStyle : inactiveTabStyle}`}>
                        Contato
                    </button>
                </div>
                {activeTab === 'tutorial' && <TutorialTab onStartTour={onStartTour} isNewUser={isNewUser} />}
                {activeTab === 'ask' && <AskTheGuideTab />}
                {activeTab === 'contact' && <ContactTab />}
                 <div className="mt-6 flex justify-end">
                    <Button onClick={onClose}>Entendido!</Button>
                </div>
            </div>
        </Modal>
    );
};