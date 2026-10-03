/* ===== VIEWER DE IMAGENS GLOBAL (delegado) ===== */
(function () {
  function garantirViewer() {
    let viewer = document.querySelector('.event-image-viewer');

    if (!viewer) {
      viewer = document.createElement('div');
      viewer.className = 'event-image-viewer';
      viewer.innerHTML = `
        <button type="button" class="event-image-viewer-close" aria-label="Fechar imagem">×</button>
        <img src="" alt="Cartaz do evento">
      `;
      document.body.appendChild(viewer);
    }
    return viewer;
  }

  function abrir(src, alt) {
    const viewer = garantirViewer();
    const img = viewer.querySelector('img');
    img.src = src;
    img.alt = alt || 'Cartaz do evento';
    viewer.classList.add('active');
    document.body.classList.add('image-viewer-open');
  }

  function fechar() {
    const viewer = document.querySelector('.event-image-viewer');
    if (!viewer) return;
    viewer.classList.remove('active');
    document.body.classList.remove('image-viewer-open');
  }

  /* Delegação: apanha cliques em qualquer .event-image img, presente ou futuro */
  document.addEventListener('click', function (ev) {
    const img = ev.target.closest('.event-image img');
    if (!img) return;

    // Ignorar cliques em botões dentro do card (Ver evento, etc.)
    if (ev.target.closest('a, button') && !ev.target.closest('.event-image')) return;

    ev.preventDefault();
    ev.stopPropagation();
    abrir(img.src, img.alt);
  }, true);  // capture: apanha antes de outros handlers

  /* Fechar: clique no viewer (fora da imagem), no ×, ou tecla Esc */
  document.addEventListener('click', function (ev) {
    const viewer = ev.target.closest('.event-image-viewer');
    if (!viewer) return;

    // Clicar no overlay OU no botão × fecha
    if (
      ev.target === viewer ||
      ev.target.classList.contains('event-image-viewer-close')
    ) {
      ev.preventDefault();
      fechar();
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') fechar();
  });

  // Garante que o viewer existe logo ao arrancar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', garantirViewer);
  } else {
    garantirViewer();
  }
})();
