const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ia')
		.setDescription('Faça uma pergunta para a Inteligência Artificial.')
		.addStringOption(option =>
			option.setName('pergunta')
				.setDescription('A pergunta que você quer fazer.')
				.setRequired(true),
		),

	async execute(interaction) {
		await interaction.deferReply();

		const question = interaction.options.getString('pergunta');

		try {
			const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
			const result = await model.generateContent(question);
			const response = await result.response;
			const text = response.text();

			const discordLimit = 4096;
			const messageLimit = 1000;
			const firstChunk = text.substring(0, discordLimit);

			const embed = new EmbedBuilder()
				.setColor('#4f46e5')
				.setTitle('🧠 Pergunta para a IA')
				.addFields(
					{ name: 'Sua pergunta: ', value: question },
					{ name: 'Resposta da IA: ', value: firstChunk }
				)
				.setTimestamp()
				.setFooter({ text: 'Powered by Google Gemini' });

			await interaction.editReply({ embeds: [embed] });

			if (text.length > discordLimit){
				const remainingText = text.substring(discordLimit);
				const remainingChunks = remainingText.match(new RegExp(`.{1,${messageLimit}}`, 'g'));

				for (const chunk of remainingChunks){
					await interaction.followUp(chunk);
				}
			}
		}
		catch (error) {
			console.error('Erro na API do Gemini: ', error);
			await interaction.editReply('Desculpe, não consegui obter uma resposta da IA no momento.');
		}
	},
};