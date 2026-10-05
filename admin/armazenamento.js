/* ===== ARMAZENAMENTO ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);
  let imagensCache = [];
  let selecionadas = new Set();

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

      // Carregar lista de imagens em paralelo
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

      // Resumo
      $('armResumo').innerHTML = [
        '<div class="arm-resumo-item">',
          '<div class="arm-resumo-label">Total</div>',
          '<div class="arm-resumo-num">' + r.total + ' · ' + r.total_mb + ' MB</div>',
        '</div>',
        '<div class="arm-resumo-item">',
          '<div class="arm-resumo-label">Em uso</div>',
          '<div class="arm-resumo-num is-uso">' + r.em_uso + ' · ' + r.em_uso_mb + ' MB</div>',
        '</div>',
        '<div class="arm-resumo-item">',
          '<div class="arm-resumo-label">Órfãs</div>',
          '<div class="arm-resumo-num is-orfao">' + r.orfas + ' · ' + r.orfas_mb + ' MB</div>',
        '</div>'
      ].join('');

      renderImagens();
    } catch (e) {
      container.innerHTML = '<div class="dash-vazio" style="color:#fca5a5">Erro: ' + escapar(e.message) + '</div>';
    }
  }

  function renderImagens() {
    const container = $('armListaImagens');

    if (!imagensCache.length) {
      container.innerHTML = '<div class="dash-vazio">Sem imagens no Cloudinary.</div>';
      atualizarBarraAccao();
      return;
    }

    container.innerHTML = imagensCache.map(function (img, idx) {
      const sel = selecionadas.has(img.public_id);
      const classes = ['arm-item'];
      if (img.em_uso) classes.push('is-em-uso');
      if (sel) classes.push('is-selecionado');

      const badge = img.em_uso
        ? '<span class="arm-item-badge is-uso">Em uso</span>'
        : '<span class="arm-item-badge is-orfao">Órfã</span>';

      const check = img.em_uso ? '' : '<div class="arm-item-check">✓</div>';

      return [
        '<div class="' + classes.join(' ') + '" data-idx="' + idx + '" data-pid="' + escapar(img.public_id) + '">',
          badge,
          check,
          '<img class="arm-item-img" src="' + escapar(img.thumbnail) + '" alt="" loading="lazy" onerror="this.style.opacity=0.3">',
          '<div class="arm-item-info">',
            '<strong>' + img.kb + ' KB</strong>',
            '<span>' + escapar(img.formato.toUpperCase()) + ' · ' + img.largura + '×' + img.altura + '</span>',
            img.em_uso
              ? '<span style="color:#86efac">' + escapar(img.tipo) + ' de ' + escapar(img.evento) + '</span>'
              : '<span style="color:#fcd34d">Sem uso</span>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');

    atualizarBarraAccao();
  }

  function atualizarBarraAccao() {
    const bar = $('armAccaoBar');
    const n = selecionadas.size;
    if (n > 0) {
      bar.style.display = 'flex';
      $('armSelCount').textContent = n + ' selecionada' + (n > 1 ? 's' : '');
    } else {
      bar.style.display = 'none';
    }
  }

  // Clicar numa imagem alterna seleção (só se for órfã)
  $('armListaImagens').addEventListener('click', function (ev) {
    const item = ev.target.closest('.arm-item');
    if (!item) return;
    if (item.classList.contains('is-em-uso')) return;
    const pid = item.getAttribute('data-pid');
    if (!pid) return;
    if (selecionadas.has(pid)) selecionadas.delete(pid);
    else selecionadas.add(pid);
    item.classList.toggle('is-selecionado');
    atualizarBarraAccao();
  });

  // Botão: selecionar todas as órfãs
  $('armSelTodas').addEventListener('click', function () {
    selecionadas.clear();
    imagensCache.forEach(function (img) {
      if (img.orfa) selecionadas.add(img.public_id);
    });
    renderImagens();
  });

  // Botão: limpar seleção
  $('armSelNenhuma').addEventListener('click', function () {
    selecionadas.clear();
    renderImagens();
  });

  // Botão: apagar selecionadas
  $('btnApagarSel').addEventListener('click', async function () {
    const n = selecionadas.size;
    if (!n) return;
    if (!confirm('Apagar ' + n + ' imagem(ns) do Cloudinary?\n\nEsta ação não pode ser desfeita.')) return;

    const btn = this;
    btn.disabled = true;
    const txt = btn.textContent;
    btn.textContent = 'A apagar…';

    try {
      const r = await Api.post('/api/admin/imagens/apagar', {
        public_ids: Array.from(selecionadas)
      });

      let msg = 'Apagadas ' + r.apagados + '.';
      if (r.bloqueados) msg += ' ' + r.bloqueados + ' bloqueadas (em uso).';
      if (r.erros && r.erros.length) msg += ' ' + r.erros.length + ' erros.';
      alert(msg);

      await carregarImagens();
    } catch (e) {
      alert('Erro: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = txt;
    }
  });

  // Header
  $('btnSair').addEventListener('click', function () { Api.logout(); });

  (async function () {
    try {
      const r = await Api.me();
      $('nomeAdmin').textContent = r.admin ? r.admin.username : '';
    } catch (_) {}
    carregar();
  })();
})();
