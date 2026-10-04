/* ===== GESTÃO DE EVENTOS ===== */
(function () {
  /* Auth guard */
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $loading = document.getElementById('loading');
  const $lista = document.getElementById('lista');
  const $filtros = document.getElementById('filtros');
  const $btnNovo = document.getElementById('btnNovo');
  const $backdrop = document.getElementById('modalBackdrop');
  const $modalTitulo = document.getElementById('modalTitulo');
  const $modalFechar = document.getElementById('modalFechar');
  const $modalCancelar = document.getElementById('modalCancelar');
  const $form = document.getElementById('formEvento');
  const $alerta = document.getElementById('modalAlerta');
  const $btnGuardar = document.getElementById('btnGuardar');
  const $posterInput = document.getElementById('poster');
  const $posterPreview = document.getElementById('posterPreview');

  let eventos = [];
  let eventoEditando = null;
  let filtroAtual = 'todos';

  /* ---------- HELPERS ---------- */
  function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = meses[d.getMonth()];
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd} ${mm} ${yyyy} · ${hh}:${mi}`;
  }

  function escapar(txt) {
    return String(txt ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function abrirModal(titulo) {
    $modalTitulo.textContent = titulo;
    $alerta.className = 'admin-alert';
    $alerta.textContent = '';
    $backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function fecharModal() {
    $backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    $form.reset();
    $posterPreview.classList.remove('is-visible');
    $posterPreview.removeAttribute('src');
    eventoEditando = null;
  }

  function mostrarAlerta(msg, tipo) {
    $alerta.textContent = msg;
    $alerta.className = 'admin-alert is-visible ' + (tipo === 'erro' ? 'is-error' : 'is-success');
  }

  /* ---------- LISTAGEM ---------- */
  async function carregar() {
    $loading.style.display = 'block';
    $lista.innerHTML = '';

    try {
      const resp = await Api.get('/api/eventos/admin/todos');
      eventos = resp.eventos || [];
      renderizar();
    } catch (e) {
      $lista.innerHTML = `<div class="admin-empty"><h3>Erro ao carregar</h3><p>${escapar(e.message)}</p></div>`;
    } finally {
      $loading.style.display = 'none';
    }
  }

  function renderizar() {
    const filtrados = eventos.filter(e => {
      if (filtroAtual === 'ativos') return e.ativo;
      if (filtroAtual === 'inativos') return !e.ativo;
      return true;
    });

    if (!filtrados.length) {
      $lista.innerHTML = `
        <div class="admin-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"></rect>
            <path d="M16 2v4M8 2v4M3 10h18"></path>
          </svg>
          <h3>Sem eventos ${filtroAtual !== 'todos' ? '(' + filtroAtual + ')' : ''}</h3>
          <p>Cria o primeiro evento para começar.</p>
        </div>`;
      return;
    }

    $lista.innerHTML = filtrados.map(e => {
      const poster = e.poster_url
        ? `<img src="${escapar(e.poster_url)}" alt="${escapar(e.nome)}">`
        : `<div class="admin-event-poster-placeholder">Sem cartaz</div>`;

      return `
        <article class="admin-event ${e.ativo ? '' : 'is-inativo'}" data-id="${e.id}">
          <div class="admin-event-poster">${poster}</div>

          <div class="admin-event-info">
            <h3>${escapar(e.nome)}</h3>

            <div class="admin-event-meta">
              <span>
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>
                ${formatarData(e.data_evento)}
              </span>
              <span>
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${escapar(e.local)}
              </span>
              <span style="text-transform:capitalize">${escapar(e.categoria)}</span>
              ${e.ativo ? '' : '<span style="color:#fca5a5;font-weight:700">INATIVO</span>'}
            </div>

            <div class="admin-event-prices">
              <span>Normal: <strong>${e.preco_normal} MT</strong></span>
              <span>VIP: <strong>${e.preco_vip} MT</strong></span>
            </div>
          </div>

          <div class="admin-event-actions">
            <button type="button" class="admin-btn admin-btn-edit" data-acao="editar">Editar</button>
            <button type="button" class="admin-btn admin-btn-delete" data-acao="apagar">Apagar</button>
          </div>
        </article>`;
    }).join('');
  }

  /* ---------- AÇÕES ---------- */
  $lista.addEventListener('click', async (ev) => {
    const botao = ev.target.closest('[data-acao]');
    if (!botao) return;

    const artigo = botao.closest('.admin-event');
    const id = Number(artigo.dataset.id);
    const evento = eventos.find(x => x.id === id);
    if (!evento) return;

    if (botao.dataset.acao === 'editar') {
      abrirFormEdicao(evento);
    } else if (botao.dataset.acao === 'apagar') {
      const ok = confirm(`Apagar "${evento.nome}"?\n\nTodos os bilhetes associados serão apagados também.`);
      if (!ok) return;
      try {
        await Api.del('/api/eventos/' + id);
        eventos = eventos.filter(x => x.id !== id);
        renderizar();
      } catch (e) {
        alert('Erro ao apagar: ' + e.message);
      }
    }
  });

  $filtros.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-filter]');
    if (!b) return;
    $filtros.querySelectorAll('.admin-filter').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    filtroAtual = b.dataset.filter;
    renderizar();
  });

  /* ---------- CRIAR ---------- */
  $btnNovo.addEventListener('click', () => {
    eventoEditando = null;
    $form.reset();
    document.getElementById('preco_normal').value = 0;
    document.getElementById('preco_vip').value = 0;
    $posterPreview.classList.remove('is-visible');
    abrirModal('Criar evento');
  });

  /* ---------- EDITAR ---------- */
  function abrirFormEdicao(e) {
    eventoEditando = e;

    document.getElementById('nome').value = e.nome || '';
    document.getElementById('descricao').value = e.descricao || '';
    document.getElementById('local').value = e.local || '';
    document.getElementById('categoria').value = e.categoria || 'outros';
    document.getElementById('preco_normal').value = e.preco_normal ?? 0;
    document.getElementById('preco_vip').value = e.preco_vip ?? 0;

    // datetime-local formato YYYY-MM-DDTHH:MM
    if (e.data_evento) {
      const d = new Date(e.data_evento);
      const p = n => String(n).padStart(2, '0');
      const local = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
      document.getElementById('data_evento').value = local;
    }

    if (e.poster_url) {
      $posterPreview.src = e.poster_url;
      $posterPreview.classList.add('is-visible');
    } else {
      $posterPreview.classList.remove('is-visible');
    }

    abrirModal('Editar evento');
  }

  /* ---------- PREVIEW DO POSTER ---------- */
  $posterInput.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    $posterPreview.src = url;
    $posterPreview.classList.add('is-visible');
  });

  /* ---------- GUARDAR ---------- */
  $form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const data_evento = document.getElementById('data_evento').value;
    const local = document.getElementById('local').value.trim();

    if (!nome || !data_evento || !local) {
      mostrarAlerta('Preenche os campos obrigatórios.', 'erro');
      return;
    }

    $btnGuardar.disabled = true;
    const txt = $btnGuardar.textContent;
    $btnGuardar.textContent = 'A guardar…';

    const fd = new FormData();
    fd.append('nome', nome);
    fd.append('descricao', document.getElementById('descricao').value.trim());
    fd.append('local', local);
    fd.append('categoria', document.getElementById('categoria').value);
    fd.append('preco_normal', document.getElementById('preco_normal').value || 0);
    fd.append('preco_vip', document.getElementById('preco_vip').value || 0);

    // Converter datetime-local para ISO
    const isoData = new Date(data_evento).toISOString();
    fd.append('data_evento', isoData);

    const ficheiro = $posterInput.files && $posterInput.files[0];
    if (ficheiro) fd.append('poster', ficheiro);

    // Empresa organizadora
    const empresaNome = document.getElementById('empresa_nome');
    if (empresaNome) fd.append('empresa_nome', empresaNome.value.trim());

    const empresaLogoInput = document.getElementById('empresa_logo');
    if (empresaLogoInput && empresaLogoInput.files[0]) {
      fd.append('empresa_logo', empresaLogoInput.files[0]);
    }

    // Fotos extra
    const foto1Input = document.getElementById('foto1');
    if (foto1Input && foto1Input.files[0]) {
      fd.append('foto1', foto1Input.files[0]);
    }
    const foto1Desc = document.getElementById('foto1_descricao');
    if (foto1Desc) fd.append('foto1_descricao', foto1Desc.value.trim());

    const foto2Input = document.getElementById('foto2');
    if (foto2Input && foto2Input.files[0]) {
      fd.append('foto2', foto2Input.files[0]);
    }
    const foto2Desc = document.getElementById('foto2_descricao');
    if (foto2Desc) fd.append('foto2_descricao', foto2Desc.value.trim());

    try {
      if (eventoEditando) {
        await Api.put('/api/eventos/' + eventoEditando.id, fd);
      } else {
        await Api.post('/api/eventos', fd);
      }
      fecharModal();
      await carregar();
    } catch (e) {
      mostrarAlerta(e.message || 'Erro ao guardar.', 'erro');
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = txt;
    }
  });

  /* ---------- FECHAR MODAL ---------- */
  $modalFechar.addEventListener('click', fecharModal);
  $modalCancelar.addEventListener('click', fecharModal);
  $backdrop.addEventListener('click', (ev) => {
    if (ev.target === $backdrop) fecharModal();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && $backdrop.classList.contains('is-open')) fecharModal();
  });

  /* ---------- HEADER ---------- */
  document.getElementById('btnSair').addEventListener('click', () => Api.logout());

  (async () => {
    try {
      const r = await Api.me();
      document.getElementById('nomeAdmin').textContent = r.admin?.username || '';
    } catch (_) {}
    carregar();
  })();



  /* Previews dos novos ficheiros */
  function ativarPreview(inputId, previewId) {
    var inp = document.getElementById(inputId);
    var prev = document.getElementById(previewId);
    if (!inp || !prev) return;
    inp.addEventListener('change', function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (!f) return;
      var url = URL.createObjectURL(f);
      prev.src = url;
      prev.classList.add('is-visible');
    });
  }
  ativarPreview('empresa_logo', 'empresaLogoPreview');
  ativarPreview('foto1', 'foto1Preview');
  ativarPreview('foto2', 'foto2Preview');

})();
