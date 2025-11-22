const data = require('../data.json');

async function updateNicknameBadge(member, newLevel) {
  
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

    const allBadges = Object.values(data.levelBadges)

    const badgeRegex = new RegExp(`(${allBadges.join('|')})+`, 'gu');
    
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