/* ===== CONTAGEM REGRESSIVA DOS EVENTOS ===== */
function iniciarContagensRegressivas() {
  const contadores = document.querySelectorAll(".event-countdown");

  function atualizar() {
    const agora = new Date();

    contadores.forEach(contador => {
      const dataEvento = new Date(contador.dataset.date);
      const numero = contador.querySelector(".countdown-number");

      if (!numero || Number.isNaN(dataEvento.getTime())) return;

      const diferenca = dataEvento - agora;

      if (diferenca <= 0) {
        numero.textContent = "0";
        return;
      }

      const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24));
      numero.textContent = dias;
    });
  }

  atualizar();
  setInterval(atualizar, 60000);
}

document.addEventListener("DOMContentLoaded", iniciarContagensRegressivas);
window.iniciarContagensRegressivas = iniciarContagensRegressivas;
