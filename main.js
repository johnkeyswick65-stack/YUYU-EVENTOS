const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");

    const aberto = mobileMenu.classList.contains("open");
    menuToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  });

  mobileMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      menuToggle.setAttribute("aria-label", "Abrir menu");
    });
  });
}

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

if (searchForm && searchInput) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const termo = searchInput.value.trim();

    if (!termo) {
      window.location.href = "eventos.html";
      return;
    }

    window.location.href =
      `eventos.html?busca=${encodeURIComponent(termo)}`;
  });
}

/* Hora e região pelo fuso horário */
const heroTime = document.getElementById("heroTime");
const heroPlace = document.getElementById("heroPlace");

function atualizarHora() {
  if (!heroTime) return;

  const agora = new Date();

  heroTime.textContent = agora.toLocaleTimeString("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function obterRegiaoPorFuso() {
  if (!heroPlace) return;

  const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const regioes = {
    "Africa/Maputo": "Moçambique",
    "Africa/Johannesburg": "África Austral",
    "Africa/Harare": "África Austral",
    "Africa/Lusaka": "África Austral",
    "Africa/Blantyre": "África Austral",
    "Africa/Nairobi": "África Oriental",
    "Africa/Dar_es_Salaam": "África Oriental",
    "Africa/Lagos": "África Ocidental",
    "Africa/Accra": "África Ocidental",
    "Europe/Lisbon": "Portugal",
    "America/Sao_Paulo": "Brasil"
  };

  heroPlace.textContent =
    regioes[fuso] || fuso.replace(/_/g, " ").replace("/", " — ");
}

atualizarHora();
setInterval(atualizarHora, 1000);
obterRegiaoPorFuso();


/* ===== MODAL DE DETALHES DO EVENTO ===== */

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".event-card");
  if (document.getElementById("eventsPage")) return;

  if (!cards.length) return;

  const modal = document.createElement("div");
  modal.className = "event-modal";
  modal.innerHTML = `
    <div class="event-modal-overlay"></div>

    <div class="event-modal-box" role="dialog" aria-modal="true">
      <button type="button" class="event-modal-close" aria-label="Fechar">×</button>

      <div class="event-modal-image">
        <img src="" alt="">
      </div>

      <div class="event-modal-content">
        <span class="event-modal-category"></span>
        <h2></h2>
        <p class="event-modal-meta"></p>
        <p class="event-modal-description"></p>

        <div class="event-modal-bottom">
          <strong></strong>
          <a href="eventos.html" class="event-modal-link">Ver evento</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const modalImage = modal.querySelector(".event-modal-image img");
  const modalCategory = modal.querySelector(".event-modal-category");
  const modalTitle = modal.querySelector("h2");
  const modalMeta = modal.querySelector(".event-modal-meta");
  const modalDescription = modal.querySelector(".event-modal-description");
  const modalPrice = modal.querySelector(".event-modal-bottom strong");

  function abrirModal(card) {
    const botao = card.querySelector(".event-description-more");

    const corCartaz = botao
      ? getComputedStyle(botao)
          .getPropertyValue("--poster-color")
          .trim()
      : "";

    if (corCartaz) {
      modal.style.setProperty("--poster-color", corCartaz);
    }

    const imagem = card.querySelector(".event-image img");
    const categoria = card.querySelector(".event-category");
    const titulo = card.querySelector("h3");
    const meta = card.querySelector(".event-meta");
    const descricao = card.querySelector(".event-description");
    const preco = card.querySelector(".event-bottom strong");

    modalImage.src = imagem ? imagem.src : "";
    modalImage.alt = titulo
      ? titulo.textContent.trim()
      : "Imagem do evento";

    modalCategory.textContent = categoria
      ? categoria.textContent.trim()
      : "";

    modalTitle.textContent = titulo
      ? titulo.textContent.trim()
      : "";

    modalMeta.textContent = meta
      ? meta.textContent.trim()
      : "";

    modalDescription.textContent = descricao
      ? descricao.textContent.trim()
      : "";

    modalPrice.textContent = preco
      ? preco.textContent.trim()
      : "";

    modal.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function fecharModal() {
    modal.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  cards.forEach(card => {
    let botao = card.querySelector(".event-description-more");

    if (!botao) {
      botao = document.createElement("button");
      botao.className = "event-description-more";
      botao.type = "button";
      botao.textContent = "Ver mais";

      const bottom = card.querySelector(".event-bottom");

      if (bottom) {
        card.querySelector(".event-info").insertBefore(
          botao,
          bottom
        );
      }
    }

    /*
     * Impede completamente qualquer navegação.
     * O botão apenas abre o modal.
     */
    botao.type = "button";

    botao.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      abrirModal(card);
    });
  });

  modal.querySelector(".event-modal-close")
    .addEventListener("click", fecharModal);

  modal.querySelector(".event-modal-overlay")
    .addEventListener("click", fecharModal);

  /* ===== ABRIR CARTAZ EM TAMANHO GRANDE ===== */

  const visualizador = document.createElement("div");
  visualizador.className = "event-image-viewer";
  visualizador.innerHTML = `
    <button type="button" class="event-image-viewer-close"
      aria-label="Fechar imagem">×</button>
    <img src="" alt="Cartaz do evento">
  `;

  document.body.appendChild(visualizador);

  const visualizadorImg =
    visualizador.querySelector("img");

  function abrirImagemGrande() {
    if (!modalImage.src) return;

    visualizadorImg.src = modalImage.src;
    visualizadorImg.alt = modalImage.alt || "Cartaz do evento";

    visualizador.classList.add("active");
    document.body.classList.add("image-viewer-open");
  }

  function fecharImagemGrande() {
    visualizador.classList.remove("active");
    document.body.classList.remove("image-viewer-open");
  }

  modalImage.style.cursor = "zoom-in";

  modalImage.addEventListener(
    "click",
    abrirImagemGrande
  );

  visualizador.addEventListener("click", event => {
    if (
      event.target === visualizador ||
      event.target === visualizadorImg
    ) {
      fecharImagemGrande();
    }
  });

  visualizador
    .querySelector(".event-image-viewer-close")
    .addEventListener("click", fecharImagemGrande);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      fecharImagemGrande();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      fecharModal();
    }
  });
});


/* ===== COR AUTOMÁTICA DO BOTÃO "VER MAIS" ===== */

function aplicarCorDoCartaz(card) {
  const imagem = card.querySelector(".event-image img");
  const botao = card.querySelector(".event-description-more");

  if (!imagem || !botao) return;

  function analisarImagem() {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const largura = 40;
      const altura = 40;

      canvas.width = largura;
      canvas.height = altura;

      ctx.drawImage(imagem, 0, 0, largura, altura);

      const dados = ctx.getImageData(
        0,
        0,
        largura,
        altura
      ).data;

      let vermelho = 0;
      let verde = 0;
      let azul = 0;
      let total = 0;

      for (let i = 0; i < dados.length; i += 4) {
        const r = dados[i];
        const g = dados[i + 1];
        const b = dados[i + 2];

        /* Ignora pixels muito escuros */
        if (r + g + b < 45) continue;

        vermelho += r;
        verde += g;
        azul += b;
        total++;
      }

      if (!total) return;

      vermelho = Math.round(vermelho / total);
      verde = Math.round(verde / total);
      azul = Math.round(azul / total);

      /*
       * Deixa a cor um pouco mais viva para o botão
       */
      const maior = Math.max(vermelho, verde, azul);

      if (maior < 120) {
        const fator = 1.35;

        vermelho = Math.min(255, Math.round(vermelho * fator));
        verde = Math.min(255, Math.round(verde * fator));
        azul = Math.min(255, Math.round(azul * fator));
      }

      const cor = `rgb(${vermelho}, ${verde}, ${azul})`;

      botao.style.setProperty("--poster-color", cor);

      botao.style.background =
        `linear-gradient(135deg,
          rgba(${vermelho}, ${verde}, ${azul}, .95),
          rgba(${vermelho}, ${verde}, ${azul}, .68)
        )`;

      botao.style.borderColor =
        `rgba(${vermelho}, ${verde}, ${azul}, 1)`;

      botao.style.boxShadow =
        `0 4px 14px rgba(${vermelho}, ${verde}, ${azul}, .22)`;

    } catch (erro) {
      console.warn(
        "Não foi possível extrair a cor do cartaz:",
        erro
      );
    }
  }

  if (imagem.complete && imagem.naturalWidth) {
    analisarImagem();
  } else {
    imagem.addEventListener(
      "load",
      analisarImagem,
      { once: true }
    );
  }
}


/* Aplicar a cada cartão */
document.querySelectorAll(".event-card").forEach(card => {
  aplicarCorDoCartaz(card);
});


/* ===== CARTAZ DO CARTÃO PRINCIPAL ===== */

document.addEventListener("DOMContentLoaded", () => {
  const imagens = document.querySelectorAll(
    ".event-card .event-image img"
  );

  const viewer = document.querySelector(".event-image-viewer");

  if (!viewer) return;

  const viewerImg = viewer.querySelector("img");

  imagens.forEach(img => {
    img.style.cursor = "zoom-in";

    img.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      viewerImg.src = img.src;
      viewerImg.alt = img.alt || "Cartaz do evento";

      viewer.classList.add("active");
      document.body.classList.add("image-viewer-open");
    });
  });
});


/* ===== PLACEHOLDER DINÂMICO DA PESQUISA ===== */

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchInput");

  if (!input) return;

  const frases = [
    "Pesquisar eventos...",
    "Encontrar eventos em Xai-Xai...",
    "O que acontece hoje?",
    "Descubra o seu próximo evento..."
  ];

  let indice = 0;

  setInterval(() => {
    if (document.activeElement === input || input.value.trim()) return;

    input.style.opacity = "0";

    setTimeout(() => {
      indice = (indice + 1) % frases.length;
      input.placeholder = frases[indice];
      input.style.opacity = "1";
    }, 180);

  }, 3000);
});


/* ===== CHAT WHATSAPP YUYU EVENTOS ===== */
document.addEventListener("DOMContentLoaded", () => {
  const whatsappButton = document.querySelector(".floating-message");
  const whatsappChat = document.getElementById("whatsappChat");
  const closeWhatsappChat = document.getElementById("closeWhatsappChat");
  const sendWhatsappMessage = document.getElementById("sendWhatsappMessage");
  const whatsappMessage = document.getElementById("whatsappMessage");

  if (!whatsappButton || !whatsappChat) return;

  whatsappButton.addEventListener("click", () => {
    whatsappChat.classList.add("open");
    whatsappChat.setAttribute("aria-hidden", "false");
    setTimeout(() => whatsappMessage?.focus(), 150);
  });

  closeWhatsappChat?.addEventListener("click", () => {
    whatsappChat.classList.remove("open");
    whatsappChat.setAttribute("aria-hidden", "true");
  });

  sendWhatsappMessage?.addEventListener("click", () => {
    const mensagem = whatsappMessage.value.trim();

    if (!mensagem) {
      whatsappMessage.focus();
      return;
    }

    const numero = "258856178099";
    const texto = `Olá! Vim pelo YUYU EVENTOS.\n\n${mensagem}`;

    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`,
      "_blank"
    );
  });
});


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

