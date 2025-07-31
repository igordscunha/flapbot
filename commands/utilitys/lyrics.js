const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Genius = require('genius-lyrics');

const Client = new Genius.Client(process.env.GENIUS_API_CLIENT_ACCESS_TOKEN);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('letra')
		.setDescription('Busca a letra de uma música.')
		.addStringOption(option =>
			option.setName('musica')
				.setDescription('O nome da música (e artista, se quiser ser mais específico)')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		const musica = interaction.options.getString('musica');
		
		try {
			const searches = await Client.songs.search(musica);
			const firstSong = searches[0];
			// console.log("About the Song: \n", firstSong, "\n"); //debug
			const lyrics = await firstSong.lyrics();
			// console.log("Lyrics of the Song:\n", lyrics, "\n"); //debug

			if (!lyrics) {
				await interaction.editReply(`Não consegui encontrar a letra para "${firstSong}".`);
				return;
			}

			// Discord tem um limite de 4096 caracteres para a descrição do Embed
			const chunks = lyrics.match(/\[[\s\S]{0,3999}/g) || [];
			const matchDescricao = lyrics.match(/\[([^\]]*)\]/) || [];
			const descricao = matchDescricao ? matchDescricao[1] : '';

			const embed = new EmbedBuilder()
				.setColor('#ffff00')
				.setTitle(`🎤 Letra de ${firstSong.title} - ${firstSong.artist.name}`)
				.setDescription(chunks[0])
				.setFooter({ text: 'Powered by Genius' });

			await interaction.editReply({ embeds: [embed] });

		}
		catch (error) {
			console.error('Erro na API do Genius:', error);
			await interaction.editReply('Ocorreu um erro ao buscar a letra da música.');
		}
	},
};