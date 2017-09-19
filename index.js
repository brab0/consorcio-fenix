const DoggoScraping = require('doggo-scraping');
const doggo = new DoggoScraping();
const fs = require("fs");
const patterns = {
      caracteristica: new RegExp(/<b>Caracter&#xED;stica:<\/b>(.*?)<br>/),
      tempo: new RegExp(/<b>Tempo de percurso :<\/b>(.*?)<br>/),
      ultima_alteracao: new RegExp(/<b>Alterada em:<\/b>(.*?)<br>/),      
      tarifa: new RegExp(/<b>Tarifa -(.*?)<\/b><br>/),
      cartao: new RegExp(/<b>Cart&#xE3;\n?o:<\/b>(.*?)<br>/),
      dinheiro: new RegExp(/<b>Dinheiro:<\/b>(.*?)<br>/)
}

doggo.wakeUp('http://www.consorciofenix.com.br', doggoAtHome => {
      
   let linhas = [];
      
   return doggoAtHome.iterate('#linha option', opt => {
      
      return doggoAtHome.goto(doggoAtHome.url + opt.val())
      .then(doggoAtLinha => {
         let saidas = [];

         return doggoAtLinha.iterate('.horario > div > div', item => {
            if(item.children("h4.title4").text() != ""){
               saidas.push({
                  title: item.children("h4.title4").text(),
                  horarios: []
               });
            } else if(item.attr("data-horario")){               
               let horario = item.attr("data-horario").split('');
         
               if(horario.length == 3){
                     horario.splice(1, 0, ":")
               } else if(horario.length == 4){
                     horario.splice(2, 0, ":")
               }

               saidas[saidas.length - 1].horarios.push(horario.join(''));
            }            
         })
         .then(() => {
            let header = doggoAtLinha.eval(".horario > div").html();
            let linha = {};
            let itinerario = [];

            doggoAtLinha.eval("ol li").each((i, item) => {
               itinerario.push(doggoAtLinha.eval(item).text())                              
            })

            if(saidas.length > 0){
               linha = {
                  name: opt.text(),
                  header: {
                     caracteristica: header && header.match(patterns.caracteristica)[1].trim(),
                     tempo: header && header.match(patterns.tempo)[1].trim(),
                     ultima_alteracao: header && header.match(patterns.ultima_alteracao)[1].trim(),
                     tarifa: header && header.match(patterns.tarifa)[1].trim(),
                     cartao: header && header.match(patterns.cartao)[1].trim(),
                     dinheiro: header && header.match(patterns.dinheiro)[1].trim()
                  },
                  itinerario: itinerario,
                  saidas: saidas
               };

               linhas.push(linha);
            }
            
            return linha || false;
         });
      })
      .then(linha => {
         if(linha.name) console.log(linhas.length + " - " + linha.name)
      });
   })
   .then(() => {
      return new Promise((resolve, reject) => {
         fs.writeFile("linhas.json", JSON.stringify(linhas), err => {
            if (err) reject(err);
            
            resolve(`${linhas.length} Linhas salvas com sucesso!`);
         })
      });
   });
})
.then(res => {
   console.log("\n--------------------------------------------------")
   console.log(res)
   console.log("--------------------------------------------------")
});