/* ===== TEMAS ===== */
(function () {
  const API_URL = (function () {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
    if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
    if (/^10\./.test(h)) return 'http://' + h + ':3000';
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
    return 'https://yuyu-backend-1b4x.onrender.com';
  })();

  async function carregar() {
    try {
      const res = await fetch(API_URL + '/api/config-publica');
      if (!res.ok) return;
      const d = await res.json();
      if (!d || !d.ok || !d.config) return;

      // Tema ativo definido pelo admin
      let ativo = d.config.tema_ativo || 'vermelho';
      if (typeof ativo !== 'string') ativo = 'vermelho';

      document.documentElement.setAttribute('data-tema', ativo);

      // Cores dinâmicas dos temas (definidas no admin)
      if (d.config.temas && Array.isArray(d.config.temas)) {
        let style = document.getElementById('temas-dinamicos');
        if (!style) {
          style = document.createElement('style');
          style.id = 'temas-dinamicos';
          document.head.appendChild(style);
        }
        style.textContent = d.config.temas.map(function (t) {
          return 'html[data-tema="' + t.id + '"] {\n' +
            '  --cor-primaria: ' + t.primaria + ';\n' +
            '  --cor-escura: ' + t.escura + ';\n' +
            '  --cor-clara: ' + t.clara + ';\n' +
            '  --rgb-primaria: ' + (t.rgb || '220,38,38') + ';\n' +
            '}';
        }).join('\n');
      }
    } catch (e) {
      console.warn('[temas] Falha:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregar);
  } else {
    carregar();
  }
})();
