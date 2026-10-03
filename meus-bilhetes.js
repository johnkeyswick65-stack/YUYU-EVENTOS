/* ===== MEUS BILHETES — login do cliente ===== */
(function () {
  const API_URL = (function () {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
    if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
    if (/^10\./.test(h)) return 'http://' + h + ':3000';
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
    return 'https://yuyu-backend-1b4x.onrender.com';
  })();

  const $ = (id) => document.getElementById(id);
  const $loginBox = $('loginBox');
  const $listaBox = $('listaBox');
  const $formLogin = $('formLogin');
  const $erroLogin = $('erroLogin');
  const $bilhetes = $('bilhetes');
  const $quemEntrou = $('quemEntrou');

  const CHAVE_TOKEN = 'yuyu_cliente_token';
  const CHAVE_NOME = 'yuyu_cliente_nome';

  function getToken() { return localStorage.getItem(CHAVE_TOKEN); }
  function setToken(t) { localStorage.setItem(CHAVE_TOKEN, t); }
  function limpar() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_NOME);
  }

  function escapar(t) {
    return String(t ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  }

  async function pedir(path, opcoes = {}) {
    const headers = { ...(opcoes.headers || {}) };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (opcoes.body && !(opcoes.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(API_URL + path, { ...opcoes, headers });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const err = new Error((data && data.error) || 'Erro ' + res.status);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  /* ---------- LOGIN ---------- */
  $formLogin.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    $erroLogin.textContent = '';
    $erroLogin.classList.remove('is-visible');

    const codigo = $('codigo').value.trim().toUpperCase();
    const telefone = $('telefone').value.trim();
    const nome = $('nome').value.trim();

    if (!codigo || !telefone || !nome) {
      $erroLogin.textContent = 'Preenche todos os campos.';
      $erroLogin.classList.add('is-visible');
      return;
    }

    const btn = $('btnEntrar');
    btn.disabled = true;
    const txt = btn.textContent;
    btn.textContent = 'A entrar…';

    try {
      const r = await pedir('/api/cliente/login', {
        method: 'POST',
        body: JSON.stringify({ codigo, telefone, nome })
      });

      setToken(r.token);
      localStorage.setItem(CHAVE_NOME, r.nome || '');
      await carregarBilhetes(r.nome);
    } catch (e) {
      $erroLogin.textContent = e.message || 'Não foi possível entrar.';
      $erroLogin.classList.add('is-visible');
    } finally {
      btn.disabled = false;
      btn.textContent = txt;
    }
  });

  /* ---------- LISTAR ---------- */
  async function carregarBilhetes(nome) {
    try {
      const r = await pedir('/api/cliente/bilhetes');
      const lista = r.bilhetes || [];

      // Preenche perfil
      const nomeFinal = nome || localStorage.getItem(CHAVE_NOME) || '—';
      const telefoneFinal = (() => {
        try {
          const tok = getToken();
          if (!tok) return '—';
          const payload = JSON.parse(atob(tok.split('.')[1]));
          return payload.telefone || '—';
        } catch (_) { return '—'; }
      })();

      const elNome = document.getElementById('perfilNome');
      const elTel = document.getElementById('perfilTelefone');
      const elAvatar = document.getElementById('perfilAvatar');

      if (elNome) elNome.textContent = nomeFinal;
      if (elTel) elTel.textContent = telefoneFinal;
      if (elAvatar) {
        const iniciais = nomeFinal
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(p => p[0])
          .join('')
          .toUpperCase();
        elAvatar.textContent = iniciais || '?';
      }

      // Estatísticas
      const total = lista.length;
      const ativos = lista.filter(b => !b.usado_em && b.estado === 'ativo').length;
      const vips = lista.filter(b => b.tipo === 'vip').length;

      const st = document.getElementById('statTotal');
      const sa = document.getElementById('statAtivos');
      const sv = document.getElementById('statVip');
      if (st) st.textContent = total;
      if (sa) sa.textContent = ativos;
      if (sv) sv.textContent = vips;

      if (!lista.length) {
        $bilhetes.innerHTML = '<div class="mb-vazio">Não encontrámos bilhetes associados a este telefone.</div>';
      } else {
        $bilhetes.innerHTML = lista.map(cartaoBilhete).join('');
      }

      $loginBox.hidden = true;
      $listaBox.hidden = false;
    } catch (e) {
      if (e.status === 401) {
        limpar();
        $loginBox.hidden = false;
        $listaBox.hidden = true;
        $erroLogin.textContent = 'Sessão expirada. Entra de novo.';
        $erroLogin.classList.add('is-visible');
      } else {
        alert('Erro: ' + e.message);
      }
    }
  }

  function cartaoBilhete(b) {
    const estado = b.usado_em ? 'usado' : b.estado;
    const estadoLabel = {
      pendente: 'Pendente',
      ativo: 'Ativo',
      cancelado: 'Cancelado',
      usado: 'Usado'
    }[estado] || estado;

    const data = new Date(b.data_evento);
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][data.getUTCMonth()];
    const hora = String(data.getUTCHours()).padStart(2, '0') + ':' + String(data.getUTCMinutes()).padStart(2, '0');

    // Codigo de barras visual (aleatorio estavel a partir do codigo)
    const barras = gerarBarrasVisual(b.codigo);

    // Acoes
    const acoes = [];

    if (estado === 'ativo' || estado === 'pendente') {
      acoes.push(`<a class="mb-btn-ticket is-primario" href="${API_URL}/api/bilhetes/${encodeURIComponent(b.codigo)}/pdf" target="_blank" rel="noopener">Ver bilhete (PDF)</a>`);
    }

    if (b.tipo === 'normal' && estado === 'ativo') {
      acoes.push(`<button type="button" class="mb-btn-ticket is-upgrade" data-upgrade="${b.id}" data-codigo="${escapar(b.codigo)}">Subir para VIP</button>`);
    }

    acoes.push(`<button type="button" class="mb-btn-ticket is-secundario" data-copiar="${escapar(b.codigo)}">Copiar código</button>`);

    return `
      <article class="mb-ticket is-${estado}" data-id="${b.id}">
        <div class="mb-ticket-top">
          <div class="mb-ticket-brand">
            <span class="mb-ticket-brand-dot"></span>
            <strong>YUYU</strong><span>EVENTOS</span>
          </div>
          <span class="mb-ticket-tipo is-${b.tipo}">${b.tipo.toUpperCase()}</span>
        </div>

        <div class="mb-ticket-body">
          <h3 class="mb-ticket-evento">${escapar(b.evento_nome)}</h3>
          <p class="mb-ticket-meta">${escapar(b.local || '')}</p>

          <div class="mb-ticket-date-block">
            <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
              <div class="mb-ticket-date-day">${dia}</div>
              <div class="mb-ticket-date-mes">${mes}</div>
            </div>
            <div class="mb-ticket-date-sep"></div>
            <div class="mb-ticket-date-info">
              <span class="mb-ticket-date-hora">${hora}</span>
              <span class="mb-ticket-date-local">${escapar(b.local || '')}</span>
            </div>
          </div>

          <div class="mb-ticket-info">
            <div class="mb-ticket-info-block">
              <span class="mb-ticket-info-label">Titular</span>
              <span class="mb-ticket-info-value">${escapar(b.comprador_nome || '—')}</span>
            </div>
            <div class="mb-ticket-info-block">
              <span class="mb-ticket-info-label">Valor</span>
              <span class="mb-ticket-info-value is-preco">${b.preco} MT</span>
            </div>
          </div>
        </div>

        <div class="mb-ticket-perf">
          <span class="mb-ticket-perf-line"></span>
        </div>

        <div class="mb-ticket-stub">
          <div class="mb-ticket-stub-left">
            <span class="mb-ticket-codigo-label">Código</span>
            <code class="mb-ticket-codigo">${escapar(b.codigo)}</code>
            <span class="mb-ticket-estado is-${estado}">${estadoLabel}</span>
          </div>
          <div class="mb-ticket-barcode" aria-hidden="true">
            ${barras}
          </div>
        </div>

        <div class="mb-ticket-actions">
          ${acoes.join('')}
        </div>
      </article>`;
  }

  /* Gera barras verticais a partir do codigo (visual apenas) */
  function gerarBarrasVisual(codigo) {
    const s = String(codigo || '');
    let seed = 0;
    for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) & 0xffff;
    let out = '';
    for (let i = 0; i < 40; i++) {
      seed = (seed * 9301 + 49297) & 0xffff;
      const h = 30 + (seed % 70);
      out += `<span style="height:${h}%"></span>`;
    }
    return out;
  }

  /* Copiar código */
  $bilhetes.addEventListener('click', async (ev) => {
    // Botao upgrade
    const up = ev.target.closest('[data-upgrade]');
    if (up) {
      if (!confirm('Subir este bilhete para VIP?\n\nEsta ação não pode ser revertida.')) return;
      const id = up.dataset.upgrade;
      up.disabled = true;
      const t = up.textContent;
      up.textContent = 'A subir…';
      try {
        await pedir(`/api/cliente/bilhetes/${id}/upgrade`, { method: 'PATCH' });
        await carregarBilhetes();
      } catch (e) {
        alert(e.message);
        up.disabled = false;
        up.textContent = t;
      }
      return;
    }

    const btn = ev.target.closest('[data-copiar]');
    if (!btn) return;
    const texto = btn.dataset.copiar;
    try {
      await navigator.clipboard.writeText(texto);
      const t = btn.textContent;
      btn.textContent = '✓ Copiado';
      setTimeout(() => btn.textContent = t, 1400);
    } catch (_) {
      alert('Código: ' + texto);
    }
  });

  /* ---------- SAIR ---------- */
  $('btnSair').addEventListener('click', () => {
    limpar();
    location.reload();
  });

  /* ---------- ARRANQUE ---------- */
  (async () => {
    if (!getToken()) return;
    try {
      await pedir('/api/cliente/me');
      await carregarBilhetes();
    } catch (_) {
      limpar();
    }
  })();

})();
