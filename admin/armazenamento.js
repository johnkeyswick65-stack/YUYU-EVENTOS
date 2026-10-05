/* ===== ARMAZENAMENTO — FILE MANAGER ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);
  let imagensCache = [];
  let selecionadas = new Set();
  let filtroAtual = 'todas';

  function formatarMB(mb) {
    if (mb < 1) return (mb * 1024).toFixed(0) + ' KB';
    if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB';
    return mb.toFixed(2) + ' MB';
  }

  function escapar(t) {
    return String(t ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderBarras(container, itens) {
    const max = Math.max(1, ...itens.map(i => i.valor));
    container.innerHTML = itens.map(function (i) {
      const perc = Math.round((i.valor / max) * 100);
      return [
        '<div class="dash-bar">',
          '<div class="dash-bar-top">',
            '<span class="dash-bar-label">' + escapar(i.label) + '</span>',
            '<span class="dash-bar-num">' + i.valor + '</span>',
          '</div>',
          '<div class="dash-bar-track">',
            '<div class="dash-bar-fill ' + (i.classe || '') + '" style="width:' + perc + '%"></div>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  async function carregar() {
    try {
      const d = await Api.get('/api/admin/armazenamento');

      const c = d.cloudinary;
      $('armPerc').textContent = c.percentagem + '%';
      $('armBarFill').style.width = Math.max(1, c.percentagem) + '%';
      $('armUsado').textContent = formatarMB(c.usado_mb);
      $('armLimite').textContent = formatarMB(c.limite_mb);
      $('armPlano').textContent = 'Plano ' + (c.plano || 'Free');
      $('armFicheiros').textContent = c.ficheiros;

      $('armRegistos').textContent = d.base_dados.total_registos;
      $('armEventos').textContent = d.base_dados.eventos;
      $('armBilhetes').textContent = d.base_dados.bilhetes;

      renderBarras($('armTipos'), [
        { label: 'Posters', valor: d.imagens.posters, classe: 'is-vermelho' },
        { label: 'Logos', valor: d.imagens.logos, classe: 'is-azul' },
        { label: 'Fotos extra', valor: d.imagens.fotos_extra, classe: 'is-verde' }
      ]);

      const top = d.top_eventos || [];
      if (!top.length) {
        $('armTop').innerHTML = '<div class="dash-vazio">Sem eventos.</div>';
      } else {
        $('armTop').innerHTML = top.map(function (e) {
          return [
            '<div class="dash-ev">',
              '<div>',
                '<div class="dash-ev-nome">' + escapar(e.nome) + '</div>',
                '<div class="dash-ev-sub">' + e.total_imagens + ' imagem(ns)</div>',
              '</div>',
              '<div class="dash-ev-receita">' + e.total_imagens + '</div>',
            '</div>'
          ].join('');
        }).join('');
      }

      $('loading').style.display = 'none';
      $('conteudo').style.display = 'block';

      carregarImagens();
    } catch (e) {
      $('loading').innerHTML = '<div style="color:#fca5a5">Erro: ' + escapar(e.message) + '</div>';
    }
  }

  async function carregarImagens() {
    const container = $('armListaImagens');
    container.innerHTML = '<div class="dash-vazio">A carregar imagens…</div>';

    try {
      const r = await Api.get('/api/admin/imagens');
      imagensCache = r.imagens || [];
      selecionadas.clear();

      $('armInfo').innerHTML =
        '<span><strong>' + r.total + '</strong> ficheiros</span>' +
        '<span>Total: <strong>' + r.total_mb + ' MB</strong></span>' +
        '<span style="color:#86efac">Em uso: <strong>' + r.em_uso + '</strong> · ' + r.em_uso_mb + ' MB</span>' +
        '<span style="color:#fcd34d">Órfãs: <strong>' + r.orfas + '</strong> · ' + r.orfas_mb + ' MB</span>';

      renderImagens();
    } catch (e) {
      container.innerHTML = '<div class="dash-vazio" style="color:#fca5a5">Erro: ' + escapar(e.message) + '</div>';
    }
  }

  function filtradas() {
    if (filtroAtual === 'uso') return imagensCache.filter(i => i.em_uso);
    if (filtroAtual === 'orfas') return imagensCache.filter(i => i.orfa);
    return imagensCache;
  }

  function renderImagens() {
    const container = $('armListaImagens');
    const lista = filtradas();

    if (!lista.length) {
      container.innerHTML = '<div class="dash-vazio">Sem imagens.</div>';
      atualizarBotaoApagar();
      return;
    }

    container.innerHTML = lista.map(function (img) {
      const sel = selecionadas.has(img.public_id);
      const classes = ['files-item'];
      if (img.em_uso) classes.push('is-em-uso');
      if (sel) classes.push('is-selecionado');

      const badge = img.em_uso
        ? '<span class="files-item-badge is-uso">Em uso</span>'
        : '<span class="files-item-badge is-orfao">Órfã</span>';

      const check = img.em_uso ? '' : '<div class="files-item-check"></div>';

      const subLinha = img.em_uso
        ? '<span class="is-verde">' + escapar(img.tipo) + ' de ' + escapar(img.evento) + '</span>'
        : '<span class="is-amarelo">Sem uso</span>';

      return [
        '<div class="' + classes.join(' ') + '" data-pid="' + escapar(img.public_id) + '">',
          check,
          badge,
          '<img src="' + escapar(img.thumbnail) + '" alt="" loading="lazy" onerror="this.style.opacity=0.3">',
          '<div class="files-item-info">',
            '<strong>' + img.kb + ' KB</strong>',
            '<span>' + escapar(img.formato.toUpperCase()) + ' · ' + img.largura + '×' + img.altura + '</span>',
            subLinha,
          '</div>',
        '</div>'
      ].join('');
    }).join('');

    atualizarBotaoApagar();
  }

  function atualizarBotaoApagar() {
    const btn = $('armApagar');
    const n = selecionadas.size;
    btn.disabled = n === 0;
    $('armApagarCount').textContent = n > 0 ? n : '';
  }

  // Clique numa imagem
  $('armListaImagens').addEventListener('click', function (ev) {
    const item = ev.target.closest('.files-item');
    if (!item) return;
    const pid = item.getAttribute('data-pid');
    const img = imagensCache.find(x => x.public_id === pid);
    if (!img) return;

    // Mostra preview
    abrirPreview(img);

    // Se for órfã, alterna seleção
    if (img.orfa) {
      if (selecionadas.has(pid)) selecionadas.delete(pid);
      else selecionadas.add(pid);
      item.classList.toggle('is-selecionado');
      atualizarBotaoApagar();
    }
  });

  function abrirPreview(img) {
    $('armPreview').hidden = false;
    $('armPreviewImg').src = img.url;
    $('armPreviewInfo').innerHTML = [
      '<div class="row"><span>Nome</span><span>' + escapar(img.public_id.split('/').pop()) + '</span></div>',
      '<div class="row"><span>Tamanho</span><span>' + img.kb + ' KB</span></div>',
      '<div class="row"><span>Formato</span><span>' + escapar(img.formato.toUpperCase()) + '</span></div>',
      '<div class="row"><span>Dimensões</span><span>' + img.largura + ' × ' + img.altura + '</span></div>',
      '<div class="row"><span>Estado</span><span style="color:' + (img.em_uso ? '#86efac' : '#fcd34d') + '">' + (img.em_uso ? 'Em uso' : 'Órfã') + '</span></div>',
      img.em_uso ? '<div class="row"><span>Evento</span><span>' + escapar(img.evento) + '</span></div>' : '',
      img.em_uso ? '<div class="row"><span>Tipo</span><span>' + escapar(img.tipo) + '</span></div>' : ''
    ].join('');
  }

  $('armPreviewClose').addEventListener('click', function () {
    $('armPreview').hidden = true;
  });

  // Filtros
  document.querySelectorAll('[data-filtro]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-filtro]').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      filtroAtual = b.dataset.filtro;
      renderImagens();
    });
  });

  // Selecionar todas órfãs
  $('armSelecionarTodas').addEventListener('click', function () {
    const lista = filtradas().filter(i => i.orfa);
    const todasMarcadas = lista.every(i => selecionadas.has(i.public_id));
    if (todasMarcadas) {
      lista.forEach(i => selecionadas.delete(i.public_id));
    } else {
      lista.forEach(i => selecionadas.add(i.public_id));
    }
    renderImagens();
  });

  // Apagar
  $('armApagar').addEventListener('click', async function () {
    const n = selecionadas.size;
    if (!n) return;
    if (!confirm('Apagar ' + n + ' imagem(ns) do Cloudinary?\n\nEsta ação não pode ser desfeita.')) return;

    const btn = this;
    btn.disabled = true;

    try {
      const r = await Api.post('/api/admin/imagens/apagar', {
        public_ids: Array.from(selecionadas)
      });

      let msg = 'Apagadas ' + r.apagados + '.';
      if (r.bloqueados) msg += ' ' + r.bloqueados + ' bloqueadas.';
      if (r.erros && r.erros.length) msg += ' ' + r.erros.length + ' erros.';
      alert(msg);

      await carregarImagens();
    } catch (e) {
      alert('Erro: ' + e.message);
    } finally {
      btn.disabled = false;
    }
  });

  // Atualizar
  $('armAtualizar').addEventListener('click', function () {
    this.style.transform = 'rotate(360deg)';
    this.style.transition = 'transform .5s';
    setTimeout(() => { this.style.transform = ''; this.style.transition = ''; }, 500);
    carregarImagens();
  });

  $('btnSair').addEventListener('click', function () { Api.logout(); });

  (async function () {
    try {
      const r = await Api.me();
      $('nomeAdmin').textContent = r.admin ? r.admin.username : '';
    } catch (_) {}
    carregar();
  })();
})();
