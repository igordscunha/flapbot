const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  cooldown: 20,
  data: new SlashCommandBuilder()
    .setName('configchannelinit')
    .setDescription('Define o canal de texto padrão.')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal de texto que o FlaBot deve usar')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction){
    await interaction.deferReply({ ephemeral: true });

    if(!interaction.member.permissions.has('ADMINISTRATOR')){
      return interaction.editReply({ content: 'Você precisa ser administrador para utilizar este comando.' });
    }

    const channel = interaction.options.getChannel('canal');

    if(!channel || channel.type !== 0){
      return interaction.editReply({ content: 'Selecione um canal de texto válido' });
    }

    await db.set(`canal_texto_${interaction.guild.id}`, channel.id);

    return interaction.editReply({ content: `Canal padrão definido para ${channel.name}` })
  }
}