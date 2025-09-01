
import React from 'react';
import { Button, Icon, Spinner, Card } from './common/index.tsx';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6 mr-3">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,35.637,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

interface LoginScreenProps {
    onSignIn: () => void;
    onContinueAsGuest: () => void;
    isAuthenticating: boolean;
    error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn, onContinueAsGuest, isAuthenticating, error }) => (
    <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-between p-4">
        <main className="flex-1 flex items-center justify-center w-full">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center px-4">
                
                {/* Left Column: Philosophy */}
                <div className="text-center md:text-left animate-[fade-in-right_500ms_ease-out]">
                    <div className="flex justify-center md:justify-start items-center gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-blue-600 text-white">
                            <Icon name="logo" className="w-8 h-8"/>
                        </div>
                        <h1 className="text-4xl font-bold">Fluxo</h1>
                    </div>
                    <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">Seu co-piloto para uma vida financeira com mais clareza, previsibilidade e confiança.</p>

                    <ul className="space-y-4 text-left inline-block max-w-sm">
                        <li className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                                <Icon name="eye" className="w-6 h-6 text-blue-500"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Clareza Total</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Entenda para onde seu dinheiro vai e tome controle do seu fluxo de caixa.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                           <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                                <Icon name="chart-bar" className="w-6 h-6 text-blue-500"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Previsibilidade para o Futuro</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Simule o crescimento do seu patrimônio e veja o impacto das suas decisões.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                             <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                                <Icon name="compass" className="w-6 h-6 text-blue-500"/>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Decisões Confiantes</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Com dados e projeções, tenha a segurança para investir, poupar e gastar.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Right Column: Login Card */}
                <div className="animate-[fade-in-left_500ms_ease-out] flex justify-center">
                     <Card className="max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold mb-6">Acesse sua conta</h2>
                        
                        {isAuthenticating ? (
                            <div className="flex flex-col items-center justify-center h-40">
                                <Spinner />
                                <p className="mt-4 text-sm text-gray-500">Autenticando...</p>
                            </div>
                        ) : (
                            <>
                                <Button size="lg" className="w-full" onClick={onSignIn} disabled={isAuthenticating || !!error}>
                                    <GoogleIcon />
                                    Entrar com o Google
                                </Button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-4">
                                    ✨ Salve seus dados na nuvem e acesse de qualquer dispositivo.
                                </p>
                                <div className="my-4 flex items-center">
                                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                                    <span className="flex-shrink mx-4 text-xs text-gray-500">OU</span>
                                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                                </div>
                                <Button size="md" variant="secondary" className="w-full" onClick={onContinueAsGuest}>
                                    Continuar sem conta
                                </Button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Seus dados serão salvos apenas neste navegador.</p>
                                
                                {error && (
                                    <div className="mt-4 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm text-left flex items-start gap-3" role="alert">
                                        <Icon name="help" className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </main>
        
        <footer className="w-full text-center p-4 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span>&copy; {new Date().getFullYear()} Fluxo. Desenvolvido por Alexandre Rodrigues.</span>
            <div className="flex items-center gap-4">
                <a href="https://api.whatsapp.com/send/?phone=5531987874252&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors" aria-label="WhatsApp">
                    <Icon name="whatsapp" className="w-4 h-4" />
                </a>
                <a href="https://www.linkedin.com/in/alexandrerodrigues-bim/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors" aria-label="LinkedIn">
                    <Icon name="linkedin" className="w-4 h-4" />
                </a>
            </div>
        </footer>
    </div>
);