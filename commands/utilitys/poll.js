const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('enquete')
		.setDescription('Cria uma enquete com até 10 opções.')
		.addStringOption(option =>
			option.setName('pergunta')
				.setDescription('A pergunta da enquete.')
				.setRequired(true))
		.addStringOption(option => option.setName('op1').setDescription('Opção de resposta 1').setRequired(true))
		.addStringOption(option => option.setName('op2').setDescription('Opção de resposta 2').setRequired(true))
		.addStringOption(option => option.setName('op3').setDescription('Opção de resposta 3'))
		.addStringOption(option => option.setName('op4').setDescription('Opção de resposta 4'))
		.addStringOption(option => option.setName('op5').setDescription('Opção de resposta 5')),

	async execute(interaction) {
		const question = interaction.options.getString('pergunta');
		const options = [];
		const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

		for (let i = 1; i <= 10; i++) {
			const opt = interaction.options.getString(`op${i}`);
			if (opt) {
				options.push(`${emojis[i - 1]} ${opt}`);
			}
		}

		const embed = new EmbedBuilder()
			.setColor('#3b82f6')
			.setTitle(`📊 Enquete: ${question}`)
			.setDescription(options.join('\n\n'))
			.setTimestamp()
			.setFooter({ text: `Enquete criada por ${interaction.member.displayName}` });

		const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });

		for (let i = 0; i < options.length; i++) {
			await pollMessage.react(emojis[i]);
		}
	},
};