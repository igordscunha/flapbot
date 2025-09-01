const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quemtajogando')
        .setDescription('Mostra quem no servidor está jogando um jogo específico.')
        .addStringOption(option =>
            option.setName('jogo')
                .setDescription('O nome do jogo que você quer verificar.')
                .setRequired(true)),
    async execute(interaction) {
        const gameName = interaction.options.getString('jogo').toLowerCase();
        const members = await interaction.guild.members.fetch();
        
        const playingMembers = members.filter(member => {
            const activity = member.presence?.activities.find(act => act.type === ActivityType.Playing);
            return activity && activity.name.toLowerCase().includes(gameName);
        });

        if (playingMembers.size === 0) {
            return interaction.reply({ content: `Ninguém está jogando "${interaction.options.getString('jogo')}" no momento.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#10b981')
            .setTitle(`🎮 Jogando "${interaction.options.getString('jogo')}" agora:`)
            .setDescription(playingMembers.map(m => `- ${m.displayName}`).join('\n'))
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};