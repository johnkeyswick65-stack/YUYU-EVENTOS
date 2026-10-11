/* ===== BARRA SOCIAL (like · comentar · partilhar) — v2 ===== */
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
    partilhar: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></svg>',
    whats: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    copiar: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"></path></svg>',
    fechar: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg>'
  };

  /* ============ MODAL GENÉRICO ============ */
  function criarModal(html, acoes) {
    const overlay = document.createElement('div');
    overlay.className = 'yu-modal-overlay';
    overlay.innerHTML = `<div class="yu-modal">${html}</div>`;

    const caixa = overlay.querySelector('.yu-modal');

    // Ações
    if (acoes) {
      const bar = document.createElement('div');
      bar.className = 'yu-modal-acoes';
      acoes.forEach(function (a) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'yu-btn ' + (a.tipo === 'primario' ? 'yu-btn-primario' : 'yu-btn-secundario');
        b.textContent = a.texto;
        b.addEventListener('click', function () {
          if (!a.acao || a.acao(overlay) !== false) fechar();
        });
        bar.appendChild(b);
      });
      caixa.appendChild(bar);
    }

    document.body.appendChild(overlay);

    function fechar() {
      overlay.style.animation = 'yuFade .15s reverse';
      setTimeout(function () { overlay.remove(); }, 150);
    }

    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) fechar();
    });

    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape') {
        fechar();
        document.removeEventListener('keydown', esc);
      }
    });

    return { overlay: overlay, fechar: fechar };
  }

  /* ============ JANELA DE COMENTÁRIOS (estilo Facebook) ============ */
async function abrirComentarios(slug, eventoNome) {
  const nav = obterNavegadorId();

  const html = `
    <div class="yu-comments-header">
      <h2>Comentários</h2>
      <button type="button" class="yu-close" aria-label="Fechar">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="yu-comments-body" id="yuComList">
      <div class="yu-comments-empty">
        <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        <h3>Ainda sem comentários</h3>
        <p>Sê a primeira pessoa a comentar.</p>
        <div class="yu-comments-chips" id="yuComChips">
          <button type="button" class="yu-comments-chip" data-chip="Este evento ainda vai acontecer?">Este evento ainda vai acontecer?</button>
          <button type="button" class="yu-comments-chip" data-chip="Tenho interesse neste evento!">Tenho interesse neste evento!</button>
          <button type="button" class="yu-comments-chip" data-chip="Qual é o preço dos bilhetes?">Qual é o preço dos bilhetes?</button>
        </div>
      </div>
    </div>

    <div class="yu-comments-footer">
      <div class="yu-comment-avatar" id="yuComAvatar">?</div>
      <div class="yu-comments-input-wrap">
        <input type="text" id="yuComNome" maxlength="60" placeholder="O teu nome">
        <textarea id="yuComTexto" maxlength="500" rows="1" placeholder="Escreve um comentário..."></textarea>
      </div>
      <button type="button" class="yu-comments-send" id="yuComEnviar" aria-label="Enviar">
        <svg viewBox="0 0 24 24"><path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4z"></path></svg>
      </button>
    </div>
  `;

  // Modal especial
  const overlay = document.createElement('div');
  overlay.className = 'yu-modal-overlay';
  overlay.innerHTML = '<div class="yu-modal yu-modal-comments">' + html + '</div>';
  document.body.appendChild(overlay);

  function fechar() {
    overlay.style.animation = 'yuFade .15s reverse';
    setTimeout(function () { overlay.remove(); }, 150);
  }

  overlay.querySelector('.yu-close').addEventListener('click', fechar);
  overlay.addEventListener('click', function (ev) {
    if (ev.target === overlay) fechar();
  });
  document.addEventListener('keydown', function esc(ev) {
    if (ev.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc); }
  });

  // Auto-resize do textarea
  const txt = overlay.querySelector('#yuComTexto');
  txt.addEventListener('input', function () {
    txt.style.height = 'auto';
    txt.style.height = Math.min(txt.scrollHeight, 100) + 'px';
  });

  // Avatar em tempo real
  const nomeInput = overlay.querySelector('#yuComNome');
  const avatar = overlay.querySelector('#yuComAvatar');
  nomeInput.addEventListener('input', function () {
    const v = nomeInput.value.trim();
    avatar.textContent = v ? v.charAt(0).toUpperCase() : '?';
  });

  // Chips
  overlay.querySelectorAll('[data-chip]').forEach(function (c) {
    c.addEventListener('click', function () {
      txt.value = c.dataset.chip;
      txt.focus();
      txt.style.height = 'auto';
      txt.style.height = Math.min(txt.scrollHeight, 100) + 'px';
    });
  });

  // Enviar
  overlay.querySelector('#yuComEnviar').addEventListener('click', function () {
    const nome = nomeInput.value.trim();
    const texto = txt.value.trim();
    if (!nome) { nomeInput.focus(); return; }
    if (!texto) { txt.focus(); return; }
    enviarComentario(slug, nome, texto, nav, fechar);
  });

  // Carrega lista real
  const lista = overlay.querySelector('#yuComList');
  try {
    const r = await fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug) + '/comentarios');
    const d = await r.json();
    const coms = (d && d.comentarios) || [];

    if (coms.length) {
      lista.innerHTML = coms.map(function (c) {
        const inicial = (c.autor_nome || '?').charAt(0).toUpperCase();
        return `
          <div class="yu-comment">
            <div class="yu-comment-avatar">${escapar(inicial)}</div>
            <div style="flex:1;min-width:0">
              <div class="yu-comment-balao">
                <div class="yu-comment-autor">${escapar(c.autor_nome)}</div>
                <div class="yu-comment-texto">${escapar(c.texto)}</div>
              </div>
              <div class="yu-comment-hora">${formatarHora(c.criado_em)}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (_) {}
}

function formatarHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const agora = Date.now();
  const dif = (agora - d.getTime()) / 1000;
  if (dif < 60) return 'agora';
  if (dif < 3600) return Math.floor(dif / 60) + ' min';
  if (dif < 86400) return Math.floor(dif / 3600) + ' h';
  if (dif < 604800) return Math.floor(dif / 86400) + ' d';
  const p = n => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}

async function enviarComentario(slug, nome, texto, nav, fechar) {
  try {
    const r = await fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug) + '/comentario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor_nome: nome, texto: texto, navegador_id: nav })
    });
    const d = await r.json();

    if (d.ok) {
      fechar();
      setTimeout(function () {
        criarModal(
          `<h2 class="yu-modal-title" style="text-align:center">Comentário enviado</h2>
           <p class="yu-modal-sub" style="text-align:center">Será publicado depois de aprovado pela equipa YUYU EVENTOS.</p>`,
          [{ texto: 'Ok', tipo: 'primario' }]
        );
      }, 250);
    } else {
      alert(d.error || 'Falhou');
    }
  } catch (_) {
    alert('Erro de rede.');
  }
}

/* ============ JANELA DE PARTILHA ============ */
  function abrirPartilha(slug) {
    const url = location.origin + location.pathname.replace(/\/[^/]*$/, '/') + 'eventos.html?evento=' + slug;
    const titulo = 'Vê este evento no YUYU EVENTOS';

    const html = `
      <h2 class="yu-modal-title">Partilhar evento</h2>
      <p class="yu-modal-sub">Escolhe como queres partilhar este evento.</p>

      <div class="yu-share-grid">
        <button type="button" class="yu-share-opc whats" data-share="whatsapp">
          ${SVG.whats}
          <span>WhatsApp</span>
        </button>
        <button type="button" class="yu-share-opc copy" data-share="copiar">
          ${SVG.copiar}
          <span>Copiar</span>
        </button>
        <button type="button" class="yu-share-opc nativo" data-share="nativo">
          ${SVG.share}
          <span>Sistema</span>
        </button>
      </div>
    `;

    const m = criarModal(html, [{ texto: 'Fechar', tipo: 'secundario' }]);

    m.overlay.querySelectorAll('[data-share]').forEach(function (b) {
      b.addEventListener('click', async function () {
        const tipo = b.dataset.share;

        if (tipo === 'whatsapp') {
          const texto = titulo + '\n\n' + url;
          window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
          m.fechar();
          return;
        }

        if (tipo === 'copiar') {
          try {
            await navigator.clipboard.writeText(url);
          } catch (_) {
            const tmp = document.createElement('textarea');
            tmp.value = url;
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand('copy');
            tmp.remove();
          }
          b.querySelector('span').textContent = 'Copiado!';
          setTimeout(function () { m.fechar(); }, 800);
          return;
        }

        if (tipo === 'nativo') {
          if (navigator.share) {
            try {
              await navigator.share({ title: titulo, url: url });
              m.fechar();
            } catch (_) {}
          } else {
            alert('O teu navegador não suporta partilha nativa.');
          }
        }
      });
    });
  }

  /* Expor para o viewer usar */
  window.__abrirComentarios = abrirComentarios;
  window.__abrirPartilha = abrirPartilha;

  /* ============ BARRA ============ */
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

  function aplicarEmCard(card, slug) {
    if (card.querySelector('.social-bar')) return;
    const img = card.querySelector('.event-image');
    if (!img) return;
    const barra = criarBarra(slug, 'card');
    img.appendChild(barra);
    carregarContadores(barra, slug);
  }

  function aplicarNoDetalhe(slug) {
    const detail = document.getElementById('eventDetail');
    if (!detail) return;

    const existente = detail.querySelector('.social-bar');
    if (existente) {
      existente.setAttribute('data-slug', slug);
      carregarContadores(existente, slug);
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

  /* ============ DELEGAÇÃO ============ */
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
                    || 'Evento';

    if (acao === 'like') alternarLike(btn, slug);
    else if (acao === 'comentar') abrirComentarios(slug, nomeEvento);
    else if (acao === 'partilhar') abrirPartilha(slug);
  }, true);

  function varrerCards() {
    document.querySelectorAll('.event-card').forEach(function (card) {
      const slug = card.dataset.slug;
      if (slug) aplicarEmCard(card, slug);
    });
  }

  document.addEventListener('yuyu:eventos-carregados', function () {
    setTimeout(varrerCards, 30);
  });

  window.__aplicarSocialDetalhe = function (slug) {
    if (slug) aplicarNoDetalhe(slug);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      varrerCards();
      setTimeout(varrerCards, 600);
    });
  } else {
    varrerCards();
    setTimeout(varrerCards, 600);
  }
})();
