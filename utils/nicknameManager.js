const data = require('../data.json');

const invisiblePrefixes = ['\uDBFF\uDFFF', '\u200B'];
const variationSelector = '\uFE0F';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function updateNicknameBadge(member, newLevel) {
  // Se o membro for o dono do servidor, não faz nada.
  if (member.id === member.guild.ownerId) return;

  let newBadge = null;
  
  const sortedLevels = Object.keys(data.levelBadges)
    .map(Number)
    .sort((a, b) => b - a);

  for (const level of sortedLevels){
    if (newLevel >= level){
      newBadge = data.levelBadges[level.toString()];
      break;
    }
  }

  try {
    let currentName = member.nickname || member.user.globalName || member.user.username;

    const allBadges = Object.values(data.levelBadges).map((badgeString) => {
      let cleanBadge = badgeString;
      
      // 1. Remove os prefixos invisíveis para analisar o emoji base
      for (const prefix of invisiblePrefixes) {
        if (cleanBadge.startsWith(prefix)) {
          cleanBadge = cleanBadge.substring(prefix.length);
          break; // Assume apenas um prefixo
        }
      }
      
      // 2. Escapa o emoji base
      let escapedBadge = escapeRegExp(cleanBadge);
      
      // 3. Adiciona o seletor de variação opcional
      if (cleanBadge.endsWith(variationSelector)) {
        // Se o emoji base já o tiver, torna-o opcional
        const base = escapedBadge.slice(0, -variationSelector.length);
        escapedBadge = `${base}${variationSelector}?`;
      } else {
        // Se não o tiver, adiciona-o como opcional (para cobrir 🐣 vs 🐣️)
        escapedBadge = `${escapedBadge}${variationSelector}?`;
      }
      
      // 4. Cria o padrão final: (prefixo invisível opcional) + (emoji com variação opcional)
      // O `(\uDBFF\uDFFF|\u200B)?` procura por um dos seus prefixos, ou nada.
      const prefixRegex = invisiblePrefixes.map(escapeRegExp).join('|');
      return `(${prefixRegex})?${escapedBadge}`;
    });    
    
    const badgeRegex = new RegExp(allBadges.join('|'), 'gu');

    let cleanName = currentName.replace(badgeRegex, '').trim();

    const newNickname = newBadge ? `${newBadge} ${cleanName}` : cleanName;

    // Evita que o apelido exceda o limite do Discord
    if (newNickname.length > 32) {
      console.log(`Não foi possível atualizar o apelido de ${member.user.username} (muito longo).`);
      return;
    }

    // Só atualiza se o apelido realmente mudou, para economizar chamadas de API
    if (member.nickname !== newNickname) {
      await member.setNickname(newNickname);
      console.log(`Apelido de ${member.user.username} atualizado para: ${newNickname}`);
    }

  } catch (error) {
    // Ignora erros de "Missing Permissions", que são comuns para cargos mais altos ou o dono.
    if (error.code !== 50013) {
      console.error(`Falha ao atualizar o apelido de ${member.user.username}:`, error.message);
    }
  }
}

module.exports = { updateNicknameBadge };