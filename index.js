const fetch = require("node-fetch");
const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const client = new Discord.Client();

function capitalize(str) {
  return (str.charAt(0).toUpperCase() + str.slice(1));
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

    const name = capitalize(args[0]);
    const url = 'https://elitebgs.app/api/ebgs/v5/systems?factionDetails=true&name=' + name;
    async function fetchURL() {
      let response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      } else {
          return await response.json();
      }
    }
    fetchURL()
    .then((data) => {
      let inf = [];
      let i = 0;
      while(data.docs[0].factions[i]) {
          inf.push(data.docs[0].factions[i].faction_details.faction_presence.influence);
          i++;
      }
      const inf_sorted = inf.sort(function(a, b){return b - a});
      inf_lead = ((inf[0] - inf[1]) * 100).toFixed(2);
      message.channel.send('The system ' + name + " has an inf lead of " + inf_lead);
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
        
        const name = capitalize(args[0]);
        let page = 1;
        let systems = [];
        let governments_raw = [];
        let lastResult = [];
        let last_update_elitebgs_raw = [];
        let power = [];
        let power_state = [];
        let last_update_eddb_raw = [];
        const url = 'https://elitebgs.app/api/ebgs/v5/systems?sphere=true&referenceDistance=15&referenceSystem=' + name;
        do {
          try {
            console.log('function page ' + page);
            const response = await fetch(url + '&page=' + page);
            const data = await response.json();
            lastResult = data;
            let i = 0;
            do {
              console.log('data fill');
              systems.push(data.docs[i].name);
              governments_raw.push(data.docs[i].government);
              last_update_elitebgs_raw.push(data.docs[i].updated_at);

              console.log('eddbapi accessing');
              const eddb_response = await fetch('https://eddbapi.kodeblox.com/api/v4/populatedsystems?name=' + data.docs[i].name);
              const eddb_data = await eddb_response.json();
              power.push(eddb_data.docs[0].power);
              power_state.push(eddb_data.docs[0].power_state);
              last_update_eddb_raw.push(eddb_data.docs[0].updated_at);
              i++;
            } while(data.docs[i]);
            page++;
          } catch (err) {
            console.error(`Error: ${err}`);
          }
        } while (lastResult.hasNextPage !== false);

        let display = 'Sphere Analysis of ' + name + '\nSystem/Government/Last Updated/Power Presence/Last Updated\n\n';
        let i, ideal_systems = 0;
        for (i = 1; i <= systems.length - 1; i++) { // Skip control system
          let government = governments_raw[i].slice(12, -1);
          let last_update_elitebgs = last_update_elitebgs_raw[i].slice(5, 10);
          let last_update_eddb = last_update_eddb_raw[i].slice(5, 10);
          if (government === "corporate") {
            ideal_systems++;
          }
          display = display + systems[i] + '\t' + capitalize(government) + '\t' + last_update_elitebgs + '\t';
          if (power[i] !== null) {
            display = display + power[i] + '\t' + power_state[i] + '\t' + last_update_eddb;
          }
          display = display + '\n';

        }
        let total_systems = systems.length;
        display = display + '\n' + ideal_systems + '/' + (total_systems - 1) + ' desired governments in place for expansion.';
        message.channel.send(display);

      }
      findSphere();
  }
});
client.login(token);