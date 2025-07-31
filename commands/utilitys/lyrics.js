const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLyrics } = require('genius-lyrics');

const geniusClient = {
	apiKey: process.env.GENIUS_API_TOKEN,
	title: '',
	artist: '',
	optimizeQuery: true,
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lyrics')
		.setDescription('Busca a letra de uma música.')
		.addStringOption(option =>
			option.setName('musica')
				.setDescription('O nome da música (e artista, se quiser ser mais específico)')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		const songQuery = interaction.options.getString('musica');
		geniusClient.title = songQuery;

		try {
			const lyrics = await getLyrics(geniusClient);

			if (!lyrics) {
				await interaction.editReply(`Não consegui encontrar a letra para "${songQuery}". Tente ser mais específico!`);
				return;
			}

			// Discord tem um limite de 4096 caracteres para a descrição do Embed
			const chunks = lyrics.match(/[\s\S]{1,4000}/g) || [];

			const firstEmbed = new EmbedBuilder()
				.setColor('#ffff00')
				.setTitle(`🎤 Letra de ${songQuery}`)
				.setDescription(chunks[0])
				.setFooter({ text: 'Powered by Genius' });

			await interaction.editReply({ embeds: [firstEmbed] });

			// Envia o resto da letra em mensagens seguintes, se houver
			for (let i = 1; i < chunks.length; i++) {
				const followupEmbed = new EmbedBuilder()
					.setColor('#ffff00')
					.setDescription(chunks[i]);
				await interaction.followUp({ embeds: [followupEmbed] });
			}

		}
		catch (error) {
			console.error('Erro na API do Genius:', error);
			await interaction.editReply('Ocorreu um erro ao buscar a letra da música.');
		}
	},
};