const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  cooldown: 20,
  data: new SlashCommandBuilder()
    .setName('mup')
    .setDescription('Ative ou desative o envio de mensagens de up do FlapBot aos canais de texto.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(option => 
      option
        .setName('ativar')
        .setDescription('Escolha true para ativar ou false para desativar.')
        .setRequired(true)
    ),

    async execute(interaction){
      await interaction.deferReply({ ephemeral: true });
      const ativar = interaction.options.getBoolean('ativar');

      if(ativar){
        await db.set('envio_mensagem', 1)
        await interaction.editReply('✅ MUP ativado!');
      }
      else{
        await db.set('envio_mensagem', 0);
        await interaction.editReply('❌ MUP desativado!');
      }
    }
}