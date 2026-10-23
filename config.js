/* Configurações do ito
 *
 * TURN: repassa a conexão quando o caminho direto falha (comum no 4G/5G
 * e em VPN). Os dados continuam criptografados de ponta a ponta.
 * Passo a passo: docs/turn.md
 *
 * turnUrl: o app pede aqui credenciais que duram 24 h (por padrão, um
 * Worker da Cloudflare). Se o pedido falhar ou demorar, usa a lista `turn`.
 * Deixe '' para não pedir.
 *
 * turn: lista fixa (usuário e senha), opcional. Entra junto com as
 * credenciais do Worker, ou sozinha se o pedido falhar. Para um TURN
 * próprio (Metered etc.), apague o turnUrl e cole os servidores aqui:
 *
 *   turn: [
 *     { urls: 'turn:global.relay.metered.ca:80', username: 'SEU_USUARIO', credential: 'SUA_SENHA' },
 *     { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'SEU_USUARIO', credential: 'SUA_SENHA' }
 *   ]
 *
 * Ao publicar, aumente VERSION em js/core.js e sw.js.
 */
window.ITO_CONFIG = {
  turnUrl: 'https://ito-turn.sschonss.workers.dev',
  turn: []
};
