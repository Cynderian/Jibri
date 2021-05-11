/* eslint-disable no-bitwise */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-console */
/* eslint-disable no-plusplus */
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

function inputPowerFilter(message, input) {
  let casedInput = input.charAt(0).toUpperCase() + input.slice(1);
  casedInput = input.toLowerCase();
  if (casedInput === 'zachary' || casedInput === 'hudson') {
    return 'Zachary Hudson';
  // eslint-disable-next-line no-else-return
  } else if (casedInput === 'felicia' || casedInput === 'winters' || casedInput === 'winter') {
    return 'Felicia Winters';
  } else if (casedInput === 'arissa' || casedInput === 'lavigny-duval' || casedInput === 'ald') {
    return 'Arissa Lavigny-Duval';
  } else if (casedInput === 'edmund' || casedInput === 'mahon') {
    return 'Edmund Mahon';
  } else if (casedInput === 'archon' || casedInput === 'delaine') {
    return 'Archon Delaine';
  } else if (casedInput === 'denton' || casedInput === 'patreus') {
    return 'Denton Patreus';
  } else if (casedInput === 'yuri' || casedInput === 'grom') {
    return 'Yuri Grom';
  } else if (casedInput === 'li' || casedInput === 'yong-rui' || casedInput === 'lyr') {
    return 'Li Yong-Rui';
  } else if (casedInput === 'zemina' || casedInput === 'torval') {
    return 'Zemina Torval';
  } else if (casedInput === 'rranav' || casedInput === 'antal') {
    return 'Pranav Antal';
  } else if (casedInput === 'aisling' || casedInput === 'aisling duval') {
    return 'Aisling Duval';
  } else {
    return undefined;
  }
}

function HQDistances(power, x, y, z) {
  let HQx;
  let HQy;
  let HQz;
  if (power === 'Aisling Duval') {
    HQx = 128.28125;
    HQy = -155.625;
    HQz = 84.21875;
  }
  if (power === 'Arissa Lavigny-Duval') {
    HQx = 110;
    HQy = -99.96875;
    HQz = -13.375;
  }
  if (power === 'Edmund Mahon') {
    HQx = -11;
    HQy = 77.84375;
    HQz = -0.875;
  }
  if (power === 'Zachary Hudson') {
    HQx = -14.78125;
    HQy = 19.65625;
    HQz = -15.25;
  }
  if (power === 'Archon Delaine') {
    HQx = -99.25;
    HQy = -100.96875;
    HQz = 20.40625;
  }
  if (power === 'Denton Patreus') {
    HQx = 49.5;
    HQy = -104.03125;
    HQz = 6.3125;
  }
  if (power === 'Yuri Grom') {
    HQx = -20.5;
    HQy = -4.96875;
    HQz = 60.6875;
  }
  if (power === 'Felicia Winters') {
    HQx = 58.125;
    HQy = 22.59375;
    HQz = -28.59375;
  }
  if (power === 'Li Yong-Rui') {
    HQx = -43.25;
    HQy = -64.34375;
    HQz = -77.6875;
  }
  if (power === 'Zemina Torval') {
    HQx = 51.78125;
    HQy = -76.40625;
    HQz = 28.71875;
  }
  if (power === 'Pranav Antal') {
    HQx = -79.90625;
    HQy = -87.46875;
    HQz = -33.53125;
  }

  const a = x - HQx;
  const b = y - HQy;
  const c = z - HQz;
  return Math.sqrt((a * a) + (b * b) + (c * c));
}

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
      const delay = i * 200;
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
    i = 0;
    systemData.sort((a, b) => a.id - b.id); // sorts systems by ID lowest to highest
    return systemData;
  } if (online === 0) {
    // yes this is messy, sorry
    return eddbBackup(message, input);
  }
  console.log(`online status: ${online}\nSomething has gone terribly wrong`);
  message.channel.send('Uhhh.. you really shouldn\'t be seeing this error. Please report this to the bot owner.');
  return 'error';
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
    exec(`truncate -s -1 systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`, (error) => {
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });
    const now = new Date();
    console.log(`EDDB jsonl mirrored at ${now}`);
  });
  download(urlTwo, pathTwo, () => {
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
    let inputPower;
    if (!args.length) { // take all input after sphere and designate it the target system
      return message.channel.send('Please define a reference system.');
    }
    // Power name sanitization
    if (args[0].substring(0, 1) === '-') { // Support for old format
      inputPower = inputPowerFilter(message, args[0].substring(1));
      args.shift();
    } else {
      inputPower = inputPowerFilter(message, args[0]);
      if (inputPower === undefined) {
        inputPower = 'Aisling Duval'; // default
      } else { args.shift(); }
    }
    if (args[0]) {
      if (args.length > 1) {
        input = args[0]; // start at first argument to avoid an extra ' ' from for loop
        for (let i = 1; i < args.length; i++) { input = `${input} ${args[i]}`; }
      } else input = args[0];
    } else {
      return message.channel.send('Please define a reference system.');
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

        let grossCC = 0;
        let favorableSystems = 0;
        let unfavorableSystems = 0;
        let neutralSystems = 0;
        let powerControlSys = 0;
        let netContestedCC = 0;
        let refSysx;
        let refSysy;
        let refSysz;
        const exploitedData = [];

        let i = 0;
        let refSys;
        let refSysPower = '';
        let refSysPowerState = '';
        console.log('reading local file');
        fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
          .pipe(split(JSON.parse))
          .on('data', (obj) => { // this iterates through every system
            if ((obj.name).toLowerCase() === input.toLowerCase()) {
              refSys = obj.name;
              refSysPower = obj.power;
              refSysPowerState = obj.power_state;
              if (refSysPowerState === 'Control') {
                inputPower = refSysPower;
              }
            }
          })
          .on('close', () => {
            i = 0;
            fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
              .pipe(split(JSON.parse))
              .on('data', (obj) => { // this iterates through every system
                if (systemData[i] != null) {
                  if (obj.id === systemData[i].id) {
                    // Account for exploited systems
                    const exploitedSystem = {};
                    if ((obj.name).toLowerCase() === input.toLowerCase()) {
                      grossCC += popToCC(obj.population);
                      refSysx = obj.x;
                      refSysy = obj.y;
                      refSysz = obj.z;
                    } else if (obj.power_state === 'Exploited') { // If exploited system
                      exploitedSystem.power = obj.power;
                      exploitedSystem.cc = popToCC(obj.population);
                      exploitedData.push(exploitedSystem);
                      // to be contested systems will not count towards triggers
                      grossCC += popToCC(obj.population);
                    } else if (obj.power_state === 'Contested') {
                      netContestedCC += popToCC(obj.population);
                      // contested systems do not count towards triggers
                      grossCC += popToCC(obj.population);
                    } else if (obj.power_state === 'Control') {
                      // control systems do not count towards triggers
                      grossCC += popToCC(obj.population);
                    } else {
                      grossCC += popToCC(obj.population);
                    }

                    // Add data to object array
                    systemData[i].cc = popToCC(obj.population);
                    systemData[i].power = obj.power;
                    systemData[i].state = obj.power_state;
                    i++;
                  }
                }
                if (obj.power === inputPower && obj.power_state === 'Control') {
                  powerControlSys++;
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
                let netExploitedCC = 0;
                let exploitedCC = 0;
                if (exploitedData.length !== 0) {
                  let powerName = exploitedData[0].power; // set initial power
                  exploitedCCStr = '';
                  exploitedCC = 0;
                  for (i = 0; i < exploitedData.length; i++) { // Add CC by power
                    if (powerName === exploitedData[i].power) {
                      exploitedCC += exploitedData[i].cc;
                      netExploitedCC += exploitedData[i].cc;
                    } else {
                      const tmp = powerName.split(' ');
                      exploitedCCStr += `Contested with ${tmp[0]}: ${exploitedCC}CC\n`;
                      powerName = exploitedData[i].power;
                      exploitedCC = exploitedData[i].cc;
                      netExploitedCC += exploitedData[i].cc;
                    }
                  }
                  const tmp = powerName.split(' ');
                  exploitedCCStr += `Contested with ${tmp[0]}: ${exploitedCC}CC\n`; // Needed for last iteration
                }
                // math for cc calculations
                const HQDistance = HQDistances(inputPower, refSysx, refSysy, refSysz);
                let overhead;
                if (refSysPower === 'Control') {
                  overhead = (Math.min(((11.5 * (powerControlSys)) / 42) ** 3, 5.4 * 11.5 * powerControlSys)) / powerControlSys;
                } else {
                  // powerControlSys + 1 is due to the additional system added via the expansion itself
                  overhead = (Math.min(((11.5 * (powerControlSys + 1)) / 42) ** 3, 5.4 * 11.5 * (powerControlSys + 1))) / (powerControlSys + 1);
                }
                const overheadMax = (Math.min(((11.5 * (55)) / 42) ** 3, 5.4 * 11.5 * 55)) / 55;
                const upkeep = Math.ceil((HQDistance ** 2) * 0.001 + 20);
                // console.log(`${grossCC} ${overhead} ${upkeep} ${netExploitedCC} ${netContestedCC}`);
                let netCC = grossCC - overhead - upkeep - netExploitedCC - netContestedCC;
                let netCCMax = grossCC - overheadMax - upkeep - netExploitedCC - netContestedCC;
                // calculate favorable/neutral/unfavorable systems
                i = 0;
                while (systemData[i]) {
                  // highlights control system in list
                  if (systemData[i].name === refSys && refSysPowerState !== 'Control') {
                    // removes control system from list
                    // systemData.splice(i, 1);
                    // i--;
                    // autocorrect to reading controlled sphere state if sleected system is Control
                  } else if (refSysPowerState === 'Control') {
                    // Control Ethos
                    // Social
                    if (refSysPower === 'Aisling Duval' || refSysPower === 'Archon Delaine') {
                      if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Control') {
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
                    }
                    // Combat
                    if (refSysPower === 'Arissa Lavigny-Duval' || refSysPower === 'Denton Patreus'
                  || refSysPower === 'Zachary Hudson') {
                      if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Control') {
                        if (systemData[i].government === 'Feudal' || systemData[i].government === 'Patronage') {
                          favorableSystems++;
                        } else if (systemData[i].government === 'Dictatorship') {
                          unfavorableSystems++;
                        } else { // all others, aka if neutral
                          neutralSystems++;
                        }
                      }
                    }
                    // Finance
                    if (refSysPower === 'Edmund Mahon' || refSysPower === 'Felicia Winters'
                  || refSysPower === 'Li Yong-Rui') {
                      if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Control') {
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
                    // Covert
                    if (refSysPower === 'Pranav Antal' || refSysPower === 'Zemina Torval'
                  || refSysPower === 'Yuri Grom') {
                      if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Control') {
                        if (systemData[i].government === 'Feudal' || systemData[i].government === 'Communism'
                          || systemData[i].government === 'Dictatorship' || systemData[i].government === 'Cooperative') {
                          favorableSystems++;
                        } else if (systemData[i].government === 'Democracy') {
                          unfavorableSystems++;
                        } else { // all others, aka if neutral
                          neutralSystems++;
                        }
                      }
                    }
                  } else {
                    // Expansion Ethos
                    // Social
                    if (inputPower === 'Pranav Antal') {
                      if (systemData[i].state !== 'Contested' && systemData[i].state !== 'Exploited'
                    && systemData[i].state !== 'Control') {
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
                    }
                    // Combat
                    if (inputPower === 'Zachary Hudson' || inputPower === 'Arissa Lavigny-Duval'
                  || inputPower === 'Archon Delaine' || inputPower === 'Denton Patreus'
                  || inputPower === 'Yuri Grom') {
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
                    }
                    // Finance
                    if (inputPower === 'Aisling Duval' || inputPower === 'Felicia Winters'
                  || inputPower === 'Edmund Mahon' || inputPower === 'Li Yong-Rui'
                  || inputPower === 'Zemina Torval') {
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
                // puts target system at bottom
                i = 0;
                while (systemData[i]) {
                  if (refSys === systemData[i].name) {
                    systemData.push(systemData[i]);
                    systemData.splice(i, 1);
                    break;
                  }
                  i++;
                }

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

                // footer setup
                let footerInfo = '';
                let setType = 'Expansion';
                let expFort = 0;
                let umOpp = 0;
                let oppOrFortInfo = '';
                if (refSysPowerState === 'Control') {
                  setType = 'Control';
                  netCC += netExploitedCC;
                  netCCMax += netExploitedCC;
                  inputPower = refSysPower;
                  if (favorableSystems > neutralSystems && favorableSystems > unfavorableSystems) {
                    expFort = Math.round(0.5 * (0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5)); // favorable fort trigger
                  } else if (unfavorableSystems > neutralSystems && unfavorableSystems > favorableSystems) {
                    expFort = Math.round(1.5 * (0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5)); // unfavorable fort trigger
                  } else {
                    expFort = Math.round(0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5); // neutral fort trigger
                  }
                  umOpp = Math.round(2750000 / (HQDistance ** 1.5) + 5000); // opposition trigger
                  oppOrFortInfo = `${expFort} to fortify, ${umOpp} to undermine`;
                } else {
                  footerInfo = `${exploitedCCStr}`;
                }

                // add max overhead if power is not at max already
                let maxOverheadStr = `/ ${netCCMax.toFixed(1)}CC at max overhead`;
                if (powerControlSys >= 55) {
                  maxOverheadStr = '';
                }

                // warning addition
                let warningStr = '';
                if (refSysPowerState === 'Exploited') {
                  warningStr = `-- Warning: Target system is already exploited by ${refSysPower} --\n`;
                } else if (refSysPowerState === 'Expansion') {
                  warningStr = `-- Warning: Target system is currently being expanded from by ${refSysPower} --\n`;
                }

                // output
                message.channel.send(`\`\`\`ini\n[${refSys} ${setType} Sphere Analysis] ${oppOrFortInfo}\n${warningStr}\n${columns}\n\`\`\``);
                if (overflowColumns.length > 0) {
                  message.channel.send(`\`\`\`\n${overflowColumns}\n\`\`\``);
                }
                message.channel.send(`\`\`\`\n${favorableSystems}/${neutralSystems}/${unfavorableSystems} favorable/neutral/unfavorable systems for ${inputPower}\nSphere gross value: ${grossCC}CC\n${footerInfo}Upkeep + Overhead: ${upkeep} + ${overhead.toFixed(1)}\nNet CC gained: ${netCC.toFixed(1)}CC ${maxOverheadStr}\n\`\`\``);

                console.log('command done');
              })
              .on('error', (err) => {
                console.log(err);
              });
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
          ${tick.getHours()}:${tick.getMinutes()}, ${tick.toString().slice(4, 7)} ${tick.getDate()}`)
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
    let overlapData = [];
    let allSystems = [];
    for (let i = 0; i < inputs.length; i++) {
      const delay = i * 200;
      const promise = new Promise((resolve) => setTimeout(resolve, delay)).then(() => ebgsOrEddb(message, `https://elitebgs.app/api/ebgs/v5/systems?sphere=true&factionDetails=true&referenceDistance=15&referenceSystem=${inputs[i]}`, inputs[i]));
      spheresPromises.push(promise);
    }
    Promise.all(spheresPromises)
      .then((tmpData) => {
        let i = 0;
        while (tmpData[i]) {
          if (tmpData[i] === 'error') { // little jank but works
            return;
          }
          i++;
        }

        // populate overlapData
        i = 0;
        let j = 0;
        let k = 0;
        // i is all systems in a specific sphere
        // j is all data for a specific system
        // k is the index in the list of all systems
        while (tmpData[i]) {
          j = 0;
          while (tmpData[i][j]) {
            k = 0;
            if (i === 0) {
              allSystems.push(tmpData[i][j]);
            } else {
              while (allSystems[k]) {
                if (allSystems[k].name === tmpData[i][j].name) {
                  overlapData.push(tmpData[i][j]);
                }
                k++;
              }
            }
            j++;
          }
          if (i !== 0) {
            allSystems = [];
            allSystems = Array.from(overlapData);
            overlapData = [];
          }
          i++;
        }
        overlapData = Array.from(allSystems);

        // add data to overlapData
        i = 0;
        fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
          .pipe(split(JSON.parse))
          .on('data', (obj) => { // this iterates through every system
            if (overlapData[i] != null) {
              if (obj.id === overlapData[i].id) {
                overlapData[i].CC = popToCC(obj.population);
                overlapData[i].power = obj.power;
                overlapData[i].state = obj.power_state;
                i++;
              }
            }
          })
          .on('close', () => { // acting as .then for createReadStream
            // properly capitalize input systems
            // delete ids
            i = 0;
            const refSys = [];
            while (overlapData[i]) {
              j = 0;
              while (inputs[j]) {
                if ((overlapData[i].name).toLowerCase() === inputs[j].toLowerCase()) {
                  refSys.push(overlapData[i].name);
                }
                j++;
              }
              delete overlapData[i].id;
              i++;
            }
            let refSysStr = '';
            for (i = 0; i < refSys.length; i++) {
              refSysStr += `${refSys[i]}, `;
            }
            refSysStr = refSysStr.slice(0, -2);
            const overlapColumns = columnify(overlapData); // tabularize info
            message.channel.send(`\`\`\`ini\n[${refSysStr} Sphere Overlap Analysis]\n\n${overlapColumns}\n\`\`\``);
            console.log('command done');
          })
          .on('error', (err) => {
            console.log(err);
          });
      });
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
    input = capitalize(removeQuotes(input));
    input = inputPowerFilter(message, input);
    if (input === undefined) {
      return;
    }

    const controlSystems = [];
    let cc = 0;
    let unique = 0;
    // grab all control systems for the power
    fs.createReadStream(`systems_populated_${today.getMonth() + 1}_${today.getDate() - 1}_${today.getFullYear()}.jsonl`)
      .pipe(split(JSON.parse))
      .on('data', (obj) => { // this iterates through every system
        if (obj.power !== null) {
          if (obj.power === input && obj.power_state === 'Control') {
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
                  }
                }
              }
            }
          })
          .on('close', () => {
            if (cc !== 0) {
              message.channel.send(`${input} has a sum of ${cc} CC across ${unique} systems.`);
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
    // readability
    const version = 'Current Version: 0.8.3';
    const preamble = 'All data is as up-to-date as possible via eddb and elitebgs. Jibri can receive dms, and does not log data for any commands given. The default power is Aisling.\n\n';
    const lead = '~lead <system> takes a system and finds the inf% difference between the controlling faction and the next highest\n';
    const sphere = '~sphere <power (optional)> <system> designates a system as a midpoint, and grabs data for all populated systems within a15ly sphere. If the target system is a control system, instead automatically shows control data. Example: ~sphere Winters Mbambiva\n';
    const multisphere = '~multisphere <system 1> <system 2> ... <system n> shows all systems overlapped by the 15ly spheres of the input systems.\n';
    const tick = '~tick shows the last tick time\n';
    const cc = '~cc <power> shows the total cc and systems controlled and exploited by a power\n';
    const postamble = 'The dates shown reflect when the leads were last updated, and are roughly autocorrected to the last tick time.\n Powerplay info is pulled from EDDB daily at 2am CST\n';
    message.channel.send(`\`\`\`\n${version}\n ${preamble}Commands:\n${lead}${sphere}${multisphere}${cc}${tick}\n ${postamble}\`\`\``);
  }
});
client.login(token);
