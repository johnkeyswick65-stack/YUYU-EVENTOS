/* ===== INDEX — CARREGAR EVENTOS DA API ===== */
(function () {
  const API_URL = (function () {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
    if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
    if (/^10\./.test(h)) return 'http://' + h + ':3000';
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
    return 'https://yuyu-backend-1b4x.onrender.com';
  })();

  const MAX = 3;
  const CHAVE_CACHE = 'yuyu_eventos_cache';

  function escapar(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatarData(iso) {
    try {
      const d = new Date(iso);
      const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      return d.getUTCDate() + ' de ' + meses[d.getUTCMonth()] + ' de ' + d.getUTCFullYear();
    } catch (_) {
      return '';
    }
  }

  function labelCategoria(c) {
    const mapa = { musica:'Música', festas:'Festas', desporto:'Desporto',
                   cultura:'Cultura', outros:'Outros' };
    return mapa[c] || 'Evento';
  }

  function renderCard(e) {
    const poster = e.poster_url || 'imagens/evento-demo.jpg';
    return [
      '<article class="event-card" data-category="' + escapar(e.categoria) + '">',
        '<div class="event-image">',
          '<div class="event-side-area"></div>',
          '<div class="event-side-bar"></div>',
          '<div class="event-pending" aria-label="Evento em destaque">',
            '<svg viewBox="0 0 24 24" aria-hidden="true">',
              '<circle cx="12" cy="12" r="9"></circle>',
              '<path d="M12 7v5l3 2"></path>',
            '</svg>',
            '<span>Pendente</span>',
          '</div>',
          '<img src="' + escapar(poster) + '" alt="' + escapar(e.nome) + '" loading="lazy">',
          '<div class="event-countdown" data-date="' + escapar(e.data_evento) + '">',
            '<div class="countdown-ring">',
              '<span class="countdown-number">--</span>',
              '<small>DIAS</small>',
            '</div>',
          '</div>',
        '</div>',
        '<div class="event-info">',
          '<span class="event-category">' + escapar(labelCategoria(e.categoria)) + '</span>',
          '<h3>' + escapar(e.nome) + '</h3>',
          '<p class="event-meta">' + escapar(formatarData(e.data_evento)) + ' · ' + escapar(e.local) + '</p>',
          '<p class="event-description">' + escapar(e.descricao || 'Sem descrição.') + '</p>',
          '<div class="event-bottom">',
            '<div class="event-prices">',
              '<span class="price-normal"><small>Normal</small><strong>' + e.preco_normal + ' MT</strong></span>',
              '<span class="price-vip"><small>VIP</small><strong>' + e.preco_vip + ' MT</strong></span>',
            '</div>',
            '<a href="eventos.html?evento=' + encodeURIComponent(e.slug) + '">Ver evento</a>',
          '</div>',
        '</div>',
      '</article>'
    ].join('');
  }

  const SKELETON_CARDS = [
    '<article class="event-card is-skeleton">',
      '<div class="event-image skel"></div>',
      '<div class="event-info">',
        '<span class="skel" style="width:80px;height:14px;border-radius:999px;display:inline-block"></span>',
        '<h3 class="skel" style="width:70%;height:24px;margin:10px 0;border-radius:6px"></h3>',
        '<p class="skel" style="width:90%;height:14px;margin:6px 0;border-radius:6px"></p>',
        '<p class="skel" style="width:80%;height:14px;margin:6px 0;border-radius:6px"></p>',
      '</div>',
    '</article>',
    '<article class="event-card is-skeleton">',
      '<div class="event-image skel"></div>',
      '<div class="event-info">',
        '<span class="skel" style="width:80px;height:14px;border-radius:999px;display:inline-block"></span>',
        '<h3 class="skel" style="width:65%;height:24px;margin:10px 0;border-radius:6px"></h3>',
        '<p class="skel" style="width:85%;height:14px;margin:6px 0;border-radius:6px"></p>',
        '<p class="skel" style="width:75%;height:14px;margin:6px 0;border-radius:6px"></p>',
      '</div>',
    '</article>'
  ].join('');

  function mostrarVazio(grid) {
    grid.innerHTML =
      '<div style="grid-column:1/-1;padding:40px 20px;text-align:center;opacity:.65;">' +
        '<p style="font-size:16px;margin:0 0 6px;"><strong>Ainda não há eventos publicados.</strong></p>' +
        '<p style="margin:0;font-size:14px;">Volta em breve para descobrir o próximo momento.</p>' +
      '</div>';
  }

  function renderLista(grid, eventos) {
    grid.innerHTML = eventos.map(renderCard).join('');
    grid.dataset.carregado = '1';
    if (typeof window.iniciarContagensRegressivas === 'function') {
      window.iniciarContagensRegressivas();
    }
  }

  function lerCache() {
    try {
      const raw = localStorage.getItem(CHAVE_CACHE);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj && Array.isArray(obj.eventos) && obj.eventos.length) return obj.eventos;
    } catch (_) {}
    return null;
  }

  function gravarCache(eventos) {
    try {
      localStorage.setItem(CHAVE_CACHE, JSON.stringify({
        eventos: eventos,
        ts: Date.now()
      }));
    } catch (_) {}
  }

  async function carregar() {
    const grid = document.getElementById('featuredEvents');
    if (!grid) return;

    // 1) Mostra cache local imediatamente, se existir
    const cacheEventos = lerCache();
    if (cacheEventos) {
      renderLista(grid, cacheEventos.slice(0, MAX));
    } else {
      grid.innerHTML = SKELETON_CARDS;
    }

    // 2) Busca dados frescos da API
    const secao = grid.closest('section');
    if (secao) secao.style.minHeight = '120px';

    try {
      const res = await fetch(API_URL + '/api/eventos');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const dados = await res.json();

      if (!dados.ok || !Array.isArray(dados.eventos)) {
        throw new Error('Resposta inválida');
      }

      gravarCache(dados.eventos);

      if (dados.eventos.length === 0) {
        mostrarVazio(grid);
        grid.dataset.carregado = '1';
      } else {
        renderLista(grid, dados.eventos.slice(0, MAX));
      }
    } catch (e) {
      console.warn('[index-eventos] Erro:', e.message);
      // Se não temos cache, mostra mensagem
      if (!cacheEventos) {
        mostrarVazio(grid);
        grid.dataset.carregado = '1';
      }
    } finally {
      if (secao) secao.style.minHeight = '';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregar);
  } else {
    carregar();
  }
})();
