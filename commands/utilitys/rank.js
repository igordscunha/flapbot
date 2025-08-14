const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('quick.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Mostra seu nível e XP no servidor.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('O usuário que você quer ver o rank.')
                .setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        
        const level = db.get(`level_${interaction.guild.id}_${user.id}`) || 1;
        const xp = db.get(`xp_${interaction.guild.id}_${user.id}`) || 0;
        const nextLevelXP = 5 * (level ** 2) + 50 * level + 100;

        const embed = new EmbedBuilder()
            .setColor('#8b5cf6')
            .setAuthor({ name: `Rank de ${user.username}`, iconURL: user.displayAvatarURL() })
            .addFields(
                { name: 'Nível', value: `**${level}**`, inline: true },
                { name: 'XP', value: `**${xp} / ${nextLevelXP}**`, inline: true }
            )
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    },
};