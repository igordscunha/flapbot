const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Mostra seu nível e XP no servidor.')
        .addSubcommand(sub =>
            sub
                .setName('usuario')
                .setDescription('O usuário que você quer ver o rank.')
                .addUserOption(opt =>
                    opt
                        .setName('nome')
                        .setDescription('Selecione o vulgo do usuário')
                        .setRequired(true)
                    )
        )
        .addSubcommand(sub =>
            sub
                .setName('medalhas')
                .setDescription('Mostra o quadro de medalhas')
        )
        .addSubcommand(sub =>
            sub
                .setName('top')
                .setDescription('Mostra o top 5 do ranking')
        ),
        
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const sub = interaction.options.getSubcommand();

        // RANK USUARIO
        if(sub === 'usuario'){
            const user = interaction.options.getUser('nome') || interaction.user;
            
            const level = (await db.get(`level_${interaction.guild.id}_${user.id}`)) || 1;
            const xp = (await db.get(`xp_${interaction.guild.id}_${user.id}`)) || 0;
            const nextLevelXP = 5 * (level ** 2) + 50 * level + 100;
    
            const embed = new EmbedBuilder()
                .setColor('#facc15')
                .setAuthor({ name: `Rank de ${user.displayName}`, iconURL: user.displayAvatarURL() })
                .addFields(
                    { name: 'Level', value: `**${level}**`, inline: true },
                    { name: 'XP', value: `**${xp} / ${nextLevelXP}**`, inline: true }
                )
                .setTimestamp();
                
            await interaction.followUp({ 
                embeds: [embed]
            });
        }


        if(sub === 'medalhas'){
            const medals = "Level 5+: 🥉\nLevel 10+: 🥈\nLevel 20+: 🥇\nLevel 35+: 💎\nLevel 50+: 👑";

            const embed = new EmbedBuilder()
                .setColor('#facc15')
                .setTitle('Quadro de medalhas 🥇')
                .setDescription(medals);

            await interaction.editReply({ embeds: [embed] });
        }
        
        if(sub === 'top'){
            
            try{
    
                const allData = await db.all();
    
                // Filtragem para pegar apenas dados do mesmo servidor do dc
                const guildLevels = allData
                    .filter(data => data.id.startsWith(`level_${interaction.guild.id}`))
                    .map(data => {
                        const userId = data.id.split('_')[2];
                        return { id: userId, level: data.value }
                    });
                
                // Adiciona XP de cada usuário encontrado
                for (const user of guildLevels){
                    user.xp = (await db.get(`xp_${interaction.guild.id}_${user.id}`)) || 0;
                }
    
                // Ordena a lista primeiro por level depois por XP
                guildLevels.sort((a, b) => {
                    if (a.level > b.level) return -1;
                    if (a.level < b.level) return 1;
                    if (a.xp > b.xp) return -1;
                    if (a.xp < b.xp) return 1;
                    return 0;
                });

                const top5 = guildLevels.slice(0, 5);

                if(top5.length <= 4){
                    return interaction.editReply('Este servidor ainda não possui 5 pessoas no ranking.');
                }

                let description = '';

                for (let i = 0; i < top5.length; i++){
                    const userEntry = top5[i];

                    const member = await interaction.guild.members.fetch(userEntry.id).catch(() => null);
                    const name = member ? member.displayName : `Usuário Desconhecido (${userEntry.id})`;

                    description += `**${name}** | Level ${userEntry.level}\n`;
                }

                const embed = new EmbedBuilder()
                    .setColor('#facc15')
                    .setTitle(`🏆 Top 5 - ${interaction.guild.name}`)
                    .setDescription(description)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
    
            }catch(error){
                console.error("Erro ao gerar o top 5 do rank: ", error);
                await interaction.editReply('Ocorreu um erro ao tentar buscar o ranking.');
            }
        }
        
    },
};