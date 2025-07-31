const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Informa sobre o usuário.'),

	async execute(interaction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		await interaction.editReply(`${interaction.user.username} entrou pro bonde em ${interaction.member.joinedAt}.`);
	},
};