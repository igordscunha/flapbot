const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('site')
    .setDescription('Site do FlapBot'),

  async execute(interaction){
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply('https://flapbot.vercel.app/');
  }
}