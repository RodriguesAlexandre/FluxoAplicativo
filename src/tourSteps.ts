import { AppView } from '@/types';

export interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  action?: {
    type: 'navigate';
    view: AppView;
  };
}

export const tourSteps: TourStep[] = [
  {
    id: 'intro',
    target: '[data-tour-id="app-header"]',
    title: 'Bem-vindo ao Fluxo!',
    content: 'Este é um tour rápido para mostrar as principais funcionalidades. Vamos começar pelo seu Controle Mensal.',
  },
  {
    id: 'saldo-conta',
    target: '[data-tour-id="saldo-conta"]',
    title: 'Saldo em Conta (Atual)',
    content: 'Este é o seu dinheiro disponível agora. Todas as suas ações de distribuição de dinheiro partem daqui.',
  },
  {
    id: 'performance-realizada',
    target: '[data-tour-id="performance-realizada"]',
    title: 'Performance Realizada',
    content: 'Este é o resultado líquido do que já aconteceu no mês (receitas confirmadas - despesas confirmadas). É o seu "lucro" ou "prejuízo" até agora.',
  },
  {
    id: 'confirmar-transacao',
    target: '[data-tour-id="confirmar-transacao"]',
    title: 'Confirmar Transações',
    content: 'Clique neste círculo para confirmar uma receita ou despesa. O valor será imediatamente refletido no seu Saldo em Conta.',
  },
   {
    id: 'distribuir-saldo',
    target: '[data-tour-id="distribuir-saldo"]',
    title: 'Distribuir Saldo',
    content: 'Use este botão para mover o dinheiro da sua conta para a Reserva de Emergência ou para os Investimentos. Ele tem um atalho para alocar o resultado do seu mês!',
  },
  {
    id: 'navegar-planejamento',
    target: '[data-tour-id="aba-planejamento"]',
    title: 'Visão de Longo Prazo',
    content: 'Ótimo! Agora, vamos para a tela de Planejamento, onde a mágica do longo prazo acontece.',
    action: {
      type: 'navigate',
      view: 'wealth',
    },
  },
   {
    id: 'grafico-riqueza',
    target: '[data-tour-id="grafico-riqueza"]',
    title: 'Projeção de Riqueza',
    content: 'Este gráfico mostra como seu patrimônio pode crescer. Use os seletores "Visão Real" vs. "Projeção" para ver cenários diferentes.',
  },
  {
    id: 'estrategia-projecao',
    target: '[data-tour-id="estrategia-projecao"]',
    title: 'Estratégia de Projeção',
    content: 'Aqui você define as regras do jogo para suas simulações! Ajuste como seu superávit será investido e veja o impacto no gráfico instantaneamente.',
  },
  {
    id: 'fim-tour',
    target: '[data-tour-id="user-menu"]',
    title: 'Você está pronto!',
    content: 'Exploramos o básico. Agora você é o piloto! Se tiver dúvidas, use o "Guia Interativo" aqui no menu a qualquer momento.',
  },
];
