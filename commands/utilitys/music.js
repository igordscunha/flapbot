const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require('@discordjs/voice');
const play = require('play-dl');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('musica')
        .setDescription('Comandos relacionados a música.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Toca uma música. Substitui a atual se houver uma.')
                .addStringOption(option => option.setName('musica').setDescription('Nome ou URL da música.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Para a música e desconecta o bot.')),

    async execute(interaction) {
        const { options, member, guild } = interaction;
        const client = interaction.client; 
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'Você precisa estar em um canal de voz para usar este comando!', flags: MessageFlags.Ephemeral });
        }

        let serverInstance = client.queues.get(guild.id);

        if (options.getSubcommand() === 'play') {
            await interaction.deferReply();
            const query = options.getString('musica');

            try {
                const searchResult = await play.search(query, { limit: 1 });
                if (searchResult.length === 0) {
                    return interaction.editReply('Não encontrei nada com essa busca.');
                }
                
                // Apenas playlists não são suportadas neste modo simples.
                if (searchResult[0].type === 'playlist' || searchResult[0].type === 'album') {
                    return interaction.editReply('Playlists e álbuns não são suportados no modo simples. Por favor, envie o link de uma única música.');
                }

                const song = {
                    title: searchResult[0].title,
                    url: searchResult[0].url,
                    duration: searchResult[0].durationRaw,
                    thumbnail: searchResult[0].thumbnails?.[0]?.url,
                };
                
                // Se não houver uma instância, crie uma nova
                if (!serverInstance) {
                    const player = createAudioPlayer();
                    
                    // Evento para quando a música termina
                    player.on(AudioPlayerStatus.Idle, () => {
                        const oldInstance = client.queues.get(guild.id);
                        if (oldInstance && oldInstance.connection) {
                            oldInstance.connection.destroy();
                        }
                        client.queues.delete(guild.id);
                    });

                    // Evento para erros no player
                    player.on('error', error => {
                        console.error(`[ERRO PLAYER] ${error.message}`);
                    });

                    const instanceContruct = {
                        textChannel: interaction.channel,
                        voiceChannel: voiceChannel,
                        connection: null,
                        player: player,
                        song: song, // Apenas uma música
                    };

                    client.queues.set(guild.id, instanceContruct);

                    try {
                        const connection = joinVoiceChannel({
                            channelId: voiceChannel.id,
                            guildId: guild.id,
                            adapterCreator: guild.voiceAdapterCreator,
                        });
                        instanceContruct.connection = connection;
                        connection.subscribe(player);
                        
                        await interaction.editReply({ content: `Iniciando...` });
                        playSong(guild.id, client);

                    } catch(err) {
                        console.error("[ERRO CONEXÃO] Erro ao tentar entrar no canal de voz:", err);
                        client.queues.delete(guild.id);
                        return interaction.editReply({ content: 'Não consegui entrar no canal de voz.'});
                    }

                } else { // Se já existe uma instância, apenas substitui a música e toca
                    serverInstance.song = song;
                    await interaction.editReply({ content: `Substituindo pela nova música...` });
                    playSong(guild.id, client);
                }

            } catch (error) {
                console.error("Erro no comando play:", error);
                return interaction.editReply("Ocorreu um erro ao processar sua solicitação.");
            }
        }
        
        // --- SUBCOMANDO STOP ---
        else if (options.getSubcommand() === 'stop') {
            if (!serverInstance) {
                return interaction.reply({ content: 'Não há nada tocando para parar!', flags: MessageFlags.Ephemeral });
            }
            
            if (serverInstance.connection) {
                serverInstance.connection.destroy();
            }
            client.queues.delete(guild.id);
            await interaction.reply('⏹️ Música parada e bot desconectado!');
        }
    },
};

const playSong = async (guildId, client) => {
    const serverInstance = client.queues.get(guildId);
    if (!serverInstance) return;

    // Se não há música para tocar, encerra a conexão.
    if (!serverInstance.song) {
        if (serverInstance.connection) {
            serverInstance.connection.destroy();
        }
        client.queues.delete(guildId);
        return;
    }

    const song = serverInstance.song;

    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        
        serverInstance.player.play(resource);

        const embed = new EmbedBuilder()
            .setColor('#22c55e')
            .setTitle('▶️ Tocando Agora')
            .setDescription(`[${song.title}](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields({ name: 'Duração', value: song.duration, inline: true })
            .setTimestamp();
        serverInstance.textChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error(`[ERRO STREAM] Erro ao criar o stream para ${song.url}:`, error);
        serverInstance.textChannel.send(`Ocorreu um erro ao tentar tocar: **${song.title}**.`);
        if (serverInstance.connection) {
            serverInstance.connection.destroy();
        }
        client.queues.delete(guildId);
    }
};