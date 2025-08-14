const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('freegames')
        .setDescription('Mostra os jogos gratuitos da Epic Games Store no momento.'),
    async execute(interaction) {
        await interaction.deferReply();
        // API não oficial, mas funcional para os jogos da Epic
        const url = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR';

        try {
            const response = await axios.get(url);
            const games = response.data.data.Catalog.searchStore.elements;
            const freeGames = games.filter(game => game.promotions && game.promotions.promotionalOffers.length > 0);

            if (freeGames.length === 0) {
                return interaction.editReply('Não há jogos gratuitos na Epic Games no momento.');
            }

            const embed = new EmbedBuilder()
                .setColor('#2dd4bf')
                .setTitle('🎮 Jogos Gratuitos na Epic Games Store')
                .setTimestamp();
            
            freeGames.forEach(game => {
                const imageUrl = game.keyImages.find(img => img.type === 'OfferImageWide')?.url;
                embed.addFields({
                    name: game.title,
                    value: `Grátis até ${new Date(game.promotions.promotionalOffers[0].promotionalOffers[0].endDate).toLocaleDateString('pt-BR')}`
                });
                if (imageUrl) embed.setImage(imageUrl);
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Ocorreu um erro ao buscar os jogos gratuitos.');
        }
    },
};