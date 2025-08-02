const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.GuildMemberAdd,

	execute(member) {
		const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'bem-vindo');

		if (!welcomeChannel) return;

		const welcomeEmbed = new EmbedBuilder()
			.setColor('#00ff99')
			.setTitle(`Seja bem vindo(a) à gangue dos marginais, ${member.displayName}!`)
			.setDescription(`Esperamos que você se divirta em nosso servidor. Escolha a cave e seja feliz.`)
			.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
			.setTimestamp();

		welcomeChannel.send({ embeds: [welcomeEmbed ] });
	},
};