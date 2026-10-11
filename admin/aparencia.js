/* ===== APARÊNCIA ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);
  let configAtual = null;

  function escapar(t) {
    return String(t ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function msg(el, texto, tipo) {
    el.textContent = texto;
    el.className = 'ap-msg ' + (tipo === 'erro' ? 'is-erro' : 'is-ok');
    setTimeout(() => { el.textContent = ''; el.className = 'ap-msg'; }, 3500);
  }

  async function carregar() {
    try {
      const r = await Api.get('/api/admin/config');
      configAtual = r.config;

      // Hero — textos
      const h = configAtual.hero || {};
      $('heroLabel').value = h.label || '';
      $('heroTitulo').value = h.titulo || '';
      $('heroDestaque').value = h.titulo_destaque || '';
      $('heroSubtitulo').value = h.subtitulo || '';
      $('heroBotao').value = h.botao_texto || '';
      $('heroBotaoLink').value = h.botao_link || '';
      $('heroPlaceholder').value = h.placeholder_busca || '';

      // Preview da imagem
      if (h.imagem_url) {
        $('heroPreview').src = h.imagem_url;
        $('heroPreview').hidden = false;
        $('heroPlaceholder').hidden = true;
      } else {
        $('heroPreview').hidden = true;
        $('heroPlaceholder').hidden = false;
      }

      // Temas
      renderizarTemas(configAtual.temas || []);

      $('loading').style.display = 'none';
      $('conteudo').style.display = 'block';
    } catch (e) {
      $('loading').innerHTML = '<div style="color:#fca5a5">Erro: ' + escapar(e.message) + '</div>';
    }
  }

  function renderizarTemas(temas) {
    $('listaTemas').innerHTML = temas.map(function (t) {
      return `
        <div class="ap-tema" data-id="${t.id}">
          <div class="ap-tema-top">
            <span class="ap-tema-nome">${escapar(t.nome)}</span>
            <div class="ap-tema-preview" style="background: linear-gradient(135deg, ${t.primaria}, ${t.escura})"></div>
          </div>
          <div class="ap-grid-3">
            <div class="ap-field">
              <label>Principal</label>
              <input type="color" data-campo="primaria" value="${t.primaria}">
            </div>
            <div class="ap-field">
              <label>Escura</label>
              <input type="color" data-campo="escura" value="${t.escura}">
            </div>
            <div class="ap-field">
              <label>Clara</label>
              <input type="color" data-campo="clara" value="${t.clara}">
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Atualiza preview em tempo real
    document.querySelectorAll('.ap-tema').forEach(function (card) {
      card.querySelectorAll('input[type=color]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          const prim = card.querySelector('[data-campo="primaria"]').value;
          const esc = card.querySelector('[data-campo="escura"]').value;
          card.querySelector('.ap-tema-preview').style.background =
            'linear-gradient(135deg, ' + prim + ', ' + esc + ')';
        });
      });
    });
  }

  function hexParaRgb(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return r + ',' + g + ',' + b;
  }

  /* Guardar HERO */
  $('btnGuardarHero').addEventListener('click', async function () {
    const msgEl = $('heroMsg');
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'A guardar…';

    try {
      const hero = Object.assign({}, configAtual.hero, {
        label: $('heroLabel').value.trim(),
        titulo: $('heroTitulo').value.trim(),
        titulo_destaque: $('heroDestaque').value.trim(),
        subtitulo: $('heroSubtitulo').value.trim(),
        botao_texto: $('heroBotao').value.trim(),
        botao_link: $('heroBotaoLink').value.trim(),
        placeholder_busca: $('heroPlaceholder').value.trim()
      });

      await Api.put('/api/admin/config/hero', { valor: hero });
      configAtual.hero = hero;
      msg(msgEl, 'Guardado ✓', 'ok');
    } catch (e) {
      msg(msgEl, 'Erro: ' + e.message, 'erro');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar alterações';
    }
  });

  /* Guardar TEMAS */
  $('btnGuardarTemas').addEventListener('click', async function () {
    const msgEl = $('temasMsg');
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'A guardar…';

    try {
      const temas = [];
      document.querySelectorAll('.ap-tema').forEach(function (card) {
        const id = card.dataset.id;
        const nome = card.querySelector('.ap-tema-nome').textContent;
        const primaria = card.querySelector('[data-campo="primaria"]').value;
        const escura = card.querySelector('[data-campo="escura"]').value;
        const clara = card.querySelector('[data-campo="clara"]').value;
        temas.push({
          id: id,
          nome: nome,
          primaria: primaria,
          escura: escura,
          clara: clara,
          rgb: hexParaRgb(primaria)
        });
      });

      await Api.put('/api/admin/config/temas', { valor: temas });
      configAtual.temas = temas;
      msg(msgEl, 'Temas guardados ✓', 'ok');
    } catch (e) {
      msg(msgEl, 'Erro: ' + e.message, 'erro');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar temas';
    }
  });

  /* Upload da imagem do hero */
  $('heroInput').addEventListener('change', async function (ev) {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;

    const btn = $('btnGuardarHero');
    btn.disabled = true;

    // Preview imediato
    const url = URL.createObjectURL(f);
    $('heroPreview').src = url;
    $('heroPreview').hidden = false;
    $('heroPlaceholder').hidden = true;

    try {
      const fd = new FormData();
      fd.append('imagem', f);
      const r = await Api.post('/api/admin/hero/imagem', fd);

      configAtual.hero.imagem_url = r.imagem_url;
      msg($('heroMsg'), 'Imagem enviada ✓', 'ok');
    } catch (e) {
      msg($('heroMsg'), 'Erro: ' + e.message, 'erro');
    } finally {
      btn.disabled = false;
    }
  });

  /* Header */
  $('btnSair').addEventListener('click', () => Api.logout());

  (async function () {
    try {
      const r = await Api.me();
      $('nomeAdmin').textContent = r.admin ? r.admin.username : '';
    } catch (_) {}
    carregar();
  })();
})();
