const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const he = require('he'); // Para decodificar caracteres HTML

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Inicia um jogo de trivia sobre conhecimentos gerais.'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = response.data.results[0];

            const question = he.decode(data.question);
            const correctAnswer = he.decode(data.correct_answer);
            const incorrectAnswers = data.incorrect_answers.map(a => he.decode(a));
            const allAnswers = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);

            const buttons = allAnswers.map(answer => 
                new ButtonBuilder()
                    .setCustomId(answer)
                    .setLabel(answer)
                    .setStyle(ButtonStyle.Secondary)
            );

            const row = new ActionRowBuilder().addComponents(buttons);

            const embed = new EmbedBuilder()
                .setColor('#ec4899')
                .setTitle('🧠 Quiz de Trivia!')
                .setDescription(question)
                .setFooter({ text: 'Você tem 15 segundos para responder!' });

            const reply = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = reply.createMessageComponentCollector({ time: 15000 });

            collector.on('collect', async i => {
                if (i.customId === correctAnswer) {
                    await i.update({ content: `🎉 ${i.user} acertou! A resposta era **${correctAnswer}**.`, embeds: [], components: [] });
                    collector.stop();
                } else {
                    await i.reply({ content: 'Resposta errada! Tente novamente.', ephemeral: true });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0 || !collected.some(i => i.customId === correctAnswer)) {
                    reply.edit({ content: `O tempo acabou! A resposta correta era **${correctAnswer}**.`, embeds: [], components: [] });
                }
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply('Não consegui buscar uma pergunta para o quiz no momento.');
        }
    }
};