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

// Tabelas de INSS e IRRF (Valores de 2024 - placeholder para 2026)
const TABELA_INSS = [
    { limite: 1412.00, aliquota: 0.075, deducao: 0 },
    { limite: 2666.68, aliquota: 0.09, deducao: 21.18 }, // (1412 * 0.075) - (1412 * 0.09)
    { limite: 4000.03, aliquota: 0.12, deducao: 101.18 }, // (1412 * 0.075) + (1254.68 * 0.09) - (2666.68 * 0.12)
    { limite: 7786.02, aliquota: 0.14, deducao: 181.18 } // (1412 * 0.075) + (1254.68 * 0.09) + (1333.35 * 0.12) - (4000.03 * 0.14)
];

const TABELA_IRRF = [
    { limite: 2259.20, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
    { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
    { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
    { limite: Infinity, aliquota: 0.275, deducao: 896.00 }
];

function calcularINSS(baseCalculo) {
    let inss = 0;
    let faixaAnterior = 0;
    let valorAcumulado = 0;

    for (const faixa of TABELA_INSS) {
        if (baseCalculo <= faixa.limite) {
            inss += (baseCalculo - faixaAnterior) * faixa.aliquota;
            break;
        } else {
            inss += (faixa.limite - faixaAnterior) * faixa.aliquota;
            faixaAnterior = faixa.limite;
        }
    }
    // Teto do INSS (valor máximo de contribuição)
    const tetoINSS = (TABELA_INSS[0].limite * TABELA_INSS[0].aliquota) +
                     ((TABELA_INSS[1].limite - TABELA_INSS[0].limite) * TABELA_INSS[1].aliquota) +
                     ((TABELA_INSS[2].limite - TABELA_INSS[1].limite) * TABELA_INSS[2].aliquota) +
                     ((TABELA_INSS[3].limite - TABELA_INSS[2].limite) * TABELA_INSS[3].aliquota);
    
    return Math.min(inss, tetoINSS);
}

function calcularIRRF(baseCalculo) {
    let irrf = 0;
    for (const faixa of TABELA_IRRF) {
        if (baseCalculo <= faixa.limite) {
            irrf = (baseCalculo * faixa.aliquota) - faixa.deducao;
            break;
        }
    }
    return Math.max(0, irrf);
}

// Função principal de cálculo
function calcularRescisao() {
    const salarioBruto = parseFloat(document.getElementById('salario-bruto').value) || 0;
    const dataAdmissaoStr = document.getElementById('data-admissao').value;
    const dataDemissaoStr = document.getElementById('data-demissao').value;
    const motivoDemissao = document.getElementById('motivo-demissao').value;
    const avisoPrevioTipo = document.getElementById('aviso-previo').value;
    const feriasVencidas = document.getElementById('ferias-vencidas').checked;
    const saldoFgts = parseFloat(document.getElementById('saldo-fgts').value) || 0;

    const dataAdmissao = new Date(dataAdmissaoStr + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
    const dataDemissao = new Date(dataDemissaoStr + 'T00:00:00');

    // Validação de datas
    if (dataDemissao < dataAdmissao) {
        alert('A data de demissão não pode ser anterior à data de admissão.');
        return;
    }

    let proventos = {
        saldoSalario: 0,
        decimoTerceiroProporcional: 0,
        feriasProporcionais: 0,
        feriasVencidas: 0,
        avisoPrevioIndenizado: 0,
        multaFgts: 0
    };

    let deducoes = {
        inss: 0,
        irrf: 0
    };

    // 1. Saldo de Salário
    const ultimoDiaMesAnterior = new Date(dataDemissao.getFullYear(), dataDemissao.getMonth(), 0);
    const diasTrabalhadosMesDemissao = dataDemissao.getDate();
    proventos.saldoSalario = (salarioBruto / 30) * diasTrabalhadosMesDemissao;

    // 2. 13º Salário Proporcional
    let mesesTrabalhadosAno = 0;
    const primeiroDiaAnoDemissao = new Date(dataDemissao.getFullYear(), 0, 1);
    const diffMeses13 = (dataDemissao.getFullYear() - primeiroDiaAnoDemissao.getFullYear()) * 12 + (dataDemissao.getMonth() - primeiroDiaAnoDemissao.getMonth());
    
    // Se trabalhou 15 dias ou mais no mês da demissão, conta como mês inteiro
    if (diasTrabalhadosMesDemissao >= 15) {
        mesesTrabalhadosAno = diffMeses13 + 1;
    } else {
        mesesTrabalhadosAno = diffMeses13;
    }
    proventos.decimoTerceiroProporcional = (salarioBruto / 12) * mesesTrabalhadosAno;

    // 3. Férias Proporcionais + 1/3
    // Calcula o período aquisitivo atual
    let anoInicioPeriodoAquisitivo = dataAdmissao.getFullYear();
    let mesInicioPeriodoAquisitivo = dataAdmissao.getMonth();
    let diaInicioPeriodoAquisitivo = dataAdmissao.getDate();

    let dataBaseFerias = new Date(anoInicioPeriodoAquisitivo, mesInicioPeriodoAquisitivo, diaInicioPeriodoAquisitivo);
    while (dataBaseFerias < dataDemissao) {
        dataBaseFerias.setFullYear(dataBaseFerias.getFullYear() + 1);
    }
    dataBaseFerias.setFullYear(dataBaseFerias.getFullYear() - 1); // Volta para o último período aquisitivo completo

    const dataInicioProporcionais = new Date(dataBaseFerias.getFullYear(), dataBaseFerias.getMonth(), dataBaseFerias.getDate());
    dataInicioProporcionais.setFullYear(dataInicioProporcionais.getFullYear() + 1); // Início do período aquisitivo atual

    let mesesFeriasProporcionais = 0;
    const diffMesesFerias = (dataDemissao.getFullYear() - dataInicioProporcionais.getFullYear()) * 12 + (dataDemissao.getMonth() - dataInicioProporcionais.getMonth());
    
    // Se trabalhou 15 dias ou mais no mês da demissão, conta como mês inteiro
    if (diasTrabalhadosMesDemissao >= 15) {
        mesesFeriasProporcionais = diffMesesFerias + 1;
    } else {
        mesesFeriasProporcionais = diffMesesFerias;
    }
    
    proventos.feriasProporcionais = (salarioBruto / 12) * mesesFeriasProporcionais * 1.33333; // + 1/3 constitucional

    // 4. Férias Vencidas + 1/3
    if (feriasVencidas) {
        proventos.feriasVencidas = salarioBruto * 1.33333;
    }

    // 5. Aviso Prévio Indenizado (se aplicável)
    if (avisoPrevioTipo === 'indenizado' && motivoDemissao === 'sem-justa-causa-empregador') {
        // Cálculo do aviso prévio: 30 dias + 3 dias por ano de serviço
        const diffTempoServicoMs = dataDemissao.getTime() - dataAdmissao.getTime();
        const anosServico = Math.floor(diffTempoServicoMs / (1000 * 60 * 60 * 24 * 365.25));
        const diasAvisoPrevio = 30 + (anosServico * 3);
        proventos.avisoPrevioIndenizado = (salarioBruto / 30) * diasAvisoPrevio;
    }

    // Deduções
    // INSS é calculado sobre Saldo de Salário e 13º Salário
    const baseINSS_saldo = proventos.saldoSalario;
    const baseINSS_13 = proventos.decimoTerceiroProporcional;
    
    deducoes.inss = calcularINSS(baseINSS_saldo) + calcularINSS(baseINSS_13);

    // IRRF é calculado sobre Saldo de Salário e 13º Salário, após dedução do INSS
    const baseIRRF_saldo = Math.max(0, proventos.saldoSalario - calcularINSS(baseINSS_saldo));
    const baseIRRF_13 = Math.max(0, proventos.decimoTerceiroProporcional - calcularINSS(baseINSS_13));

    deducoes.irrf = calcularIRRF(baseIRRF_saldo) + calcularIRRF(baseIRRF_13);

    // Multa FGTS (40%)
    if (motivoDemissao === 'sem-justa-causa-empregador') {
        proventos.multaFgts = saldoFgts * 0.40;
    }

    // Totalização
    const totalProventos = proventos.saldoSalario + proventos.decimoTerceiroProporcional +
                           proventos.feriasProporcionais + proventos.feriasVencidas +
                           proventos.avisoPrevioIndenizado;
    const totalDeducoes = deducoes.inss + deducoes.irrf;
    const totalLiquido = totalProventos - totalDeducoes + proventos.multaFgts; // Multa FGTS é um "provento" para o trabalhador

    // Atualizar o DOM
    document.getElementById('res-total-liquido').innerText = formatBRL(totalLiquido);
    document.getElementById('prov-saldo-salario').innerText = formatBRL(proventos.saldoSalario);
    document.getElementById('prov-13-proporcional').innerText = formatBRL(proventos.decimoTerceiroProporcional);
    document.getElementById('prov-ferias-proporcionais').innerText = formatBRL(proventos.feriasProporcionais);
    document.getElementById('prov-ferias-vencidas').innerText = formatBRL(proventos.feriasVencidas);
    document.getElementById('prov-aviso-indenizado').innerText = formatBRL(proventos.avisoPrevioIndenizado);
    document.getElementById('prov-total').innerText = formatBRL(totalProventos);
    document.getElementById('ded-inss').innerText = formatBRL(deducoes.inss);
    document.getElementById('ded-irrf').innerText = formatBRL(deducoes.irrf);
    document.getElementById('ded-total').innerText = formatBRL(totalDeducoes);
    document.getElementById('outros-fgts').innerText = formatBRL(proventos.multaFgts);
}

// Executar cálculo ao carregar a página
document.addEventListener('DOMContentLoaded', calcularRescisao);