const data = require('../data.json');

async function updateNicknameBadge(member, newLevel) {
    // Se o membro for o dono do servidor, não faz nada.
    if (member.id === member.guild.ownerId) return;

    let newBadge = null;
    // Encontra o badge correto para o novo nível do usuário
    for (const level of Object.keys(data.levelBadges).sort((a, b) => b - a)) {
        if (newLevel >= parseInt(level, 10)) { // Garante que a chave seja tratada como número
            newBadge = data.levelBadges[level];
            break;
        }
    }

    try {
        let currentName = member.nickname || member.user.globalName || member.user.username;
        
        // Cria uma Expressão Regular que encontra QUALQUER badge da sua lista e a remove.
        const allBadges = Object.values(data.levelBadges).map(b => {
            // Se o badge for o do detetive, usamos um padrão especial.
            if (b.includes('🕵️')) {
                // \u1F575 é o detetive, \uFE0F é o seletor de cor. O '?' torna o seletor opcional.
                return '\u1F575\uFE0F?'; 
            }
            // Para todos os outros emojis, usamos o "escape" padrão.
            return b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
        const badgeRegex = new RegExp(allBadges.join('|'), 'gu');
        
        let cleanName = currentName.replace(badgeRegex, '').trim();

        // Se não houver badge para o nível atual, apenas mantém o nome limpo.
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

// Exporta a função para que outros arquivos possam usá-la
module.exports = { updateNicknameBadge };