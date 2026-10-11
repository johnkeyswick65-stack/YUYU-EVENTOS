/* ===== EDGE PANEL (tipo Samsung) ===== */
(function () {
  // Não aparece no admin
  if (location.pathname.includes('/admin/')) return;

  /* ---------- ABA lateral ---------- */
  const tab = document.createElement('button');
  tab.className = 'edge-tab';
  tab.setAttribute('aria-label', 'Abrir ferramentas');
  tab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"></path></svg>';
  document.body.appendChild(tab);

  /* ---------- Painel ---------- */
  const panel = document.createElement('aside');
  panel.className = 'edge-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="edge-head">
      <span class="edge-title">Ferramentas</span>
      <button type="button" class="edge-close" aria-label="Fechar">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="edge-body">

      <button type="button" class="edge-item" data-action="share">
        <span class="edge-ic">
          <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></svg>
        </span>
        <span class="edge-label">Partilhar página</span>
      </button>

      <div class="edge-item edge-slider">
        <span class="edge-ic">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>
        </span>
        <div class="edge-slider-wrap">
          <div class="edge-slider-top">
            <span class="edge-label">Brilho</span>
            <span class="edge-slider-val" id="edgeBrightVal">100%</span>
          </div>
          <input type="range" id="edgeBright" min="20" max="100" value="100" step="5">
        </div>
      </div>

      <button type="button" class="edge-item" data-action="view">
        <span class="edge-ic">
          <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg>
        </span>
        <span class="edge-label" id="edgeViewLabel">Ver como PC</span>
      </button>

      <button type="button" class="edge-item" data-action="top">
        <span class="edge-ic">
          <svg viewBox="0 0 24 24"><path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path></svg>
        </span>
        <span class="edge-label">Voltar ao topo</span>
      </button>

    </div>
  `;
  document.body.appendChild(panel);

  /* ---------- Abrir/fechar ---------- */
  let startX = 0, tracking = false;

  function abrir() {
    panel.classList.add('is-open');
    tab.classList.add('is-hidden');
    panel.setAttribute('aria-hidden', 'false');
  }

  function fechar() {
    panel.classList.remove('is-open');
    tab.classList.remove('is-hidden');
    panel.setAttribute('aria-hidden', 'true');
  }

  tab.addEventListener('click', abrir);
  panel.querySelector('.edge-close').addEventListener('click', fechar);

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') fechar();
  });

  /* Arrastar da borda direita */
  document.addEventListener('touchstart', function (ev) {
    const x = ev.touches[0].clientX;
    if (x > window.innerWidth - 20) {
      startX = x;
      tracking = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function (ev) {
    if (!tracking) return;
    const x = ev.touches[0].clientX;
    if (startX - x > 50) {
      abrir();
      tracking = false;
    }
  }, { passive: true });

  document.addEventListener('touchend', function () { tracking = false; });

  /* ---------- Acções ---------- */
  panel.addEventListener('click', async function (ev) {
    const item = ev.target.closest('[data-action]');
    if (!item) return;
    const action = item.dataset.action;

    if (action === 'share') {
      const dados = { title: document.title, url: location.href };
      try {
        if (navigator.share) {
          await navigator.share(dados);
        } else {
          await navigator.clipboard.writeText(location.href);
          alert('Link copiado para a área de transferência');
        }
      } catch (_) {}
      return;
    }

    if (action === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fechar();
      return;
    }

    if (action === 'view') {
      const html = document.documentElement;
      const ativo = html.classList.toggle('force-desktop');
      const vp = document.querySelector('meta[name="viewport"]');
      const label = document.getElementById('edgeViewLabel');

      if (vp) {
        if (!vp.dataset.original) vp.dataset.original = vp.content;
        vp.content = ativo ? 'width=1280' : vp.dataset.original;
      }

      label.textContent = ativo ? 'Ver como celular' : 'Ver como PC';
      localStorage.setItem('yuyu_force_desktop', ativo ? '1' : '0');
      return;
    }
  });

  /* ---------- Brilho ---------- */
  const slider = document.getElementById('edgeBright');
  const valorEl = document.getElementById('edgeBrightVal');
  const brilhoGuardado = localStorage.getItem('yuyu_brilho') || '100';

  slider.value = brilhoGuardado;
  valorEl.textContent = brilhoGuardado + '%';
  document.documentElement.style.setProperty('--page-brightness', (brilhoGuardado / 100));

  slider.addEventListener('input', function () {
    const v = slider.value;
    valorEl.textContent = v + '%';
    document.documentElement.style.setProperty('--page-brightness', (v / 100));
    localStorage.setItem('yuyu_brilho', v);
  });

  /* ---------- Restaurar modo PC no arranque ---------- */
  if (localStorage.getItem('yuyu_force_desktop') === '1') {
    document.documentElement.classList.add('force-desktop');
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
      if (!vp.dataset.original) vp.dataset.original = vp.content;
      vp.content = 'width=1280';
    }
    setTimeout(function () {
      const l = document.getElementById('edgeViewLabel');
      if (l) l.textContent = 'Ver como celular';
    }, 100);
  }
})();
