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
    // Procura containers onde inserir os temas (menu mobile + desktop)
    const menus = document.querySelectorAll('#mobileMenu, .mobile-menu');

    menus.forEach(function (menu) {
      if (menu.querySelector('.tema-menu-seccao')) return;

      const sec = document.createElement('div');
      sec.className = 'tema-menu-seccao';
      sec.innerHTML = `
        <span class="tema-menu-titulo">Tema</span>
        <div class="tema-menu-cores">
          <button type="button" class="tema-menu-cor vermelho" data-tema="vermelho" aria-label="Vermelho"></button>
          <button type="button" class="tema-menu-cor laranja" data-tema="laranja" aria-label="Laranja"></button>
          <button type="button" class="tema-menu-cor castanho" data-tema="castanho" aria-label="Castanho"></button>
          <button type="button" class="tema-menu-cor azul" data-tema="azul" aria-label="Azul"></button>
        </div>
      `;

      menu.appendChild(sec);
    });

    // Atualizar selecção
    document.querySelectorAll('.tema-menu-cor').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.tema === actual());
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        aplicar(b.dataset.tema);
        document.querySelectorAll('.tema-menu-cor').forEach(function (x) {
          x.classList.toggle('is-active', x.dataset.tema === actual());
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criarUI);
  } else {
    criarUI();
  }
})();
