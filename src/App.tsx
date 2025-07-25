import React, { useState, useEffect, useRef } from 'react';
import type firebase from 'firebase/compat/app';
import { auth, googleProvider, firebaseConfig } from '@/services/firebase';
import { useFinancialState } from '@/hooks/useFinancialState';
import { AppView, FinancialState } from '@/types';
import MonthlyControlView from '@/components/monthly';
import WealthPlanningView from '@/components/wealth';
import { OracleModal } from '@/components/oracle/OracleModal';
import { Button, Icon, Modal, Spinner, Input } from '@/components/common';
import { LoginScreen } from '@/components/LoginScreen';
import { BLANK_FINANCIAL_STATE } from '@/constants';
import { GuideModal } from '@/components/guide/GuideModal';
import { tourSteps } from '@/tourSteps';
import { TourPopover } from '@/components/tour/TourPopover';

type FirebaseUser = firebase.User;

// --- Header Component ---
const AppHeader: React.FC<{
    activeView: AppView;
    onSetView: (view: AppView) => void;
    onOpenHelp: () => void;
    onOpenReset: () => void;
    user: FirebaseUser | null;
    isGuest: boolean;
    onSignOut: () => void;
    isSimulating: boolean;
}> = ({ activeView, onSetView, onOpenHelp, onOpenReset, user, isGuest, onSignOut, isSimulating }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const tabStyle = "px-1 sm:px-4 py-2 text-sm sm:text-base font-semibold transition-all duration-200 border-b-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const activeTabStyle = "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400";
    const inactiveTabStyle = "text-gray-500 border-transparent hover:text-gray-800 dark:hover:text-gray-200";

    const userName = isGuest ? "Convidado" : user?.displayName || 'Usuário';
    const userEmail = isGuest ? "Dados salvos localmente" : user?.email;
    const userPhoto = isGuest ? null : user?.photoURL || undefined;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header data-tour-id="app-header" className="sticky top-0 z-30 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center h-16 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-600 text-white"><Icon name="logo" /></div>
                    <h1 className="text-xl font-bold hidden sm:block">Fluxo</h1>
                </div>
                <div className="flex-1 flex justify-center items-center">
                   <div className="flex items-center gap-4 sm:gap-8">
                        <button className={`${tabStyle} ${activeView === 'monthly' ? activeTabStyle : inactiveTabStyle}`} onClick={() => onSetView('monthly')} disabled={isSimulating}>
                            Controle Mensal
                        </button>
                        <button data-tour-id="aba-planejamento" className={`${tabStyle} ${activeView === 'wealth' ? activeTabStyle : inactiveTabStyle}`} onClick={() => onSetView('wealth')} disabled={isSimulating}>
                            Planejamento
                        </button>
                    </div>
                </div>
                <div className="relative" ref={menuRef} data-tour-id="user-menu">
                    <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        {isGuest ? (
                            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-sm" title="Modo Convidado">
                                <Icon name="user-circle" className="w-6 h-6"/>
                            </div>
                        ) : (
                            userPhoto && <img src={userPhoto} alt="User" className="w-8 h-8 rounded-full" />
                        )}
                    </button>
                    {isMenuOpen && (
                         <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 transform transition-all origin-top-right animate-[fade-in-down_150ms_ease-out]">
                            <div className="flex items-center gap-3 p-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                               {isGuest ? <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold" title="Modo Convidado"><Icon name="user-circle" className="w-7 h-7"/></div> : (userPhoto && <img src={userPhoto} alt="User" className="w-10 h-10 rounded-full" />)}
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                </div>
                            </div>
                            <button onClick={() => { onOpenHelp(); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Icon name="help" className="w-5 h-5 text-gray-500 dark:text-gray-400"/> Guia Interativo</button>
                            <button onClick={() => { onOpenReset(); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 text-left rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Icon name="warning" className="w-5 h-5"/> Resetar Dados</button>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                            <button onClick={onSignOut} className="w-full flex items-center gap-3 p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Icon name="logout" className="w-5 h-5 text-gray-500 dark:text-gray-400"/> {isGuest ? 'Voltar' : 'Sair'}</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// --- Authenticated App Screen ---
const AuthenticatedApp: React.FC<{ user: FirebaseUser | null, isGuest: boolean, onSignOut: () => void }> = ({ user, isGuest, onSignOut }) => {
    const { financialState, setFinancialState, isLoading } = useFinancialState(user, isGuest);
    const [activeView, setActiveView] = useState<AppView>('monthly');
    const [isGuideOpen, setGuideOpen] = useState(false);
    const [isOracleOpen, setOracleOpen] = useState(false);
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [simulationState, setSimulationState] = useState<FinancialState | null>(null);
    const [isTourActive, setIsTourActive] = useState(false);
    const [tourStepIndex, setTourStepIndex] = useState(0);

    const isSimulating = simulationState !== null;
    const isFirstVisit = financialState && !financialState.hasSeenWelcomeGuide;
    const isNewUserSetup = isFirstVisit && financialState.checkingAccountBalance === 0 && financialState.records.length === 0 && !isGuest;


    const handleStartSimulation = () => {
        if (financialState) {
            setSimulationState(JSON.parse(JSON.stringify(financialState)));
        }
    };

    const handleSaveChanges = () => {
        if (simulationState) {
            setFinancialState(simulationState);
            setSimulationState(null);
        }
    };

    const handleDiscardChanges = () => {
        setSimulationState(null);
    };

    useEffect(() => {
        if (isFirstVisit && !isLoading) {
            setGuideOpen(true);
        }
    }, [isFirstVisit, isLoading]);

    const handleCloseGuide = () => {
        if (isFirstVisit) {
            setFinancialState(prev => prev ? { ...prev, hasSeenWelcomeGuide: true } : prev);
        }
        setGuideOpen(false);
    };
    
    const handleResetData = () => {
        setFinancialState(BLANK_FINANCIAL_STATE);
        setResetModalOpen(false);
    };
    
    // --- Tour Logic ---
    const skipTour = () => {
        setIsTourActive(false);
    };

    const startTour = () => {
        setGuideOpen(false);
        setActiveView('monthly'); // Ensure tour starts on the correct view
        // A small delay to ensure the view is set before starting the tour
        setTimeout(() => {
            setIsTourActive(true);
            setTourStepIndex(0);
        }, 100);
    };

    const proceedToStep = (stepIndex: number) => {
        const targetSelector = tourSteps[stepIndex].target;
        let attempts = 0;
        const intervalId = setInterval(() => {
            const element = document.querySelector(targetSelector);
            if (element) {
                clearInterval(intervalId);
                setTourStepIndex(stepIndex);
            } else {
                attempts++;
                if (attempts > 50) { // ~5 second timeout
                    clearInterval(intervalId);
                    console.error(`Tour target element "${targetSelector}" not found. Skipping tour.`);
                    skipTour();
                }
            }
        }, 100);
    };

    const goToNextStep = () => {
        if (tourStepIndex >= tourSteps.length - 1) {
            skipTour();
            return;
        }

        const currentStep = tourSteps[tourStepIndex];
        const nextStepIndex = tourStepIndex + 1;
        
        if (currentStep.action?.type === 'navigate') {
            setActiveView(currentStep.action.view);
        }
        
        proceedToStep(nextStepIndex);
    };

    const goToPrevStep = () => {
        if (tourStepIndex <= 0) {
            return;
        }

        const prevStepIndex = tourStepIndex - 1;

        let requiredView: AppView = 'monthly'; // Default view
        for (let i = prevStepIndex; i >= 0; i--) {
            const stepAction = tourSteps[i].action;
            if (stepAction?.type === 'navigate') {
                requiredView = stepAction.view;
                break;
            }
        }
        
        if (requiredView !== activeView) {
            setActiveView(requiredView);
        }

        proceedToStep(prevStepIndex);
    };

    if (isLoading || !financialState) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Spinner className="w-12 h-12" />
                <p className="mt-4 text-gray-500">Carregando seus dados financeiros...</p>
            </div>
        );
    }
    
    return (
        <div className="h-screen w-screen flex flex-col bg-white dark:bg-gray-800">
            <AppHeader
                activeView={activeView}
                onSetView={setActiveView}
                onOpenHelp={() => setGuideOpen(true)}
                onOpenReset={() => setResetModalOpen(true)}
                user={user}
                isGuest={isGuest}
                onSignOut={onSignOut}
                isSimulating={isSimulating}
            />
            <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                {activeView === 'monthly' && (
                    <MonthlyControlView
                        state={isSimulating ? simulationState! : financialState}
                        setState={isSimulating ? setSimulationState : setFinancialState}
                        setAppView={setActiveView}
                        onOpenOracle={() => setOracleOpen(true)}
                        isSimulating={isSimulating}
                        onStartSimulation={handleStartSimulation}
                        onSaveChanges={handleSaveChanges}
                        onDiscardChanges={handleDiscardChanges}
                    />
                )}
                {activeView === 'wealth' && (
                    <WealthPlanningView
                        state={financialState}
                        setState={setFinancialState}
                        setAppView={setActiveView}
                    />
                )}
            </main>
            
            <GuideModal isOpen={isGuideOpen} onClose={handleCloseGuide} onStartTour={startTour} isNewUser={isNewUserSetup} />
            <OracleModal isOpen={isOracleOpen} onClose={() => setOracleOpen(false)} state={financialState} />
            <ResetDataModal isOpen={isResetModalOpen} onClose={() => setResetModalOpen(false)} onConfirm={handleResetData} />
            {isTourActive && (
                <TourPopover 
                    step={tourSteps[tourStepIndex]}
                    currentStepIndex={tourStepIndex}
                    totalSteps={tourSteps.length}
                    onNext={goToNextStep}
                    onPrev={goToPrevStep}
                    onSkip={skipTour}
                />
            )}
        </div>
    );
}

const ResetDataModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; }> = ({ isOpen, onClose, onConfirm }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const isConfirmed = confirmationText === 'RESETAR';

    useEffect(() => {
        if (isOpen) setConfirmationText('');
    }, [isOpen]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resetar Todos os Dados">
            <div className="space-y-4">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                    <h3 className="font-bold flex items-center gap-2"><Icon name="warning" className="w-5 h-5"/> Ação Irreversível</h3>
                    <p className="text-sm mt-1">
                        Você está prestes a apagar **TODOS** os seus dados financeiros deste aplicativo, incluindo categorias, registros, metas e estratégias. Esta ação não pode ser desfeita.
                    </p>
                </div>
                <div>
                    <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Para confirmar, digite <strong>RESETAR</strong> no campo abaixo:
                    </label>
                    <Input
                        id="reset-confirm"
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="mt-1"
                        placeholder="RESETAR"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="danger" onClick={onConfirm} disabled={!isConfirmed}>
                        Eu entendo, resete meus dados
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// --- Main App Component ---
function App() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loadingAuthState, setLoadingAuthState] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        if (!firebaseConfig.apiKey) {
            console.warn("Firebase Auth is not configured. App cannot authenticate.");
            setAuthError("As chaves de configuração do Firebase não foram encontradas. O login com Google está desativado. Para habilitar, configure as 'Environment Variables' na sua plataforma de hospedagem (ex: Vercel). Você pode continuar sem conta.");
            setLoadingAuthState(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) setIsGuest(false);
            setUser(currentUser);
            setLoadingAuthState(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSignIn = async () => {
        if (!firebaseConfig.apiKey) return;
        setIsAuthenticating(true);
        setAuthError(null);
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            setAuthError("Falha ao entrar. Por favor, tente novamente.");
        } finally {
            setIsAuthenticating(false);
        }
    };
    
    const handleContinueAsGuest = () => {
        setIsGuest(true);
    }

    const handleSignOut = async () => {
        if(isGuest) {
            setIsGuest(false);
        } else if (firebaseConfig.apiKey) {
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Sign Out Error:", error);
            }
        }
    };

    if (loadingAuthState) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Spinner className="w-12 h-12" />
            </div>
        );
    }

    if (!user && !isGuest) {
        return <LoginScreen onSignIn={handleSignIn} onContinueAsGuest={handleContinueAsGuest} isAuthenticating={isAuthenticating} error={authError} />;
    }

    return <AuthenticatedApp user={user} isGuest={isGuest} onSignOut={handleSignOut} />;
}

export default App;