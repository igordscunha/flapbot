const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Mostra seu nível e XP no servidor.')
    .addSubcommand(sub =>
      sub
        .setName('usuario')
        .setDescription('O usuário que você quer ver o rank.')
        .addUserOption(opt =>
          opt
            .setName('nome')
            .setDescription('Selecione o vulgo do usuário')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('insigneas')
        .setDescription('Mostra o quadro de insigneas')
    )
    .addSubcommand(sub =>
      sub
        .setName('top')
        .setDescription('Mostra o top server do ranking')
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    // RANK USUARIO
    if (sub === 'usuario') {
      const user = interaction.options.getUser('nome') || interaction.user;

      const level = (await db.get(`level_${interaction.guild.id}_${user.id}`)) || 1;
      const xp = (await db.get(`xp_${interaction.guild.id}_${user.id}`)) || 0;
      const nextLevelXP = 5 * (level ** 2) + 50 * level + 100;

      const embed = new EmbedBuilder()
        .setColor('#facc15')
        .setAuthor({ name: `Rank de ${user.displayName}`, iconURL: user.displayAvatarURL() })
        .addFields(
          { name: 'Level', value: `**${level}**`, inline: true },
          { name: 'XP', value: `**${xp} / ${nextLevelXP}**`, inline: true }
        )
        .setTimestamp();

      await interaction.followUp({
        embeds: [embed]
      });
    }


    if (sub === 'insigneas') {
      const medals = "Level 1+: ☹\nLevel 10+: 🥉\nLevel 20+: 🥈\nLevel 30+: 🥇\nLevel 40+: 🤺\nLevel 45+: 🔱\nLevel 50+: 💠\nLevel 55+: 💎\nLevel 65+: 👻\nLevel 75+: 👹\nLevel 85+: 👑\nLevel 95+: 🐲\nLevel 100+: ☺";

      const embed = new EmbedBuilder()
        .setColor('#facc15')
        .setTitle('Quadro de insígneas 🥇')
        .setDescription(medals);

      await interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'top') {

      try {

        const guildOwnerId = interaction.guild.ownerId;

        const allData = await db.all();

        // Filtrar, mapear e excluir o dono
        const rankedUsers = allData
          .filter(data =>
            data.id.startsWith(`level_${interaction.guild.id}_`) && // Filtra por levels do servidor
            data.id.split('_')[2] !== guildOwnerId // Exclui o dono do servidor
          )
          .map(data => ({
            id: data.id.split('_')[2],
            level: data.value,
            xp: 0 // XP será buscado a seguir
          }))
          .filter(user => user.level > 0); // Garante que só usuários com level > 0 entrem

        // Buscar XP para desempate
        for (const user of rankedUsers) {
          const xp = await db.get(`xp_${interaction.guild.id}_${user.id}`);
          user.xp = (typeof xp === 'number' ? xp : 0);
        }

        // Ordenar a lista
        rankedUsers.sort((a, b) => {
          if (a.level !== b.level) {
            return b.level - a.level; // Maior level primeiro
          }
          return b.xp - a.xp; // Maior XP como desempate
        });

        // Determinar o "Top" dinâmico
        const totalRanked = rankedUsers.length;
        let topToShow = 5; // Mínimo de 5

        if (totalRanked >= 10) {
          // A cada 5 usuários, aumenta o top em 5, até o máximo de 50.
          topToShow = Math.min(Math.floor(totalRanked / 5) * 5, 50);
        }

        const topList = rankedUsers.slice(0, topToShow);

        const embed = new EmbedBuilder()
          .setColor('#e2a82a')
          .setTitle(`🏆 Top ${topToShow} - ${interaction.guild.name}`);

        if (topList.length === 0) {
          embed.setDescription('Ainda não há ninguém no ranking (exceto o dono).');
          await interaction.editReply({ embeds: [embed] });
          return;
        }

        // Busca nomes e formata a descrição
        const descriptionLines = [];
        for (let i = 0; i < topList.length; i++) {
          const userRank = topList[i];
          let member = null;
          try {
            // Busca o membro no cache ou na API
            member = await interaction.guild.members.fetch(userRank.id);
          } catch (e) {
            // O usuário pode ter saído do servidor
            await interaction.editReply('Ocorreu um erro ao tentar buscar o ranking deste usuário.')
          }

          const rank = i + 1;
          // Mostra o nome de exibição ou um fallback
          const name = member.nickname || member.user.globalName || member.user.username;
          descriptionLines.push(
            `**${rank}º.** ${name} - Level ${userRank.level}`
          );
        }

        embed.setDescription(descriptionLines.join('\n'));
        await interaction.editReply({ embeds: [embed] });

      } catch (error) {
        console.error("Erro ao gerar o top do rank: ", error);
        await interaction.editReply('Ocorreu um erro ao tentar buscar o ranking.');
      }
    }

  },
};