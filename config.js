/* Configurações do ito
 *
 * Servidor TURN (opcional): ajuda quem está no 4G/5G a conectar quando a
 * conexão direta entre celulares falha.
 *
 * Como ativar (grátis):
 *   1. Crie uma conta em https://www.metered.ca/stun-turn (plano gratuito).
 *   2. No painel, copie a lista "ICE Servers" (urls, username, credential).
 *   3. Cole os servidores TURN dentro de `turn` abaixo, assim:
 *
 *      turn: [
 *        { urls: 'turn:global.relay.metered.ca:80', username: 'SEU_USUARIO', credential: 'SUA_SENHA' },
 *        { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'SEU_USUARIO', credential: 'SUA_SENHA' }
 *      ]
 *
 *   4. Aumente VERSION em js/core.js e sw.js e publique.
 */
window.ITO_CONFIG = {
  turn: []
};
