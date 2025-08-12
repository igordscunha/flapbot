const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lembrete')
		.setDescription('Define um lembrete.')
		.addStringOption(option =>
			option.setName('quando')
				.setDescription('Quando devo te lembrar? (ex: 10m, 1h, 14:30)')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('mensagem')
				.setDescription('A mensagem do lembrete.')
				.setRequired(true)),
	async execute(interaction) {
		const when = interaction.options.getString('quando');
		const message = interaction.options.getString('mensagem');
		const user = interaction.user;

		let delay = 0;
		const now = new Date();

		if (when.match(/^\d+m$/)) { // 10m (minutos)
			delay = parseInt(when) * 60 * 1000;
		}
		else if (when.match(/^\d+h$/)) { // 2h (horas)
			delay = parseInt(when) * 60 * 60 * 1000;
		}
		else if (when.match(/^\d{1,2}:\d{2}$/)) { // 14:30 (horário)
			const [hours, minutes] = when.split(':').map(Number);
			const reminderTime = new Date();
			reminderTime.setHours(hours, minutes, 0, 0);
			if (reminderTime < now) { // Se o horário já passou hoje, define para amanhã
				reminderTime.setDate(reminderTime.getDate() + 1);
			}
			delay = reminderTime.getTime() - now.getTime();
		}
		else {
			await interaction.reply({ content: 'Formato de tempo inválido. Use "10m" para 10 minutos, "1h" para 1 hora, ou "14:30" para um horário específico.'});
			return;
		}

		if (delay <= 0 || delay > 2147483647) {
			await interaction.reply({ content: 'Tempo inválido. O lembrete deve ser no futuro e em menos de 24 dias.'});
			return;
		}

		await interaction.reply({ content: `✅ Ok! Vou te lembrar sobre "${message}" em ${when}.`});

		setTimeout(() => {
			user.send(`⏰ **Lembrete:** ${message}`)
				.catch(console.error);
		}, delay);
	},
};