const { QuickDB } = require('quick.db');
const db = new QuickDB();
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

async function DarLevel(guildId, memberId){

  try{
    const levelAtual = await db.get(`level_${guildId}_${memberId}`)
    await db.set(`level_${guildId}_${memberId}`, levelAtual + 1)
    console.log(`Você acabou de dar um level para: ${memberId}`)
  }
  catch (error){
    console.error("Alguma coisa deu errado: ", error)
  }
}

rl.question('Qual id da guild que você quer upar o usuário: ', guildId => {
  rl.question('Qual o id do usuário: ', memberId => {
    console.log(DarLevel(guildId, memberId));
    rl.close();
  });
});