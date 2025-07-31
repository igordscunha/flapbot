const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.GuildMemberAdd,

	execute(member) {
		const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'bem-vindo' || channel.name === 'geral');

		if (!welcomeChannel) return;

		const welcomeEmbed = new EmbedBuilder()
			.setColor('#00ff99')
			.setTitle(`Seja bem vindo(a) à gangue dos marginais, ${member.displayName}!`)
			.setDescription(`Esperamos que você se divirta em nosso servidor, ${member.user.username}.`)
			.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
			.setTimestamp();

		welcomeChannel.send({ embeds: [welcomeEmbed ] });
	},
};