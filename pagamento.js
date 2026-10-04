/* ===== SUBJANELA DE PAGAMENTO ===== */
document.addEventListener("DOMContentLoaded", () => {
  const openPayment = document.getElementById("openPayment");
  const paymentPage = document.getElementById("paymentPage");
  const paymentBack = document.getElementById("paymentBack");
  const paymentAmount = document.getElementById("paymentAmount");
  const tiers = document.querySelectorAll(".payment-tier");
  const copies = document.querySelectorAll(".payment-copy");
  const paymentFile = document.getElementById("paymentFile");
  const paymentPreview = document.getElementById("paymentPreview");
  const paymentPreviewImg = document.getElementById("paymentPreviewImg");
  const paymentPreviewName = document.getElementById("paymentPreviewName");
  const paymentRemove = document.getElementById("paymentRemove");
  const paymentSend = document.getElementById("paymentSend");
  const paymentMessage = document.getElementById("paymentMessage");
  const paymentPlus = document.getElementById("paymentPlus");
  const paymentPreviewFile = document.getElementById("paymentPreviewFile");

  if (!openPayment || !paymentPage) return;

  let arquivo = null;
  let tierAtual = "VIP";
  let precoAtual = "250";

  function atualizarPrecos() {
    var ev = window.__eventoAtual;
    if (!ev) return;

    // Título e subtítulo da subjanela
    var titulo = document.querySelector('.payment-title');
    var subtitulo = document.querySelector('.payment-subtitle');
    var headerSmall = document.querySelector('.payment-header-info small');
    if (titulo) titulo.textContent = ev.nome || 'Evento';
    if (headerSmall) headerSmall.textContent = ev.nome || 'Evento';
    if (subtitulo) {
      var d = new Date(ev.data_evento);
      var meses = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      subtitulo.textContent = d.getUTCDate() + ' de ' + meses[d.getUTCMonth()] + ' de ' + d.getUTCFullYear() + ' · ' + (ev.local || '');
    }

    // Botoes Normal / VIP
    var tiers = document.querySelectorAll('.payment-tier');
    if (tiers.length >= 2) {
      tiers[0].dataset.price = String(ev.preco_normal || 0);
      tiers[0].querySelector('.payment-tier-price').textContent = (ev.preco_normal || 0) + ' MT';
      tiers[1].dataset.price = String(ev.preco_vip || 0);
      tiers[1].querySelector('.payment-tier-price').textContent = (ev.preco_vip || 0) + ' MT';

      // O tier activo por defeito passa a ser o VIP (indice 1)
      tiers.forEach(function (t) { t.classList.remove('is-active'); });
      tiers[1].classList.add('is-active');
      precoAtual = String(ev.preco_vip || 0);
      if (paymentAmount) paymentAmount.textContent = precoAtual + ' MT';
    }
  }

  function abrirPagamento() {
    atualizarPrecos();
    document.body.classList.add("pagamento-aberto");
    paymentPage.setAttribute("aria-hidden", "false");
  }

  function fecharPagamento() {
    document.body.classList.remove("pagamento-aberto");
    paymentPage.setAttribute("aria-hidden", "true");
  }

  openPayment.addEventListener("click", abrirPagamento);
  paymentBack.addEventListener("click", fecharPagamento);

  /* Trocar tier */
  tiers.forEach(botao => {
    botao.addEventListener("click", () => {
      tiers.forEach(b => b.classList.remove("is-active"));
      botao.classList.add("is-active");
      tierAtual = botao.dataset.tier;
      precoAtual = botao.dataset.price;
      paymentAmount.textContent = precoAtual + " MT";
    });
  });

  /* Copiar (número, titular) */
  copies.forEach(botao => {
    botao.addEventListener("click", async () => {
      const valor = botao.dataset.copy;
      try {
        await navigator.clipboard.writeText(valor);
      } catch (e) {
        const tmp = document.createElement("textarea");
        tmp.value = valor;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
      }
      botao.classList.add("is-copied");
      setTimeout(() => botao.classList.remove("is-copied"), 1200);
    });
  });

  /* Anexar comprovativo */
  paymentPlus?.addEventListener("click", () => paymentFile.click());

  paymentFile.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    arquivo = file;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        paymentPreviewImg.src = ev.target.result;
        paymentPreviewImg.hidden = false;
        if (paymentPreviewFile) paymentPreviewFile.hidden = true;
      };
      reader.readAsDataURL(file);
    } else {
      paymentPreviewImg.hidden = true;
      if (paymentPreviewFile) {
        paymentPreviewFile.hidden = false;
        if (paymentPreviewName) paymentPreviewName.textContent = file.name;
      }
    }

    paymentPreview.hidden = false;
  });

  /* Remover anexo */
  paymentRemove.addEventListener("click", () => {
    arquivo = null;
    paymentFile.value = "";
    paymentPreview.hidden = true;
    paymentPreviewImg.src = "";
    paymentPreviewImg.hidden = false;
    if (paymentPreviewFile) paymentPreviewFile.hidden = true;
    if (paymentPreviewName) paymentPreviewName.textContent = "";
  });

  /* Enviar pelo WhatsApp */
  paymentSend.addEventListener("click", async () => {
    const mensagemCliente = (paymentMessage?.value || "").trim();

    let texto =
      "Olá! Fiz o pagamento do bilhete *" + tierAtual + "* para o evento *Sabor do Verão* (16/10/2026).\n\n" +
      "Valor: *" + precoAtual + " MT*";

    if (mensagemCliente) {
      texto += "\n\nMensagem: " + mensagemCliente;
    }

    texto += "\n\nSegue o comprovativo em anexo.";

    /* 1) Se tem arquivo e o browser aceita partilhar arquivos (Android) */
    if (arquivo && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      try {
        await navigator.share({
          files: [arquivo],
          title: "Comprovativo — Sabor do Verão",
          text: texto
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
        /* se falhar, cai para o fallback abaixo */
      }
    }

    /* 2) Fallback: abre o WhatsApp com mensagem pré-preenchida */
    const url = "https://wa.me/258856178099?text=" + encodeURIComponent(texto);
    window.open(url, "_blank");
  });
});
