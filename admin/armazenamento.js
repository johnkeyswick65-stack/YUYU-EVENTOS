/* ===== ARMAZENAMENTO ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);

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

      // Cloudinary
      const c = d.cloudinary;
      $('armPerc').textContent = c.percentagem + '%';
      $('armBarFill').style.width = Math.max(1, c.percentagem) + '%';
      $('armUsado').textContent = formatarMB(c.usado_mb);
      $('armLimite').textContent = formatarMB(c.limite_mb);
      $('armPlano').textContent = 'Plano ' + (c.plano || 'Free');
      $('armFicheiros').textContent = c.ficheiros;

      // KPIs
      $('armRegistos').textContent = d.base_dados.total_registos;
      $('armEventos').textContent = d.base_dados.eventos;
      $('armBilhetes').textContent = d.base_dados.bilhetes;

      // Imagens por tipo
      renderBarras($('armTipos'), [
        { label: 'Posters', valor: d.imagens.posters, classe: 'is-vermelho' },
        { label: 'Logos', valor: d.imagens.logos, classe: 'is-azul' },
        { label: 'Fotos extra', valor: d.imagens.fotos_extra, classe: 'is-verde' }
      ]);

      // Top eventos
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
    } catch (e) {
      $('loading').innerHTML = '<div style="color:#fca5a5">Erro: ' + escapar(e.message) + '</div>';
    }
  }

  // Botão limpar órfãs
  $('btnLimpar').addEventListener('click', async function () {
    if (!confirm('Apagar imagens órfãs do Cloudinary?\n\nEsta ação não pode ser desfeita.')) return;
    $('armLimparMsg').textContent = 'A processar...';
    try {
      const r = await Api.post('/api/admin/limpar-orfas');
      $('armLimparMsg').textContent = 'Removidas ' + (r.removidas || 0) + ' imagens.';
      setTimeout(function () { location.reload(); }, 2000);
    } catch (e) {
      $('armLimparMsg').textContent = 'Erro: ' + e.message;
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
