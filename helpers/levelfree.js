const { QuickDB } = require('quick.db');
const db = new QuickDB();
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

async function darLevel(guildId, memberId){

  try{
    const levelAtual = (await db.get(`level_${guildId}_${memberId}`)) || 1;
    const novoLevel = levelAtual + 1;

    await db.set(`level_${guildId}_${memberId}`, novoLevel)
    console.log(`Sucessagem! Agora o usuário está no nível: ${novoLevel}`)
  }
  catch (error){
    console.error("Alguma coisa deu errado: ", error)
  }
}

async function main(){
  rl.question('Qual id da guild que você quer upar o usuário: ', guildId => {
    rl.question('Qual o id do usuário: ', async (memberId) => {
      await darLevel(guildId, memberId);
      rl.close();
    });
  });
}

main();