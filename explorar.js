/* ===== FILTROS DA PÁGINA EXPLORAR EVENTOS ===== */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("exploreInput");
  const chips = document.querySelectorAll(".explore-chip");
  const cards = document.querySelectorAll(".event-card");
  const count = document.getElementById("exploreCount");
  const grid = document.getElementById("eventsGrid");

  if (!input || !cards.length) return;

  let filtroAtual = "todos";
  let buscaAtual = "";

  // Lê ?categoria=... da URL (vem da index)
  const params = new URLSearchParams(window.location.search);
  const categoriaURL = params.get("categoria");
  if (categoriaURL) {
    filtroAtual = categoriaURL;
    chips.forEach(c => {
      c.classList.toggle("is-active", c.dataset.filter === categoriaURL);
    });
  }

  function aplicar() {
    let visiveis = 0;

    cards.forEach(card => {
      const categoria = card.dataset.category || "outros";
      const texto = (
        (card.dataset.name || "") + " " +
        (card.dataset.location || "") + " " +
        (card.querySelector(".event-info")?.textContent || "")
      ).toLowerCase();

      const passaFiltro = filtroAtual === "todos" || categoria === filtroAtual;
      const passaBusca = !buscaAtual || texto.includes(buscaAtual);

      if (passaFiltro && passaBusca) {
        card.style.display = "";
        visiveis++;
      } else {
        card.style.display = "none";
      }
    });

    if (count) count.textContent = visiveis;

    // Estado vazio
    let empty = document.querySelector(".explore-empty");
    if (visiveis === 0) {
      if (!empty && grid) {
        empty = document.createElement("div");
        empty.className = "explore-empty";
        empty.innerHTML = "<strong>Nenhum evento encontrado</strong>Tente outra pesquisa ou categoria.";
        grid.parentNode.insertBefore(empty, grid.nextSibling);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      filtroAtual = chip.dataset.filter;
      aplicar();
    });
  });

  input.addEventListener("input", () => {
    buscaAtual = input.value.trim().toLowerCase();
    aplicar();
  });

  // Aplica já se veio categoria da URL
  if (categoriaURL) aplicar();
});
