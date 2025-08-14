const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Mostra o avatar de um usuário em alta resolução.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('O usuário que você quer ver o avatar.')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario') || interaction.user;

        const embed = new EmbedBuilder()
            .setColor('#3b82f6')
            .setTitle(`Avatar de ${user.username}`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};