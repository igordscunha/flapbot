const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Busca informações sobre um jogo na Steam.')
        .addStringOption(option => 
            option.setName('nome')
                .setDescription('O nome do jogo para pesquisar.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const gameName = interaction.options.getString('nome');
        const apiKey = process.env.STEAM_API_KEY;

        try {
            // 1. Encontrar o AppID do jogo
            const searchUrl = `https://api.steampowered.com/ISteamApps/GetAppList/v2/`;
            const appListResponse = await axios.get(searchUrl);
            const app = appListResponse.data.applist.apps.find(a => a.name.toLowerCase() === gameName.toLowerCase());

            if (!app) {
                return interaction.editReply(`Não encontrei o jogo "${gameName}" na Steam.`);
            }

            // 2. Buscar detalhes do jogo com o AppID
            const detailsUrl = `http://store.steampowered.com/api/appdetails?appids=${app.appid}&cc=br&l=brazilian`;
            const detailsResponse = await axios.get(detailsUrl);
            const gameData = detailsResponse.data[app.appid].data;

            const embed = new EmbedBuilder()
                .setColor('#1e3a8a')
                .setTitle(gameData.name)
                .setImage(gameData.header_image)
                .setDescription(gameData.short_description)
                .addFields(
                    { name: 'Preço', value: gameData.is_free ? 'Gratuito' : gameData.price_overview?.final_formatted || 'Não disponível', inline: true },
                    { name: 'Desenvolvedor', value: gameData.developers?.join(', ') || 'N/A', inline: true },
                    { name: 'Publicadora', value: gameData.publishers?.join(', ') || 'N/A', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Ocorreu um erro ao buscar informações do jogo.');
        }
    },
};