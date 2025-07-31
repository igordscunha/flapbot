const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Informa sobre o servidor.'),

	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		await interaction.editReply(`${interaction.guild.name} tem ${interaction.guild.memberCount} capangas.`);
	},
};