/* eslint-disable no-bitwise */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
// eslint-disable-next-line no-unused-vars
const request = require('request');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');
const split = require('split');
const columnify = require('columnify');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

let newTick = '';
const today = new Date();
const client = new Discord.Client(); // game start!

function isOnline(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) reject(error);

      if (response.statusCode !== 200) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject(`Invalid status code <${response.statusCode}>`);
      }
      resolve(body);
    });
  });
}

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

function capitalize(str) {
  const words = str.split(' ');
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(' ');
}

function popToCC(pop) { // CC given per system population
  const CC = 1 + Math.round(Math.log10(pop));
  if (CC >= 11) {
    return 11;
  }
  return CC;
}

function distLessThan(dist, x1, y1, z1, x2, y2, z2) { // length of a vector
  const a = x2 - x1;
  const b = y2 - y1;
  const c = z2 - z1;
  const length = Math.sqrt((a * a) + (b * b) + (c * c));

  if (length <= dist) {
    return true;
  }
  return false;
}

function lastUpdated(date) {
  // Convert Unix time to UTC
  const lastUpdate = new Date(date);
  let lastDay = lastUpdate.getDate();
  // lower date by 1 if update was before tick that day
  if (lastUpdate.getDate() > newTick.getDate()) {
    lastDay--;
  } else if (lastUpdate.getDate() === newTick.getDate()
  && lastUpdate.getTime() <= newTick.getTime()) {
    lastDay--;
  }
  return `${lastUpdate.getMonth() + 1}/${lastDay}`;
}

function eddbBackup(message, input) {
  const systemData = [];
  let inputX;
  let inputY;
  let inputZ;
  const data = fs.readFileSync(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.json`, 'utf8');
  let i = 0;
  const obj = JSON.parse(data);

  while (obj[i]) {
    if (obj[i].population > 0) {
      if (input.toLowerCase() === (obj[i].name).toLowerCase()) {
        inputX = obj[i].x;
        inputY = obj[i].y;
        inputZ = obj[i].z;
      }
    }
    i++;
  }
  if (inputX === undefined) { // if system entered does not exist
    message.channel.send('Something went wrong; was there a typo?');
    console.log('command aborted');
    return 'error';
  }
  i = 0;
  while (obj[i]) {
    if (distLessThan(15, inputX, inputY, inputZ, obj[i].x, obj[i].y, obj[i].z) === true
      && obj[i].name !== 'Shinrarta Dezhra' // you know where this is
      && obj[i].name !== 'Azoth' // 10 starter systems
      && obj[i].name !== 'Dromi'
      && obj[i].name !== 'Lia Fall'
      && obj[i].name !== 'Matet'
      && obj[i].name !== 'Orna'
      && obj[i].name !== 'Otegine'
      && obj[i].name !== 'Sharur'
      && obj[i].name !== 'Tarnkappe'
      && obj[i].name !== 'Tyet'
      && obj[i].name !== 'Wolfsegen') {
      // inf math alternative for eddb json
      let j = 0;
      let controllingInf;
      let secondInf;
      const infs = [];
      while (obj[i].minor_faction_presences[j]) {
        if (obj[i].controlling_minor_faction_id === obj[i].minor_faction_presences[j].minor_faction_id) {
          controllingInf = obj[i].minor_faction_presences[j].influence;
        }
        infs.push(obj[i].minor_faction_presences[j].influence);
        j++;
      }
      infs.sort((a, b) => b - a);
      if (infs[0] === controllingInf) {
        secondInf = infs[1];
      } else {
        secondInf = infs[0]; // allowing for if highest inf faction != controlling faction
      }

      const system = {};
      system.name = obj[i].name;
      system.id = obj[i].id;
      system.government = obj[i].government;
      system.lead = (controllingInf - secondInf).toFixed(2);
      system.date = lastUpdated(obj[i].minor_factions_updated_at * 1000); // convert from unix timestamp
      systemData.push(system);
    }
    i++;
  }
  systemData.sort((a, b) => a.id - b.id); // sorts systems by ID lowest to highest
  return systemData;
}

async function ebgsOrEddb(message, url, input) {
  let online = 2;
  try {
    await isOnline('https://elitebgs.app');
    online = 1;
  } catch (error) {
    online = 0;
    console.error('ERROR:');
    console.error(error);
  }
  const systemData = [];
  if (online === 1) {
    const json = await getURL(url);
    console.log('got response');
    if (json.total === 0) { // if system entered does not exist
      message.channel.send('Something went wrong; was there a typo?');
      console.log('command aborted');
      return 'error';
    }
    const ebgsPromises = [];
    for (let i = 1; i < json.pages + 1; i++) { // pages starts at 1
      const delay = i * 500;
      const promise = new Promise((resolve) => setTimeout(resolve, delay)).then(() => fetch(`https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${input}&page=${i}`));
      ebgsPromises.push(promise);
    }
    const responses = await Promise.all(ebgsPromises);
    const data = await Promise.all(responses.map((response) => response.json()));
    let i = 0;
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
          const system = {};
          system.name = data[i].docs[j].name;
          system.id = data[i].docs[j].eddb_id;
          // determining controlling faction's government
          let k = 0;
          while (data[i].docs[j].factions[k]) {
            if (data[i].docs[j].controlling_minor_faction_cased === data[i].docs[j].factions[k].name) {
              system.government = capitalize(data[i].docs[j].factions[k].faction_details.government);
            }
            k++;
          }
          system.lead = infLead(data[i], j);
          system.date = lastUpdated(data[i].docs[j].updated_at);
          systemData.push(system); // push object with names to array
        }
        j++; // increment system selection
      } while (data[i].docs[j]);
      i++;
    } while (data[i]);
    i = 0; // reset for readStream loop
    systemData.sort((a, b) => a.id - b.id); // sorts systems by ID lowest to highest
    return systemData;
  // eslint-disable-next-line no-else-return
  } else if (online === 0) {
    // yes this is messy, sorry
    return eddbBackup(message, input);
  } else {
    console.log(`online status: ${online}\nSomething has gone terribly wrong`);
    message.channel.send('Uhhh.. you really shouldn\'t be seeing this error. Please report this to the bot owner.');
    return 'error';
  }
}

function mirrorEddb() {
  const download = (url, path, callback) => {
    request.head(url, () => {
      request(url)
        .pipe(fs.createWriteStream(path))
        .on('close', callback);
    });
  };
  const urlOne = 'https://eddb.io/archive/v6/systems_populated.jsonl';
  const urlTwo = 'https://eddb.io/archive/v6/systems_populated.json';
  // save file as data for day before
  const pathOne = `systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`;
  const pathTwo = `systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.json`;
  download(urlOne, pathOne, () => {
    exec(`truncate -s -1 systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`, (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });
    const now = new Date();
    console.log(`EDDB jsonl mirrored at ${now}`);
  });
  download(urlTwo, pathTwo, () => {
    exec(`truncate -s -1 systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`, (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });
    const now = new Date();
    console.log(`EDDB json mirrored at ${now}`);
  });
}

function removeQuotes(input) {
  if (input[0] === '"' && input[0] === input[input.length - 1]) {
    return input.slice(1, -1);
  }
  return input;
}

/* function withinCube(dist, x1, y1, z1, x2, y2, z2) {
  if (x2 < x1 + 10 && x2 > x1 - 10 && y2 < y1 + 10 && y2 > y1 - 10 && z2 < z1 + 10 && z2 > z1 - 10) {
    return true;
  }
  return false;
} */

client.on('ready', () => {
  console.info('Logged in!');
  client.user.setActivity('All systems online');
  // mirror eddb file and remove the last blank line
  mirrorEddb();

  // tick handling
  getURL('https://elitebgs.app/api/ebgs/v5/ticks')
    .then((tickData) => {
      console.log('initial tick get!');
      newTick = new Date(tickData[0].time);
    })
    .catch((err) => console.log(`Tick get failed, ${err}`));

  setInterval(() => { // grab tick every minute
    getURL('https://elitebgs.app/api/ebgs/v5/ticks')
      .then((tickData) => {
        newTick = new Date(tickData[0].time);
      })
      .catch((err) => console.log(`Tick get failed, ${err}`));
  }, 60000);
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  if (command === 'lead') {
    console.log('working on lead...');
    let input = '';
    if (!args.length) { // take all input after sphere and designate it the target system
      return message.channel.send('Please define a reference system.');
    } if (args.length > 1) {
      input = args[0];
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];
    input = removeQuotes(input);

    getURL('https://elitebgs.app/api/ebgs/v5/systems?factionDetails=true&name=', input)
      .then((data) => {
        const lead = infLead(data);
        message.channel.send(`The system ${input} has an inf lead of ${lead}`);
      })
      .catch((e) => {
        console.log(`Error: ${e.message}`);
      });
  } else if (command === 'sphere') {
    console.log('working on sphere');
    message.channel.send('Calculating...');
    let input = '';
    let inputPower = 'Aisling';
    if (!args.length) { // take all input after sphere and designate it the target system
      return message.channel.send('Please define a reference system.');
    }
    if (args[0].substring(0, 1) === '-') {
      inputPower = capitalize(args[0].substring(1));
      args.shift();
    }
    if (args.length > 1) {
      input = args[0]; // start at first argument to avoid an extra ' ' from for loop
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];

    // Power name sanitization
    if (inputPower === 'Zachary' || inputPower === 'Hudson') {
      inputPower = 'Hudson';
    } else if (inputPower === 'Felica' || inputPower === 'Winters') {
      inputPower = 'Winters';
    } else if (inputPower !== 'Aisling') { // if not any powers supported
      message.channel.send('Input power was not found; either it is not yet supported, or there may be a typo.');
      return;
    }

    // if systems are seperated with "", remove them for processing
    input = removeQuotes(input);

    const url = `https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${input}`;
    ebgsOrEddb(message, url, input) // if ebgs is online, use that, otherwise use eddb data
      .then((tmpData) => {
        let systemData = [];
        if (tmpData === 'error') { // little jank but works
          return;
        }
        systemData = Array.from(tmpData);

        let freeCC = 0;
        let favorableSystems = 0;
        let unfavorableSystems = 0;
        let neutralSystems = 0;
        let refSysPowerState = '';
        let refSysPower = '';
        const exploitedData = [];
        let i = 0;
        let refSys;
        console.log('reading local file');
        fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
          .pipe(split(JSON.parse))
          .on('data', (obj) => { // this iterates through every system
            if (systemData[i] != null) {
              if (obj.id === systemData[i].id) {
                // Account for exploited systems
                const exploitedSystem = {};
                if ((obj.name).toLowerCase() === input.toLowerCase()) {
                  refSys = obj.name;
                  freeCC += popToCC(obj.population);
                  refSysPowerState = obj.power_state;
                  refSysPower = obj.power;
                } else if (obj.power_state === 'Exploited') { // If exploited system
                  exploitedSystem.power = obj.power;
                  exploitedSystem.cc = popToCC(obj.population);
                  exploitedData.push(exploitedSystem);
                  // to be contested systems will not count towards triggers
                } else if (obj.power_state === 'Contested' || obj.power_state === 'Control') {
                  // contested systems do not count towards triggers
                } else {
                  freeCC += popToCC(obj.population);
                }

                // Add data to object array
                systemData[i].cc = popToCC(obj.population);
                systemData[i].power = obj.power;
                systemData[i].state = obj.power_state;
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
              exploitedCCStr = '';
              let exploitedCC = 0;
              for (i = 0; i < exploitedData.length; i++) { // Add CC by power
                if (powerName === exploitedData[i].power) {
                  exploitedCC += exploitedData[i].cc;
                } else {
                  exploitedCCStr = `${exploitedCCStr + exploitedCC} CC will be contested with ${powerName}\n`;
                  powerName = exploitedData[i].power;
                  exploitedCC = exploitedData[i].cc;
                }
              }
              exploitedCCStr = `${exploitedCCStr + exploitedCC} CC will be contested with ${powerName}\n`; // Needed for last iteration
            }

            // calculate favorable/neutral/unfavorable systems
            i = 0;
            while (systemData[i]) {
              if (systemData[i].name === refSys) {
                systemData.splice(i, 1);
                i--;
              } else if (refSysPowerState === 'Control' && refSysPower === 'Aisling Duval') {
                if (systemData[i].state !== 'Contested') {
                  if (systemData[i].government === 'Communism' || systemData[i].government === 'Cooperative'
                      || systemData[i].government === 'Confederacy') {
                    favorableSystems++;
                  } else if (systemData[i].government === 'Feudal' || systemData[i].government === 'Prison Colony'
                      || systemData[i].government === 'Theocracy') {
                    unfavorableSystems++;
                  } else { // all others, aka if neutral
                    neutralSystems++;
                  }
                }
              } else if (inputPower === 'Aisling') {
                if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Exploited'
                  && systemData[i].state !== 'Control') {
                  if (systemData[i].government === 'Corporate') {
                    favorableSystems++;
                  } else if (systemData[i].government === 'Communism' || systemData[i].government === 'Cooperative'
                      || systemData[i].government === 'Feudal' || systemData[i].government === 'Patronage') {
                    unfavorableSystems++;
                  } else { // all others, aka if neutral
                    neutralSystems++;
                  }
                }
              } else if (inputPower === 'Hudson') {
                if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Exploited'
                  && systemData[i].state !== 'Control') {
                  if (systemData[i].government === 'Feudal' || systemData[i].government === 'Patronage') {
                    favorableSystems++;
                  } else if (systemData[i].government === 'Dictatorship') {
                    unfavorableSystems++;
                  } else { // all others, aka if neutral
                    neutralSystems++;
                  }
                }
              } else if (inputPower === 'Winters') {
                if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Exploited'
                  && systemData[i].state !== 'Control') {
                  if (systemData[i].government === 'Corporate') {
                    favorableSystems++;
                  } else if (systemData[i].government === 'Communism' || systemData[i].government === 'Cooperative'
                      || systemData[i].government === 'Feudal' || systemData[i].government === 'Patronage') {
                    unfavorableSystems++;
                  } else { // all others, aka if neutral
                    neutralSystems++;
                  }
                }
              }
              i++;
            }

            // shenanigans to get the sort to work correctly when null values exist
            i = 0;
            while (systemData[i]) {
              if (systemData[i].power === null) {
                systemData[i].power = '';
              }
              if (systemData[i].state === null) {
                systemData[i].state = '';
              }
              i++;
            }
            // These three sorts produce an output sorted by power first, gov second
            systemData.sort((a, b) => { // sorts systems by government
              const nameA = a.government;
              const nameB = b.government;
              if (nameA < nameB) { return -1; }
              if (nameA > nameB) { return 1; }
              return 0;
            });
            systemData.sort((a, b) => { // sorts systems by power state
              const nameA = a.state;
              const nameB = b.state;
              if (nameA < nameB) { return -1; }
              if (nameA > nameB) { return 1; }
              return 0;
            });
            systemData.sort((a, b) => { // sorts systems by power
              const nameA = a.power;
              const nameB = b.power;
              if (nameA < nameB) { return -1; }
              if (nameA > nameB) { return 1; }
              return 0;
            });

            let columns = columnify(systemData); // tabularize info
            // In case of >2000 character message overflow
            let overflowColumns = '';
            if (columns.length >= 2000) {
              const subStr = columns.substring(0, 1900); // for some reason, it needs to be decently <2000
              let index;
              i = 0;
              let flag = 0;
              while (flag === 0) { // search substring for starting index of latest system name below 2000 chars, with intent to make a new message from that starting point
                if (subStr.search(systemData[i].name) !== -1) {
                  index = subStr.search(systemData[i].name);
                } else { flag = 1; }
                i++;
              }
              overflowColumns = columns.substring(index);
              columns = columns.substring(0, index);
            }
            message.channel.send(`\`\`\`ini\n[${refSys} Control Sphere Analysis]\n\n${columns}\n\`\`\``);
            if (overflowColumns.length > 0) {
              message.channel.send(`\`\`\`\n${overflowColumns}\n\`\`\``);
            }

            let footerInfo = '';
            let setType = 'expansion';
            if (refSysPowerState === 'Control' && refSysPower === 'Aisling Duval') {
              inputPower = 'Aisling';
              setType = 'control';
            } else {
              footerInfo = `${freeCC} CC gained by ${inputPower} expansion\n${exploitedCCStr}`;
            }
            message.channel.send(`\`\`\`\n${favorableSystems}/${neutralSystems}/${unfavorableSystems} favorable/neutral/unfavorable systems for ${inputPower} ${setType}\n${
              footerInfo
            }\n\`\`\``);

            console.log('command done');
          })
          .on('error', (err) => {
            console.log(err);
          });
      });
  } else if (command === 'tick') {
    console.log('tick\'d');
    getURL('https://elitebgs.app/api/ebgs/v5/ticks')
      .then((data) => {
        const tick = new Date(data[0].time);
        const tickEmbed = new Discord.MessageEmbed()
          .setColor('#0055b3')
          .setURL('https://elitebgs.app/tick')
          .setDescription(`**Latest tick was at**
          ${tick.getUTCHours()}:${tick.getUTCMinutes()} UTC, ${tick.toString().slice(4, 7)} ${tick.getUTCDate()}`)
          // .setThumbnail('https://i.imgur.com/wSTFkRM.png')
          .setTimestamp();

        message.channel.send(tickEmbed);
      })
      .catch((err) => { console.log(`Error: ${err.message}`); });
  } else if (command === 'multisphere') {
    console.log('working on multisphere');
    message.channel.send('Calculating...');
    let input = '';
    const inputs = [];
    if (!args.length || args[0][0] !== '"') { // take all input after sphere and designate it the target system
      return message.channel.send('Please define reference systems using "" (example: ~multisphere "Zhao" "Psi Octantis").');
    }
    // account for multi-word and multiple systems, seperated by ""
    // combine all arguments into one string, input
    input = args[0];
    for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }

    // find all indicies of "
    const indicies = [];
    for (let i = 0; i < input.length; i++) {
      if (input[i] === '"') indicies.push(i);
    }
    if (indicies.length % 2 !== 0) { // input sanitization
      message.channel.send('Invalid input, please try again.');
      return;
    }
    for (let i = 0; i < indicies.length / 2; i++) { // populate inputs
      inputs.push(input.substring(indicies[i * 2] + 1, indicies[(i * 2) + 1]));
    }
    if (inputs.length <= 1) { // if one/none system
      message.channel.send('This command requires at least 2 input systems');
      return;
    }

    const spheresPromises = [];
    const ebgsPromises = [];
    for (let i = 0; i < inputs.length; i++) {
      const delay = i * 1000;
      const promise = new Promise((resolve) => setTimeout(resolve, delay)).then(() => fetch(`https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${inputs[i]}`));
      spheresPromises.push(promise);
    }
    Promise.all(spheresPromises)
      .then((responses) => Promise.all(responses.map((response) => response.json())))
      .then((spheresData) => {
        const pages = [];
        let i = 0;
        let page = 0;
        // for every sphere, find a list of systems
        while (spheresData[i]) {
          if (spheresData[i].total === 0) { // if system entered does not exist
            message.channel.send('Something went wrong; was there a typo?');
            console.log('command aborted');
            return;
          }
          for (let j = 1; j < spheresData[i].pages + 1; j++) { // page starts at 1
            const iterator = i; // make variable safe
            const delay = j * 1000;
            const promise = new Promise((resolve) => setTimeout(resolve, delay)).then(() => fetch(`https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${inputs[iterator]}&page=${j}`));
            ebgsPromises.push(promise);
            page++;
          }
          pages.push(page);
          i++;
        }
        Promise.all(ebgsPromises)
          .then((responses) => Promise.all(responses.map((response) => response.json())))
          .then((data) => {
            // const totalSys = [];
            // let freeCC = 0;
            // let favorableSystems = 0;
            let overlapTotalCC = 0;
            const sphereData = [];
            let systemData = [];
            // const exploitedData = [];
            const overlapData = [];
            let sphereNumber = 0;
            const refSys = []; // reference systems
            i = 0;
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
                  if (i === 0 && j === 0) { // Store first system name
                    refSys.push(data[i].docs[j].factions[0].faction_details.faction_presence.system_name);
                  }
                  if (pages[sphereNumber] < i + 1) { // when the pages enter a new sphere
                    refSys.push(data[i].docs[j].factions[0].faction_details.faction_presence.system_name);
                    // if (totalSys.length === 0) { // totalSys is additive
                    //   totalSys.push(data[i].docs[j].total);
                    // } else { totalSys.push(totalSys[i - 1] + data[i].docs[j].total); }
                    sphereData.push(systemData);
                    systemData = []; // clear systems to prepare for the next sphere
                    sphereNumber++;
                  }
                  const system = {};
                  system.name = data[i].docs[j].name;
                  system.id = data[i].docs[j].eddb_id;
                  system.lead = infLead(data[i], j);
                  system.date = lastUpdated(data[i].docs[j].last_updated);
                  systemData.push(system); // push object with names to array
                }
                j++; // increment system selection
              } while (data[i].docs[j]);
              i++; // increment page selection
            } while (data[i]);
            sphereData.push(systemData); // push last sphere
            for (i = 0; i < sphereData.length; i++) {
              sphereData[i].sort((a, b) => a.id - b.id); // sorts systems by ID lowest to highest
            }
            console.log('reading local file');
            i = 0; // reset for readStream split loop
            let j = 0;
            fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
              .pipe(split(JSON.parse))
              .on('data', (obj) => { // this iterates through every system
                let overlapIndicator = 0;
                let lastLead;
                for (i = 0; i < sphereData.length; i++) { // iterate through spheres
                  for (j = 0; j < sphereData[i].length; j++) { // iterate through systems
                    if (obj.id === sphereData[i][j].id) { // if system matched eddb entry
                      overlapIndicator++;
                      // Account for exploited systems
                      /* const exploitedSystem = {};
                      for (i = 0; i < refSys.length; i++) {
                        if (obj.name === refSys[i]) {
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
                            favorableSystems++;
                          }
                        }
                      } */
                      // Add data to object array
                      sphereData[i][j].government = obj.government;
                      // reorganize lead in the displayed order
                      const tmp = sphereData[i][j].lead;
                      delete sphereData[i][j].lead;
                      sphereData[i][j].lead = tmp;
                      sphereData[i][j].cc = popToCC(obj.population);
                      sphereData[i][j].power = obj.power;
                      sphereData[i][j].state = obj.power_state;
                      lastLead = tmp;
                    }
                  }
                }
                if (overlapIndicator > 1) {
                  const overlapSystem = {};
                  overlapSystem.name = obj.name;
                  overlapSystem.government = obj.government;
                  overlapSystem.lead = lastLead;
                  overlapSystem.cc = popToCC(obj.population);
                  overlapSystem.power = obj.power;
                  overlapSystem.state = obj.power_state;
                  overlapData.push(overlapSystem);
                  overlapTotalCC += popToCC(obj.population);
                }
              })
              .on('close', () => { // acting as .then for createReadStream
                // remove id from values so they can be columnified
                i = 0;
                while (sphereData[i]) {
                  while (sphereData[j]) {
                    delete sphereData[i][j].id;
                    j++;
                  }
                  j = 0;
                  i++;
                } /*
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
                } */
                let refSysStr = '';
                for (i = 0; i < refSys.length; i++) {
                  refSysStr += `${refSys[i]}, `;
                }
                refSysStr = refSysStr.slice(0, -2);
                const overlapColumns = columnify(overlapData); // tabularize info
                message.channel.send(`\`\`\`ini\n[${refSysStr} Sphere Overlap Analysis]\n\n${overlapColumns}\n\`\`\``);
                message.channel.send(`\`\`\`${overlapTotalCC} CC inside the overlap\n\`\`\``);
                console.log('command done');
              })
              .on('error', (err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(`Promise problem: ${err.message}`);
            message.channel.send('Something went wrong, likely elitebgs.app being difficult. Please try again, or if the problem persists, contact Cynder#7567');
          });
      })
      .catch((err) => { console.log(`Fetch problem: ${err.message}`); });
  } else if (command === 'cc') {
    console.log('working on cc');
    message.channel.send('Calculating...');
    let input = '';
    if (!args.length) { // take all input after cc and designate it the target power
      return message.channel.send('Please define a reference power.');
    }
    if (args.length > 1) {
      input = args[0]; // start at first argument to avoid an extra ' ' from for loop
      for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
    } else input = args[0];
    // if input is seperated with "", remove them for processing
    input = removeQuotes(input);

    const controlSystems = [];
    let cc = 0;
    let unique = 0;
    let capitalizationFlag = 0;
    let power = '';
    // grab all control systems for the power
    fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
      .pipe(split(JSON.parse))
      .on('data', (obj) => { // this iterates through every system
        if (obj.power !== null) {
          if ((obj.power).toLowerCase() === input.toLowerCase() && capitalizationFlag === 0) { // properly capitalize input
            power = obj.power;
            capitalizationFlag++;
          }
          if (obj.power === power && obj.power_state === 'Control') {
            cc += popToCC(obj.population);
            unique++;
            const controlSystem = {};
            controlSystem.name = obj.name;
            controlSystem.x = obj.x;
            controlSystem.y = obj.y;
            controlSystem.z = obj.z;
            controlSystems.push(controlSystem);
          }
        }
      })
      .on('close', () => {
        const countedSystems = [];
        // grab all unique exploited systems for the power
        fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
          .pipe(split(JSON.parse))
          .on('data', (sys) => { // this iterates through every system
            if (sys.population > 0) {
              for (let i = 0; i < controlSystems.length; i++) {
                if (distLessThan(15, controlSystems[i].x, controlSystems[i].y, controlSystems[i].z, sys.x, sys.y, sys.z) === true && sys.power_state !== 'Contested' && sys.power_state !== 'Control') { // if system is within sphere of control system
                  console.log(`Ref: ${controlSystems[i].name}`);
                  let counted = 0;
                  for (let j = 0; j < countedSystems.length; j++) {
                    if (sys.name === countedSystems[j]) {
                      counted++;
                    }
                  }
                  if (counted === 0) {
                    cc += popToCC(sys.population);
                    countedSystems.push(sys.name);
                    unique++;
                    console.log(`${sys.name}, ${sys.power_state}, ${popToCC(sys.population)} CC`);
                  }
                }
              }
            }
          })
          .on('close', () => {
            if (cc !== 0) {
              message.channel.send(`${power} has a sum of ${cc} CC across ${unique} systems.`);
            } else { message.channel.send('Something went wrong. Was there a typo?'); }
          })
          .on('error', (err) => {
            console.log(err);
          });
      })
      .on('error', (err) => {
        console.log(err);
      });
  } else if (command === 'help') {
    message.channel.send(`\`\`\`Current Version: 0.7.0
    All data is as up-to-date as possible (via eddb), bot can receive dms. Dates shown are roughly auto-corrected to tick timings.
    
    Commands:
    ~lead <system> takes a system and finds the inf% difference between the highest inf% faction, and the 2nd highest
    ~sphere -<power (optional)> <system> designated a system as a control system, and grabs data for all populated systems within a 15ly sphere. If the target system is a control system, instead shows control ratios. Only supports Hudson/Winters/Aisling currently. Example: ~sphere -Hudson Mbambiva
    ~tick shows the last tick time
    ~multisphere <system 1> <system 2> ... <system i> shows all systems overlapped by the 15ly spheres of the input systems.
    ~cc <power> shows the total cc and systems controlled by a power
    
    The dates shown reflect when the leads were last updated; the Powerplay info is updated daily at 1am CST, via EDDB\n\`\`\``);
  }
});
client.login(token);
