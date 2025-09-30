const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus
} = require('@discordjs/voice');
const play = require('play-dl');

// ------------- // -------------- // --------------- //

// Função auxiliar (PLAYSONG)
const playSong = async (guildId, client) => {
    const serverQueue = client.queues.get(guildId);
    if (!serverQueue) return;

    const song = serverQueue.songs[0];

    if (!song) {
        if (serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        client.queues.delete(guildId);
        return;
    }

    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        serverQueue.player.play(resource);

        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
             if (serverQueue.connection) {
                serverQueue.connection.destroy();
            }
            client.queues.delete(guildId);
        });

        const embed = new EmbedBuilder()
            .setColor('#e1672bff')
            .setTitle('🎧 Tocando Agora')
            .setDescription(`**[${song.title}](${song.url})**`)
            .setThumbnail(song.thumbnail)
            .addFields({ name: 'Artista', value: song.artist, inline: true })
            .setTimestamp();
        serverQueue.textChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error(`[ERRO STREAM] Erro ao criar o stream para ${song.url}:`, error.message);
        serverQueue.textChannel.send(`Ocorreu um erro ao tentar tocar **${song.title}**. Pulando para a próxima, se houver.`);
        if (serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        client.queues.delete(guildId);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Comandos de música via SoundCloud.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Toca uma música do SoundCloud.')
                .addStringOption(option => option.setName('musica').setDescription('Nome ou URL da música no SoundCloud.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Para a música e desconecta o bot.')),

    async execute(interaction) {
        const { options, member, guild, client } = interaction;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'Você precisa estar em um canal de voz para usar este comando!', ephemeral: true });
        }

        if (options.getSubcommand() === 'play') {
            await interaction.deferReply();
            const query = options.getString('musica');
            
            let songInfo;
            const validation = await play.validate(query);

            if (validation === 'sc_track') {
                songInfo = await play.soundcloud(query);
            } else if (validation === 'sc_playlist') {
                return interaction.editReply('Desculpe, tocar playlists do SoundCloud ainda não é suportado.');
            } else {
                const searchResults = await play.search(query, { source: { soundcloud: 'tracks' } });
                if (!searchResults.length) {
                    return interaction.editReply('Não encontrei nenhuma faixa com esse nome no SoundCloud.');
                }
                songInfo = searchResults[0];
            }
            
            const song = {
                title: songInfo.name,
                url: songInfo.url,
                thumbnail: songInfo.thumbnail,
                artist: songInfo.publisher?.name || 'Artista Desconhecido'
            };

            const queueContruct = {
                textChannel: interaction.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: createAudioPlayer(),
                songs: [song],
            };

            client.queues.set(guild.id, queueContruct);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                });
                queueContruct.connection = connection;
                connection.subscribe(queueContruct.player);
                playSong(guild.id, client);
                await interaction.editReply({ content: `🎵 Buscando **${song.title}** no SoundCloud...` });

            } catch (err) {
                console.log(err);
                client.queues.delete(guild.id);
                return interaction.editReply({ content: 'Não consegui entrar no canal de voz!' });
            }
        } else if (options.getSubcommand() === 'stop') {
            const serverQueue = client.queues.get(guild.id);
            if (!serverQueue) {
                return interaction.reply({ content: 'Não há nada tocando para parar!', ephemeral: true });
            }
            if (serverQueue.connection) {
                serverQueue.connection.destroy();
            }
            client.queues.delete(guild.id);
            await interaction.reply('⏹️ A música parou e o bot foi desconectado!');
        }
    },
};