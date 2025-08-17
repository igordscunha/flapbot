const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events, Partials } = require('discord.js');
const { QuickDB } = require('quick.db');
const play = require('play-dl');
const db = new QuickDB();
require('dotenv').config();

// *************** // **************** //

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessagePolls,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildPresences
	], 
	partials: [Partials.Channel]
});

async function configurePlayer() {
    if (play.is_expired()) {
        try {
            await play.refreshToken();
            console.log('[CONFIGURAÇÃO] Token do play-dl atualizado.');
        } catch (e) { 
            console.error('[CONFIGURAÇÃO] Falha ao atualizar token do play-dl.');
        }
    }
    if (process.env.YOUTUBE_COOKIE) {
        try {
            await play.setToken({ youtube: { cookie: process.env.YOUTUBE_COOKIE } });
            console.log('[CONFIGURAÇÃO] Cookie do YouTube configurado com sucesso.');
        } catch (e) { 
            console.error('[CONFIGURAÇÃO] Falha ao configurar cookie do YouTube.');
        }
    } else {
        console.warn('[CONFIGURAÇÃO] Cookie do YouTube não encontrado. O bot pode ser bloqueado.');
    }
}

const mensagens = [
    "Tu ta ficando fortin, ein 💪",
    "Vagabundo tá entendendo nada 👀",
    "Tá ficando brabin de te pegar...",
    "Hora de jogar o jet na água e dar esse role",
    "Quer namorar comigo? 🥹",
    "Você tá ficando até mais bonito... 👀",
    "O capitalismo precisa ruir...",
    "Hoje o gelo é por sua conta!",
    "Cruuuuuuuuuzes",
    "Gostozin no azeite aiiii 🥵",
    "Glub glub... 💦💦",
    "Aaaaaaaii que delíciaaaa",
    "Si señor 🫡",
    "Que cintura ignorante 😳",
    "Coisa linda de se ver!",
    "Me paga um balde hoje?",
    "Tadalaboy! 😈",
    "Vai que vai companheiro!",
    "Você é muito brabo! 👏",
    "Quero ser igual você quando crescer! 🤩",
    "Te amo, ta? ❤️",
    "Koe cara não tô acreditando nisso...",
    "Dono da porra toda 💵",
    "Com certeza o melhor da tua rua!"
];

const levelBadges = {
    5: '🥉',
    10: '🥈',
    20: '🥇',
    35: '💎',
    50: '👑'
};

const token = process.env.DISCORD_TOKEN;

client.commands = new Collection();
client.cooldowns = new Collection();
client.queues = new Map();
const cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Tudo pronto! Logado como ${c.user.tag}`);
    configurePlayer();
	setInterval(updateVoiceXP, 60000);
})

// SISTEMA DE XP POR MENSAGEM
client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;

    // Cooldown para evitar spam de XP
    if (cooldowns.has(message.author.id)) return;

    const xpToGive = Math.floor(Math.random() * (25 - 15 + 1)) + 15; // XP entre 15 e 25
    const currentXP = (await db.get(`xp_${message.guild.id}_${message.author.id}`)) || 0;
    const currentLevel = (await db.get(`level_${message.guild.id}_${message.author.id}`)) || 1;
    
    const newXP = currentXP + xpToGive;
    const nextLevelXP = 5 * (currentLevel ** 2) + 50 * currentLevel + 100;

    if (newXP >= nextLevelXP) {
        const newLevel = currentLevel + 1;
        await db.set(`level_${message.guild.id}_${message.author.id}`, newLevel);
        await db.set(`xp_${message.guild.id}_${message.author.id}`, 0); // Reseta o XP para o novo nível
        message.channel.send(`${message.author}, você subiu para o nível **${newLevel}**! ${mensagens[Math.floor(Math.random() * mensagens.length)]}`);
        
        await updateNicknameBadge(message.member, newLevel)
    } else {
        await db.set(`xp_${message.guild.id}_${message.author.id}`, newXP);
    }
    
    // Adiciona cooldown de 60 segundos
    cooldowns.set(message.author.id, true);
    setTimeout(() => {
        cooldowns.delete(message.author.id);
    }, 60000);
});



// SISTEMA DE XP POR VOZ

async function updateVoiceXP() {
    client.guilds.cache.forEach(guild => {
        guild.members.cache.forEach(async member => {
            if (member.voice.channel && !member.voice.selfDeaf && !member.voice.serverMute) {
                 const xpToGive = 10; // XP fixo por minuto em voz
                 const currentXP = (await db.get(`xp_${guild.id}_${member.id}`)) || 0;
                 const currentLevel = (await db.get(`level_${guild.id}_${member.id}`)) || 1;
                 const newXP = currentXP + xpToGive;
                 const nextLevelXP = 5 * (currentLevel ** 2) + 50 * currentLevel + 100;


                 if (newXP >= nextLevelXP) {
                    const newLevel = currentLevel + 1;
                    await db.set(`level_${guild.id}_${member.id}`, newLevel);
                    await db.set(`xp_${guild.id}_${member.id}`, 0);
                    
                    // Encontrar um canal de texto para anunciar
                    const channel = guild.channels.cache.find(ch => ch.name === 'geral' || ch.type === 0);
                    if (channel) channel.send(`${member.displayName} subiu para o nível **${newLevel}**! ${mensagens[Math.floor(Math.random() * mensagens.length)]}`);
                
                    await updateNicknameBadge(member, newLevel)
                } else {
                    await db.set(`xp_${guild.id}_${member.id}`, newXP);
                 }
            }
        });
    });
}


// FUNÇÃO PARA ATUALIZAR O NICK COM A INSÍGNIA

async function updateNicknameBadge(member, newLevel) {
    let newBadge = null;
    for (const level of Object.keys(levelBadges).sort((a, b) => b - a)) {
        if (newLevel >= level) {
            newBadge = levelBadges[level];
            break;
        }
    }

    if (!newBadge) return;

    try {
        let currentName = member.nickname || member.user.username;

        Object.values(levelBadges).forEach(badge => {
            currentName = currentName.replace(badge, '').trim();
        });

        const newNickname = `${newBadge} | ${currentName}`;
        
        if (newNickname.length > 32) {
            console.log(`Não foi possível atualizar o apelido de ${member.user.username} por exceder 32 caracteres.`);
            return;
        }

        await member.setNickname(newNickname);
        console.log(`Apelido de ${member.user.username} atualizado para: ${newNickname}`);

    } catch (error) {
        console.error(`Falha ao atualizar o apelido de ${member.user.username}:`, error.message);
    }
}

client.login(token);
