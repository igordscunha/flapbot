const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events, Partials } = require('discord.js');
const { QuickDB } = require('quick.db');
const play = require('play-dl');
const db = new QuickDB();
const data = require('./data.json')
require('dotenv').config();

// *************** // **************** //


async function configurePlayer(){
    try{
        const soundcloud_client_id = await play.getFreeClientID();
        await play.setToken({
            soundcloud : {
                client_id : soundcloud_client_id
            }
        })
        console.log("[CONFIGURAÇÃO]: Client ID do SoundCloud configurado com sucesso.");
    } catch(e){
        console.error("[CONFIGURAÇÃO]: Falha ao configurar Client ID do SoundCloud", e.message);
    }
}

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

client.once(Events.ClientReady, async c => {
	console.log(`Tudo pronto! Logado como ${c.user.tag}`);
    await configurePlayer();
	setInterval(updateVoiceXP, 60000);
});

// SISTEMA DE XP POR MENSAGEM
client.on(Events.MessageCreate, async message => {
    if (message.author.bot || !message.guild) return;

    // Cooldown para evitar spam de XP
    if (cooldowns.has(message.author.id)) return;

    const xpToGive = Math.floor(Math.random() * (25 - 15 + 1)) + 15; // XP entre 15 e 25
    const currentXP = (await db.get(`xp_${message.guild.id}_${message.author.id}`)) || 150;
    const currentLevel = (await db.get(`level_${message.guild.id}_${message.author.id}`)) || 1;
    
    const newXP = currentXP + xpToGive;
    const nextLevelXP = 5 * (currentLevel ** 2) + 50 * currentLevel + 100;

    if (newXP >= nextLevelXP) {
        const newLevel = currentLevel + 1;
        await db.set(`level_${message.guild.id}_${message.author.id}`, newLevel);
        await db.set(`xp_${message.guild.id}_${message.author.id}`, 0); // Reseta o XP para o novo nível
        message.channel.send(`${member.displayName} advanced from Level **${newLevel - 1}** to Level **${newLevel}**!`);
        
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
                    const channelId = (await db.get(`canal_texto_${guild.id}`));
                    let targetChannel;

                    if(channelId) {
                        targetChannel = guild.channels.cache.get(channelId);
                    }

                    //primeiro fallback
                    if(!targetChannel){
                        targetChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.name.toLowerCase() === 'geral' || ch.name.toLocaleLowerCase() === 'welcome');
                    }

                    //segundo fallback
                    if(!targetChannel){
                        targetChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText || 0);
                    }

                    //tratamento erro
                    if(!targetChannel){
                        console.error(`Nenhum canal de texto encontrado em ${guild.id}`);
                        return;
                    }
  
                    const envioMensagem = await db.get('envio_mensagem') || 0;

                    if(envioMensagem == 1){
                        await targetChannel.send(`${member.displayName} advanced from Level **${newLevel - 1}** to Level **${newLevel}**!`);
                    }
                
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
    for (const level of Object.keys(data.levelBadges).sort((a, b) => b - a)) {
        if (newLevel >= level) {
            newBadge = data.levelBadges[level];
            break;
        }
    }

    if (!newBadge) return;

    try {
        let currentName = member.nickname || member.user.globalName || member.user.username;

        Object.values(data.levelBadges).forEach(badge => {
            currentName = currentName.replace(badge, '').trim();
        });

        const newNickname = `${newBadge} ${currentName}`;
        
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
