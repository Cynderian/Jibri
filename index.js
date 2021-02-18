/* eslint-disable consistent-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
const fetch = require('node-fetch');
const columnify = require('columnify');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();

function capitalize(str) {
  const words = str.split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(' ');
}

async function getURL(url, name, page = 1) {
  const response = await fetch(`${url + name}&page=${page}`);
  return response.json();
}

function infLead(data, sys = 0) {
  let inf = [];
  let i = 0;
  do {
    inf.push(data.docs[sys].factions[i].faction_details.faction_presence.influence);
    i++;
  } while (data.docs[sys].factions[i]);
  inf = inf.sort((a, b) => b - a);
  return (((inf[0] - inf[1]) * 100).toFixed(2));
}

function popToCC(pop) { // CC given per system population
  if (pop < 3200) { return 4; }
  if (pop < 30000) { return 5; }
  if (pop < 300000) { return 6; }
  if (pop < 3000000) { return 7; }
  if (pop < 30000000) { return 8; }
  if (pop < 300000000) { return 9; }
  if (pop < 3000000000) { return 10; }
  return 11;
}

async function findSphere(urlsys, message) {
  let refSysFlag = 0;
  let page = 1;
  let total = 0;
  let idealSystems = 0;
  let lastResult;
  const systemData = [];
  const contestedData = [];
  let sysCC;
  let input;
  let freeCC = 0;
  const url = `https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${urlsys}`;
  do {
    try {
      console.log(`function page ${page}`);
      const response = await fetch(`${url}&page=${page}`);
      const ebgsData = await response.json();
      if (ebgsData.total === 0) { // if system entered does not exist
        message.channel.send('Something went wrong; was there a typo?');
        console.log('command aborted');
        return;
      }

      lastResult = ebgsData.hasNextPage;
      let i = 0;
      do {
        console.log(`data fill ${i}`);
        // Check for special systems, excluded from PP/BGS
        if (ebgsData.docs[i].name !== 'Shinrarta Dezhra' // you know where this is
          && ebgsData.docs[i].name !== 'Azoth' // 10 starter systems
          && ebgsData.docs[i].name !== 'Dromi'
          && ebgsData.docs[i].name !== 'Lia Fall'
          && ebgsData.docs[i].name !== 'Matet'
          && ebgsData.docs[i].name !== 'Orna'
          && ebgsData.docs[i].name !== 'Otegine'
          && ebgsData.docs[i].name !== 'Sharur'
          && ebgsData.docs[i].name !== 'Tarnkappe'
          && ebgsData.docs[i].name !== 'Tyet'
          && ebgsData.docs[i].name !== 'Wolfsegen') {
          total++; // increment for every system that passes the filter
          const eddbResponse = await fetch(`https://eddbapi.kodeblox.com/api/v4/populatedsystems?name=${ebgsData.docs[i].name}`);
          const eddbData = await eddbResponse.json();

          if (i === 0 && refSysFlag === 0) { // Store first system name for capitalization purposes
            input = ebgsData.docs[0].factions[0].faction_details.faction_presence.system_name;
            refSysFlag++;
          }

          sysCC = popToCC(ebgsData.docs[i].population);

          const system = {};
          const contestedSys = {};
          system.name = ebgsData.docs[i].name;
          system.government = capitalize((ebgsData.docs[i].government).slice(12, -1));
          system.lead = infLead(ebgsData, i);
          system.gov_date = capitalize(`${(ebgsData.docs[i].updated_at).slice(5, 7)}/${(ebgsData.docs[i].updated_at).slice(8, 10)}`);
          system.cc = sysCC;
          if (eddbData.docs[0].power != null) { // So null values do not go to capitalize
            system.power = capitalize(eddbData.docs[0].power);
            system.state = capitalize(eddbData.docs[0].power_state);
            if (eddbData.docs[0].power_state === 'exploited') { // If exploited system
              contestedSys.power = capitalize(eddbData.docs[0].power);
              contestedSys.cc = sysCC;
              contestedData.push(contestedSys);
            }
          } else {
            system.power = null;
            if (eddbData.docs[0].power_state === 'contested') {
              system.state = capitalize(eddbData.docs[0].power_state);
              total--;
            } else {
              system.state = null;
              freeCC += sysCC;
            }
          }
          system.pow_date = capitalize(`${(eddbData.docs[0].updated_at).slice(5, 7)}/${(eddbData.docs[0].updated_at).slice(8, 10)}`);
          systemData.push(system);

          if ((ebgsData.docs[i].government).slice(12, -1) === 'corporate' && eddbData.docs[0].power_state !== 'contested') { idealSystems++; } // Find # of ideal systems
        }
        i++;
      } while (ebgsData.docs[i]);
      page++;
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  } while (lastResult);

  // convert contested CC values into readable strings
  contestedData.sort((a, b) => { // Sort by power alphabetically
    const nameA = a.power;
    const nameB = b.power;
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  let powerName = contestedData[0].power;
  let contestedCCStr = '\n';
  let contestedCC = 0;
  for (let i = 0; i < contestedData.length; i++) { // Add CC by power
    if (powerName === contestedData[i].power) {
      contestedCC += contestedData[i].cc;
    } else {
      contestedCCStr = `${contestedCCStr + contestedCC}CC is contested with ${powerName}\n`;
      powerName = contestedData[i].power;
      contestedCC = 0;
    }
  }
  contestedCCStr = `${contestedCCStr + contestedCC}CC is contested with ${powerName}\n`; // Needed for last iteration

  const columns = columnify(systemData);
  console.log('message sent');
  message.channel.send(`\`\`\`ini\n[${input} Control Sphere Analysis]\n\n${columns}\n\`\`\``); // tabularize info
  message.channel.send(`\`\`\`\n${idealSystems}/${total - 1} favorable systems for Aisling expansion` // favorable systems footer
    + `\n${freeCC}CC gained by Aisling expansion${// CC gain footer
      contestedCCStr // CC contested footer
    }\n\`\`\``);
}

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}`);
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'lead') {
    console.log('Working on lead...');
    if (!args.length) {
      return message.channel.send('Please define a reference system.');
    } if (args.length > 1) {
      return message.channel.send('Error, too many arguments.');
    }
    const input = capitalize(args[0]);
    getURL('https://elitebgs.app/api/ebgs/v5/systems?factionDetails=true&name=', input)
      .then((data) => {
        const lead = infLead(data);
        message.channel.send(`The system ${input} has an inf lead of ${lead}`);
      })
      .catch((e) => {
        console.log(`Error: ${e.message}`);
      });
  } else if (command === 'sphere') {
    console.log('Working on sphere...');
    message.channel.send('Calculating...');
    let input = '';
    if (!args.length) { // take all input after sphere and designate it the target system
      return message.channel.send('Please define a reference system.');
    } if (args.length > 1) {
      input = args[0];
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];
    console.log(`input: ${input}`);

    findSphere(input, message);
  } else if (command === 'sphere2') {
    console.log('Working...');
    message.channel.send('Calculating...');
    let input = '';
    if (!args.length) { // take all input after sphere and designate it the target system
      return message.channel.send('Please define a reference system.');
    } if (args.length > 1) {
      input = args[0];
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];
    console.log(`input: ${input}`);

    const ebgsPromises = [];
    const eddbPromises = [];
    fetch(`https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${input}`)
      .then((response) => response.json())
      .then((json) => {
        for (let i = 1; i < json.pages + 1; i++) { // page # starts at 1
          ebgsPromises.push(fetch(`https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${input}&page=${i}`));
        }
        Promise.all(ebgsPromises)
          .then((responses) => Promise.all(responses.map((response) => response.json())))
          .then((data) => {
            let i = 0;
            const systemData = [];
            do { // Iterate through each page
              let j = 0;
              do { // Iterate through each system
                const system = {};
                console.log(data[i].docs[j].name);
                system.name = data[i].docs[j].name;
                systemData.push(system);
                eddbPromises.push(fetch(`${data[i].docs[j].name}`));
                j++;
              } while (data[i].docs[j]);
              i++;
            } while (data[i]);
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((err) => { console.log(`Fetch problem: ${err.message}`); });
  }
});
client.login(token);
