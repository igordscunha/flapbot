const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clima')
        .setDescription('Mostra a previsão do tempo para uma cidade.')
        .addStringOption(option =>
            option.setName('cidade')
                .setDescription('O nome da cidade.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const cidade = interaction.options.getString('cidade');
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            const embed = new EmbedBuilder()
                .setColor('#f59e0b')
                .setTitle(`Clima em ${data.name}, ${data.sys.country}`)
                .setThumbnail(`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
                .addFields(
                    { name: 'Condição', value: data.weather[0].description, inline: true },
                    { name: 'Temperatura', value: `${data.main.temp}°C`, inline: true },
                    { name: 'Sensação Térmica', value: `${data.main.feels_like}°C`, inline: true },
                    { name: 'Umidade', value: `${data.main.humidity}%`, inline: true },
                    { name: 'Vento', value: `${data.wind.speed} m/s`, inline: true },
                    { name: 'Nuvens', value: `${data.clouds.all}%`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply(`Não consegui encontrar o clima para a cidade "${city}". Verifique o nome e tente novamente.`);
        }
    },
};