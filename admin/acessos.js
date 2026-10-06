/* ===== ACESSOS — monitorizacao e bloqueio ===== */
(function () {
  if (!Api.getToken()) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);
  let filtroAtual = 'todos';

  function escapar(t) {
    return String(t ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatarData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth()+1)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  async function carregarResumo() {
    try {
      const r = await Api.get('/api/admin/acessos/resumo');

      // IPs activos
      const ips = r.ips_activos || [];
      if (!ips.length) {
        $('listaIPs').innerHTML = '<div class="dash-vazio">Sem acessos nas últimas 24h.</div>';
      } else {
        $('listaIPs').innerHTML = ips.map(ip => {
          const suspeito = ip.erros > 3 || ip.total > 200;
          return `
            <div class="acc-ip ${suspeito ? 'is-suspeito' : ''}">
              <div class="acc-ip-info">
                <code class="acc-ip-num">${escapar(ip.ip)}</code>
                ${suspeito ? '<span class="acc-badge">Suspeito</span>' : ''}
              </div>
              <div class="acc-ip-stats">
                <span><strong>${ip.total}</strong> pedidos</span>
                <span><strong>${ip.erros}</strong> erros</span>
                <span>${ip.rotas_distintas} rotas</span>
                <span class="acc-ip-tempo">${formatarData(ip.ultimo_acesso)}</span>
              </div>
              <div class="acc-ip-acoes">
                <button type="button" class="admin-btn admin-btn-delete" data-bloquear="${escapar(ip.ip)}">Bloquear</button>
              </div>
            </div>
          `;
        }).join('');
      }

      // Bloqueados
      const bloq = r.bloqueados || [];
      if (!bloq.length) {
        $('listaBloqueados').innerHTML = '<div class="dash-vazio">Nenhum IP bloqueado.</div>';
      } else {
        $('listaBloqueados').innerHTML = bloq.map(b => `
          <div class="acc-ip is-bloqueado">
            <div class="acc-ip-info">
              <code class="acc-ip-num">${escapar(b.ip)}</code>
              <span class="acc-badge is-vermelho">Bloqueado</span>
            </div>
            <div class="acc-ip-stats">
              <span>${escapar(b.motivo || 'Sem motivo')}</span>
              ${b.admin_username ? `<span>por <strong>${escapar(b.admin_username)}</strong></span>` : ''}
              ${b.expira_em ? `<span>até ${formatarData(b.expira_em)}</span>` : '<span>permanente</span>'}
            </div>
            <div class="acc-ip-acoes">
              <button type="button" class="admin-btn" data-desbloquear="${escapar(b.ip)}">Desbloquear</button>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      $('listaIPs').innerHTML = `<div class="dash-vazio" style="color:#fca5a5">Erro: ${escapar(e.message)}</div>`;
    }
  }

  async function carregarAcessos() {
    try {
      const url = filtroAtual === 'suspeitos'
        ? '/api/admin/acessos?limit=100&suspeitos=1'
        : '/api/admin/acessos?limit=100';
      const r = await Api.get(url);
      const lista = r.acessos || [];

      if (!lista.length) {
        $('listaAcessos').innerHTML = '<div class="dash-vazio">Sem acessos.</div>';
        return;
      }

      $('listaAcessos').innerHTML = `
        <div class="acc-tabela">
          ${lista.map(a => {
            const erro = a.status >= 400;
            return `
              <div class="acc-linha ${erro ? 'is-erro' : ''}">
                <span class="acc-hora">${formatarData(a.criado_em)}</span>
                <code class="acc-ip-num-sm">${escapar(a.ip)}</code>
                <span class="acc-metodo is-${a.metodo}">${a.metodo}</span>
                <span class="acc-rota">${escapar(a.rota)}</span>
                <span class="acc-status is-${erro ? 'erro' : 'ok'}">${a.status}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (e) {
      $('listaAcessos').innerHTML = `<div class="dash-vazio" style="color:#fca5a5">Erro: ${escapar(e.message)}</div>`;
    }
  }

  // Bloquear
  document.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-bloquear]');
    if (b) {
      const ip = b.dataset.bloquear;
      const motivo = prompt('Motivo do bloqueio para ' + ip + ':', 'Acesso suspeito');
      if (motivo === null) return;
      const horasStr = prompt('Duração em horas (0 = permanente):', '24');
      if (horasStr === null) return;
      const horas = parseInt(horasStr, 10) || 0;

      try {
        await Api.post('/api/admin/bloquear', { ip, motivo, horas });
        await carregarResumo();
      } catch (e) {
        alert('Erro: ' + e.message);
      }
      return;
    }

    const d = ev.target.closest('[data-desbloquear]');
    if (d) {
      const ip = d.dataset.desbloquear;
      if (!confirm('Desbloquear o IP ' + ip + '?')) return;
      try {
        await Api.del('/api/admin/desbloquear/' + encodeURIComponent(ip));
        await carregarResumo();
      } catch (e) {
        alert('Erro: ' + e.message);
      }
    }
  });

  // Filtros
  document.querySelectorAll('[data-filtro]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-filtro]').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      filtroAtual = b.dataset.filtro;
      carregarAcessos();
    });
  });

  // Atualizar
  $('btnAtualizar').addEventListener('click', () => {
    carregarResumo();
    carregarAcessos();
  });

  // Sair
  $('btnSair').addEventListener('click', () => Api.logout());

  // Arranque
  (async () => {
    try {
      const r = await Api.me();
      $('nomeAdmin').textContent = r.admin ? r.admin.username : '';
    } catch (_) {}
    $('loading').style.display = 'none';
    $('conteudo').style.display = 'block';
    carregarResumo();
    carregarAcessos();
  })();
})();
