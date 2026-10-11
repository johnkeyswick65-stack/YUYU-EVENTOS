/* ===== HERO DINÂMICO (lê do backend) ===== */
(function () {
  const API_URL = (function () {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') return 'http://localhost:3000';
    if (/^192\.168\./.test(h)) return 'http://' + h + ':3000';
    if (/^10\./.test(h)) return 'http://' + h + ':3000';
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return 'http://' + h + ':3000';
    return 'https://yuyu-backend-1b4x.onrender.com';
  })();

  async function aplicar() {
    try {
      const res = await fetch(API_URL + '/api/config-publica');
      if (!res.ok) return;
      const d = await res.json();
      if (!d || !d.ok) return;

      const hero = d.config && d.config.hero;
      if (!hero) return;

      /* 1. Imagem de fundo do hero (mantém o gradiente escuro por cima) */
      if (hero.imagem_url) {
        const heroEl = document.querySelector('.hero');
        if (heroEl) {
          heroEl.style.background =
            'linear-gradient(rgba(0, 0, 0, .68), rgba(0, 0, 0, .78)), ' +
            'url("' + hero.imagem_url + '") center center / cover no-repeat';
        }
      }

      /* 2. Label */
      const labelEl = document.querySelector('.hero-label');
      if (labelEl && hero.label) labelEl.textContent = hero.label;

      /* 3. Título — usa <strong> para o destaque */
      const h1El = document.querySelector('.hero h1');
      if (h1El) {
        const t = hero.titulo || 'Seu próximo momento';
        const d2 = hero.titulo_destaque || 'começa aqui.';
        h1El.innerHTML = t + '\n          <strong>' + d2 + '</strong>';
      }

      /* 4. Subtítulo */
      const subEl = document.querySelector('.hero-content > p');
      if (subEl && hero.subtitulo) subEl.textContent = hero.subtitulo;

      /* 5. Botão "Explorar eventos" */
      const botaoEl = document.querySelector('.hero-button');
      if (botaoEl) {
        if (hero.botao_texto) botaoEl.textContent = hero.botao_texto;
        if (hero.botao_link) botaoEl.href = hero.botao_link;
      }

      /* 6. Placeholder da pesquisa */
      const inputEl = document.querySelector('.search-box input, #searchInput, input[type=search]');
      if (inputEl && hero.placeholder_busca) {
        inputEl.placeholder = hero.placeholder_busca;
      }

      /* 7. Temas — aplicar cores dinâmicas */
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
      console.warn('[hero-config] Falha:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }
})();
