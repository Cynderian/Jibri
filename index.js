const fetch = require("node-fetch");
const columnify = require('columnify');
const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const client = new Discord.Client();

function capitalize(str) {
  let words = str.split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(' ');
}

async function getURL(url, name, page = 1) {
  const response = await fetch(url + name + '&page=' + page);
  return await response.json();
}

function infLead(data, sys = 0) {
  let inf = [];
  let i = 0;
  do {
    inf.push(data.docs[sys].factions[i].faction_details.faction_presence.influence);
    i++;
  } while (data.docs[sys].factions[i]);
  inf = inf.sort(function(a, b){return b - a});
  return (((inf[0] - inf[1]) * 100).toFixed(2));
}


client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}`);
});

client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'lead') {
    console.log('Working on lead...')
    if (!args.length) {
      return message.channel.send('Please define a reference system.')
    } else if (args.length > 1) {
      return message.channel.send('Error, too many arguments.')
    }
    const input = capitalize(args[0]);
    getURL('https://elitebgs.app/api/ebgs/v5/systems?factionDetails=true&name=', input)
    .then((data) => {
      let x = infLead(data);
      message.channel.send('The system ' + input + " has an inf lead of " + x);
    })
    .catch(e => {
      console.log('Error: ' + e.message);
    });
    

  } else if (command === 'sphere') {
    console.log('Working on sphere...');
      if (!args.length) {
        return message.channel.send('Please define a reference system.')
      } else if (args.length > 1) {
        return message.channel.send('Error, too many arguments.')
      }
      message.channel.send("Processing...");
      
      async function findSphere() {
        
        const input = capitalize(args[0]);
        let page = 1;
        let total = 0;
        let ideal_systems = 0;
        let lastResult;
        let systemData = [];
        const url = 'https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=' + input;
        do {
          try {
            console.log('function page ' + page);
            const response = await fetch(url + '&page=' + page);
            const data_ebgs = await response.json();
            lastResult = data_ebgs.hasNextPage;
            let i = 0;
            let j = 0;
            do {
              console.log('data fill ' + i);
              total = data_ebgs.total;
              const eddb_response = await fetch('https://eddbapi.kodeblox.com/api/v4/populatedsystems?name=' + data_ebgs.docs[i].name);
              const data_eddb = await eddb_response.json();

              let system = new Object();
              system.name = data_ebgs.docs[i].name;
              system.government = capitalize((data_ebgs.docs[i].government).slice(12, -1));
              system.lead = infLead(data_ebgs, i);
              system.gov_date = capitalize((data_ebgs.docs[i].updated_at).slice(5, 7) + '/' + (data_ebgs.docs[i].updated_at).slice(8, 10));
              if (data_eddb.docs[0].power != null) {// So null values do not go to capitalize
                system.power = capitalize(data_eddb.docs[0].power);
                system.state = capitalize(data_eddb.docs[0].power_state);
              } else {
                system.power = null;
                system.state = null;
              }
              system.pow_date = capitalize((data_eddb.docs[0].updated_at).slice(5, 7) + '/' + (data_eddb.docs[0].updated_at).slice(8, 10));
              systemData.push(system);


              if ((data_ebgs.docs[i].government).slice(12, -1) == "corporate")
                ideal_systems++;// Find # of ideal systems

              i++;
            } while(data_ebgs.docs[i]);
            page++;
          } catch (err) {
            console.error(`Error: ${err}`);
          }
        } while (lastResult != false);

        var columns = columnify(systemData);
        console.log("message sent");
        message.channel.send('```ini\n[' + input +  ' Control Sphere Analysis]\n\n' + columns + '\n\n' + ideal_systems + '/' + (total - 1) + ' favorable systems for Aisling expansion' + '\n```');
      }
      findSphere();
    }
});
client.login(token);