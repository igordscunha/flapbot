const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  cooldown: 20,
  data: new SlashCommandBuilder()
    .setName('configchannelinit')
    .setDescription('Define o canal de texto padrão.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal de texto que o FlaBot deve usar')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction){
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('canal');

    if(!channel || channel.type !== 0){
      return interaction.editReply('Selecione um canal de texto válido');
    }

    await db.set(`canal_texto_${interaction.guild.id}`, channel.id);

    return interaction.editReply(`Canal padrão definido para ${channel.name}`)
  }
}