/* ===== NAV — adapta "Entrar" ao estado do cliente ===== */
(function () {
  function ajustar() {
    const temSessao = !!localStorage.getItem('yuyu_cliente_token');
    document.querySelectorAll('a[href="meus-bilhetes.html"]').forEach(function (a) {
      var texto = (a.textContent || '').trim().toLowerCase();
      if (texto === 'entrar' || texto === 'meus bilhetes') {
        a.textContent = temSessao ? 'Meus bilhetes' : 'Entrar';
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ajustar);
  } else {
    ajustar();
  }
})();
