/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
const fetch = require('node-fetch');
const fs = require('fs');
const split = require('split');
const { exec } = require('child_process');
const columnify = require('columnify');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const channel = '810285631460474940'; // TODO: un-hardcode
let newTick = '';

const client = new Discord.Client(); // game start!

/* function capitalize(str) {
  const words = str.split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(' ');
} */

async function getURL(base, ...args) { // pass url and the ?/&
  // pass name, then page
  let url = base;
  if (args.length !== 0) {
    if (args.length <= 1) {
      url += `&name=${args[0]}`;
    }
    if (args.length <= 2) {
      url += `&page=${args[1]}`;
    }
  }
  const response = await fetch(url);
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

function lastUpdated(eddbData) {
  // Convert Unix time to UTC
  const lastUpdate = new Date(eddbData.updated_at * 1000);
  let lastDay = lastUpdate.getDate();
  // lower date by 1 if update was before tick that day
  if (lastUpdate.getDate() > newTick.getDate()) {
    lastDay--;
  } else if (lastUpdate.getDate() === newTick.getDate()
  && lastUpdate.getTime() <= newTick.getTime()) { // TODO: replace if needed after tick update
    lastDay--;
  }
  return `${lastUpdate.getMonth() + 1}/${lastDay}`;
}

function makeEmbed(message, color, type, nameStr, leadStr, dateStr) {
  const redAlertEmbed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(`${type} systems`)
    .addFields(
      { name: 'System', value: nameStr, inline: true },
      { name: 'Lead', value: leadStr, inline: true },
      { name: 'Date', value: dateStr, inline: true },
    );
  message.channel.send(redAlertEmbed);
}

client.on('ready', () => {
  console.info('Logged in!');
  client.user.setActivity('All systems online');
  // mirror eddb file and remove the last blank line
  /* exec('wget -N \'https://eddb.io/archive/v6/systems_populated.jsonl\' && truncate -s -1 systems_populated.jsonl', (error, stdout, stderr) => {
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    if (error !== null) {
      console.log(`exec error: ${error}`);
    }
  }); */ // TODO: create alarm so this updates daily

  // tick handling
  if (channel.length > 0) { // check if channel is defined
    // TODO: When permanent hosting aquired, daily tick option
    const lastTick = new Date();
    setTimeout(() => { // TODO: fix so it grabs tick daily, not every startup
      getURL('https://elitebgs.app/api/ebgs/v5/ticks')
        .then((data) => {
          newTick = new Date(data[0].time);
          if (lastTick < newTick) {
          //  client.channels.cache.get(channel).send('```ini\n[--------------------------]\n[-          TICK          -]\n[--------------------------]\n```');
          }
        })
        .catch((err) => { console.log(`Error: ${err.message}`); });
    }, 1000);
  }
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'lead') {
    console.log(`${message.author.username}#${message.author.discriminator} working on lead...`);
    let input = '';
    if (!args.length) { // take all input after sphere and designate it the target system
      return message.channel.send('Please define a reference system.');
    } if (args.length > 1) {
      input = args[0];
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];
    getURL('https://elitebgs.app/api/ebgs/v5/systems?factionDetails=true&name=', input)
      .then((data) => {
        const lead = infLead(data);
        message.channel.send(`The system ${input} has an inf lead of ${lead}`);
      })
      .catch((e) => {
        console.log(`Error: ${e.message}`);
      });
  } else if (command === 'sphere') {
    console.log(`${message.author.username}#${message.author.discriminator} working on sphere`);
    message.channel.send('Calculating...');
    let input = '';
    if (!args.length) { // take all input after sphere and designate it the target system
      return message.channel.send('Please define a reference system.');
    } if (args.length > 1) {
      input = args[0];
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];
    const ebgsPromises = [];
    fetch(`https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${input}`)
      .then((response) => response.json())
      .then((json) => { // find # of pages
        console.log('got response');
        if (json.total === 0) { // if system entered does not exist
          message.channel.send('Something went wrong; was there a typo?');
          console.log('command aborted');
          return;
        }
        for (let i = 1; i < json.pages + 1; i++) { // page starts at 1
          const delay = i * 500;
          const promise = new Promise((resolve) => setTimeout(resolve, delay)).then(() => fetch(`https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${input}&page=${i}`));
          ebgsPromises.push(promise);
        }
        Promise.all(ebgsPromises)
          .then((responses) => Promise.all(responses.map((response) => response.json())))
          .then((data) => {
            let i = 0;
            let total = 0;
            let freeCC = 0;
            let idealSystems = 0;
            const lead = [];
            const systemData = [];
            const exploitedData = [];
            let refSys; // reference system
            do { // Iterate through each page
              let j = 0;
              do { // Iterate through each system
                // Check for special systems, excluded from PP/BGS
                if (data[i].docs[j].name !== 'Shinrarta Dezhra' // you know where this is
                && data[i].docs[j].name !== 'Azoth' // 10 starter systems
                && data[i].docs[j].name !== 'Dromi'
                && data[i].docs[j].name !== 'Lia Fall'
                && data[i].docs[j].name !== 'Matet'
                && data[i].docs[j].name !== 'Orna'
                && data[i].docs[j].name !== 'Otegine'
                && data[i].docs[j].name !== 'Sharur'
                && data[i].docs[j].name !== 'Tarnkappe'
                && data[i].docs[j].name !== 'Tyet'
                && data[i].docs[j].name !== 'Wolfsegen') {
                  total++; // increment total trigger counting systems
                  if (i === 0 && j === 0) { // Store first system name for capitalization purposes
                    refSys = data[i].docs[j].factions[0].faction_details.faction_presence.system_name;
                  }
                  // console.log(`reading system ${i}:${j}`); // debug
                  const system = {};
                  system.name = data[i].docs[j].name;
                  system.id = data[i].docs[j].eddb_id;
                  systemData.push(system); // push object with names to array
                  // assign these later to maintain order for columnify
                  lead.push(infLead(data[i], j));
                }
                j++; // increment system selection
              } while (data[i].docs[j]);
              i++;
            } while (data[i]);
            i = 0; // reset for readStream loop
            systemData.sort((a, b) => a.id - b.id); // sorts systems by ID lowest to highest
            console.log('reading local file');
            fs.createReadStream('./systems_populated.jsonl')
              .pipe(split(JSON.parse))
              .on('data', (obj) => { // this iterates through every system
                // TODO: find a way around manually removing the final space on systems_population,
                // so theres not an unexpected json file end
                if (systemData[i] != null) {
                  if (obj.id === systemData[i].id) {
                    // Account for exploited systems
                    const exploitedSystem = {};
                    if (obj.name === refSys) {
                      freeCC += popToCC(obj.population);
                      total--;
                    } else if (obj.power_state === 'Exploited') { // If exploited system
                      exploitedSystem.power = obj.power;
                      exploitedSystem.cc = popToCC(obj.population);
                      exploitedData.push(exploitedSystem);
                      total--; // to be contested systems will not count towards triggers
                    } else if (obj.power_state === 'Contested' || obj.power_state === 'Control') {
                      total--; // contested systems do not count towards triggers
                    } else {
                      freeCC += popToCC(obj.population);
                      if (obj.government === 'Corporate') {
                        idealSystems++;
                      }
                    }

                    // Add data to object array
                    systemData[i].government = obj.government;
                    systemData[i].lead = lead[i];
                    systemData[i].cc = popToCC(obj.population);
                    systemData[i].power = obj.power;
                    systemData[i].state = obj.power_state;
                    systemData[i].date = lastUpdated(obj);
                    i++;
                  }
                }
              })
              .on('close', () => { // acting as .then for createReadStream
                i = 0;
                while (systemData[i]) {
                  delete systemData[i].id;
                  i++;
                }
                // convert contested CC values into readable strings
                // Sort by power alphabetically
                exploitedData.sort((a, b) => {
                  const nameA = a.power;
                  const nameB = b.power;
                  if (nameA < nameB) { return -1; }
                  if (nameA > nameB) { return 1; }
                  return 0;
                });
                // convert to readable string
                let exploitedCCStr = '';
                if (exploitedData.length !== 0) {
                  let powerName = exploitedData[0].power; // set initial power
                  exploitedCCStr = '\n';
                  let exploitedCC = 0;
                  for (i = 0; i < exploitedData.length; i++) { // Add CC by power
                    if (powerName === exploitedData[i].power) {
                      exploitedCC += exploitedData[i].cc;
                    } else {
                      exploitedCCStr = `${exploitedCCStr + exploitedCC}CC will be contested with ${powerName}\n`;
                      powerName = exploitedData[i].power;
                      exploitedCC = exploitedData[i].cc;
                    }
                  }
                  exploitedCCStr = `${exploitedCCStr + exploitedCC}CC will be contested with ${powerName}\n`; // Needed for last iteration
                }
                const columns = columnify(systemData); // tabularize info
                message.channel.send(`\`\`\`ini\n[${refSys} Control Sphere Analysis]\n\n${columns}\n\`\`\``);
                message.channel.send(`\`\`\`\n${idealSystems}/${total} favorable systems for Aisling expansion` // favorable systems footer
                + `\n${freeCC}CC gained by Aisling expansion${// CC gain footer
                  exploitedCCStr // CC contested footer
                }\n\`\`\``);
                console.log('command done');
              })
              .on('error', (err) => {
                console.log(err);
              });
          })
          .catch((err) => { console.log(`Promise problem: ${err.message}`); });
      })
      .catch((err) => { console.log(`Fetch problem: ${err.message}`); });
  } else if (command === 'tick') {
    console.log(`${message.author.username}#${message.author.discriminator} tick'd`);
    getURL('https://elitebgs.app/api/ebgs/v5/ticks')
      .then((data) => {
        const tick = new Date(data[0].time);
        const tickEmbed = new Discord.MessageEmbed()
          .setColor('#0055b3')
          .setTitle('Tick Detected')
          .setURL('https://elitebgs.app/tick')
          .setDescription(`**Latest tick was at**
          ${tick.getUTCHours()}:${tick.getUTCMinutes()} UTC, ${tick.toString().slice(4, 7)} ${tick.getUTCDate()}`)
          // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
          .setTimestamp();

        message.channel.send(tickEmbed);
      })
      .catch((err) => { console.log(`Error: ${err.message}`); });
  } else if (command === 'scout') {
    console.log(`${message.author.username}#${message.author.discriminator} working on scout`);
    message.channel.send('Calculating...');
    let input = '';
    if (!args.length) { // take all input after sphere and designate it the target faction
      return message.channel.send('Please define a reference faction.');
    } if (args.length > 1) {
      input = args[0];
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];
    const factionSystems = [];
    // using elitebgs for data as eddb updates only at midnight, not close enough to tick
    getURL('https://elitebgs.app/api/ebgs/v5/factions?name=', input)
      .then((factionData) => {
        if (factionData.total === 0) { // if system entered does not exist
          message.channel.send('Something went wrong; was there a typo?');
          console.log('command aborted');
          return;
        }
        input = factionData.docs[0].name;
        let i = 0;
        // get names of all systems we control
        do {
          const factionSystem = {};
          factionSystem.name = (factionData.docs[0].faction_presence[i].system_name);
          factionSystems.push(factionSystem);
          i++;
        } while (factionData.docs[0].faction_presence[i]);
        // run through system api to get all faction infs in system
        const ebgsPromises = [];
        for (i = 0; i < factionSystems.length; i++) {
          const delay = (i + 1) * 500;
          const names = factionSystems[i].name;
          const promise = new Promise((resolve) => setTimeout(resolve, delay)).then(() => fetch(`https://elitebgs.app/api/ebgs/v5/systems?factionDetails=true&name=${names}`));
          ebgsPromises.push(promise);
        }
        Promise.all(ebgsPromises)
          .then((responses) => Promise.all(responses.map((response) => response.json())))
          .then((data) => {
            i = 0;

            do { // loop of all systems
              // find last updated day accounting for tick
              let dateStr = '';
              const lastUpdate = new Date(data[i].docs[0].updated_at);
              let lastDay = lastUpdate.getDate();
              // lower date by 1 if update was before tick that day
              if (lastUpdate.getDate() > newTick.getDate()) {
                lastDay--;
              } else if (lastUpdate.getDate() === newTick.getDate()
              && lastUpdate.getTime() <= newTick.getTime()) { // TODO: replace if needed after tick update
                lastDay--;
              }
              if (newTick.getDate() > lastDay) { // if the tick is 1+ days ahead of the last update
                dateStr = `${lastUpdate.getMonth() + 1}/${lastDay}(!)`;
              } else {
                dateStr = `${lastUpdate.getMonth() + 1}/${lastDay}`;
              }

              factionSystems[i].lead = infLead(data[i]);
              factionSystems[i].date = dateStr;
              i++;
            } while (data[i]);
            factionSystems.sort((a, b) => a.lead - b.lead); // sort from lowest to highest lead
            let redAlertSystemsNameStr = '';
            let redAlertSystemsLeadStr = '';
            let redAlertSystemsDateStr = '';
            let alertSystemsNameStr = '';
            let alertSystemsLeadStr = '';
            let alertSystemsDateStr = '';
            let reportSystemsNameStr = '';
            let reportSystemsLeadStr = '';
            let reportSystemsDateStr = '';
            let watchSystemsNameStr = '';
            let watchSystemsLeadStr = '';
            let watchSystemsDateStr = '';
            let safeSystemsNameStr = '';
            let safeSystemsLeadStr = '';
            let safeSystemsDateStr = '';
            for (i = 0; i < factionSystems.length; i++) {
              if (factionSystems[i].lead < 5) {
                redAlertSystemsNameStr += `${factionSystems[i].name}\n`;
                redAlertSystemsLeadStr += `${factionSystems[i].lead}\n`;
                redAlertSystemsDateStr += `${factionSystems[i].date}\n`;
              } else if (factionSystems[i].lead < 10) {
                alertSystemsNameStr += `${factionSystems[i].name}\n`;
                alertSystemsLeadStr += `${factionSystems[i].lead}\n`;
                alertSystemsDateStr += `${factionSystems[i].date}\n`;
              } else if (factionSystems[i].lead < 15) {
                reportSystemsNameStr += `${factionSystems[i].name}\n`;
                reportSystemsLeadStr += `${factionSystems[i].lead}\n`;
                reportSystemsDateStr += `${factionSystems[i].date}\n`;
              } else if (factionSystems[i].lead < 20) {
                watchSystemsNameStr += `${factionSystems[i].name}\n`;
                watchSystemsLeadStr += `${factionSystems[i].lead}\n`;
                watchSystemsDateStr += `${factionSystems[i].date}\n`;
              } else {
                safeSystemsNameStr += `${factionSystems[i].name}\n`;
                safeSystemsLeadStr += `${factionSystems[i].lead}\n`;
                safeSystemsDateStr += `${factionSystems[i].date}\n`;
              }
            }
            if (redAlertSystemsNameStr !== '') {
              makeEmbed(message, '#f05c44', 'Red Alert', redAlertSystemsNameStr, redAlertSystemsLeadStr, redAlertSystemsDateStr);
            }
            if (alertSystemsNameStr !== '') {
              makeEmbed(message, '#ff9c1c', 'Alert', alertSystemsNameStr, alertSystemsLeadStr, alertSystemsDateStr);
            }
            if (reportSystemsNameStr !== '') {
              makeEmbed(message, '#f8d404', 'Report', reportSystemsNameStr, reportSystemsLeadStr, reportSystemsDateStr);
            }
            if (watchSystemsNameStr !== '') {
              makeEmbed(message, '#58ec9c', 'Watch', watchSystemsNameStr, watchSystemsLeadStr, watchSystemsDateStr);
            }
            if (safeSystemsNameStr !== '') {
              makeEmbed(message, '#589c3c', 'Safe', safeSystemsNameStr, safeSystemsLeadStr, safeSystemsDateStr);
            }
          })
          .catch((err) => { console.log(`Error in promise.all: ${err.message}`); });
      })
      .catch((err) => { console.log(`Error: ${err.message}`); });
  }
});
client.login(token);
