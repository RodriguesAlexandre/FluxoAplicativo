import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import type firebase from 'firebase/compat/app';
import { auth, googleProvider } from './services/firebase';
import { useFinancialState } from './hooks/useFinancialState';
import { useTheme } from './hooks/useTheme';
import { AppView, FinancialState } from './types';
import { OracleModal } from './components/oracle/OracleModal';
import { Button, Icon, Modal, Spinner, Input } from './components/common/index.tsx';
import { LoginScreen } from './components/LoginScreen';
import { BLANK_FINANCIAL_STATE } from './constants';
import { GuideModal, GuideTab } from './components/guide/GuideModal';
import { tourSteps } from './tourSteps';
import { TourPopover } from './components/tour/TourPopover';

// Lazy load the main views for code splitting
const MonthlyControlView = lazy(() => import('./components/monthly/index.tsx'));
const WealthPlanningView = lazy(() => import('./components/wealth/index.tsx'));

type FirebaseUser = firebase.User;
type Theme = 'light' | 'dark' | 'system';

// --- Header Component ---
const AppHeader: React.FC<{
    activeView: AppView;
    onSetView: (view: AppView) => void;
    onOpenHelp: () => void;
    onOpenReset: () => void;
    user: FirebaseUser;
    onSignOut: () => void;
    onLinkAccount: () => void;
    isSimulating: boolean;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isScrolled: boolean;
}> = ({ activeView, onSetView, onOpenHelp, onOpenReset, user, onSignOut, onLinkAccount, isSimulating, theme, setTheme, isScrolled }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const tabStyle = "px-1 sm:px-4 py-2 text-sm sm:text-base font-semibold transition-all duration-200 border-b-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const activeTabStyle = "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400";
    const inactiveTabStyle = "text-gray-500 border-transparent hover:text-gray-800 dark:hover:text-gray-200";

    const isAnonymous = user.isAnonymous;
    const userName = isAnonymous ? "Convidado" : user.displayName || 'Usuário';
    const userEmail = isAnonymous ? "Dados salvos na nuvem anonimamente" : user.email;
    const userPhoto = isAnonymous ? null : user.photoURL || undefined;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const ThemeButton: React.FC<{ mode: Theme; iconName: string; text: string }> = ({ mode, iconName, text }) => (
      <button
        onClick={() => { setTheme(mode); setMenuOpen(false); }}
        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-xs font-semibold ${
          theme === mode ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        <Icon name={iconName} className="w-5 h-5 mb-1" />
        {text}
      </button>
    );

    return (
        <header data-tour-id="app-header" className={`sticky top-0 z-30 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
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
                        {isAnonymous ? (
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
                               {isAnonymous ? <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold" title="Modo Convidado"><Icon name="user-circle" className="w-7 h-7"/></div> : (userPhoto && <img src={userPhoto} alt="User" className="w-10 h-10 rounded-full" />)}
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                </div>
                            </div>
                            
                            {isAnonymous && <button onClick={() => { onLinkAccount(); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 text-left rounded-lg bg-green-100 text-green-800 dark:bg-green-800 dark:text-white hover:bg-green-200 dark:hover:bg-green-700 transition-colors font-semibold"><Icon name="save" className="w-5 h-5"/> Salvar com Google</button>}

                            <button onClick={() => { onOpenHelp(); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Icon name="help" className="w-5 h-5 text-gray-500 dark:text-gray-400"/> Guia Interativo</button>
                            <button onClick={() => { onOpenReset(); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 text-left rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Icon name="warning" className="w-5 h-5"/> Resetar Dados</button>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                            <div className="px-2 pb-1">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tema</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <ThemeButton mode="light" iconName="sun" text="Claro" />
                                    <ThemeButton mode="dark" iconName="moon" text="Escuro" />
                                    <ThemeButton mode="system" iconName="desktop" text="Sistema" />
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                            <button onClick={onSignOut} className="w-full flex items-center gap-3 p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Icon name="logout" className="w-5 h-5 text-gray-500 dark:text-gray-400"/> Sair</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

// --- View Loader ---
const ViewLoader: React.FC = () => (
    <div className="flex-1 flex items-center justify-center">
        <Spinner className="w-10 h-10" />
    </div>
);

// --- Authenticated App Screen ---
const AuthenticatedApp: React.FC<{ user: FirebaseUser, onSignOut: () => void, onLinkAccount: () => void, theme: Theme, setTheme: (t: Theme) => void }> = ({ user, onSignOut, onLinkAccount, theme, setTheme }) => {
    const { financialState, setFinancialState, isLoading } = useFinancialState(user);
    const [activeView, setActiveView] = useState<AppView>('monthly');
    const [isGuideOpen, setGuideOpen] = useState(false);
    const [initialGuideTab, setInitialGuideTab] = useState<GuideTab>('tutorial');
    const [isOracleOpen, setOracleOpen] = useState(false);
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [simulationState, setSimulationState] = useState<FinancialState | null>(null);
    const [isTourActive, setIsTourActive] = useState(false);
    const [tourStepIndex, setTourStepIndex] = useState(0);
    const [headerScrolled, setHeaderScrolled] = useState(false);

    const isSimulating = simulationState !== null;
    const isFirstVisit = financialState && !financialState.hasSeenWelcomeGuide;
    const isNewUserSetup = isFirstVisit && financialState.checkingAccountBalance === 0 && financialState.records.length === 0 && user.isAnonymous;

    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (!mainElement) return;

        const handleScroll = () => {
            setHeaderScrolled(mainElement.scrollTop > 10);
        };
        mainElement.addEventListener('scroll', handleScroll);
        return () => mainElement.removeEventListener('scroll', handleScroll);
    }, []);

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
            handleOpenGuide('tutorial');
        }
    }, [isFirstVisit, isLoading]);

    const handleOpenGuide = (tab: GuideTab = 'tutorial') => {
        setInitialGuideTab(tab);
        setGuideOpen(true);
    };

    const handleCloseGuide = () => {
        if (isFirstVisit) {
            setFinancialState(prev => prev ? { ...prev, hasSeenWelcomeGuide: true } : null);
        }
        setGuideOpen(false);
    };
    
    const handleResetData = () => {
        if (setFinancialState) {
            setFinancialState(BLANK_FINANCIAL_STATE);
            setResetModalOpen(false);
        }
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
    
    const setSafeFinancialState: React.Dispatch<React.SetStateAction<FinancialState>> = (action) => {
        setFinancialState(current => {
            if (!current) return null;
            return typeof action === 'function' ? action(current) : action;
        });
    };
    
    const setSafeSimulationState: React.Dispatch<React.SetStateAction<FinancialState>> = (action) => {
        setSimulationState(current => {
            if (!current) return null;
            return typeof action === 'function' ? action(current) : action;
        });
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-white dark:bg-gray-800">
            <AppHeader
                activeView={activeView}
                onSetView={setActiveView}
                onOpenHelp={() => handleOpenGuide('tutorial')}
                onOpenReset={() => setResetModalOpen(true)}
                user={user}
                onSignOut={onSignOut}
                onLinkAccount={onLinkAccount}
                isSimulating={isSimulating}
                theme={theme}
                setTheme={setTheme}
                isScrolled={headerScrolled}
            />
            <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 flex flex-col">
                 <div className="flex-1 flex flex-col animate-[fade-in_400ms_ease-out]" key={activeView}>
                    <Suspense fallback={<ViewLoader />}>
                        {activeView === 'monthly' && (
                            <MonthlyControlView
                                state={isSimulating ? simulationState! : financialState}
                                setState={isSimulating ? setSafeSimulationState : setSafeFinancialState}
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
                                setState={setSafeFinancialState}
                                setAppView={setActiveView}
                            />
                        )}
                    </Suspense>
                </div>
                 {/* Floating Action Button for Help */}
                <Button 
                    variant="primary" 
                    onClick={() => handleOpenGuide('ask')}
                    className="fixed bottom-6 right-6 z-20 rounded-full w-14 h-14 shadow-lg animate-pulse"
                    aria-label="Abrir Guia Interativo"
                >
                    <Icon name="help" className="w-8 h-8"/>
                </Button>
            </main>
            
            <GuideModal isOpen={isGuideOpen} onClose={handleCloseGuide} onStartTour={startTour} isNewUser={isNewUserSetup} initialTab={initialGuideTab} />
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
    const [loadingAuthState, setLoadingAuthState] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        if (!auth?.app) {
            console.warn("Firebase Auth is not configured. App cannot authenticate.");
            setAuthError("As chaves de configuração do Firebase não foram encontradas. O login com Google está desativado. Para habilitar, configure as 'Environment Variables' com o prefixo 'VITE_' na sua plataforma de hospedagem (ex: Vercel). Você pode continuar sem conta.");
            setLoadingAuthState(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoadingAuthState(false);
            setIsAuthenticating(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSignIn = async () => {
        if (!auth?.app) return;
        setIsAuthenticating(true);
        setAuthError(null);
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            setAuthError("Falha ao entrar. Por favor, tente novamente.");
            setIsAuthenticating(false);
        }
    };
    
    const handleContinueAnonymously = async () => {
        if (!auth?.app) return;
        setIsAuthenticating(true);
        setAuthError(null);
        try {
            await auth.signInAnonymously();
        } catch (error) {
            console.error("Anonymous Sign-In Error:", error);
            setAuthError("Falha ao entrar como convidado. Por favor, tente novamente.");
            setIsAuthenticating(false);
        }
    };

    const handleLinkAccount = async () => {
        if (!auth?.currentUser?.isAnonymous) return;
        try {
            const result = await auth.currentUser.linkWithPopup(googleProvider);
            // Re-fetch user data or rely on onAuthStateChanged to update the UI
            setUser(result.user);
        } catch (error) {
            console.error("Error linking account:", error);
            alert("Falha ao vincular conta. Se você já possui uma conta com este email, faça o logout e entre novamente com sua conta do Google.");
        }
    };

    const handleSignOut = async () => {
        if (auth?.app) {
            try {
                await auth.signOut();
                setUser(null);
            } catch (error) {
                console.error("Sign Out Error:", error);
            }
        }
    };

    if (loadingAuthState) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Spinner className="w-12 h-12" />
                <p className="mt-4 text-gray-500">Verificando autenticação...</p>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen onSignIn={handleSignIn} onContinueAsGuest={handleContinueAnonymously} isAuthenticating={isAuthenticating} error={authError} />;
    }

    return <AuthenticatedApp user={user} onSignOut={handleSignOut} onLinkAccount={handleLinkAccount} theme={theme} setTheme={setTheme} />;
}

export default App;