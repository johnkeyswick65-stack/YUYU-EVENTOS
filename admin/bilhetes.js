/* ===== GESTÃO DE BILHETES ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);

  const $loading = $('loading');
  const $lista = $('lista');
  const $contador = $('contador');
  const $busca = $('busca');
  const $filtroEvento = $('filtroEvento');
  const $filtroEstado = $('filtroEstado');
  const $filtroTipo = $('filtroTipo');

  const $modalEmitir = $('modalEmitir');
  const $formEmitir = $('formEmitir');
  const $alertaEmitir = $('alertaEmitir');
  const $btnEmitir = $('btnEmitir');
  const $eventoSelect = $('evento_id');

  const $modalHistorico = $('modalHistorico');
  const $histTitulo = $('histTitulo');
  const $histCorpo = $('histCorpo');

  let bilhetes = [];
  let eventos = [];
  const API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '')
    ? 'http://localhost:3000'
    : 'https://yuyu-eventos-api.onrender.com';

  function escapar(t) {
    return String(t ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function badgeTipo(t) {
    return t === 'vip' ? '<span class="badge badge-vip">VIP</span>' : '<span class="badge badge-normal">Normal</span>';
  }

  function badgeEstado(b) {
    if (b.usado_em) return '<span class="badge badge-usado">Usado</span>';
    if (b.estado === 'ativo') return '<span class="badge badge-ativo">Ativo</span>';
    if (b.estado === 'pendente') return '<span class="badge badge-pendente">Pendente</span>';
    if (b.estado === 'cancelado') return '<span class="badge badge-cancelado">Cancelado</span>';
    return '';
  }

  async function carregarEventos() {
    try {
      const r = await Api.get('/api/eventos/admin/todos');
      eventos = r.eventos || [];
      $filtroEvento.innerHTML = '<option value="">Todos os eventos</option>' +
        eventos.map(e => `<option value="${e.id}">${escapar(e.nome)}</option>`).join('');
      $eventoSelect.innerHTML = '<option value="">— Escolhe um evento —</option>' +
        eventos.filter(e => e.ativo).map(e => `<option value="${e.id}">${escapar(e.nome)} · Normal ${e.preco_normal}MT · VIP ${e.preco_vip}MT</option>`).join('');
    } catch (_) {}
  }

  async function carregar() {
    $loading.style.display = 'block';
    try {
      const r = await Api.get('/api/bilhetes');
      bilhetes = r.bilhetes || [];
      renderizar();
    } catch (e) {
      $lista.innerHTML = `<div class="admin-empty"><h3>Erro</h3><p>${escapar(e.message)}</p></div>`;
    } finally {
      $loading.style.display = 'none';
    }
  }

  function filtrar() {
    const busca = $busca.value.trim().toLowerCase();
    const ev = $filtroEvento.value;
    const es = $filtroEstado.value;
    const tp = $filtroTipo.value;

    return bilhetes.filter(b => {
      if (ev && String(b.evento_id) !== ev) return false;
      if (es) {
        if (es === 'usado' && !b.usado_em) return false;
        if (es !== 'usado' && b.estado !== es) return false;
      }
      if (tp && b.tipo !== tp) return false;
      if (busca) {
        const alvo = (b.codigo + ' ' + (b.comprador_nome || '') + ' ' + b.evento_nome).toLowerCase();
        if (!alvo.includes(busca)) return false;
      }
      return true;
    });
  }

  function renderizar() {
    const lista = filtrar();
    $contador.textContent = `${lista.length} de ${bilhetes.length} bilhetes`;

    if (!lista.length) {
      $lista.innerHTML = `<div class="admin-empty"><h3>Sem bilhetes</h3><p>${bilhetes.length ? 'Nada corresponde aos filtros.' : 'Emita o primeiro bilhete.'}</p></div>`;
      return;
    }

    $lista.innerHTML = lista.map(b => {
      const classes = 'admin-ticket ' + (b.usado_em ? 'is-usado' : 'is-' + b.estado);

      const acoes = [];
      if (b.estado === 'pendente' && !b.usado_em) {
        acoes.push(`<button class="admin-btn-xs is-success" data-acao="ativar" data-id="${b.id}">Ativar</button>`);
      }
      if (b.estado !== 'cancelado' && !b.usado_em) {
        acoes.push(`<button class="admin-btn-xs" data-acao="cancelar" data-id="${b.id}">Cancelar</button>`);
      }
      if (b.tipo === 'normal' && !b.usado_em && b.estado !== 'cancelado') {
        acoes.push(`<button class="admin-btn-xs is-warn" data-acao="upgrade" data-id="${b.id}">→ VIP</button>`);
      }
      acoes.push(`<button class="admin-btn-xs is-primary" data-acao="ver-pdf" data-codigo="${escapar(b.codigo)}">Ver PDF</button>`);
      acoes.push(`<button class="admin-btn-xs" data-acao="baixar-pdf" data-codigo="${escapar(b.codigo)}">Baixar</button>`);
      acoes.push(`<button class="admin-btn-xs" data-acao="copiar-link" data-codigo="${escapar(b.codigo)}">Copiar link</button>`);
      acoes.push(`<button class="admin-btn-xs" data-acao="historico" data-id="${b.id}" data-codigo="${escapar(b.codigo)}">Histórico</button>`);
      acoes.push(`<button class="admin-btn-xs is-danger" data-acao="eliminar" data-id="${b.id}" data-codigo="${escapar(b.codigo)}">Eliminar</button>`);

      return `
        <article class="${classes}" data-id="${b.id}">
          <div>
            <div class="admin-ticket-top">
              <span class="admin-ticket-code">${escapar(b.codigo)}</span>
              <button type="button" class="admin-ticket-copy" data-acao="copiar-codigo" data-codigo="${escapar(b.codigo)}">copiar</button>
              ${badgeTipo(b.tipo)}
              ${badgeEstado(b)}
            </div>
            <p class="admin-ticket-info">
              <strong>${escapar(b.evento_nome)}</strong> · ${formatarData(b.data_evento)}
            </p>
            <p class="admin-ticket-info">
              ${b.comprador_nome ? escapar(b.comprador_nome) : '<em style="opacity:.5">Sem titular</em>'}
              ${b.comprador_telefone ? ' · ' + escapar(b.comprador_telefone) : ''}
            </p>
            <p class="admin-ticket-info" style="color:#fca5a5;font-weight:700">${b.preco} MT</p>
            ${b.usado_em ? `<p class="admin-ticket-info" style="color:#fca5a5">Usado em ${formatarData(b.usado_em)}</p>` : ''}
          </div>

          <div class="admin-ticket-actions">
            ${acoes.join('')}
          </div>
        </article>`;
    }).join('');
  }

  /* ---------- AÇÕES NOS BILHETES ---------- */
  $lista.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('[data-acao]');
    if (!btn) return;
    const acao = btn.dataset.acao;
    const id = btn.dataset.id ? Number(btn.dataset.id) : null;
    const codigo = btn.dataset.codigo || '';

    if (acao === 'copiar-codigo' || acao === 'copiar-link') {
      const valor = acao === 'copiar-codigo' ? codigo : `${API_URL}/api/bilhetes/${codigo}/pdf`;
      try {
        await navigator.clipboard.writeText(valor);
        btn.classList.add('is-ok');
        const txt = btn.textContent;
        btn.textContent = '✓ copiado';
        setTimeout(() => { btn.classList.remove('is-ok'); btn.textContent = txt; }, 1400);
      } catch (_) { alert('Não foi possível copiar'); }
      return;
    }

    if (acao === 'ver-pdf') {
      window.open(`${API_URL}/api/bilhetes/${codigo}/pdf`, '_blank');
      return;
    }

    if (acao === 'baixar-pdf') {
      const a = document.createElement('a');
      a.href = `${API_URL}/api/bilhetes/${codigo}/pdf`;
      a.download = `bilhete-${codigo}.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    if (acao === 'historico') {
      abrirHistorico(id, codigo);
      return;
    }

    if (acao === 'eliminar') {
      const b = bilhetes.find(x => x.id === id);
      const info = b ? `${b.codigo}\nEvento: ${b.evento_nome}\nTipo: ${b.tipo.toUpperCase()}\nTitular: ${b.comprador_nome || 'sem titular'}` : codigo;
      if (!confirm(`Eliminar definitivamente este bilhete?\n\n${info}\n\nEsta ação NÃO pode ser desfeita.`)) return;
      try {
        await Api.del(`/api/bilhetes/${id}`);
        await carregar();
      } catch (e) {
        alert('Erro ao eliminar: ' + e.message);
      }
      return;
    }

    if (acao === 'ativar') {
      if (!confirm('Marcar este bilhete como ativo?')) return;
      try { await Api.patch(`/api/bilhetes/${id}/estado`, { estado: 'ativo' }); await carregar(); }
      catch (e) { alert(e.message); }
      return;
    }

    if (acao === 'cancelar') {
      if (!confirm('Cancelar este bilhete? Não poderá ser ativado de novo.')) return;
      try { await Api.patch(`/api/bilhetes/${id}/estado`, { estado: 'cancelado' }); await carregar(); }
      catch (e) { alert(e.message); }
      return;
    }

    if (acao === 'upgrade') {
      if (!confirm('Fazer upgrade para VIP? Esta ação não pode ser revertida.')) return;
      try { await Api.patch(`/api/bilhetes/${id}/upgrade`); await carregar(); }
      catch (e) { alert(e.message); }
      return;
    }
  });

  /* ---------- EMITIR BILHETE ---------- */
  $('btnNovo').addEventListener('click', () => {
    $formEmitir.reset();
    $alertaEmitir.className = 'admin-alert';
    abrir($modalEmitir);
  });

  $formEmitir.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const evento_id = Number($('evento_id').value);
    const tipo = $('tipo').value;
    const comprador_nome = $('comprador_nome').value.trim();
    const comprador_telefone = $('comprador_telefone').value.trim();
    const marcarPago = $('marcarPago').checked;

    if (!evento_id) {
      $alertaEmitir.textContent = 'Escolhe um evento.';
      $alertaEmitir.className = 'admin-alert is-visible is-error';
      return;
    }

    $btnEmitir.disabled = true;
    $btnEmitir.textContent = 'A emitir…';

    try {
      const r = await Api.post('/api/bilhetes', { evento_id, tipo, comprador_nome, comprador_telefone });

      if (marcarPago && r.bilhete) {
        await Api.patch(`/api/bilhetes/${r.bilhete.id}/estado`, { estado: 'ativo' });
      }

      fechar($modalEmitir);
      await carregar();
    } catch (e) {
      $alertaEmitir.textContent = e.message || 'Erro ao emitir.';
      $alertaEmitir.className = 'admin-alert is-visible is-error';
    } finally {
      $btnEmitir.disabled = false;
      $btnEmitir.textContent = 'Emitir bilhete';
    }
  });

  /* ---------- HISTÓRICO ---------- */
  async function abrirHistorico(id, codigo) {
    $histTitulo.textContent = `Histórico — ${codigo}`;
    $histCorpo.innerHTML = '<div class="admin-loading">A carregar…</div>';
    abrir($modalHistorico);

    try {
      const r = await Api.get(`/api/bilhetes/${id}/validacoes`);
      const lista = r.validacoes || [];

      if (!lista.length) {
        $histCorpo.innerHTML = '<p style="color:var(--cinza);text-align:center;padding:24px 0">Sem validações registadas para este bilhete.</p>';
        return;
      }

      $histCorpo.innerHTML = lista.map(v => {
        const cores = { valido: 'var(--sucesso)', repetido: 'var(--aviso)', invalido: 'var(--erro)', cancelado: 'var(--cinza)', pendente: 'var(--aviso)' };
        const cor = cores[v.resultado] || 'var(--cinza)';
        return `
          <div style="padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.03);border-left:3px solid ${cor}">
            <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <strong style="color:${cor};text-transform:uppercase;font-size:12px;letter-spacing:.05em">${escapar(v.resultado)}</strong>
              <span style="font-size:12px;opacity:.65">${formatarData(v.criado_em)}</span>
            </div>
            <p style="margin:6px 0 0;font-size:13px;color:var(--cinza)">${escapar(v.notas || '')}</p>
            ${v.admin_username ? `<p style="margin:4px 0 0;font-size:12px;opacity:.6">por ${escapar(v.admin_username)}</p>` : ''}
          </div>`;
      }).join('');
    } catch (e) {
      $histCorpo.innerHTML = `<p style="color:#fca5a5">${escapar(e.message)}</p>`;
    }
  }

  /* ---------- MODAL HELPERS ---------- */
  function abrir(el) { el.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function fechar(el) { el.classList.remove('is-open'); document.body.style.overflow = ''; }

  document.querySelectorAll('[data-fechar]').forEach(b => {
    b.addEventListener('click', () => {
      fechar($modalEmitir);
      fechar($modalHistorico);
    });
  });

  [$modalEmitir, $modalHistorico].forEach(m => {
    m.addEventListener('click', (ev) => { if (ev.target === m) fechar(m); });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fechar($modalEmitir); fechar($modalHistorico); }
  });

  /* ---------- FILTROS ---------- */
  [$busca, $filtroEvento, $filtroEstado, $filtroTipo].forEach(el => {
    el.addEventListener('input', renderizar);
    el.addEventListener('change', renderizar);
  });

  /* ---------- HEADER ---------- */
  $('btnSair').addEventListener('click', () => Api.logout());

  (async () => {
    try {
      const r = await Api.me();
      $('nomeAdmin').textContent = r.admin?.username || '';
    } catch (_) {}
    await carregarEventos();
    await carregar();
  })();

})();
