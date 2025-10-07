const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { updateNicknameBadge } = require('../../utils/nicknameManager.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('syncbadges')
        .setDescription('[Admin] Sincroniza as insígnias de todos os membros do servidor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
          // Busca todos os membros do servidor
          const members = await interaction.guild.members.fetch();
          let updatedCount = 0;

          // Itera por cada membro
          for (const member of members.values()) {
            if (member.user.bot) continue; // Pula outros bots
            
            // Pega o nível atual do membro no banco de dados
            const currentLevel = (await db.get(`level_${interaction.guild.id}_${member.id}`)) || 0;

            // Se o membro tem um nível, chama a função para atualizar seu badge
            if (currentLevel > 0) {
              await updateNicknameBadge(member, currentLevel);
              updatedCount++;
            }
          }
          
          await interaction.editReply(`✅ Sincronização concluída! ${updatedCount} membros foram verificados e atualizados.`);

        } catch (error) {
          console.error("Erro ao sincronizar badges:", error);
          await interaction.editReply("Ocorreu um erro durante a sincronização. Verifique o console.");
        }
    },
};