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

function popToCC (pop) { // CC given per system population
  if (3200 > pop) {return 4;} else
  if (30000 > pop) {return 5;} else
  if (300000 > pop) {return 6;} else
  if (3000000 > pop) {return 7;} else
  if (30000000 > pop) {return 8;} else
  if (300000000 > pop) {return 9;} else
  if (3000000000 > pop) {return 10;} else
  {return 11;}
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
    message.channel.send("Calculating...");
    let input = '';
      if (!args.length) { // take all input after sphere and designate it the target system
        return message.channel.send('Please define a reference system.')
      } else if (args.length > 1) {
        input = args[0];
        for (let i = 1; i < args.length; i++)
          input = input + ' ' + args[i];
      } else input = args[0];
    console.log('input: ' + input);
    
    
    async function findSphere() {
      let ref_sys_flag = 0;
      let page = 1;
      let total = 0;
      let ideal_systems = 0;
      let lastResult;
      let systemData = [];
      let contestedData = [];
      let sys_cc;
      let free_cc = 0;
        const url = 'https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=' + input;
        do {
          try {
            console.log('function page ' + page);
            const response = await fetch(url + '&page=' + page);
            const data_ebgs = await response.json();
            if (data_ebgs.total == 0) { //if system entered does not exist
              message.channel.send('Something went wrong; was there a typo?');
              console.log('command aborted');
              return;
            }

            lastResult = data_ebgs.hasNextPage;
            let i = 0;
            do {
              console.log('data fill ' + i);
              total = data_ebgs.total;
              const eddb_response = await fetch('https://eddbapi.kodeblox.com/api/v4/populatedsystems?name=' + data_ebgs.docs[i].name);
              const data_eddb = await eddb_response.json();

              if (i == 0 && ref_sys_flag == 0) {
                input = data_ebgs.docs[0].factions[0].faction_details.faction_presence.system_name;
                ref_sys_flag++;
              }

              sys_cc = popToCC(data_ebgs.docs[i].population);

              let system = new Object();
              let contested_sys = new Object();
              system.name = data_ebgs.docs[i].name;
              system.government = capitalize((data_ebgs.docs[i].government).slice(12, -1));
              system.lead = infLead(data_ebgs, i);
              system.gov_date = capitalize((data_ebgs.docs[i].updated_at).slice(5, 7) + '/' + (data_ebgs.docs[i].updated_at).slice(8, 10));
              system.cc = sys_cc;
              if (data_eddb.docs[0].power != null) {// So null values do not go to capitalize
                system.power = capitalize(data_eddb.docs[0].power);
                system.state = capitalize(data_eddb.docs[0].power_state);
                if (data_eddb.docs[0].power_state == 'exploited') {
                  contested_sys.power = capitalize(data_eddb.docs[0].power);
                  contested_sys.cc = sys_cc;
                  contestedData.push(contested_sys);
                }
              } else {
                system.power = null;
                system.state = null;
                free_cc = free_cc + sys_cc;
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
        } while (lastResult);

        // convert contested CC values into readable strings
        contestedData.sort(function(a, b) { // Sort by power alphabetically
          var nameA = a.power;
          var nameB = b.power;
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
        console.log(contestedData);
        let power_name = contestedData[0].power;
        let cc_contested_str = '\n';
        let contested_cc = 0;
        for(let i = 0; i < contestedData.length; i++) { // Add CC by power
          if (power_name == contestedData[i].power) {
            contested_cc = contested_cc + contestedData[i].cc;
          } else {
            cc_contested_str = cc_contested_str + contested_cc + 'CC is contested with ' + power_name + '\n';
            power_name = contestedData[i].power;
            contested_cc = 0;
          }  
        }
        cc_contested_str = cc_contested_str + contested_cc + 'CC is contested with ' + power_name + '\n'; // Needed for last iteration


        var columns = columnify(systemData);
        console.log("message sent");
        message.channel.send('```ini\n[' + input +  ' Control Sphere Analysis]\n\n' + columns + '\n```'); // tabularize info
        message.channel.send('```\n' + ideal_systems + '/' + (total - 1) + ' favorable systems for Aisling expansion' // favorable systems footer
        + '\n' + free_cc + 'CC gained by Aisling expansion' // CC gain footer
        + cc_contested_str // CC contested footer
        + '\n```');
      }
      findSphere();
    }
});
client.login(token);