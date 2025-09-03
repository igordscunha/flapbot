const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('reloadxp')
        .setDescription('Corrige o XP de usuários que foi corrompido por um bug antigo.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Apenas admins podem usar
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let checkedMembers = 0;
        let fixedMembers = 0;

        try {
            const members = await interaction.guild.members.fetch();

            for (const member of members.values()) {
                if (member.user.bot) continue;

                const xpKey = `xp_${interaction.guild.id}_${member.id}`;
                const currentXP = await db.get(xpKey);
                checkedMembers++;

                // Verifica se o XP é uma string
                if (typeof currentXP === 'string') {
                    await db.set(xpKey, 0); // Reseta o XP para 0
                    fixedMembers++;
                }
            }

            await interaction.editReply(`✅ Verificação concluída!\n- Membros checados: ${checkedMembers}\n- Membros com XP corrigido: ${fixedMembers}`);

        } catch (error) {
            console.error("Erro ao executar /fixxp:", error);
            await interaction.editReply("Ocorreu um erro durante a verificação. Verifique o console.");
        }
    },
};