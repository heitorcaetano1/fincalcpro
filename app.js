// Gerenciamento de Tema
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

// Lógica de Cookies
const cookieBanner = document.getElementById('cookie-banner');
const acceptBtn = document.getElementById('accept-cookies');

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookies-accepted')) {
        setTimeout(() => {
            cookieBanner.classList.remove('translate-y-full');
        }, 1000);
    }
    calcular();
});

acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookies-accepted', 'true');
    cookieBanner.classList.add('translate-y-full');
});

// Formatação de Moeda
const formatBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Cálculo Principal
function calcular() {
    const cap = parseFloat(document.getElementById('capital-inicial').value) || 0;
    const ap = parseFloat(document.getElementById('aporte-mensal').value) || 0;
    const taxaInput = parseFloat(document.getElementById('taxa-juros').value) || 0;
    const tipoTaxa = document.getElementById('tipo-taxa').value;
    const perInput = parseInt(document.getElementById('periodo').value) || 0;
    const tipoPer = document.getElementById('tipo-periodo').value;

    const meses = tipoPer === 'anos' ? perInput * 12 : perInput;
    const taxaMensal = tipoTaxa === 'anual' ? Math.pow(1 + (taxaInput / 100), 1 / 12) - 1 : taxaInput / 100;

    let total = cap;
    let investido = cap;
    const corpo = document.getElementById('tabela-corpo');
    corpo.innerHTML = '';
    document.getElementById('tabela-evolucao-container').classList.remove('hidden');

    for (let i = 1; i <= meses; i++) {
        total = total * (1 + taxaMensal) + ap;
        investido += ap;

        if (i % 12 === 0) {
            const linha = `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <td class="p-4 text-sm font-medium">Ano ${i / 12}</td>
                <td class="p-4 text-sm">${formatBRL(investido)}</td>
                <td class="p-4 text-sm text-secondary">${formatBRL(total - investido)}</td>
                <td class="p-4 text-sm font-bold text-primary">${formatBRL(total)}</td>
            </tr>`;
            corpo.insertAdjacentHTML('beforeend', linha);
        }
    }

    animateValue('res-total', total);
    document.getElementById('res-investido').innerText = formatBRL(investido);
    document.getElementById('res-juros').innerText = formatBRL(total - investido);
}

let anim;
function animateValue(id, target) {
    const el = document.getElementById(id);
    if (anim) cancelAnimationFrame(anim);
    if (isNaN(target) || target <= 0) { el.innerText = formatBRL(0); return; }
    let start = 0;
    const dur = 500;
    const startTime = performance.now();
    const up = (now) => {
        const prog = Math.min((now - startTime) / dur, 1);
        const val = start + (target - start) * (prog * (2 - prog));
        el.innerText = formatBRL(val);
        if (prog < 1) anim = requestAnimationFrame(up);
        else el.innerText = formatBRL(target);
    };
    anim = requestAnimationFrame(up);
}
