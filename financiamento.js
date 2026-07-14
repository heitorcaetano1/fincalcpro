// Gerenciamento de Tema (Dark Mode) - Reutilizado do app.js
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
    if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn.addEventListener('click', () => {
    if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('dark');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.classList.add('dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
});

// Função de Formatação de Moeda
const formatBRL = (valor) => {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
};

let simulacaoSAC = [];
let simulacaoPRICE = [];

// Função principal de simulação
function simularFinanciamento() {
    const valorTotal = parseFloat(document.getElementById('valor-total').value) || 0;
    const valorEntrada = parseFloat(document.getElementById('valor-entrada').value) || 0;
    const taxaJurosAnualInput = parseFloat(document.getElementById('taxa-juros-anual').value) || 0;
    const prazoMeses = parseInt(document.getElementById('prazo-meses').value) || 0;

    if (valorTotal <= 0 || prazoMeses <= 0 || taxaJurosAnualInput < 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }
    if (valorEntrada >= valorTotal) {
        alert('O valor da entrada deve ser menor que o valor total.');
        return;
    }

    const valorFinanciado = valorTotal - valorEntrada;
    const taxaJurosMensal = Math.pow(1 + (taxaJurosAnualInput / 100), 1 / 12) - 1;

    simulacaoSAC = [];
    simulacaoPRICE = [];

    // --- Simulação SAC ---
    let saldoDevedorSAC = valorFinanciado;
    const amortizacaoConstanteSAC = valorFinanciado / prazoMeses;
    let totalJurosSAC = 0;
    let totalPagoSAC = 0;

    for (let i = 1; i <= prazoMeses; i++) {
        const juros = saldoDevedorSAC * taxaJurosMensal;
        const prestacao = amortizacaoConstanteSAC + juros;
        saldoDevedorSAC -= amortizacaoConstanteSAC;
        
        totalJurosSAC += juros;
        totalPagoSAC += prestacao;

        simulacaoSAC.push({
            parcela: i,
            prestacao: prestacao,
            amortizacao: amortizacaoConstanteSAC,
            juros: juros,
            saldoDevedor: Math.max(0, saldoDevedorSAC) // Garante que não seja negativo
        });
    }

    // --- Simulação PRICE ---
    let saldoDevedorPRICE = valorFinanciado;
    const i = taxaJurosMensal;
    const n = prazoMeses;
    const prestacaoConstantePRICE = valorFinanciado * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

    let totalJurosPRICE = 0;
    let totalPagoPRICE = 0;

    for (let i = 1; i <= prazoMeses; i++) {
        const juros = saldoDevedorPRICE * taxaJurosMensal;
        const amortizacao = prestacaoConstantePRICE - juros;
        saldoDevedorPRICE -= amortizacao;

        totalJurosPRICE += juros;
        totalPagoPRICE += prestacaoConstantePRICE;

        simulacaoPRICE.push({
            parcela: i,
            prestacao: prestacaoConstantePRICE,
            amortizacao: amortizacao,
            juros: juros,
            saldoDevedor: Math.max(0, saldoDevedorPRICE) // Garante que não seja negativo
        });
    }

    // Atualizar comparativo
    document.getElementById('sac-primeira-parcela').innerText = formatBRL(simulacaoSAC[0].prestacao);
    document.getElementById('sac-ultima-parcela').innerText = formatBRL(simulacaoSAC[prazoMeses - 1].prestacao);
    document.getElementById('sac-total-pago').innerText = formatBRL(totalPagoSAC);
    document.getElementById('sac-total-juros').innerText = formatBRL(totalJurosSAC);

    document.getElementById('price-primeira-parcela').innerText = formatBRL(simulacaoPRICE[0].prestacao);
    document.getElementById('price-ultima-parcela').innerText = formatBRL(simulacaoPRICE[prazoMeses - 1].prestacao);
    document.getElementById('price-total-pago').innerText = formatBRL(totalPagoPRICE);
    document.getElementById('price-total-juros').innerText = formatBRL(totalJurosPRICE);

    // Exibir tabela
    document.getElementById('tabela-amortizacao-container').classList.remove('hidden');
    exibirTabela();
}

function exibirTabela() {
    const tipoTabela = document.querySelector('input[name="tabela-tipo"]:checked').value;
    const corpoTabela = document.getElementById('tabela-corpo');
    corpoTabela.innerHTML = '';

    const dadosSimulacao = tipoTabela === 'sac' ? simulacaoSAC : simulacaoPRICE;
    const prazoMeses = dadosSimulacao.length;

    if (prazoMeses === 0) return;

    // Primeiras 12 parcelas
    for (let i = 0; i < Math.min(12, prazoMeses); i++) {
        const item = dadosSimulacao[i];
        const row = `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td class="p-4 text-sm font-medium">${item.parcela}</td>
                <td class="p-4 text-sm">${formatBRL(item.prestacao)}</td>
                <td class="p-4 text-sm">${formatBRL(item.amortizacao)}</td>
                <td class="p-4 text-sm">${formatBRL(item.juros)}</td>
                <td class="p-4 text-sm">${formatBRL(item.saldoDevedor)}</td>
            </tr>
        `;
        corpoTabela.insertAdjacentHTML('beforeend', row);
    }

    // Adicionar "..." se houver mais de 24 parcelas
    if (prazoMeses > 24) {
        const ellipsisRow = `
            <tr class="bg-slate-50 dark:bg-slate-800/50">
                <td colspan="5" class="p-4 text-center text-sm text-slate-500">...</td>
            </tr>
        `;
        corpoTabela.insertAdjacentHTML('beforeend', ellipsisRow);
    }

    // Últimas 12 parcelas (se houver mais de 12 no total)
    if (prazoMeses > 12) {
        const startLast12 = Math.max(12, prazoMeses - 12);
        for (let i = startLast12; i < prazoMeses; i++) {
            const item = dadosSimulacao[i];
            const row = `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td class="p-4 text-sm font-medium">${item.parcela}</td>
                    <td class="p-4 text-sm">${formatBRL(item.prestacao)}</td>
                    <td class="p-4 text-sm">${formatBRL(item.amortizacao)}</td>
                    <td class="p-4 text-sm">${formatBRL(item.juros)}</td>
                    <td class="p-4 text-sm">${formatBRL(item.saldoDevedor)}</td>
                </tr>
            `;
            corpoTabela.insertAdjacentHTML('beforeend', row);
        }
    }
}

// Executar simulação ao carregar a página
document.addEventListener('DOMContentLoaded', simularFinanciamento);