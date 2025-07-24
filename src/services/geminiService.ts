import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FinancialState } from '@/types';

export const getFinancialAnalysis = async (state: FinancialState): Promise<string> => {
    const apiKey = process.env.VITE_API_KEY;

    if (!apiKey) {
        console.warn("API_KEY environment variable not found. Oracle is in maintenance mode.");
        return new Promise(resolve => {
            setTimeout(() => {
                resolve("O Oráculo está em manutenção. A análise financeira via IA está temporariamente indisponível. Por favor, configure sua API Key para habilitar esta funcionalidade.");
            }, 1500);
        });
    }

    const ai = new GoogleGenAI({ apiKey });

    // --- Data Calculation for more accurate analysis ---
    const getProjectedValue = (categoryId: string, month: string, records: FinancialState['records']): number => {
        const relevantRecords = records
            .filter(r => r.categoryId === categoryId && r.month <= month)
            .sort((a, b) => b.month.localeCompare(a.month));
        return relevantRecords.length > 0 ? relevantRecords[0].value : 0;
    };

    const currentMonth = new Date().toISOString().slice(0, 7);
    let projectedIncome = 0;
    let projectedExpense = 0;

    state.categories.forEach(cat => {
        const record = state.records.find(r => r.categoryId === cat.id && r.month === currentMonth);
        const value = record ? record.value : getProjectedValue(cat.id, currentMonth, state.records);

        if (cat.type === 'income') {
            projectedIncome += value;
        } else {
            projectedExpense += value;
        }
    });

    state.monthlyAdjustments.forEach(adj => {
        if (currentMonth >= adj.startMonth && (!adj.endMonth || currentMonth <= adj.endMonth)) {
            if (adj.type === 'income') {
                projectedIncome += adj.value;
            } else {
                projectedExpense += adj.value;
            }
        }
    });

    const projectedSurplus = projectedIncome - projectedExpense;
    const savingsRate = projectedIncome > 0 ? (projectedSurplus / projectedIncome) * 100 : 0;
    // --- End Data Calculation ---

    const prompt = `
        **Análise Financeira para o Co-piloto Fluxo**

        Você é um consultor financeiro especialista. Analise o seguinte estado financeiro de um usuário e forneça um resumo claro e acionável.
        Seja conciso, motivador e foque nos pontos mais importantes. Formate sua resposta em markdown.

        **Dados do Usuário:**
        - Saldo em Conta Corrente: R$ ${state.checkingAccountBalance.toFixed(2)}
        - Saldo da Reserva de Emergência: R$ ${state.emergencyFund.balance.toFixed(2)}
        - Saldo de Investimentos: R$ ${state.investments.balance.toFixed(2)}
        - **Projeção para o Mês Atual:**
          - Receitas Totais: R$ ${projectedIncome.toFixed(2)}
          - Despesas Totais: R$ ${projectedExpense.toFixed(2)}
          - Superávit/Déficit: R$ ${projectedSurplus.toFixed(2)}
          - Taxa de Poupança (Performance): ${savingsRate.toFixed(1)}%
        - Estratégia de Superávit: ${state.surplusAllocation.emergencyFund}% para Reserva, ${state.surplusAllocation.investments}% para Investimentos.
        - Estratégia de Déficit: ${state.deficitStrategy === 'emergency_first' ? 'Retirar da Reserva de Emergência primeiro' : 'Retirar dos Investimentos primeiro'}.

        **Sua Tarefa:**
        Aja como um co-piloto financeiro amigável e experiente. Sua missão é dar ao usuário clareza e confiança.

        1.  **Diagnóstico Geral:** Dê um panorama sobre a saúde financeira do usuário. Comece com uma frase encorajadora.
        2.  **Fluxo de Caixa e Performance:** Comente sobre as receitas e despesas. Analise a performance (taxa de poupança). Nossa filosofia é que uma taxa de poupança de 20% a 30% ou mais é o ideal para construir riqueza de forma sustentável. Se a taxa estiver nessa faixa, parabenize! Se estiver abaixo, mostre que é uma oportunidade de melhoria e sugira gentilmente que revise as despesas.
        3.  **Reserva de Emergência:** A reserva é o seu escudo, sua tranquilidade. Analise a meta do usuário e o saldo atual. Reforce a importância de focar em atingir essa meta primeiro, antes de partir para investimentos mais arrojados. É o passo fundamental para uma vida financeira sólida.
        4.  **Construção de Riqueza:** Com a reserva sólida (ou a caminho), avalie a estratégia de investimentos. Comente se a alocação de superávit faz sentido para o crescimento de longo prazo.
        5.  **Recomendações:** Forneça 2-3 dicas práticas, como um amigo daria. Foque em ações que o usuário pode tomar no próximo mês.

        Responda em português do Brasil.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Ocorreu um erro ao contatar o Oráculo. Por favor, verifique sua conexão ou a chave da API e tente novamente.";
    }
};

export const getFeatureExplanation = async (question: string): Promise<string> => {
    const apiKey = process.env.VITE_API_KEY;
     if (!apiKey) {
        return "A funcionalidade de chat com o Guia está indisponível. Por favor, configure sua API Key para habilitar.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
        Você é o "Guia Interativo" do aplicativo financeiro "Fluxo". Sua única função é responder perguntas dos usuários sobre COMO USAR o aplicativo. Você não dá conselhos financeiros. Seja claro, direto e amigável.

        **Manual de Funcionalidades do Aplicativo Fluxo:**

        *   **Visão Geral:** Fluxo tem duas telas principais: "Controle Mensal" e "Planejamento".
            *   **Controle Mensal:** É para gerenciar o dia a dia. O usuário insere receitas e despesas, confirma o que já aconteceu e vê o impacto no saldo da conta.
            *   **Planejamento:** É para a visão de longo prazo. O usuário vê como seu patrimônio pode crescer com base em suas estratégias e no resultado do seu controle mensal.

        *   **Recursos do Controle Mensal:**
            *   **Confirmar uma Transação:** Clicar no círculo ao lado de uma receita ou despesa a marca como "confirmada". O valor é imediatamente somado ou subtraído do "Saldo em Conta (Atual)". Itens confirmados ficam verdes.
            *   **Performance Realizada:** É o resultado do que já foi confirmado no mês (Receitas confirmadas - Despesas confirmadas).
            *   **Performance Projetada:** É a previsão do resultado do mês se todas as receitas e despesas se confirmarem.
            *   **Distribuir Saldo:** Botão no card "Saldo em Conta". Abre um modal para transferir dinheiro da conta corrente para a Reserva de Emergência ou Investimentos. O modal tem um atalho "+ Alocar Resultado" para investir o valor exato da "Performance Realizada".
            *   **Projeção do Fluxo de Caixa:** Mostra a evolução do saldo da conta corrente nos próximos 12 meses, começando com o saldo atual e somando o superávit (ou subtraindo o déficit) de cada mês.

        *   **Recursos do Planejamento de Riqueza:**
            *   **Visão Real vs. Projeção com Aportes:** O gráfico tem dois modos. "Visão Real" mostra o crescimento apenas do patrimônio atual com juros, sem aportes futuros. "Projeção com Aportes" simula o crescimento incluindo o "Aporte Mensal Projetado".
            *   **Aporte Mensal Projetado:** É a média do superávit (ou déficit) que o usuário consegue gerar nos próximos 12 meses, com base no seu orçamento. É a "ponte" que conecta o Controle Mensal ao Planejamento. É um guia informativo, não um botão de ação.
            *   **Estratégia de Projeção:** Controla COMO o Aporte Mensal Projetado é usado na simulação. O usuário define a porcentagem que vai para a Reserva vs. Investimentos. Ele também define de onde o dinheiro sai em caso de déficit. Mudar essa estratégia atualiza o gráfico em tempo real para o modo "Projeção".
            *   **Reserva de Emergência e Investimentos:** Cards onde o usuário pode fazer depósitos e retiradas manuais.

        *   **Funções Gerais:**
            *   **Oráculo:** Fornece um diagnóstico da saúde financeira do usuário (outra função da IA).
            *   **Saldos e Metas:** Botão roxo para ajustar saldos iniciais, metas da reserva e taxas de juros.

        Responda em português do Brasil, usando markdown simples para formatação (negrito com **texto**).
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction,
            },
            contents: question,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for guide:", error);
        return "Desculpe, não consegui processar sua pergunta no momento. Tente novamente mais tarde.";
    }
};