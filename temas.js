/* ===== SISTEMA DE TEMAS ===== */
(function () {
  const TEMAS = ['vermelho', 'laranja', 'castanho', 'azul'];
  const CHAVE = 'yuyu_tema';
  const PADRAO = 'vermelho';

  function aplicar(tema) {
    if (!TEMAS.includes(tema)) tema = PADRAO;
    document.documentElement.setAttribute('data-tema', tema);
    try { localStorage.setItem(CHAVE, tema); } catch (_) {}
    atualizarPainel(tema);
  }

  function actual() {
    try { return localStorage.getItem(CHAVE) || PADRAO; }
    catch (_) { return PADRAO; }
  }

  function atualizarPainel(tema) {
    document.querySelectorAll('.tema-opcao').forEach(b => {
      b.classList.toggle('is-active', b.dataset.tema === tema);
    });
  }

  /* Aplica imediatamente (antes do HTML pintar) */
  aplicar(actual());

  /* Cria o botão e o painel */
  function criarUI() {
    if (document.querySelector('.tema-toggle')) return;

    const botao = document.createElement('button');
    botao.className = 'tema-toggle';
    botao.setAttribute('aria-label', 'Escolher tema');
    botao.innerHTML = `
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      </svg>
    `;

    const painel = document.createElement('div');
    painel.className = 'tema-panel';
    painel.innerHTML = `
      <h3>Escolher tema</h3>
      <button type="button" class="tema-opcao" data-tema="vermelho">
        <span class="tema-cor vermelho"></span> Vermelho + Preto
      </button>
      <button type="button" class="tema-opcao" data-tema="laranja">
        <span class="tema-cor laranja"></span> Laranja + Preto
      </button>
      <button type="button" class="tema-opcao" data-tema="castanho">
        <span class="tema-cor castanho"></span> Castanho + Preto
      </button>
      <button type="button" class="tema-opcao" data-tema="azul">
        <span class="tema-cor azul"></span> Azul + Preto
      </button>
    `;

    document.body.appendChild(botao);
    document.body.appendChild(painel);

    botao.addEventListener('click', function (ev) {
      ev.stopPropagation();
      painel.classList.toggle('is-open');
    });

    painel.addEventListener('click', function (ev) {
      const b = ev.target.closest('.tema-opcao');
      if (!b) return;
      aplicar(b.dataset.tema);
      painel.classList.remove('is-open');
    });

    document.addEventListener('click', function (ev) {
      if (!painel.contains(ev.target) && !botao.contains(ev.target)) {
        painel.classList.remove('is-open');
      }
    });

    atualizarPainel(actual());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criarUI);
  } else {
    criarUI();
  }
})();
