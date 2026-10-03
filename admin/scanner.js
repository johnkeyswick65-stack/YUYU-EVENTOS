/* ===== SCANNER DE VALIDAÇÃO ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);

  const $video = $('video');
  const $placeholder = $('placeholder');
  const $frame = $('frame');
  const $btnIniciar = $('btnIniciar');
  const $btnParar = $('btnParar');
  const $feedback = $('feedback');
  const $fbIcon = $('fbIcon');
  const $fbTitulo = $('fbTitulo');
  const $fbMensagem = $('fbMensagem');
  const $fbInfo = $('fbInfo');
  const $formManual = $('formManual');
  const $inputManual = $('inputManual');
  const $histLista = $('histLista');
  const $statTotal = $('statTotal');
  const $statValidos = $('statValidos');
  const $btnSelecionar = $('btnSelecionar');
  const $btnEliminarSel = $('btnEliminarSel');
  const $btnCancelarSel = $('btnCancelarSel');
  const $btnLimpar = $('btnLimpar');

  const CHAVE_HIST = 'yuyu_scanner_historico';
  const CHAVE_STATS = 'yuyu_scanner_stats';

  /* ---------- PERSISTÊNCIA ---------- */
  function carregarHistorico() {
    try {
      const raw = localStorage.getItem(CHAVE_HIST);
      if (!raw) return [];
      return JSON.parse(raw).map(h => ({ ...h, hora: new Date(h.hora) }));
    } catch (_) { return []; }
  }
  function guardarHistorico() {
    try { localStorage.setItem(CHAVE_HIST, JSON.stringify(historico)); } catch (_) {}
  }
  function carregarStats() {
    try {
      const raw = localStorage.getItem(CHAVE_STATS);
      if (!raw) return { total: 0, validos: 0 };
      const s = JSON.parse(raw);
      return { total: s.total || 0, validos: s.validos || 0 };
    } catch (_) { return { total: 0, validos: 0 }; }
  }
  function guardarStats() {
    try { localStorage.setItem(CHAVE_STATS, JSON.stringify(stats)); } catch (_) {}
  }

  /* ---------- ESTADO ---------- */
  let stream = null;
  let detector = null;
  let loopHandle = null;
  let ultimoCodigo = '';
  let ultimoTempo = 0;
  let stats = carregarStats();
  let historico = carregarHistorico();
  let modoSelecao = false;
  const selecionadas = new Set();
  const suportaBarcode = ('BarcodeDetector' in window);

  /* ---------- SOM ---------- */
  let audioCtx = null;
  function bip(frequencia, duracao) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.value = frequencia; osc.type = 'sine';
      gain.gain.setValueAtTime(.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + duracao);
      osc.start(); osc.stop(audioCtx.currentTime + duracao);
    } catch (_) {}
  }
  function bipVerde() { bip(880, .15); setTimeout(() => bip(1320, .12), 130); }
  function bipVermelho() { bip(220, .35); }
  function vibrar(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

  function escapar(t) {
    return String(t ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ---------- CÂMARA ---------- */
  async function iniciar() {
    if (!suportaBarcode) {
      alert('Este navegador não suporta leitura automática.\n\nUsa a "Entrada manual".');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      $video.srcObject = stream;
      await $video.play();

      let formatos = ['qr_code', 'code_128'];
      try {
        const suportados = await BarcodeDetector.getSupportedFormats();
        formatos = formatos.filter(f => suportados.includes(f));
      } catch (_) {}
      detector = new BarcodeDetector({ formats: formatos });

      $placeholder.style.display = 'none';
      $frame.style.display = 'block';
      $btnIniciar.style.display = 'none';
      $btnParar.style.display = 'flex';
      loopHandle = requestAnimationFrame(loop);
    } catch (e) {
      alert('Não foi possível aceder à câmara:\n' + e.message);
    }
  }

  function parar() {
    if (loopHandle) { cancelAnimationFrame(loopHandle); loopHandle = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    $video.srcObject = null;
    $placeholder.style.display = 'grid';
    $frame.style.display = 'none';
    $btnIniciar.style.display = 'flex';
    $btnParar.style.display = 'none';
  }

  async function loop() {
    if (!detector || !$video || $video.readyState < 2) {
      loopHandle = requestAnimationFrame(loop); return;
    }
    try {
      const codigos = await detector.detect($video);
      if (codigos && codigos.length) {
        const texto = (codigos[0].rawValue || '').trim().toUpperCase();
        if (texto) {
          const agora = Date.now();
          if (texto !== ultimoCodigo || (agora - ultimoTempo) > 3000) {
            ultimoCodigo = texto; ultimoTempo = agora;
            validarCodigo(texto);
          }
        }
      }
    } catch (_) {}
    loopHandle = requestAnimationFrame(loop);
  }

  /* ---------- VALIDAÇÃO ---------- */
  async function validarCodigo(codigo) {
    codigo = String(codigo || '').trim().toUpperCase();
    if (!codigo) return;
    try {
      const r = await Api.post(`/api/bilhetes/${encodeURIComponent(codigo)}/validar`);
      const verde = r.resultado === 'verde';
      stats.total++;
      if (verde) stats.validos++;
      guardarStats();
      atualizarStats();
      verde ? bipVerde() : bipVermelho();
      vibrar(verde ? [60,40,60] : [200,60,200]);
      mostrarFeedback(verde, r);
      adicionarHistorico(verde, codigo, r.motivo || '');
    } catch (e) {
      stats.total++;
      guardarStats(); atualizarStats();
      bipVermelho(); vibrar(300);
      mostrarFeedback(false, { motivo: e.message || 'Erro ao validar' });
      adicionarHistorico(false, codigo, e.message || 'Erro');
    }
  }

  /* ---------- FEEDBACK ---------- */
  function mostrarFeedback(verde, dados) {
    $feedback.classList.remove('is-verde', 'is-vermelho');
    $feedback.classList.add(verde ? 'is-verde' : 'is-vermelho', 'is-visible');
    $fbTitulo.textContent = verde ? 'Entrada autorizada' : 'Entrada negada';
    $fbMensagem.textContent = dados.motivo || '';
    $fbIcon.innerHTML = verde
      ? '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>'
      : '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M15 9l-6 6M9 9l6 6"></path></svg>';

    const b = dados.bilhete;
    if (b) {
      $fbInfo.style.display = 'grid';
      $fbInfo.innerHTML = `
        <div><strong>${escapar(b.codigo || '')}</strong></div>
        <div>${escapar(b.evento_nome || '')}</div>
        ${b.comprador_nome ? `<div>Titular: <strong>${escapar(b.comprador_nome)}</strong></div>` : ''}
        <div>Tipo: <strong>${(b.tipo || '').toUpperCase()}</strong></div>`;
    } else {
      $fbInfo.style.display = 'none'; $fbInfo.innerHTML = '';
    }

    clearTimeout(window.__fbTimer);
    window.__fbTimer = setTimeout(() => {
      $feedback.classList.remove('is-visible');
    }, verde ? 2200 : 3200);
  }

  /* ---------- HISTÓRICO ---------- */
  function adicionarHistorico(verde, codigo, motivo) {
    historico.unshift({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      verde, codigo, motivo, hora: new Date()
    });
    if (historico.length > 100) historico.pop();
    guardarHistorico();
    renderHistorico();
  }

  function renderHistorico() {
    const temHist = historico.length > 0;
    $btnSelecionar.style.display = (temHist && !modoSelecao) ? 'inline-block' : 'none';
    $btnLimpar.style.display = (temHist && !modoSelecao) ? 'inline-block' : 'none';
    $btnCancelarSel.style.display = modoSelecao ? 'inline-block' : 'none';
    $btnEliminarSel.style.display = modoSelecao ? 'inline-block' : 'none';

    if (modoSelecao) {
      const n = selecionadas.size;
      $btnEliminarSel.textContent = `Eliminar (${n})`;
      $btnEliminarSel.disabled = n === 0;
      $btnEliminarSel.style.opacity = n === 0 ? '.5' : '1';
    }

    if (!historico.length) {
      $histLista.innerHTML = '<div class="scanner-history-empty">Sem leituras ainda.</div>';
      return;
    }

    const p = (n) => String(n).padStart(2, '0');
    $histLista.innerHTML = historico.map(h => {
      const hora = `${p(h.hora.getHours())}:${p(h.hora.getMinutes())}:${p(h.hora.getSeconds())}`;
      const selecionada = selecionadas.has(h.id);
      const check = modoSelecao
        ? `<input type="checkbox" class="scanner-entry-checkbox" ${selecionada ? 'checked' : ''} data-id="${h.id}">`
        : `<span class="scanner-entry-dot"></span>`;
      return `
        <div class="scanner-entry ${h.verde ? 'is-verde' : 'is-vermelho'} ${modoSelecao ? 'is-selectable' : ''} ${selecionada ? 'is-selected' : ''}"
             data-hid="${h.id}">
          ${check}
          <div>
            <div class="scanner-entry-code">${escapar(h.codigo)}</div>
            <div style="font-size:12px;color:var(--cinza);margin-top:2px">${escapar(h.motivo)}</div>
          </div>
          <span class="scanner-entry-time">${hora}</span>
        </div>`;
    }).join('');
  }

  /* Change dos checkboxes — NÃO re-renderiza */
  $histLista.addEventListener('change', (ev) => {
    const cb = ev.target.closest('input[type=checkbox]');
    if (!cb || !modoSelecao) return;
    const id = cb.dataset.id;
    if (cb.checked) selecionadas.add(id); else selecionadas.delete(id);
    const linha = cb.closest('[data-hid]');
    if (linha) linha.classList.toggle('is-selected', cb.checked);
    const n = selecionadas.size;
    $btnEliminarSel.textContent = `Eliminar (${n})`;
    $btnEliminarSel.disabled = n === 0;
    $btnEliminarSel.style.opacity = n === 0 ? '.5' : '1';
  });

  /* Clique na linha — toggle do checkbox */
  $histLista.addEventListener('click', (ev) => {
    if (!modoSelecao) return;
    if (ev.target.tagName === 'INPUT') return;
    const linha = ev.target.closest('[data-hid]');
    if (!linha) return;
    const cb = linha.querySelector('input[type=checkbox]');
    if (!cb) return;
    cb.checked = !cb.checked;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* Botões de controlo */
  $btnSelecionar.addEventListener('click', () => {
    modoSelecao = true; selecionadas.clear(); renderHistorico();
  });
  $btnCancelarSel.addEventListener('click', () => {
    modoSelecao = false; selecionadas.clear(); renderHistorico();
  });
  $btnEliminarSel.addEventListener('click', () => {
    const n = selecionadas.size;
    if (!n) return;
    if (!confirm(`Eliminar ${n} ${n === 1 ? 'entrada' : 'entradas'} do histórico?`)) return;
    historico = historico.filter(h => !selecionadas.has(h.id));
    selecionadas.clear(); modoSelecao = false;
    guardarHistorico(); renderHistorico();
  });
  $btnLimpar.addEventListener('click', () => {
    if (!historico.length) return;
    if (!confirm('Limpar todo o histórico de leituras?\n\nOs contadores também serão reiniciados.')) return;
    historico = []; stats = { total: 0, validos: 0 };
    selecionadas.clear(); modoSelecao = false;
    guardarHistorico(); guardarStats(); atualizarStats(); renderHistorico();
  });

  function atualizarStats() {
    $statTotal.textContent = stats.total;
    $statValidos.textContent = stats.validos;
  }

  /* ---------- BOTÕES PRINCIPAIS ---------- */
  $btnIniciar.addEventListener('click', iniciar);
  $btnParar.addEventListener('click', parar);

  $formManual.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const codigo = $inputManual.value.trim().toUpperCase();
    if (!codigo) return;
    $inputManual.value = '';
    validarCodigo(codigo);
  });

  $('btnSair').addEventListener('click', () => { parar(); Api.logout(); });
  window.addEventListener('beforeunload', parar);

  /* ---------- INFO INICIAL ---------- */
  if (!suportaBarcode) {
    $placeholder.innerHTML = `
      <div>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4M12 16h.01"></path>
        </svg>
        <p><strong>Leitura automática indisponível</strong><br>
        Este navegador não suporta BarcodeDetector.<br>
        Usa a <strong>Entrada manual</strong> abaixo.</p>
      </div>`;
  }

  atualizarStats();
  renderHistorico();

  (async () => {
    try {
      const r = await Api.me();
      $('nomeAdmin').textContent = r.admin?.username || '';
    } catch (_) {}
  })();

})();
