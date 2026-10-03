/* ===== DASHBOARD ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);
  const $loading = $('loading');
  const $conteudo = $('conteudo');

  function escapar(t) {
    return String(t ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatarMT(v) {
    const n = Number(v || 0);
    return n.toLocaleString('pt-PT') + ' MT';
  }

  function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth()+1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function pct(parte, total) {
    if (!total) return 0;
    return Math.round((parte / total) * 100);
  }

  /* ---------- KPIs ---------- */
  function renderKPIs(d) {
    const kpis = [
      {
        num: d.eventos.total,
        label: 'Eventos',
        sub: `${d.eventos.ativos} ativos · ${d.eventos.inativos} inativos`,
        icon: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>'
      },
      {
        num: d.bilhetes.total,
        label: 'Bilhetes emitidos',
        sub: `${d.bilhetes.ativos} ativos · ${d.bilhetes.pendentes} pendentes`,
        icon: '<path d="M3 9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v1a2 2 0 0 0 0 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1a2 2 0 0 0 0-4V9z"></path>'
      },
      {
        num: d.receita.confirmada,
        label: 'Receita confirmada',
        sub: `Total esperado: ${formatarMT(d.receita.total)}`,
        isMT: true,
        icon: '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>'
      },
      {
        num: d.bilhetes.usados,
        label: 'Entradas validadas',
        sub: `De ${d.bilhetes.ativos + d.bilhetes.usados} bilhetes ativos`,
        icon: '<path d="M20 6L9 17l-5-5"></path>'
      },
      {
        num: d.admins.ativos,
        label: 'Contas ativas',
        sub: `${d.admins.total} no total`,
        icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>'
      },
      {
        num: d.validacoesHoje.total,
        label: 'Validações hoje',
        sub: `${d.validacoesHoje.validos} válidas · ${d.validacoesHoje.repetidos} repetidas`,
        icon: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>'
      }
    ];

    $('kpis').innerHTML = kpis.map(k => `
      <div class="dash-kpi">
        <div class="dash-kpi-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">${k.icon}</svg>
        </div>
        <div class="dash-kpi-num">${k.isMT ? formatarMT(k.num) : k.num}</div>
        <div class="dash-kpi-label">${k.label}</div>
        <div class="dash-linha-meta" style="margin-top:2px">${k.sub}</div>
      </div>
    `).join('');
  }

  /* ---------- RECEITA ---------- */
  function renderReceita(d) {
    $('receitaConfirmada').textContent = formatarMT(d.receita.confirmada);
    $('receitaPendente').textContent = formatarMT(d.receita.pendente);
    $('receitaTotal').textContent = formatarMT(d.receita.total);
  }

  /* ---------- BARRAS ---------- */
  function barra(label, num, total, corClasse) {
    const p = pct(num, total);
    return `
      <div class="dash-bar">
        <div class="dash-bar-top">
          <span class="dash-bar-label">${escapar(label)}</span>
          <span class="dash-bar-num">${num}</span>
        </div>
        <div class="dash-bar-track">
          <div class="dash-bar-fill ${corClasse || ''}" style="width:${p}%"></div>
        </div>
      </div>`;
  }

  function renderTipo(d) {
    const total = d.bilhetes.total || 1;
    $('barsTipo').innerHTML =
      barra('Normal', d.bilhetes.normal, total, 'is-azul') +
      barra('VIP', d.bilhetes.vip, total, '');
  }

  function renderValidacoes(d) {
    const v = d.validacoesHoje;
    const total = v.total || 1;
    if (v.total === 0) {
      $('barsValidacoes').innerHTML = '<div class="dash-vazio">Sem validações hoje.</div>';
      return;
    }
    $('barsValidacoes').innerHTML =
      barra('Válidas', v.validos, total, 'is-verde') +
      barra('Repetidas', v.repetidos, total, 'is-amarelo') +
      barra('Inválidas', v.invalidos, total, 'is-cinza');
  }

  /* ---------- ÚLTIMOS BILHETES ---------- */
  function renderUltimos(d) {
    const lista = d.ultimosBilhetes || [];
    if (!lista.length) {
      $('ultimos').innerHTML = '<div class="dash-vazio">Sem bilhetes emitidos.</div>';
      return;
    }
    $('ultimos').innerHTML = '<div class="dash-lista">' + lista.map(b => `
      <div class="dash-linha is-${b.tipo}">
        <div>
          <code>${escapar(b.codigo)}</code>
          <div class="dash-linha-meta">
            <strong>${escapar(b.evento_nome)}</strong>
            ${b.comprador_nome ? ' · ' + escapar(b.comprador_nome) : ''}
            · ${b.preco} MT
          </div>
        </div>
        <div class="dash-linha-meta">${formatarData(b.criado_em)}</div>
      </div>
    `).join('') + '</div>';
  }

  /* ---------- TOP EVENTOS ---------- */
  function renderTopEventos(d) {
    const lista = d.vendasPorEvento || [];
    if (!lista.length) {
      $('topEventos').innerHTML = '<div class="dash-vazio">Sem eventos criados.</div>';
      return;
    }
    $('topEventos').innerHTML = lista.map(e => `
      <div class="dash-ev">
        <div>
          <div class="dash-ev-nome">${escapar(e.nome)}</div>
          <div class="dash-ev-sub">${e.total_bilhetes} ${e.total_bilhetes === 1 ? 'bilhete' : 'bilhetes'}</div>
        </div>
        <div class="dash-ev-receita">${formatarMT(e.receita)}</div>
      </div>
    `).join('');
  }

  /* ---------- CARREGAR ---------- */
  async function carregar() {
    /* Cache frontend: 30s para a mesma sessão */
    const CHAVE_CACHE = 'yuyu_dash_cache';
    const CHAVE_TS = 'yuyu_dash_ts';
    try {
      const ts = parseInt(sessionStorage.getItem(CHAVE_TS) || '0', 10);
      if (Date.now() - ts < 60000) {
        const cached = sessionStorage.getItem(CHAVE_CACHE);
        if (cached) {
          const d = JSON.parse(cached);
          renderKPIs(d); renderReceita(d); renderTipo(d);
          renderValidacoes(d); renderUltimos(d); renderTopEventos(d);
          $loading.style.display = 'none';
          $conteudo.style.display = 'block';
          return;
        }
      }
    } catch (_) {}

    try {
      const d = await Api.get('/api/admin/stats');
      try {
        sessionStorage.setItem(CHAVE_CACHE, JSON.stringify(d));
        sessionStorage.setItem(CHAVE_TS, String(Date.now()));
      } catch (_) {}
      renderKPIs(d);
      renderReceita(d);
      renderTipo(d);
      renderValidacoes(d);
      renderUltimos(d);
      renderTopEventos(d);
      $loading.style.display = 'none';
      $conteudo.style.display = 'block';
    } catch (e) {
      $loading.innerHTML = `<div style="color:#fca5a5">Erro ao carregar: ${escapar(e.message)}</div>`;
    }
  }

  /* ---------- HEADER ---------- */
  $('btnSair').addEventListener('click', () => Api.logout());

  /* Busca sem usar cache (força query fresca em background) */
  async function refreshSilencioso() {
    try {
      const d = await Api.get('/api/admin/stats');
      try {
        sessionStorage.setItem('yuyu_dash_cache', JSON.stringify(d));
        sessionStorage.setItem('yuyu_dash_ts', String(Date.now()));
      } catch (_) {}
      renderKPIs(d); renderReceita(d); renderTipo(d);
      renderValidacoes(d); renderUltimos(d); renderTopEventos(d);
    } catch (_) {}
  }

  (async () => {
    const admin = Api.getAdmin();
    if (admin) {
      $('nomeAdmin').textContent = admin.username || '';
      $('nomeTitulo').textContent = admin.username || '';
    }
    await carregar();

    /* A cada 50s, re-busca em background (mantém cache backend quente) */
    setInterval(refreshSilencioso, 50000);
  })();

})();
