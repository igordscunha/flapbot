const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const formatDate = (dateString) => {
	const [year, month, day] = dateString.split('-');
	return `${day}/${month}/${year}`
};

const leagueNames = {
  '4351': 'Brasileirão Série A',
  '4328': 'Premier League (Inglaterra)',
  '4335': 'La Liga (Espanha)',
  '4332': 'Serie A (Itália)',
  '4331': 'Bundesliga (Alemanha)',
  '4337': 'Eredivise (Holanda)',
  '4370': 'Formula 1',
  '5282': 'Diamond League (Atletismo)',
  '4443': 'UFC',
  '4391': 'NFL',
  '4387': 'NBA (Basquete)'
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('esportes')
		.setDescription('Mostra os últimos resultados de uma liga esportiva.')
		.addSubcommand(option =>
			option
				.setName('liga')
				.setDescription('Ver últimos resultados de uma liga')
				.addStringOption(option => 
					option
						.setName('id')
						.setDescription('Escolha a liga')
						.setRequired(true)
						.addChoices(
							{ name: 'Brasileirão Série A', value: '4351' },
							{ name: 'Premier League (Inglaterra)', value: '4328' },
							{ name: 'La Liga (Espanha)', value: '4335' },
							{ name: 'Serie A (Italia)', value: '4332' },
							{ name: 'Bundesliga (Alemanha)', value: '4331' },
							{ name: 'Eredivise (Holanda)', value: '4337' },
							{ name: 'Formula 1', value: '4370' },
							{ name: 'Diamond League (Atletismo)', value: '5282' },
							{ name: 'UFC', value: '4443' },
							{ name: 'NFL', value: '4391' },
							{ name: 'NBA (Basquete)', value: '4387' },
						),
				),
			)
		.addSubcommand(option =>
			option
				.setName('time')
				.setDescription('Ver últimas e próximas partidas de um time')
				.addStringOption(option =>
					option
						.setName('nome')
						.setDescription('Nome do time')
						.setRequired(true)
				)
		),

	async execute(interaction) {
    await interaction.deferReply();
    const apiKey = process.env.SPORTS_API_KEY;
    const sub = interaction.options.getSubcommand();

    // Lógica da liga
    if (sub === 'liga') {
      const leagueId = interaction.options.getString('id');
      const leagueDisplay = leagueNames[leagueId] || 'Essa liga';
      const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventspastleague.php?id=${leagueId}`;

      try {
        const { data } = await axios.get(url);
        const events = data.events;
        if (!events) {
          return interaction.editReply(`Não encontrei resultados recentes para a ${leagueDisplay}.`);
        }

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle(`🏆 Últimos Resultados: ${leagueDisplay}`)
          .setTimestamp();

        events.slice(0, 5).forEach(ev => {
          embed.addFields({
            name: `📅 ${formatDate(ev.dateEvent)} – ${ev.strEvent}`,
            value: `**${ev.intHomeScore} x ${ev.intAwayScore}**`
          });
        });

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('Erro na API de ligas:', err);
        return interaction.editReply('Ocorreu um erro ao buscar os resultados da liga.');
      }
    }

    // Lógica do time
    if (sub === 'time') {
      const teamQuery = interaction.options.getString('nome');
      try {
        // Busca do time
        const searchUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${encodeURIComponent(teamQuery)}`;
        const teamRes = await axios.get(searchUrl);
        const team = teamRes.data.teams?.[0];
        if (!team) {
          return interaction.editReply(`Time "${teamQuery}" não encontrado.`);
        }

        const { idTeam, strTeam, strTeamBadge } = team;
        const lastUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${idTeam}`;
        const nextUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsnext.php?id=${idTeam}`;

        const [lastRes, nextRes] = await Promise.all([
          axios.get(lastUrl),
          axios.get(nextUrl)
        ]);

        const lastArr = lastRes.data.results || [];
        const nextArr = nextRes.data.events || [];

        const lastField = lastArr.length
          ? lastArr.slice(0, 3).map(ev => {
              const opponent = ev.strHomeTeam === strTeam ? ev.strAwayTeam : ev.strHomeTeam;
              const score = `${ev.intHomeScore} x ${ev.intAwayScore}`;
              return `📅 ${formatDate(ev.dateEvent)}: vs **${opponent}** (Resultado: ${score})`;
            }).join('\n')
          : 'Nenhuma partida recente encontrada.';

        const nextField = nextArr.length
          ? nextArr.slice(0, 3).map(ev => {
              const opponent = ev.strHomeTeam === strTeam ? ev.strAwayTeam : ev.strHomeTeam;
              const time = ev.strTime?.substring(0, 5) || '–';
              return `📅 ${formatDate(ev.dateEvent)} às **${time}**: vs **${opponent}**`;
            }).join('\n')
          : 'Nenhuma partida futura encontrada.';

        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle(`Resultados e Agenda: ${strTeam}`)
          .setThumbnail(strTeamBadge)
          .addFields(
            { name: 'Últimas 3 Partidas', value: lastField, inline: false },
            { name: 'Próximas 3 Partidas', value: nextField, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Powered by TheSportsDB' });

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('Erro na API de times:', err);
        return interaction.editReply('Ocorreu um erro ao buscar as informações do time.');
      }
    }
  }
};
