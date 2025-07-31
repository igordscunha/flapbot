const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sports')
		.setDescription('Mostra os últimos resultados de uma liga esportiva.')
		.addStringOption(option =>
			option.setName('liga')
				.setDescription('Qual liga você quer ver? (ex: Brasileirão, NBA, Premier League)')
				.setRequired(true)
				.addChoices(
					{ name: 'Brasileirão Série A', value: '4328' },
					{ name: 'Premier League (Inglaterra)', value: '4328' }, //Valores iguais depois ver isso
					{ name: 'La Liga (Espanha)', value: '4335' },
					{ name: 'NBA (Basquete)', value: '4387' },
				)),
	async execute(interaction) {
		await interaction.deferReply();

		const leagueId = interaction.options.getString('liga');
		const leagueName = interaction.options.get('liga').name;
		const apiKey = process.env.SPORTS_API_KEY;
		const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventspastleague.php?id=${leagueId}`;

		try {
			const response = await axios.get(url);
			const events = response.data.events;

			if (!events) {
				await interaction.editReply(`Não encontrei resultados recentes para a ${leagueName}.`);
				return;
			}

			const embed = new EmbedBuilder()
				.setColor('#ef4444')
				.setTitle(`🏆 Últimos Resultados: ${leagueName}`)
				.setTimestamp();

			events.slice(0, 5).forEach(event => {
				embed.addFields({
					name: `📅 ${event.dateEvent} - ${event.strEvent}`,
					value: `**${event.intHomeScore} x ${event.intAwayScore}**`,
				});
			});

			await interaction.editReply({ embeds: [embed] });

		}
		catch (error) {
			console.error('Erro na API de Esportes:', error);
			await interaction.editReply('Ocorreu um erro ao buscar os resultados esportivos.');
		}
	},
};
