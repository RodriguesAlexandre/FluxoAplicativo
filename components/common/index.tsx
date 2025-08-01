
import React, { ReactNode } from 'react';

// --- Card ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`} {...props}>
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'danger-ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, className = '', variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
        const sizeStyles = {
            sm: 'py-1 px-2 text-sm',
            md: 'py-2 px-4 text-base',
            lg: 'py-3 px-6 text-lg',
        };
        const variantStyles = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
            accent: 'bg-purple-800 text-white hover:bg-purple-900 focus:ring-purple-700',
            secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
            ghost: 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700 focus:ring-blue-500',
            'danger-ghost': 'bg-transparent text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 focus:ring-red-500'
        };

        return (
            <button ref={ref} className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';


// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: ReactNode;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', icon, ...props }, ref) => {
        return (
            <div className="relative">
                {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
                <input
                    ref={ref}
                    className={`w-full p-2 ${icon ? 'pl-10' : ''} border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${className}`}
                    {...props}
                />
            </div>
        );
    }
);
Input.displayName = 'Input';


// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-[fade-in_200ms_ease-out]" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-[fade-in-down_300ms_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition" aria-label="Fechar modal">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};


// --- SidePanel ---
interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
}
export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, children, title }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition">
                <Icon name="close" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              {children}
            </div>
        </div>
      </div>
    </>
  );
};


// --- Icon ---
interface IconProps {
  name: string;
  className?: string;
}
export const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6' }) => {
  const icons: { [key: string]: ReactNode } = {
    'logo': <>
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>
        </defs>
        <path d="M3 19 C 8 19, 12 16, 17 16" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M3 13 C 9 13, 14 10, 20 10" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M3 7 C 10 7, 15 4, 22 4" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </>,
    'plus': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
    'minus': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />,
    'edit': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    'trash': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    'chevron-left': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />,
    'chevron-right': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />,
    'close': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
    'check': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    'help': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    'oracle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
    'simulate': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
    'wallet': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    'logout': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    'settings': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
    'user-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    'database': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7a8 8 0 014-3h4a8 8 0 014 3" />,
    'warning': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    'message-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />,
    'whatsapp': <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
    'linkedin': <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
    'eye': <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    'chart-bar': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V10m6 0V4m-6 6v6m-6 4v-4" />,
    'compass': <><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>,
    'sun': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a5 5 0 110-10 5 5 0 010 10z" />,
    'moon': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
    'desktop': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    'save': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V3" />,
    'target': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z M12 15a3 3 0 100-6 3 3 0 000 6z" />,
    'grip-vertical': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9h.01M10 12h.01M10 15h.01M14 9h.01M14 12h.01M14 15h.01" />,
  };
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">{icons[name] || null}</svg>;
};

// --- Spinner ---
export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <div className={`animate-spin rounded-full border-4 border-blue-500 border-t-transparent ${className}`} />
);

// --- SimpleMarkdown ---
export const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
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

// --- EmptyState ---
interface EmptyStateProps {
    icon: string;
    title: string;
    children: ReactNode;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, children }) => (
    <div className="text-center py-4 px-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 mx-auto">
            <Icon name={icon} className="w-6 h-6 text-gray-500" />
        </div>
        <h4 className="mt-2 font-semibold">{title}</h4>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{children}</div>
    </div>
);