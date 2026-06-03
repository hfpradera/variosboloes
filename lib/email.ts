import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

interface ApostaGrupoEmail {
  para: string
  nomeUsuario: string
  nomeGrupo: string
  primeiro: string
  segundo: string
  terceiro?: string
}

interface ApostaEspeciaisEmail {
  para: string
  nomeUsuario: string
  artilheiro?: string
  craque?: string
  goleiro?: string
  campea?: string
}

// ──────────────────────────────────────────────
// Notificação para o admin a cada aposta salva
// ──────────────────────────────────────────────

interface GrupoApostaAdmin {
  nomeGrupo: string
  primeiro: string
  segundo: string
  terceiro?: string
  atualizado?: boolean  // marca o grupo que acabou de ser salvo
}

interface NotificacaoAdminGrupoEmail {
  nomeUsuario: string
  emailUsuario: string
  grupos: GrupoApostaAdmin[]
  timestamp: string
}

export async function enviarNotificacaoAdminGrupo(dados: NotificacaoAdminGrupoEmail) {
  if (!ADMIN_EMAIL) return
  const { nomeUsuario, emailUsuario, grupos, timestamp } = dados

  const grupoRecemSalvo = grupos.find(g => g.atualizado)

  const linhasGrupos = grupos.map(g => {
    const destaque = g.atualizado ? 'background:#1a3a1a;border-left:3px solid #4ade80;' : ''
    return `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e2235;${destaque}">
        <span style="color:#f5c518;font-size:11px;font-weight:700;">GRUPO ${g.nomeGrupo}${g.atualizado ? ' ✓' : ''}</span>
        <div style="color:#fff;font-size:13px;margin-top:2px;">🥇 ${g.primeiro} · 🥈 ${g.segundo} · 🥉 ${g.terceiro ?? '—'}</div>
      </td>
    </tr>`
  }).join('')

  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: ADMIN_EMAIL,
    subject: `[Bolão] Aposta salva — ${nomeUsuario}${grupoRecemSalvo ? ` · Grupo ${grupoRecemSalvo.nomeGrupo}` : ''}`,
    html: `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#0f1117;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:8px;padding:24px;max-width:600px;">
    <tr><td>
      <p style="margin:0 0 4px;color:#a0a8c0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Aposta de grupos atualizada</p>
      <h2 style="margin:0 0 4px;color:#f5c518;">${nomeUsuario}</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">${emailUsuario} · ${timestamp}</p>
      <p style="margin:0 0 8px;color:#a0a8c0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Estado atual de todos os grupos</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:6px;overflow:hidden;">
        ${linhasGrupos}
      </table>
    </td></tr>
  </table>
</body></html>`.trim(),
  })
}

interface NotificacaoAdminEspeciaisEmail {
  nomeUsuario: string
  emailUsuario: string
  artilheiro?: string
  craque?: string
  goleiro?: string
  campea?: string
  timestamp: string
}

export async function enviarNotificacaoAdminEspeciais(dados: NotificacaoAdminEspeciaisEmail) {
  if (!ADMIN_EMAIL) return
  const { nomeUsuario, emailUsuario, artilheiro, craque, goleiro, campea, timestamp } = dados
  const campos = [
    { label: '⚽ Artilheiro', valor: artilheiro },
    { label: '🌟 Craque', valor: craque },
    { label: '🧤 Goleiro', valor: goleiro },
    { label: '🏆 Campeã', valor: campea },
  ]
  const linhas = campos.map(c =>
    `<tr><td style="padding:4px 0;color:#a0a8c0;font-size:13px;">${c.label}</td><td style="padding:4px 0;color:${c.valor ? '#fff' : '#6b7280'};font-size:13px;text-align:right;">${c.valor ?? '—'}</td></tr>`
  ).join('')
  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: ADMIN_EMAIL,
    subject: `[Bolão] Pré-Copa salvo — ${nomeUsuario}`,
    html: `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#0f1117;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:8px;padding:24px;max-width:600px;">
    <tr><td>
      <p style="margin:0 0 4px;color:#a0a8c0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Apostas Pré-Copa registradas</p>
      <h2 style="margin:0 0 16px;color:#f5c518;">${nomeUsuario} &lt;${emailUsuario}&gt;</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:6px;padding:16px;margin-bottom:16px;">
        ${linhas}
        <tr><td style="padding:4px 0;color:#a0a8c0;font-size:13px;">Horário</td><td style="padding:4px 0;color:#6b7280;font-size:13px;text-align:right;">${timestamp}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim(),
  })
}

// ──────────────────────────────────────────────
// Resumo completo para o usuário (pós-encerramento)
// ──────────────────────────────────────────────

interface ApostaGrupoResumo {
  nomeGrupo: string
  primeiro: string
  segundo: string
  terceiro?: string
}

interface ResumoUsuarioEmail {
  para: string | string[]
  nomeUsuario: string
  grupos: ApostaGrupoResumo[]
  artilheiro?: string
  craque?: string
  goleiro?: string
  campea?: string
  assunto?: string
  mensagemIntro?: string
}

export async function enviarResumoUsuario(dados: ResumoUsuarioEmail) {
  const { para, nomeUsuario, grupos, artilheiro, craque, goleiro, campea } = dados
  const assunto = dados.assunto ?? '📋 Suas apostas — Bolão Copa 2026 (resumo final)'
  const mensagemIntro = dados.mensagemIntro ?? 'As apostas foram encerradas. Este é o registro completo das suas apostas.'

  const linhasGrupos = grupos.map(g => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1e2235;">
        <span style="color:#f5c518;font-weight:700;font-size:12px;">GRUPO ${g.nomeGrupo}</span>
        <div style="margin-top:4px;color:#ffffff;font-size:13px;">
          🥇 ${g.primeiro} · 🥈 ${g.segundo}${g.terceiro ? ` · 🥉 ${g.terceiro}` : ''}
        </div>
      </td>
    </tr>`).join('')

  const especiaisCampos = [
    { label: '⚽ Artilheiro', valor: artilheiro },
    { label: '🌟 Craque', valor: craque },
    { label: '🧤 Melhor Goleiro', valor: goleiro },
    { label: '🏆 Seleção Campeã', valor: campea },
  ].filter(c => c.valor)

  const linhasEspeciais = especiaisCampos.map(c => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1e2235;">
        <span style="color:#f5c518;font-weight:700;font-size:12px;">${c.label}</span>
        <span style="color:#ffffff;font-size:13px;margin-left:8px;">${c.valor}</span>
      </td>
    </tr>`).join('')

  const destinatarios = Array.isArray(para) ? para.filter(Boolean) : para
  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: destinatarios,
    subject: assunto,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b3a,#f5c518);padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Bolão Copa 2026</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Resumo final das suas apostas</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 24px;">Olá, <strong style="color:#ffffff;">${nomeUsuario}</strong>! ${mensagemIntro}</p>

            ${grupos.length > 0 ? `
            <p style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Fase de Grupos</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              ${linhasGrupos}
            </table>` : ''}

            ${especiaisCampos.length > 0 ? `
            <p style="color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Apostas Pré-Copa</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              ${linhasEspeciais}
            </table>` : ''}

            <p style="color:#6b7280;font-size:13px;margin:0;">Boa sorte! Acompanhe o ranking em <a href="${process.env.NEXT_PUBLIC_APP_URL}/ranking" style="color:#f5c518;">bolao.hfpradera.com.br</a>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1e2235;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">Este email foi enviado automaticamente pelo Bolão Copa 2026.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}

export async function enviarConfirmacaoEspeciais(dados: ApostaEspeciaisEmail) {
  const { para, nomeUsuario, artilheiro, craque, goleiro, campea } = dados

  const campos = [
    { label: '⚽ Artilheiro da Copa', valor: artilheiro },
    { label: '🌟 Craque da Copa', valor: craque },
    { label: '🧤 Melhor Goleiro', valor: goleiro },
    { label: '🏆 Seleção Campeã', valor: campea },
  ].filter(c => c.valor)

  const linhas = campos.map(c => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #1e2235;">
        <span style="color:#f5c518;font-weight:700;font-size:13px;">${c.label}</span>
        <span style="color:#ffffff;font-size:15px;margin-left:12px;">${c.valor}</span>
      </td>
    </tr>`).join('')

  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: para,
    subject: '✅ Apostas Pré-Copa salvas',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b3a,#f5c518);padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Bolão Copa 2026</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">EUA · Canadá · México</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 8px;">Olá, <strong style="color:#ffffff;">${nomeUsuario}</strong>!</p>
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 24px;">Suas apostas <strong style="color:#f5c518;">Pré-Copa</strong> foram registradas com sucesso.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#1e2235;">
                <td style="padding:12px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Suas apostas</td>
              </tr>
              ${linhas}
            </table>
            <p style="color:#6b7280;font-size:13px;margin:0;">Você pode alterar suas apostas até <strong style="color:#f5c518;">10/06/2026 às 23h59</strong>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1e2235;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">Este email foi enviado automaticamente pelo Bolão Copa 2026.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}

export async function enviarConfirmacaoGrupo(dados: ApostaGrupoEmail) {
  const { para, nomeUsuario, nomeGrupo, primeiro, segundo, terceiro } = dados

  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: para,
    subject: `✅ Aposta salva — Grupo ${nomeGrupo}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b3a,#f5c518);padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Bolão Copa 2026</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">EUA · Canadá · México</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 8px;">Olá, <strong style="color:#ffffff;">${nomeUsuario}</strong>!</p>
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 24px;">Sua aposta para o <strong style="color:#f5c518;">Grupo ${nomeGrupo}</strong> foi registrada com sucesso.</p>

            <!-- Aposta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#1e2235;">
                <td style="padding:12px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Sua aposta</td>
              </tr>
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #1e2235;">
                  <span style="color:#f5c518;font-weight:700;font-size:13px;">🥇 1º lugar</span>
                  <span style="color:#ffffff;font-size:15px;margin-left:12px;">${primeiro}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #1e2235;">
                  <span style="color:#a0a8c0;font-weight:700;font-size:13px;">🥈 2º lugar</span>
                  <span style="color:#ffffff;font-size:15px;margin-left:12px;">${segundo}</span>
                </td>
              </tr>
              ${terceiro ? `
              <tr>
                <td style="padding:14px 16px;">
                  <span style="color:#a0a8c0;font-weight:700;font-size:13px;">🥉 3º lugar</span>
                  <span style="color:#ffffff;font-size:15px;margin-left:12px;">${terceiro}</span>
                </td>
              </tr>` : ''}
            </table>

            <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">Você pode alterar sua aposta a qualquer momento antes de <strong style="color:#f5c518;">10/06/2026 às 23h59</strong>.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1e2235;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">Este email foi enviado automaticamente pelo Bolão Copa 2026.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  })
}

// ──────────────────────────────────────────────
// Resumo de apostas do mata-mata para o usuário
// ──────────────────────────────────────────────

interface ConfrontoResumo {
  posicao: number
  selecaoA: string
  selecaoB: string
  apostou?: string
  placarA?: number | null
  placarB?: number | null
}

interface ResumoFaseEmail {
  para: string | string[]
  nomeUsuario: string
  nomeFase: string      // ex: 'Oitavas de Final'
  confrontos: ConfrontoResumo[]
}

// ──────────────────────────────────────────────
// Novo cadastro — notificação para o admin
// ──────────────────────────────────────────────

export async function enviarNotificacaoNovoCadastro(dados: { nomeUsuario: string; emailUsuario: string; timestamp: string }) {
  if (!ADMIN_EMAIL) return
  const { nomeUsuario, emailUsuario, timestamp } = dados
  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: ADMIN_EMAIL,
    subject: `[Bolão] Novo cadastro — ${nomeUsuario}`,
    html: `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#0f1117;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:8px;padding:24px;max-width:600px;">
    <tr><td>
      <p style="margin:0 0 4px;color:#a0a8c0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">⚽ Novo participante</p>
      <h2 style="margin:0 0 16px;color:#f5c518;">Novo cadastro no Bolão</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:6px;padding:16px;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#a0a8c0;font-size:13px;">Nome</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${nomeUsuario}</td></tr>
        <tr><td style="padding:4px 0;color:#a0a8c0;font-size:13px;">E-mail</td><td style="padding:4px 0;color:#fff;font-size:13px;text-align:right;">${emailUsuario}</td></tr>
        <tr><td style="padding:4px 0;color:#a0a8c0;font-size:13px;">Horário</td><td style="padding:4px 0;color:#6b7280;font-size:13px;text-align:right;">${timestamp}</td></tr>
      </table>
      <p style="margin:0;color:#a0a8c0;font-size:13px;">
        Acesse o painel de administração para aprovar ou rejeitar este participante.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/usuarios" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1a6b3a;color:#fff;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">
        Ir para Usuários →
      </a>
    </td></tr>
  </table>
</body></html>`.trim(),
  })
}

// ──────────────────────────────────────────────
// Aprovação — notificação para o usuário
// ──────────────────────────────────────────────

export async function enviarAprovacaoUsuario(dados: { para: string; nomeUsuario: string }) {
  const { para, nomeUsuario } = dados
  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: para,
    subject: '✅ Participação aprovada — Bolão Copa 2026',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b3a,#f5c518);padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Bolão Copa 2026</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Você foi aprovado!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 16px;">Olá, <strong style="color:#ffffff;">${nomeUsuario}</strong>!</p>
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 24px;">
              Sua participação no <strong style="color:#f5c518;">Bolão Copa do Mundo 2026</strong> foi aprovada pelo administrador. Agora você já pode acessar o site e fazer suas apostas!
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:14px 28px;background:#1a6b3a;color:#fff;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
              Acessar o Bolão →
            </a>
            <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Lembre-se de confirmar o pagamento com o administrador para que suas apostas sejam computadas.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1e2235;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">Este email foi enviado automaticamente pelo Bolão Copa 2026.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}

// ──────────────────────────────────────────────
// Reset de senha
// ──────────────────────────────────────────────

export async function enviarResetSenha(dados: { para: string; link: string }) {
  const { para, link } = dados
  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: para,
    subject: '🔑 Redefinição de senha — Bolão Copa 2026',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b3a,#f5c518);padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Bolão Copa 2026</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Redefinição de senha</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 16px;">Recebemos uma solicitação para redefinir sua senha.</p>
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 24px;">Clique no botão abaixo para escolher uma nova senha. O link expira em 1 hora.</p>
            <a href="${link}" style="display:inline-block;padding:14px 28px;background:#1a6b3a;color:#fff;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">
              Redefinir senha →
            </a>
            <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Se você não solicitou isso, ignore este e-mail com segurança.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1e2235;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">Este email foi enviado automaticamente pelo Bolão Copa 2026.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}

// ──────────────────────────────────────────────
// Relato de erro enviado pelo apostador
// ──────────────────────────────────────────────

interface RelatoErroEmail {
  nomeUsuario: string
  emailUsuario: string
  mensagem: string
  timestamp: string
}

export async function enviarRelatoErro(dados: RelatoErroEmail) {
  if (!ADMIN_EMAIL) return
  const { nomeUsuario, emailUsuario, mensagem, timestamp } = dados
  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: ADMIN_EMAIL,
    subject: `[Bolão] Relato de problema — ${nomeUsuario}`,
    html: `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#0f1117;font-family:Arial,sans-serif;color:#ffffff;">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:8px;padding:24px;max-width:600px;">
    <tr><td>
      <p style="margin:0 0 4px;color:#f87171;font-size:12px;text-transform:uppercase;letter-spacing:1px;">⚠ Relato de problema</p>
      <h2 style="margin:0 0 4px;color:#f5c518;">${nomeUsuario}</h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">${emailUsuario} · ${timestamp}</p>
      <div style="background:#0f1117;border-radius:6px;padding:16px;margin-bottom:16px;border-left:3px solid #f87171;">
        <p style="margin:0;color:#ffffff;font-size:14px;white-space:pre-wrap;">${mensagem.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
    </td></tr>
  </table>
</body></html>`.trim(),
  })
}

export async function enviarResumoFase(dados: ResumoFaseEmail) {
  const { nomeUsuario, nomeFase, confrontos } = dados
  const destinatarios = Array.isArray(dados.para) ? dados.para.filter(Boolean) : dados.para

  const linhas = confrontos.map(c => {
    const apostou = c.apostou
      ? `<span style="color:#f5c518;font-weight:700;">${c.apostou}</span>${
          c.placarA != null && c.placarB != null
            ? ` <span style="color:#6b7280;font-size:12px;">(${c.placarA}×${c.placarB})</span>`
            : ''
        }`
      : `<span style="color:#6b7280;font-style:italic;">Não apostou</span>`

    return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1e2235;">
        <div style="color:#a0a8c0;font-size:12px;margin-bottom:4px;">Jogo ${c.posicao}</div>
        <div style="color:#ffffff;font-size:14px;">${c.selecaoA} <span style="color:#6b7280;">×</span> ${c.selecaoB}</div>
        <div style="margin-top:4px;font-size:13px;">Apostou: ${apostou}</div>
      </td>
    </tr>`
  }).join('')

  await resend.emails.send({
    from: 'Bolão Copa 2026 <bolao@hfpradera.com.br>',
    to: destinatarios,
    subject: `📋 Suas apostas — ${nomeFase} (Bolão Copa 2026)`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b3a,#f5c518);padding:32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">🛡️</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">Bolão Copa 2026</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${nomeFase} — apostas encerradas</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 8px;">Olá, <strong style="color:#ffffff;">${nomeUsuario}</strong>!</p>
            <p style="color:#a0a8c0;font-size:15px;margin:0 0 24px;">As apostas da fase <strong style="color:#f5c518;">${nomeFase}</strong> foram encerradas. Confira o que você apostou:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#1e2235;">
                <td style="padding:12px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Suas apostas</td>
              </tr>
              ${linhas}
            </table>
            <p style="color:#6b7280;font-size:13px;margin:0;">Acompanhe o ranking em <a href="${process.env.NEXT_PUBLIC_APP_URL}/ranking" style="color:#f5c518;">bolao.hfpradera.com.br</a>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1e2235;text-align:center;">
            <p style="color:#6b7280;font-size:12px;margin:0;">Este email foi enviado automaticamente pelo Bolão Copa 2026.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  })
}
