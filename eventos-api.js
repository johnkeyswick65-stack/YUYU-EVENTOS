/* ===== EVENTOS.HTML — CARREGAR EVENTOS DA API ===== */
(function () {
  const API_URL = (function () {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
    if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
    if (/^10\./.test(h)) return 'http://' + h + ':3000';
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
    return 'https://yuyu-backend-1b4x.onrender.com';
  })();

  const CHAVE_CACHE = 'yuyu_eventos_cache';
  window.__yuyuEventos = [];

  function escapar(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatarData(iso) {
    try {
      const d = new Date(iso);
      const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      return d.getUTCDate() + ' de ' + meses[d.getUTCMonth()] + ' de ' + d.getUTCFullYear();
    } catch (_) { return ''; }
  }

  function labelCategoria(c) {
    const mapa = { musica:'Música', festas:'Festas', desporto:'Desporto',
                   cultura:'Cultura', outros:'Outros' };
    return mapa[c] || 'Evento';
  }

  function renderCard(e, idx) {
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
            '<button type="button" class="event-open" data-idx="' + idx + '">Ver detalhes</button>',
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
        '<div class="event-bottom">',
          '<div class="event-prices">',
            '<span class="skel" style="flex:1;height:56px;border-radius:14px"></span>',
            '<span class="skel" style="flex:1;height:56px;border-radius:14px"></span>',
          '</div>',
          '<div class="skel" style="width:100%;height:44px;border-radius:999px"></div>',
        '</div>',
      '</div>',
    '</article>',
    '<article class="event-card is-skeleton">',
      '<div class="event-image skel"></div>',
      '<div class="event-info">',
        '<span class="skel" style="width:80px;height:14px;border-radius:999px;display:inline-block"></span>',
        '<h3 class="skel" style="width:65%;height:24px;margin:10px 0;border-radius:6px"></h3>',
        '<p class="skel" style="width:85%;height:14px;margin:6px 0;border-radius:6px"></p>',
        '<p class="skel" style="width:75%;height:14px;margin:6px 0;border-radius:6px"></p>',
        '<div class="event-bottom">',
          '<div class="event-prices">',
            '<span class="skel" style="flex:1;height:56px;border-radius:14px"></span>',
            '<span class="skel" style="flex:1;height:56px;border-radius:14px"></span>',
          '</div>',
          '<div class="skel" style="width:100%;height:44px;border-radius:999px"></div>',
        '</div>',
      '</div>',
    '</article>'
  ].join('');

  function mostrarVazio(grid) {
    grid.innerHTML =
      '<div class="explore-empty">' +
        '<strong>Ainda não há eventos publicados.</strong>' +
        'Volta em breve para descobrir o próximo momento.' +
      '</div>';
  }

  function renderLista(grid, eventos) {
    window.__yuyuEventos = eventos;
    grid.innerHTML = eventos.map(function (e, i) { return renderCard(e, i); }).join('');
    grid.dataset.carregado = '1';

    // Reaplica countdown
    if (typeof window.iniciarContagensRegressivas === 'function') {
      window.iniciarContagensRegressivas();
    }

    // Actualiza o contador "N eventos disponíveis"
    const contador = document.getElementById('exploreCount');
    if (contador) contador.textContent = eventos.length;
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
        eventos: eventos, ts: Date.now()
      }));
    } catch (_) {}
  }

  async function carregar() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    // 1) Skeleton ou cache local
    const cache = lerCache();
    if (cache && cache.length) {
      renderLista(grid, cache);
    } else {
      grid.innerHTML = SKELETON_CARDS;
    }

    // 2) Busca fresca da API
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
      } else {
        renderLista(grid, dados.eventos);
      }

      // Reaplica filtro ?categoria= se existir
      const params = new URLSearchParams(location.search);
      const cat = params.get('categoria');
      if (cat) {
        const chip = document.querySelector('.explore-chip[data-filter="' + cat + '"]');
        if (chip) chip.click();
      }
    } catch (e) {
      console.warn('[eventos-api] Falha:', e.message);
      if (!cache) {
        // mantém o card hardcoded como último recurso
      }
    }
  }

  /* Deep-link ?evento=slug — abre o detalhe directamente */
  function tratarDeepLink() {
    const params = new URLSearchParams(location.search);
    const slug = params.get('evento');
    if (!slug) return;

    fetch(API_URL + '/api/eventos/' + encodeURIComponent(slug))
      .then(r => r.json())
      .then(d => {
        if (d && d.ok && d.evento && typeof window.abrirEventoComDados === 'function') {
          window.abrirEventoComDados(d.evento);
        }
      })
      .catch(() => {});
  }

  /* Clique em "Ver detalhes" abre a janela do evento */
  document.addEventListener('click', function (ev) {
    var botao = ev.target.closest('.event-open');
    if (!botao) return;
    ev.preventDefault();
    ev.stopPropagation();

    var idx = parseInt(botao.getAttribute('data-idx'), 10);
    var evento = (window.__yuyuEventos || [])[idx];
    if (!evento) {
      console.warn('[eventos-api] Evento nao encontrado no indice', idx);
      return;
    }

    if (typeof window.abrirEventoComDados === 'function') {
      window.abrirEventoComDados(evento);
    } else {
      console.warn('[eventos-api] abrirEventoComDados nao existe');
    }
  });


  function iniciar() {
    carregar();
    tratarDeepLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
