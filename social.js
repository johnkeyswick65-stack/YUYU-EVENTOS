/* ===== BARRA SOCIAL (like · comentar · partilhar) ===== */
(function () {
  const API_URL = (function () {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
    if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
    if (/^10\./.test(h)) return 'http://' + h + ':3000';
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
    return 'https://yuyu-backend-1b4x.onrender.com';
  })();

  const CHAVE_NAV = 'yuyu_navegador_id';

  function obterNavegadorId() {
    let id = localStorage.getItem(CHAVE_NAV);
    if (!id) {
      id = 'nav_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(CHAVE_NAV, id); } catch (_) {}
    }
    return id;
  }

  function escapar(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const SVG = {
    coracao: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    comentario: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    partilhar: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></svg>'
  };

  function criarBarra(slug, contexto) {
    const barra = document.createElement('div');
    barra.className = 'social-bar';
    barra.setAttribute('data-slug', slug);
    barra.setAttribute('data-ctx', contexto);
    barra.innerHTML = `
      <button type="button" class="social-btn social-like" data-acao="like" aria-label="Gosto">
        ${SVG.coracao}
        <span class="social-count social-likes-num">0</span>
      </button>
      <span class="social-sep"></span>
      <button type="button" class="social-btn social-comentar" data-acao="comentar" aria-label="Comentar">
        ${SVG.comentario}
        <span class="social-count social-comentarios-num">0</span>
      </button>
      <span class="social-sep"></span>
      <button type="button" class="social-btn social-partilhar" data-acao="partilhar" aria-label="Partilhar">
        ${SVG.partilhar}
        <span>Partilhar</span>
      </button>
    `;
    return barra;
  }

  /* Coloca a barra dentro do card, sobre a imagem */
  function aplicarEmCard(card, slug) {
    if (card.querySelector('.social-bar')) return;

    const img = card.querySelector('.event-image');
    if (!img) return;

    const barra = criarBarra(slug, 'card');
    img.appendChild(barra);
    carregarContadores(barra, slug);
  }

  /* Coloca a barra no detalhe, abaixo do poster */
  function aplicarNoDetalhe(slug) {
    const detail = document.getElementById('eventDetail');
    if (!detail) return;
    if (detail.querySelector('.social-bar')) {
      // Atualizar slug
      const b = detail.querySelector('.social-bar');
      b.setAttribute('data-slug', slug);
      carregarContadores(b, slug);
      return;
    }

    const conteudo = detail.querySelector('.event-detail-content');
    if (!conteudo) return;

    const poster = conteudo.querySelector('.event-detail-poster');
    const barra = criarBarra(slug, 'detalhe');

    if (poster && poster.parentNode) {
      poster.parentNode.insertBefore(barra, poster.nextSibling);
    } else {
      conteudo.insertBefore(barra, conteudo.firstChild);
    }

    carregarContadores(barra, slug);
  }

  async function carregarContadores(barra, slug) {
    const nav = obterNavegadorId();
    try {
      const r = await fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug) + '/social?navegador=' + encodeURIComponent(nav));
      if (!r.ok) return;
      const d = await r.json();
      if (!d.ok) return;

      const likesEl = barra.querySelector('.social-likes-num');
      const comsEl = barra.querySelector('.social-comentarios-num');
      const btnLike = barra.querySelector('.social-like');

      if (likesEl) likesEl.textContent = d.likes || 0;
      if (comsEl) comsEl.textContent = d.comentarios || 0;
      if (btnLike && d.jaGostei) btnLike.classList.add('is-gostei');
    } catch (_) {}
  }

  /* =========== Acções =========== */
  async function alternarLike(btn, slug) {
    const nav = obterNavegadorId();
    try {
      btn.disabled = true;
      const r = await fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug) + '/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navegador_id: nav })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Erro');

      btn.classList.toggle('is-gostei', d.gostei);
      const num = btn.parentNode.querySelector('.social-likes-num');
      if (num) num.textContent = d.likes;
    } catch (e) {
      console.warn('[social/like]', e.message);
    } finally {
      btn.disabled = false;
    }
  }

  function abrirPartilha(slug) {
    const url = location.origin + location.pathname.replace(/\/[^/]*$/, '/') + 'eventos.html?evento=' + slug;
    const titulo = document.title || 'YUYU EVENTOS';

    if (navigator.share) {
      navigator.share({ title: titulo, url: url }).catch(function () {
        // Se falhar, copia
        copiarLink(url);
      });
    } else {
      copiarLink(url);
    }
  }

  function copiarLink(url) {
    try {
      navigator.clipboard.writeText(url).then(function () {
        alert('Link copiado:\n' + url);
      }).catch(function () {
        prompt('Copia o link:', url);
      });
    } catch (_) {
      prompt('Copia o link:', url);
    }
  }

  function abrirComentario(slug, eventoNome) {
    const nome = prompt('O teu nome (aparecerá publicamente):');
    if (!nome || !nome.trim()) return;
    const texto = prompt('Escreve o teu comentário sobre "' + eventoNome + '":');
    if (!texto || !texto.trim()) return;

    const nav = obterNavegadorId();
    fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug) + '/comentario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor_nome: nome.trim(), texto: texto.trim(), navegador_id: nav })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.ok) {
          alert('Comentário enviado! Será publicado após aprovação.');
        } else {
          alert('Erro: ' + (d.error || 'falhou'));
        }
      })
      .catch(function () { alert('Erro de rede.'); });
  }

  /* =========== Delegação de cliques =========== */
  document.addEventListener('click', function (ev) {
    const btn = ev.target.closest('.social-btn');
    if (!btn) return;
    const barra = btn.closest('.social-bar');
    if (!barra) return;
    const slug = barra.dataset.slug;
    if (!slug) return;

    ev.preventDefault();
    ev.stopPropagation();

    const acao = btn.dataset.acao;
    const nomeEvento = (btn.closest('.event-card')?.querySelector('h3')?.textContent)
                    || (document.getElementById('detailNome')?.textContent)
                    || 'evento';

    if (acao === 'like') alternarLike(btn, slug);
    else if (acao === 'comentar') abrirComentario(slug, nomeEvento);
    else if (acao === 'partilhar') abrirPartilha(slug);
  }, true);

  /* =========== Aplicar às várias vistas =========== */
  function varrerCards() {
    document.querySelectorAll('.event-card').forEach(function (card) {
      // Detecta slug
      let slug = card.dataset.slug;
      if (!slug) {
        // Da API: procura o botão Ver detalhes com onclick ou data-evento
        const btn = card.querySelector('.event-open[onclick*="__yuyuAbrir"]');
        if (btn && window.__yuyuEventos) {
          const m = btn.getAttribute('onclick').match(/__yuyuAbrir\((\d+)\)/);
          if (m) {
            const idx = parseInt(m[1], 10);
            const ev = window.__yuyuEventos[idx];
            if (ev) slug = ev.slug;
          }
        }
        // Hardcoded
        if (!slug && card.dataset.eventoUrl) {
          const m = card.dataset.eventoUrl.match(/evento=([^&]+)/);
          if (m) slug = decodeURIComponent(m[1]);
        }
      }
      if (slug) aplicarEmCard(card, slug);
    });
  }

  /* Quando o eventos-api terminar de renderizar, aplica social bar */
  document.addEventListener('yuyu:eventos-carregados', function () {
    setTimeout(varrerCards, 30);
  });

  /* Quando o detalhe abrir, aplica social bar */
  window.__aplicarSocialDetalhe = function (slug) {
    if (slug) aplicarNoDetalhe(slug);
  };

  /* Arranque */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      varrerCards();
      // Também tenta ao fim de 600ms (caso a API ainda esteja a chegar)
      setTimeout(varrerCards, 600);
    });
  } else {
    varrerCards();
    setTimeout(varrerCards, 600);
  }
})();
