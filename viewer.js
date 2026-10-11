/* ===== VIEWER DE IMAGENS GLOBAL (delegado) ===== */
(function () {
  function garantirViewer() {
    let viewer = document.querySelector('.event-image-viewer');

    if (!viewer) {
      viewer = document.createElement('div');
      viewer.className = 'event-image-viewer';
      viewer.innerHTML = `
        <button type="button" class="event-image-viewer-close" aria-label="Fechar imagem">×</button>
        <img src="" alt="Cartaz do evento">
      `;
      document.body.appendChild(viewer);
    }
    return viewer;
  }

  function abrir(src, alt) {
    const viewer = garantirViewer();
    const img = viewer.querySelector('img');
    img.src = src;
    img.alt = alt || 'Cartaz do evento';
    viewer.classList.add('active');
    document.body.classList.add('image-viewer-open');
    criarBotoesViewer(viewer);
  }

  /* ===== Botões Facebook dentro do viewer ===== */
  function criarBotoesViewer(viewer) {
    if (viewer.querySelector('.viewer-acoes')) return;

    // Detectar slug do evento actual
    const slug = detectarSlug();

    const barra = document.createElement('div');
    barra.className = 'viewer-acoes';
    barra.innerHTML = `
      <button type="button" class="viewer-btn viewer-like" data-acao="like">
        <svg viewBox="0 0 24 24"><path d="M7 22V11M2 13v8a1 1 0 0 0 1 1h14.42a3 3 0 0 0 2.94-2.43l1.13-6A2 2 0 0 0 19.5 11H14V4a2 2 0 0 0-2-2l-5 9Z"></path></svg>
        <span>Gosto</span>
      </button>
      <button type="button" class="viewer-btn viewer-comentar" data-acao="comentar">
        <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <span>Comentar</span>
      </button>
      <button type="button" class="viewer-btn viewer-partilhar" data-acao="partilhar">
        <svg viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path><path d="M16 6l-4-4-4 4"></path><path d="M12 2v14"></path></svg>
        <span>Partilhar</span>
      </button>
    `;

    // Guardar slug no botão para uso posterior
    barra.setAttribute('data-slug', slug || '');

    viewer.appendChild(barra);

    // Se já gostou, marca o botão
    if (slug) verificarGosto(slug, barra);
  }

  function detectarSlug() {
    // 1. Do detalhe do evento aberto (eventos.html?evento=slug)
    const params = new URLSearchParams(location.search);
    const s = params.get('evento');
    if (s) return s;

    // 2. Do data-slug de um card (procurar o que está visível por trás do viewer)
    // Impossível saber directamente, então procura no window.__yuyuEventos
    // se a imagem corresponde a um poster
    const imgViewer = document.querySelector('.event-image-viewer img');
    if (imgViewer && window.__yuyuEventos) {
      const src = imgViewer.src;
      for (let i = 0; i < window.__yuyuEventos.length; i++) {
        const ev = window.__yuyuEventos[i];
        if (ev.poster_url && src.includes(ev.poster_url.split('/').pop())) {
          return ev.slug;
        }
      }
    }

    return '';
  }

  async function verificarGosto(slug, barra) {
    try {
      const nav = localStorage.getItem('yuyu_navegador_id') || '';
      if (!nav) return;
      const API_URL = (function () {
        const h = location.hostname;
        if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
        if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
        if (/^10\./.test(h)) return 'http://' + h + ':3000';
        if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
        return 'https://yuyu-backend-1b4x.onrender.com';
      })();

      const r = await fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug) + '/social?navegador=' + encodeURIComponent(nav));
      const d = await r.json();
      if (d.ok && d.jaGostei) {
        const btn = barra.querySelector('.viewer-like');
        if (btn) btn.classList.add('is-gostei');
      }
    } catch (_) {}
  }

  /* ===== Delegar cliques nos botões do viewer ===== */
  document.addEventListener('click', async function (ev) {
    const btn = ev.target.closest('.viewer-btn');
    if (!btn) return;
    const barra = btn.closest('.viewer-acoes');
    if (!barra) return;

    const slug = barra.getAttribute('data-slug');
    if (!slug) {
      // Não conseguiu detectar o evento
      alert('Não foi possível identificar este evento.');
      return;
    }

    ev.preventDefault();
    ev.stopPropagation();

    const acao = btn.dataset.acao;
    const API_URL = (function () {
      const h = location.hostname;
      if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
      if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
      if (/^10\./.test(h)) return 'http://' + h + ':3000';
      if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
      return 'https://yuyu-backend-1b4x.onrender.com';
    })();

    if (acao === 'like') {
      const nav = localStorage.getItem('yuyu_navegador_id') || '';
      if (!nav) { alert('Não foi possível identificar o teu navegador.'); return; }
      try {
        btn.disabled = true;
        const r = await fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug) + '/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ navegador_id: nav })
        });
        const d = await r.json();
        if (d.ok) {
          btn.classList.toggle('is-gostei', d.gostei);
        }
      } catch (_) {}
      finally { btn.disabled = false; }
      return;
    }

    if (acao === 'comentar') {
      // Fechar o viewer e abrir modal de comentários
      const viewer = document.querySelector('.event-image-viewer');
      if (viewer) viewer.classList.remove('active');
      document.body.classList.remove('image-viewer-open');

      // Chamar a função do social.js se existir
      if (typeof window.__abrirComentarios === 'function') {
        window.__abrirComentarios(slug);
      }
      return;
    }

    if (acao === 'partilhar') {
      const url = location.origin + location.pathname.replace(/\/[^/]*$/, '/') + 'eventos.html?evento=' + slug;
      if (navigator.share) {
        try { await navigator.share({ title: document.title, url: url }); return; } catch (_) {}
      }
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copiado!');
      } catch (_) {
        prompt('Copia o link:', url);
      }
    }
  }, true);

  function fechar() {
    const viewer = document.querySelector('.event-image-viewer');
    if (!viewer) return;
    viewer.classList.remove('active');
    document.body.classList.remove('image-viewer-open');
  }

  /* Delegação: apanha cliques em qualquer .event-image img, presente ou futuro */
  document.addEventListener('click', function (ev) {
    const img = ev.target.closest('.event-image img');
    if (!img) return;

    // Ignorar cliques em botões dentro do card (Ver evento, etc.)
    if (ev.target.closest('a, button') && !ev.target.closest('.event-image')) return;

    ev.preventDefault();
    ev.stopPropagation();
    abrir(img.src, img.alt);
  }, true);  // capture: apanha antes de outros handlers

  /* Fechar: clique no viewer (fora da imagem), no ×, ou tecla Esc */
  document.addEventListener('click', function (ev) {
    const viewer = ev.target.closest('.event-image-viewer');
    if (!viewer) return;

    // Clicar no overlay OU no botão × fecha
    if (
      ev.target === viewer ||
      ev.target.classList.contains('event-image-viewer-close')
    ) {
      ev.preventDefault();
      fechar();
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') fechar();
  });

  // Garante que o viewer existe logo ao arrancar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', garantirViewer);
  } else {
    garantirViewer();
  }
})();
