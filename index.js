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
const columnify = require('columnify');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

let newTick = new Date();
const today = new Date();
const client = new Discord.Client(); // game start!

function inputPowerFilter(message, input) {
	let casedInput = input.charAt(0).toUpperCase() + input.slice(1);
	casedInput = input.toLowerCase();
	if (casedInput === 'zachary' || casedInput === 'hudson') {
		return 'Zachary Hudson';
	}
  if (casedInput === 'felicia' || casedInput === 'winters' || casedInput === 'winter') {
		return 'Felicia Winters';
	}
  if (casedInput === 'arissa' || casedInput === 'lavigny-duval' || casedInput === 'ald') {
		return 'Arissa Lavigny-Duval';
	}
  if (casedInput === 'edmund' || casedInput === 'mahon') {
		return 'Edmund Mahon';
	}
  if (casedInput === 'archon' || casedInput === 'delaine') {
		return 'Archon Delaine';
	}
  if (casedInput === 'denton' || casedInput === 'patreus') {
		return 'Denton Patreus';
	}
  if (casedInput === 'yuri' || casedInput === 'grom') {
		return 'Yuri Grom';
	}
  if (casedInput === 'li' || casedInput === 'yong-rui' || casedInput === 'lyr') {
		return 'Li Yong-Rui';
	}
  if (casedInput === 'zemina' || casedInput === 'torval') {
		return 'Zemina Torval';
	}
  if (casedInput === 'pranav' || casedInput === 'antal') {
		return 'Pranav Antal';
	}
  if (casedInput === 'aisling' || casedInput === 'aisling duval' || casedInput === 'ad') {
		return 'Aisling Duval';
	}
	return undefined;
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

function favorability(power, government, state, systemPower, type) {
  // console.log(`${power} ${government} ${state} ${systemPower} ${type}`);
  // type can be 'Control' or 'Expansion'
  // Control Ethos
  if (type === 'Control') {
    // Social
    if ((power === 'Aisling Duval' || power === 'Archon Delaine')
      && state === 'Exploited') {
      if (government === 'Communism' || government === 'Cooperative' || government === 'Confederacy') {
        return 'favorable';
      } else if (government === 'Feudal' || government === 'Prison Colony' || government === 'Theocracy') {
        return 'unfavorable';
      }
      return 'neutral';
    }
    // Combat
    if ((power === 'Arissa Lavigny-Duval' || power === 'Denton Patreus' || power === 'Zachary Hudson')
      && state === 'Exploited') {
      if (government === 'Feudal' || government === 'Patronage') {
        return 'favorable';
      } else if (government === 'Dictatorship') {
        return 'unfavorable';
      }
      return 'neutral';
    }
    // Finance
    if ((power === 'Edmund Mahon' || power === 'Felicia Winters' || power === 'Li Yong-Rui')
      && state === 'Exploited') {
      if (government === 'Corporate') {
        return 'favorable';
      } else if (government === 'Communism' || government === 'Cooperative' || government === 'Feudal' || government === 'Patronage') {
        return 'unfavorable';
      }
      return 'neutral';
    }
    // Covert
    if ((power === 'Pranav Antal' || power === 'Zemina Torval' || power === 'Yuri Grom')
      && state === 'Exploited') {
      if (government === 'Feudal' || government === 'Communism' || government === 'Dictatorship' || government === 'Cooperative') {
        return 'favorable';
      }
      if (government === 'Democracy') {
        return 'unfavorable';
      }
      return 'neutral';
    }
  }
  // Expansion Ethos
  if (type === 'Expansion') {
    // Social
    if ((power === 'Pranav Antal')
      && (state === null || state === 'Expansion' || (state === 'Exploited' && systemPower === 'Pranav Antal'))) {
      if (government === 'Communism' || government === 'Cooperative' || government === 'Confederacy') {
        return 'favorable';
      } else if (government === 'Feudal' || government === 'Prison Colony' || government === 'Theocracy') {
        return 'unfavorable';
      }
      return 'neutral';
    }
    // Combat
    if ((power === 'Zachary Hudson' || power === 'Arissa Lavigny-Duval' || power === 'Archon Delaine' || power === 'Denton Patreus' || power === 'Yuri Grom')
      && (state === null || state === 'Expansion' || (state === 'Exploited' && (systemPower === 'Zachary Hudson' || systemPower === 'Arissa Lavigny-Duval' || systemPower === 'Archon Delaine' || systemPower === 'Denton Patreus' || systemPower === 'Yuri Grom')))) {
      if (government === 'Feudal' || government === 'Patronage') {
        return 'favorable';
      } else if (government === 'Dictatorship') {
        return 'unfavorable';
      }
      return 'neutral';
    }
    // Finance
    if ((power === 'Aisling Duval' || power === 'Felicia Winters' || power === 'Edmund Mahon' || power === 'Li Yong-Rui' || power === 'Zemina Torval')
      && (state === null || state === 'Expansion' || (state === 'Exploited' && (systemPower === power)))) {
      if (government === 'Corporate') {
        return 'favorable';
      } else if (government === 'Communism' || government === 'Cooperative' || government === 'Feudal' || government === 'Patronage') {
        return 'unfavorable';
      }
      return 'neutral';
    }
  }
  // Contested Systems
  if (state === 'Contested' || state === 'Control' || (type === 'Expansion' && state === 'Exploited' && systemPower !== power)) {
    return 0;
  }
  // Error
  return -1;
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

function infLead(obj) { // inf lead for eddb json
	const factions = [];
	for (let j = 0; j < obj.minor_faction_presences.length; j++) {
		const faction = {};
		faction.id = obj.minor_faction_presences[j].minor_faction_id;
		faction.inf = obj.minor_faction_presences[j].influence;
		factions.push(faction);
	}
	factions.sort((a, b) => b.inf - a.inf); // sorts systems by lead highest to lowest
	if (factions[0].id === obj.controlling_minor_faction_id) { // if controlling faction is highest inf
		return (factions[0].inf - factions[1].inf).toFixed(2);
	}
	for (let j = 0; j < factions.length; j++) {
		if (factions[j].id === obj.controlling_minor_faction_id) {
			return Number((factions[j].inf - factions[0].inf).toFixed(2));
		}
	}
}

function capitalize(str) {
	const words = str.split(' ');
	for (let i = 0; i < words.length; i++) {
		words[i] = words[i][0].toUpperCase() + words[i].substr(1);
	}
	return words.join(' ');
}

function popToCC(pop) { // CC given per system population
	if (pop === 0) {
		return 0;
	}
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
	let lastYear = lastUpdate.getFullYear();
	let lastMonth = lastUpdate.getMonth() + 1; // month counting starts at 0
	if (lastDay === 0) {
		lastDay = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth() - 1, 0).getDate(); // find days in previous month, month value is for the month after. For lastDay = 0 edge case
		if (lastMonth === 1) {
			lastYear -= 1;
			lastMonth = 12;
		} else {
			lastMonth -= 1;
		}
	}
	const lastTick = {};
	lastTick.year = lastYear;
	lastTick.month = lastMonth;
	lastTick.day = lastDay;
	return lastTick;
}

function mirrorEddb() {
	const download = (url, path, callback) => {
		request.head(url, () => {
			request(url)
				.pipe(fs.createWriteStream(path))
				.on('close', callback);
		});
	};

	const urlOne = 'https://eddb.io/archive/v6/systems_populated.json';
	const urlTwo = 'https://eddb.io/archive/v6/stations.json';
	// save file as data for day before
	const pathOne = `./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`;
	const pathTwo = './data/stations.json';
	exec('mkdir data', (error) => { console.log(error);});
	download(urlOne, pathOne, () => {
		const now = new Date();
		console.log(`EDDB populated systems json mirrored at ${now}`);
	});
	download(urlTwo, pathTwo, () => {
		const now = new Date();
		console.log(`EDDB station json mirrored at ${now}`);
	});
	let oldData = new Date();
	oldData = oldData.setDate(today.getDate() - 6); // find 6 days prior in ms
	oldData = new Date(oldData); // convert ms to Date object
	const oldJSON = `./data/systems_populated_${oldData.getMonth() + 1}_${oldData.getDate()}_${oldData.getFullYear()}.json`;
	fs.stat(oldJSON, (err) => { // check if old data exists
		if (err) return console.log(err);
		fs.unlink(oldJSON, () => { // delete old data
			console.log('file deleted successfully');
		});
	});
}

function removeQuotes(input) {
	if (input[0] === '"' && input[0] === input[input.length - 1]) {
		return input.slice(1, -1);
	}
	return input;
}

client.on('ready', () => {
	console.info('Logged in!');
	client.user.setActivity('All systems online');
	// mirror eddb file and remove the last blank line
	mirrorEddb(); // commented for testing

	// tick handling
	getURL('https://elitebgs.app/api/ebgs/v5/ticks')
		.then((tickData) => {
			console.log('initial tick get!');
			newTick = new Date(tickData[0].time);
		})
		.catch((err) => console.log(`Tick get failed, ${err}`));

	setInterval(() => { // grab tick every 5 minutes
		getURL('https://elitebgs.app/api/ebgs/v5/ticks')
			.then((tickData) => {
				newTick = new Date(tickData[0].time);
			})
			.catch((err) => console.log(`Tick get failed, ${err}`));
	}, 60000 * 5);
});

client.on('message', (message) => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
    if (command === 'sphere') {
		console.log('working on sphere');
		message.channel.send('Calculating...');
		if (!args.length) { // take all input after sphere and designate it the target system
			return message.channel.send('Please define a reference system.');
		}
		// Override to ignore system controlling/expanding power
		let override = 0;
		if (args[0] === '-o') {
			console.log('override enabled');
			override = 1;
			args.shift();
    }
		// power assignment
    let noInputPowerFlag = 0;
		let power = args[0]; // start at first argument to avoid an extra ' ' from for loop
		power = capitalize(removeQuotes(power)); // if input is seperated with "", remove them for processing
		power = inputPowerFilter(message, power);
		if (power === undefined) {
			power = 'Aisling Duval';
      noInputPowerFlag = 1;
		} else { args.shift(); }
    // sphere assignment
    let sphere = '';
		if (args[0]) {
      sphere = args[0];
			for (let i = 1; i < args.length; i++) {
				sphere += ` ${args[i]}`;
			}
		} else {
			return message.channel.send('Please define a reference system.');
		}
		// correct potential formatting errors
		sphere = (removeQuotes(sphere)).toLowerCase();
		const data = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
		const allSystems = JSON.parse(data);

    // variable declarations
    const targetSystems = [];
    const contestedSystems = [];
    let grossCC = 0;
    let controlledSystems = 0;
    let favorables = 0;
    let unfavorables = 0;
    let neutrals = 0;
    let favor = '';
    let warningFlag = '';

    // find input system's coords to use in distLessThan
    let sphereType = 'Expansion';
    const sphereCoords = {};
    // central system to base sphere off of
		for (let i = 0; i < allSystems.length; i++) {
			if (sphere === (allSystems[i].name).toLowerCase()) {
        sphere = allSystems[i].name;
				sphereCoords.x = allSystems[i].x;
				sphereCoords.y = allSystems[i].y;
				sphereCoords.z = allSystems[i].z;
        if (allSystems[i].power_state === 'Control') {
          sphereType = 'Control';
        }
        if (allSystems[i].power_state === 'Expansion') {
          warningFlag = 'Expansion';
        }
        if (allSystems[i].power_state === 'Exploited') {
          warningFlag = 'Exploited';
        }
        if ((allSystems[i].power_state === 'Control' || allSystems[i].power_state === 'Expansion')
          && override === 0) {
          power = allSystems[i].power;
        }
        break;
			}
		}
    // exit if system does not exist
		if (sphereCoords.x === undefined) {
      console.log('command aborted');
			return message.channel.send('Something went wrong; was there a typo?');
		}
    if (sphereType === 'Expansion' && noInputPowerFlag === 1) {
      message.channel.send('No power designated, assuming AD');
    }
		for (let i = 0; i < allSystems.length; i++) {
			if (allSystems[i].name !== 'Shinrarta Dezhra' // you know where this is
        && allSystems[i].name !== 'Azoth' // 10 starter systems
        && allSystems[i].name !== 'Dromi'
        && allSystems[i].name !== 'Lia Fall'
        && allSystems[i].name !== 'Matet'
        && allSystems[i].name !== 'Orna'
        && allSystems[i].name !== 'Otegine'
        && allSystems[i].name !== 'Sharur'
        && allSystems[i].name !== 'Tarnkappe'
        && allSystems[i].name !== 'Tyet'
        && allSystems[i].name !== 'Wolfsegen') {
        // count control systems of input power
        if (allSystems[i].power === power && allSystems[i].power_state === 'Control') {
          controlledSystems += 1;
        }
        if (distLessThan(15, sphereCoords.x, sphereCoords.y, sphereCoords.z, allSystems[i].x, allSystems[i].y, allSystems[i].z) === true) {
          const lastTick = lastUpdated(allSystems[i].minor_factions_updated_at * 1000); // convert from unix timestamp

          // displayed sphere data
          const system = {};
          system.name = allSystems[i].name;
          system.government = allSystems[i].government;
          system.lead = infLead(allSystems[i]);
          system.date = `${lastTick.month}/${lastTick.day}`;
          system.cc = popToCC(allSystems[i].population);
          system.power = allSystems[i].power;
          system.state = allSystems[i].power_state;
          targetSystems.push(system);

          // footer data
          // Favorable / Neutral / Unfavorable
          const tmp = favorability(power, allSystems[i].government, allSystems[i].power_state, allSystems[i].power, sphereType);
          if (tmp === 'favorable') {
            favorables += 1;
          }
          if (tmp === 'unfavorable') {
            unfavorables += 1;
          }
          if (tmp === 'neutral') {
            neutrals += 1;
          }
          if (tmp === -1) { console.log('favorability error'); }
          favor = `${favorables}/${neutrals}/${unfavorables}`;
          // Gross CC
          grossCC += popToCC(allSystems[i].population);
          // Control - Contested
          if (sphereType === 'Control' && allSystems[i].power_state === 'Contested') {
            for (let j = 0; j < allSystems.length; j++) {
              if (distLessThan(15, allSystems[i].x, allSystems[i].y, allSystems[i].z, allSystems[j].x, allSystems[j].y, allSystems[j].z)
                && allSystems[j].power_state === 'Control') {
                const system2 = {};
                system2.power = allSystems[j].power;
                system2.cc = popToCC(allSystems[j].population);
                contestedSystems.push(system2);
              }
            }
          }
          // Expansion - Contested
          if (sphereType === 'Expansion' && (allSystems[i].power_state === 'Exploited' || allSystems[i].power_state === 'Expansion')) {
            const system2 = {};
            system2.power = allSystems[i].power;
            system2.cc = popToCC(allSystems[i].population);
            contestedSystems.push(system2);
          }
        }
      }
    }
    // Control - Contested systems string-ification
    // generate blank objects for indexes
    const onelineContestedSystems = [];
    for (let i = 0; i < 11; i++) {
      const system = {};
      system.power = undefined;
      system.cc = 0;
      onelineContestedSystems.push(system);
    }
    for (let i = 0; i < contestedSystems.length; i++) {
      if (contestedSystems[i].power === 'Zachary Hudson') {
        onelineContestedSystems[0].power = contestedSystems[i].power;
        onelineContestedSystems[0].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Felicia Winters') {
        onelineContestedSystems[1].power = contestedSystems[i].power;
        onelineContestedSystems[1].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Arissa Lavigny-Duval') {
        onelineContestedSystems[2].power = contestedSystems[i].power;
        onelineContestedSystems[2].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Edmund Mahon') {
        onelineContestedSystems[3].power = contestedSystems[i].power;
        onelineContestedSystems[3].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Archon Delaine') {
        onelineContestedSystems[4].power = contestedSystems[i].power;
        onelineContestedSystems[4].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Denton Patreus') {
        onelineContestedSystems[5].power = contestedSystems[i].power;
        onelineContestedSystems[5].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Yuri Grom') {
        onelineContestedSystems[6].power = contestedSystems[i].power;
        onelineContestedSystems[6].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Li Yong-Rui') {
        onelineContestedSystems[7].power = contestedSystems[i].power;
        onelineContestedSystems[7].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Zemina Torval') {
        onelineContestedSystems[8].power = contestedSystems[i].power;
        onelineContestedSystems[8].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Pranav Antal') {
        onelineContestedSystems[9].power = contestedSystems[i].power;
        onelineContestedSystems[9].cc += contestedSystems[i].cc;
      }
      if (contestedSystems[i].power === 'Aisling Duval') {
        onelineContestedSystems[10].power = contestedSystems[i].power;
        onelineContestedSystems[10].cc += contestedSystems[i].cc;
      }
    }
    let contestedStr = '';
    for (let i = 0; i < onelineContestedSystems.length; i++) {
      if (onelineContestedSystems[i].power !== undefined && onelineContestedSystems[i].power !== power) {
        contestedStr += `Contested with ${(onelineContestedSystems[i].power).split(' ')[0]}: ${onelineContestedSystems[i].cc}CC\n`;
      }
    }

    // math for cc calculations
    const HQDistance = HQDistances(power, sphereCoords.x, sphereCoords.y, sphereCoords.z);
    // Upkeep
    const upkeep = Math.ceil((HQDistance ** 2) * 0.001 + 20);
    // Overhead
    let overhead;
    if (sphereType === 'Control') {
      overhead = (Math.min(((11.5 * (controlledSystems)) / 42) ** 3, 5.4 * 11.5 * controlledSystems)) / controlledSystems;
    }
    if (sphereType === 'Expansion') {
      // controlledSystems + 1 is due to the additional system added via the expansion itself
      overhead = (Math.min(((11.5 * (controlledSystems + 1)) / 42) ** 3, 5.4 * 11.5 * (controlledSystems + 1))) / (controlledSystems + 1);
    }
    const overheadMax = (Math.min(((11.5 * (55)) / 42) ** 3, 5.4 * 11.5 * 55)) / 55;
    // Net CC
    let contested = 0;
    for (let i = 0; i < onelineContestedSystems.length; i++) {
      // todo improve araay to not need to filter data every time its referenced
      if (onelineContestedSystems[i].power !== undefined && onelineContestedSystems[i].power !== power) {
        contested += onelineContestedSystems[i].cc;
      }
    }
    const netCC = grossCC - overhead - upkeep - contested;
    const netCCMax = grossCC - overheadMax - upkeep - contested;

    // math for fortification / undermining / expansion triggers
    let fort = -1;
    if (favorables > neutrals && favorables > unfavorables) {
      fort = Math.round(0.5 * (0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5)); // favorable fort trigger
    } else if (unfavorables > neutrals && unfavorables > favorables) {
      fort = Math.round(1.5 * (0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5)); // unfavorable fort trigger
    } else {
      fort = Math.round(0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5); // neutral fort trigger
    }
    const umOpp = Math.round(2750000 / (HQDistance ** 1.5) + 5000); // opposition trigger
    const oppOrFortInfo = `${(fort / umOpp).toFixed(2)}:1 triggers`;

    // Shenanigans to get the sorts to work correctly when null values exist
    for (let i = 0; i < targetSystems.length; i++) {
      if (targetSystems[i].power === null) {
        targetSystems[i].power = '';
      }
      if (targetSystems[i].state === null) {
        targetSystems[i].state = '';
      }
    }

		// sorts
    // power -> power state -> government
		targetSystems.sort((a, b) => {
			const nameA = a.government;
			const nameB = b.government;
			if (nameA < nameB) { return -1; }
			if (nameA > nameB) { return 1; }
			return 0;
		});
		targetSystems.sort((a, b) => {
			const nameA = a.state;
			const nameB = b.state;
			if (nameA < nameB) { return -1; }
			if (nameA > nameB) { return 1; }
			return 0;
		});
		targetSystems.sort((a, b) => {
			const nameA = a.power;
			const nameB = b.power;
			if (nameA < nameB) { return -1; }
			if (nameA > nameB) { return 1; }
			return 0;
		});
		// puts target system at bottom
		for (let i = 0; i < targetSystems.length; i++) {
			if (sphere === targetSystems[i].name) {
				targetSystems.push(targetSystems[i]);
				targetSystems.splice(i, 1);
				break;
			}
		}

		// add max overhead if power is not at max already
		let maxOverheadStr = `/ ${netCCMax.toFixed(1)}CC at max overhead`;
		if (controlledSystems >= 55) {
			maxOverheadStr = '';
		}

		// warning addition
		let warningStr = '';
		if (warningFlag === 'Exploited') {
			warningStr = '[ Warning: Target system is already exploited, footer favorability ratios may be inaccurate ]\n';
		} else if (warningFlag === 'Expansion') {
			warningStr = '[ Warning: Target system is currently being expanded from ]\n';
		}

    // output main block(s)
    let block = '';
    const columns = columnify(targetSystems); // tabularize info
    let subSystems = [];
    let x = 0;
    for (let i = 0; i < targetSystems.length; i++) {
      subSystems.push(targetSystems[i]);
      if ((i + 1) % 24 === 0) {
        block = columnify(subSystems);
        subSystems = [];
        message.channel.send(`\`\`\`asciidoc\n= ${sphere} ${sphereType} Sphere Analysis\t\t${oppOrFortInfo}\n${warningStr}\n${columns}\n\`\`\``);
      }
      x += 1;
    }
    if (x === 0) {
      message.channel.send('`No systems found`');
    } else if (x < 24) {
      block = columnify(targetSystems);
      message.channel.send(`\`\`\`asciidoc\n= ${sphere} ${sphereType} Sphere Analysis\t\t${oppOrFortInfo}\n${warningStr}\n${columns}\n\`\`\``);
    } else {
      block = columnify(subSystems);
      message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
    }

    // footer
    const favorStr = `${favor} favorable/neutral/unfavorable systems for ${power}`;
    const grossStr = `Sphere gross value: ${grossCC}CC`;
    const upkeepOverheadStr = `Upkeep + Overhead: ${upkeep} + ${overhead.toFixed(1)}`;
    const netStr = `Net CC gained: ${netCC.toFixed(1)}CC ${maxOverheadStr}`;
		message.channel.send(`\`\`\`\n${favorStr}\n${grossStr}\n${contestedStr}${upkeepOverheadStr}\n${netStr}\n\`\`\``);

    // mem usage
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
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
		} else {input = args[0];}
		// if input is seperated with "", remove them for processing
		input = capitalize(removeQuotes(input));
		input = inputPowerFilter(message, input);
		if (input === undefined) {
			return;
		}

		const powerSystems = [];
		let cc = 0;
		let unique = 0;
		let control = 0;
		// grab all control systems for the power
		const obj = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
		const allSystems = JSON.parse(obj);

		for (let i = 0; i < allSystems.length; i++) {
			if (allSystems[i].power === input
      && (allSystems[i].power_state === 'Exploited' || allSystems[i].power_state === 'Control')) {
				const system = {};
				system.name = allSystems[i].name;
				system.cc = popToCC(allSystems[i].population);
				powerSystems.push(system);

				cc += popToCC(allSystems[i].population);
				unique += 1;
				if (allSystems[i].power_state === 'Control') {
					control += 1;
				}
			}
		}
		message.channel.send(`${input} has a total of ${cc} gross CC, across a total of ${control} spheres, or ${unique} systems.`);

		// sorts
		powerSystems.sort((a, b) => b.CC - a.CC); // sorts systems by CC

		// write to txt
		const columns = columnify(powerSystems); // tabularize info
		fs.writeFile('./data/cc.txt', columns, (err) => {
			if (err) return console.log(err);
			console.log('file successfully saved');
		});

		// mem usage
		const used = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
	} else if (command === 'threats') {
		if (message.author.id !== '182976741373902848') { // only Cynder#7567 can use this
			console.log('- - Unauthorized command \'threats\' attempted - -');
			return message.channel.send('You do not have permission to use this command.');
		}
		console.log('working on threats');
		message.channel.send('Calculating...');
		let input = '';
		if (!args.length) { // take all input after command and designate it the target power
			return message.channel.send('Please define a first reference power.');
		}
		let showAll = 0;
		if (args[0] === '-f') {
			showAll = 1;
			args.shift();
		}
		input = args[0]; // start at first argument to avoid an extra ' ' from for loop
		input = capitalize(removeQuotes(input)); // if input is seperated with "", remove them for processing
		input = inputPowerFilter(message, input);
		if (input === undefined) {
			return message.channel.send('Error reading first power name, please try again');
		}
		if (!args[1]) { // take all input after command and designate it the target power
			return message.channel.send('Please define a second reference power.');
		}
		let threatPower = '';
		threatPower = args[1]; // start at first argument to avoid an extra ' ' from for loop
		threatPower = capitalize(removeQuotes(threatPower)); // if input is seperated with "", remove them for processing
		threatPower = inputPowerFilter(message, threatPower);
		if (threatPower === undefined) {
			return message.channel.send('Error reading second power name, please try again');
		}
		// distance from main star input
		if (!args[2]) {
			return message.channel.send('Please provide a reference distance');
		}
		const distance = Number(args[2], 10);
		if (Number.isNaN(distance)) {
			return message.channel.send('Please input a whole number for distance from main star');
		}

		const controlSystems = [];
		const allSystems = [];
		let threatControlSystems = 0;
		let obj = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
		const refSys = JSON.parse(obj);
		// grab all friendly power control systems
		for (let i = 0; i < refSys.length; i++) {
			if (refSys[i].power === input && refSys[i].power_state === 'Control') {
				const controlSystem = {};
				controlSystem.name = refSys[i].name;
				controlSystem.x = refSys[i].x;
				controlSystem.y = refSys[i].y;
				controlSystem.z = refSys[i].z;
				controlSystems.push(controlSystem);
			}
			if (refSys.power === threatPower && refSys.power_state === 'Control') {
				threatControlSystems++;
			}
		}
		console.log('control systems fetched');
		// find all systems within the input range
		for (let i = 0; i < refSys.length; i++) {
			if (refSys[i].population > 0 && refSys[i].power === null
          && refSys[i].name !== 'Shinrarta Dezhra' // you know where this is
          && refSys[i].name !== 'Azoth' // 10 starter systems
          && refSys[i].name !== 'Dromi'
          && refSys[i].name !== 'Lia Fall'
          && refSys[i].name !== 'Matet'
          && refSys[i].name !== 'Orna'
          && refSys[i].name !== 'Otegine'
          && refSys[i].name !== 'Sharur'
          && refSys[i].name !== 'Tarnkappe'
          && refSys[i].name !== 'Tyet'
          && refSys[i].name !== 'Wolfsegen') {
				for (let j = 0; j < controlSystems.length; j++) {
					// all systems within range of any control sphere
					if (distLessThan(30, refSys[i].x, refSys[i].y, refSys[i].z, controlSystems[j].x, controlSystems[j].y, controlSystems[j].z) === true
            && refSys[i].power === null && refSys[i].power_state !== 'Contested') {
						const system = {};
						system.name = refSys[i].name;
						system.id = refSys[i].id;
						system.power = refSys[i].power;
						system.intersection = controlSystems[j].name; // for tracking which spheres would be intersected
						system.x = refSys[i].x;
						system.y = refSys[i].y;
						system.z = refSys[i].z;
						allSystems.push(system);
					}
				}
			}
		}
		console.log(`${allSystems.length} potential systems found`);
		obj = fs.readFileSync('./data/stations.json', 'utf8');
		const data = JSON.parse(obj);
		const threatSystems = [];
		// filter out all systems without a large port && with a port <(distance)ls out
		for (let i = 0; i < data.length; i++) {
			for (let j = 0; j < allSystems.length; j++) {
				// same system & large station & <(distance)ls from star % no power
				if (data[i].system_id === allSystems[j].id && data[i].max_landing_pad_size === 'L' && data[i].distance_to_star <= distance) {
					// filter out all repeated data from being added
					let exists = 0;
					for (let k = 0; k < threatSystems.length; k++) {
						if (threatSystems[k].name === allSystems[j].name) {
							exists++;
							let intersectDuplicate = 0;
							for (let l = 0; l < (threatSystems[k].intersections).length; l++) { // iterate through existing contested control systems
								if (threatSystems[k].intersections[l] === allSystems[j].intersection) {
									intersectDuplicate = 1;
								}
							}
							if (intersectDuplicate === 0) { // if not duplicate intersect
								threatSystems[k].intersections.push(allSystems[j].intersection); // add to array
							}
						}
					}
					if (exists === 0) { // if not a duplicate
						const threatSystem = {};
						threatSystem.name = allSystems[j].name;
						threatSystem.intersections = [];
						(threatSystem.intersections).push(allSystems[j].intersection);
						threatSystem.x = allSystems[j].x;
						threatSystem.y = allSystems[j].y;
						threatSystem.z = allSystems[j].z;
						threatSystems.push(threatSystem);
					}
				}
			}
		}
		console.log('potential systems vetted for starports within <(distance)ls');
		// find 15ly sphere of all potential systems
		// add net and contested CC to threatSystem objects
		for (let i = 0; i < threatSystems.length; i++) {
			let netCC = 0;
			let contestedCC = 0;
			let MahonCC = 0;
			let HudsonCC = 0;
			let WintersCC = 0;
			let otherImperialCC = 0;
			for (let j = 0; j < refSys.length; j++) {
				if (refSys[j].population > 0
            && distLessThan(15, refSys[j].x, refSys[j].y, refSys[j].z, threatSystems[i].x, threatSystems[i].y, threatSystems[i].z) === true // 15ly sphere
            && refSys[j].name !== 'Shinrarta Dezhra' // you know where this is
            && refSys[j].name !== 'Azoth' // 10 starter systems
            && refSys[j].name !== 'Dromi'
            && refSys[j].name !== 'Lia Fall'
            && refSys[j].name !== 'Matet'
            && refSys[j].name !== 'Orna'
            && refSys[j].name !== 'Otegine'
            && refSys[j].name !== 'Sharur'
            && refSys[j].name !== 'Tarnkappe'
            && refSys[j].name !== 'Tyet'
            && refSys[j].name !== 'Wolfsegen') {
					if (refSys[j].power_state === null || refSys[j].power_state === 'Expansion') { // to be control/exploited
						netCC += popToCC(refSys[j].population);
					}
					if (refSys[j].power_state === 'Exploited') {
						if (refSys[j].power === input) { // to be contested
							contestedCC += popToCC(refSys[j].population);
						}
						if (refSys[j].power === 'Edmund Mahon') {
							MahonCC += popToCC(refSys[j].population);
						}
						if (input === 'Aisling Duval' || input === 'Zemina Torval' || input === 'Arissa Lavigny-Duval' || input === 'Denton Patreus') { // For imperial friendlies
							if (threatPower === 'Felicia Winters' && refSys[j].power === 'Zachary Hudson') {
								HudsonCC += popToCC(refSys[j].population);
							}
							if (threatPower === 'Zachary Hudson' && refSys[j].power === 'Felicia Winters') {
								WintersCC += popToCC(refSys[j].population);
							}
							if (refSys[j].power === 'Zemina Torval' || refSys[j].power === 'Arissa Lavigny-Duval' || refSys[j].power === 'Denton Patreus') {
								otherImperialCC += popToCC(refSys[j].population);
							}
						}
					}
				}
				// fortification / undermining / expansion triggers
				let expFort = 0;
				const HQDistance = HQDistances(threatPower, threatSystems[i].x, threatSystems[i].y, threatSystems[i].z);
				expFort = Math.round(0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5); // neutral fort trigger
				// }
				const umOpp = Math.round(2750000 / (HQDistance ** 1.5) + 5000); // opposition trigger
				threatSystems[i].trigger = Math.round(100 * (expFort / umOpp)) / 100; // ratio
			}
			const powerControlSys = threatControlSystems;
			const HQDistance = HQDistances(threatPower, threatSystems[i].x, threatSystems[i].y, threatSystems[i].z);
			const overhead = Math.round((Math.min(((11.5 * (powerControlSys + 1)) / 42) ** 3, 5.4 * 11.5 * (powerControlSys + 1))) / (powerControlSys + 1));
			const overheadMax = 62;
			const upkeep = Math.ceil((HQDistance ** 2) * 0.001 + 20);
			const worstNetCC = netCC - upkeep - overheadMax;
			netCC = netCC - upkeep - overhead;
			// threatSystems[i].net_CC = `${netCC} / ${worstNetCC}`;
			threatSystems[i].net_CC = worstNetCC;
			threatSystems[i].Aisling = contestedCC;
			// Relevant contested power CC adding
			if (MahonCC > 0) {
				threatSystems[i].Mahon = MahonCC;
			}
			if (HudsonCC > 0) {
				threatSystems[i].Hudson = HudsonCC;
			}
			if (WintersCC > 0) {
				threatSystems[i].Winters = WintersCC;
			}
			if (otherImperialCC > 0) {
				threatSystems[i].Imperial = otherImperialCC;
			}
		}

		// reorganize and filter data
		for (let i = 0; i < threatSystems.length; i++) {
			delete threatSystems[i].x;
			delete threatSystems[i].y;
			delete threatSystems[i].z;/*
      let intersectionString = String(threatSystems[i].intersections[0]);
      for (let j = 1; j < (threatSystems[i].intersections).length; j++) {
        intersectionString += `, ${threatSystems[i].intersections[j]}`;
      } */
			delete threatSystems[i].intersections;
			// threatSystems[i].intersect = intersectionString;
		}

		// sorts
		threatSystems.sort((a, b) => b.net_CC - a.net_CC); // sorts systems by net CC
		threatSystems.sort((a, b) => b.Aisling - a.Aisling); // sorts systems by contested CC

		const columns = columnify(threatSystems); // tabularize info
		// In case of >2000 character message overflow (basically guaranteed)
		if (showAll === 1) {
			let index = 0;
			let i = 0;
			while (columns.indexOf('\n', 1800 * (i + 1)) !== -1) {
				const block = columns.substring(index, columns.indexOf('\n', 1800 * (i + 1)));
				index = columns.indexOf('\n', 1900 * (i + 1));
				message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
				i++;
			}
		} else {
			let index = 0;
			for (let i = 0; i < 3; i++) {
				const block = columns.substring(index, columns.indexOf('\n', 1800 * (i + 1)));
				index = columns.indexOf('\n', 1900 * (i + 1));
				message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
			}
			/*
      const index = columns.indexOf('\n', 1800);
      message.channel.send(`\`\`\`ini\n${columns.substring(0, index)}\n\`\`\``);
      */
		}

		// write to txt
		fs.writeFile('./data/targets.txt', columns, (err) => {
			if (err) return console.log(err);
			console.log('file successfully saved');
		});

		// mem usage
		const used = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
	} else if (command === 'profitables') {
		console.log('working on profitables');
		message.channel.send('Calculating...');
		// power-dynamic option
		let power = '';
		if (!args.length) {
			return message.channel.send('Please define a reference power.');
		}
		// power assignment
		power = args[0]; // start at first argument to avoid an extra ' ' from for loop
		power = capitalize(removeQuotes(power)); // if input is seperated with "", remove them for processing
		power = inputPowerFilter(message, power);
		if (power === undefined) {
			return message.channel.send('Error reading power name, please try again');
		}
		const obj = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
		const allSystems = JSON.parse(obj);

    // find all expandable systems
    console.log('finding all expandable systems');
    const viableSystems = [];
		for (let i = 0; i < allSystems.length; i++) {
      if (allSystems[i].power_state === null) {
        const system = {};
        system.name = allSystems[i].name;
        system.x = allSystems[i].x;
        system.y = allSystems[i].y;
        system.z = allSystems[i].z;
        system.cc = 0;
        system.winters = 0;
        system.hudson = 0;
        viableSystems.push(system);
      }
		}

    console.log(`finding gross cc across ${viableSystems.length} viable systems`);
    for (let i = 0; i < viableSystems.length; i++) {
      for (let j = 0; j < allSystems.length; j++) {
        if (distLessThan(15, viableSystems[i].x, viableSystems[i].y, viableSystems[i].z, allSystems[j].x, allSystems[j].y, allSystems[j].z)) {
          if (allSystems[j].power_state === null) {
            viableSystems[i].cc += popToCC(allSystems[j].population);
          }
          if (allSystems[j].power === 'Zachary Hudson' && allSystems[j].power_state === 'Exploited') {
            viableSystems[i].hudson += popToCC(allSystems[j].population);
          }
          if (allSystems[j].power === 'Felicia Winters' && allSystems[j].power_state === 'Exploited') {
            viableSystems[i].winters += popToCC(allSystems[j].population);
          }
        }
      }
    }

    console.log('calculating and subtracting overhead and upkeep');
    for (let i = 0; i < viableSystems.length; i++) {
      const HQDistance = HQDistances(power, viableSystems[i].x, viableSystems[i].y, viableSystems[i].z);
      const overhead = (Math.min(((11.5 * (100)) / 42) ** 3, 5.4 * 11.5 * (100))) / (100);
      const upkeep = Math.ceil((HQDistance ** 2) * 0.001 + 20);
      const OHUP = overhead + upkeep;
      viableSystems[i].cc -= OHUP;
      viableSystems[i].cc = (viableSystems[i].cc).toFixed(1);
    }

    // sorts
    viableSystems.sort((a, b) => b.cc - a.cc); // sorts by cc highest to lowest

    for (let i = 0; i < viableSystems.length; i++) {
      if (viableSystems[i].hudson === 0) {
        viableSystems[i].hudson = null;
      }
      if (viableSystems[i].winters === 0) {
        viableSystems[i].winters = null;
      }
      delete viableSystems[i].x;
      delete viableSystems[i].y;
      delete viableSystems[i].z;
    }

    // write to txt
		const columns = columnify(viableSystems); // tabularize info
		fs.writeFile('./data/profitables.txt', columns, (err) => {
			if (err) return console.log(err);
			console.log('file successfully saved');
		});

		// mem usage
		const used = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
	} else if (command === 'scout') {
		console.log('working on scout');
		message.channel.send('Calculating...');
		let scanArea = '';
		if (!args.length) {
			return message.channel.send('Please define internal or external');
		}
		// power-dynamic option
		let input = '';
		if (!args.length) {
			return message.channel.send('Please define a first reference power.');
		}
		// Override to ignore system control state
		let overrideProfitables = 0;
		if (args[0] === '-profitables') {
			console.log('profitables override enabled');
			overrideProfitables = 1;
			args.shift();
		}
		// power assignment
		input = args[0]; // start at first argument to avoid an extra ' ' from for loop
		input = capitalize(removeQuotes(input)); // if input is seperated with "", remove them for processing
		input = inputPowerFilter(message, input);
		if (input === undefined) {
			return message.channel.send('Error reading power name, please try again');
		}
		// in/out
		if (args[1] === 'internal' || args[1] === 'external') {
			scanArea = args[1];
		} else {
			return message.channel.send('Please define internal or external');
		}
		if (!args[2]) {
			return message.channel.send('Please specify how many days ago to compare data to');
		}
		let daysAgo = Number(args[2]);
		if (!Number.isNaN(args[2]) && args[2] < 6 && args[2] > 0) {
			daysAgo = args[2];
		} else {
			return message.channel.send('Please specify how many days ago to compare data to');
		}

		let obj = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
		let allSystems = JSON.parse(obj);
		const controlSystems = [];
		// grab all friendly power control systems
		for (let i = 0; i < allSystems.length; i++) {
			if (allSystems[i].power === input && allSystems[i].power_state === 'Control') {
				const controlSystem = {};
				controlSystem.name = allSystems[i].name;
				controlSystem.x = allSystems[i].x;
				controlSystem.y = allSystems[i].y;
				controlSystem.z = allSystems[i].z;

				if (overrideProfitables === 0) {
					controlSystems.push(controlSystem);
				} else {
					let grossCC = 0;
					for (let j = 0; j < allSystems.length; j++) {
						if (allSystems[i].population > 0
              && allSystems[i].name !== 'Shinrarta Dezhra' // you know where this is
              && allSystems[i].name !== 'Azoth' // 10 starter systems
              && allSystems[i].name !== 'Dromi'
              && allSystems[i].name !== 'Lia Fall'
              && allSystems[i].name !== 'Matet'
              && allSystems[i].name !== 'Orna'
              && allSystems[i].name !== 'Otegine'
              && allSystems[i].name !== 'Sharur'
              && allSystems[i].name !== 'Tarnkappe'
              && allSystems[i].name !== 'Tyet'
              && allSystems[i].name !== 'Wolfsegen'
              && distLessThan(15, allSystems[j].x, allSystems[j].y, allSystems[j].z, controlSystem.x, controlSystem.y, controlSystem.z) === true) {
							grossCC += popToCC(allSystems[j].population);
						}
					}
					const HQDistance = HQDistances(input, controlSystem.x, controlSystem.y, controlSystem.z);
					const overhead = (Math.min(((11.5 * (55)) / 42) ** 3, 5.4 * 11.5 * 55)) / 55;
					const upkeep = Math.ceil((HQDistance ** 2) * 0.001 + 20);
					const netCC = grossCC - overhead - upkeep;
					if (netCC > 0) {
						controlSystems.push(controlSystem);
					}
				}
			}
		}
		console.log(`${controlSystems.length} control systems fetched`);
		// find all systems within the input range
		const potentialSystems = [];
		let range = 0;
		if (scanArea === 'internal') {
			range = 15;
		} else if (scanArea === 'external') {
			range = 45;
		}
		for (let i = 0; i < allSystems.length; i++) {
			if (allSystems[i].population > 0
          && allSystems[i].name !== 'Shinrarta Dezhra' // you know where this is
          && allSystems[i].name !== 'Azoth' // 10 starter systems
          && allSystems[i].name !== 'Dromi'
          && allSystems[i].name !== 'Lia Fall'
          && allSystems[i].name !== 'Matet'
          && allSystems[i].name !== 'Orna'
          && allSystems[i].name !== 'Otegine'
          && allSystems[i].name !== 'Sharur'
          && allSystems[i].name !== 'Tarnkappe'
          && allSystems[i].name !== 'Tyet'
          && allSystems[i].name !== 'Wolfsegen') {
				for (let j = 0; j < controlSystems.length; j++) {
					// all systems within 45ly of any control sphere (15ly radius internal, 30ly radius external)
					if (distLessThan(range, allSystems[i].x, allSystems[i].y, allSystems[i].z, controlSystems[j].x, controlSystems[j].y, controlSystems[j].z) === true) {
						let copy = 0;
						for (let k = 0; k < potentialSystems.length; k++) {
							if (allSystems[i].name === potentialSystems[k].name) {
								copy = 1;
							}
						}
						if (copy === 0) {
							const system = {};
							system.name = allSystems[i].name;
							system.government = allSystems[i].government;
							system.minor_factions_updated_at = allSystems[i].minor_factions_updated_at;
							system.controlling_minor_faction_id = allSystems[i].controlling_minor_faction_id;
							system.minor_faction_presences = allSystems[i].minor_faction_presences;
							system.power = allSystems[i].power;
							system.power_state = allSystems[i].power_state;
							system.states = allSystems[i].states;
							potentialSystems.push(system);
						}
					}
				}
			}
		}

		console.log(`${potentialSystems.length} potential systems found`);
		const scoutedSystems = [];
		const dangerSystems = [];
		// recreate potential systems list using old data for compairson
		let oldData = new Date();
		oldData = oldData.setDate(oldData.getDate() - daysAgo); // find days prior in ms
		oldData = new Date(oldData); // convert ms to Date object
		const oldJSON = `./data/systems_populated_${oldData.getMonth() + 1}_${oldData.getDate()}_${oldData.getFullYear()}.json`;
		obj = fs.readFileSync(oldJSON, 'utf8');
		allSystems = [];
		allSystems = JSON.parse(obj);
		const oldSystems = [];
		for (let i = 0; i < potentialSystems.length; i++) {
			for (let j = 0; j < allSystems.length; j++) {
				if (potentialSystems[i].name === allSystems[j].name) {
					const system = {};
					system.name = allSystems[j].name;
					system.minor_factions_updated_at = allSystems[j].minor_factions_updated_at;
					system.controlling_minor_faction_id = allSystems[j].controlling_minor_faction_id;
					system.minor_faction_presences = allSystems[j].minor_faction_presences;
					system.power = allSystems[j].power;
					system.states = allSystems[j].states;
					oldSystems.push(system);
				}
			}
		}
		for (let i = 0; i < potentialSystems.length; i++) {
			if (scanArea === 'internal' // All exploited CCC controlled systems within AD space (the 'castle')
        && potentialSystems[i].power === input
        && potentialSystems[i].power_state === 'Exploited') {
				if (((input === 'Aisling Duval' || input === 'Archon Delaine')
                && (potentialSystems[i].government === 'Communism' || potentialSystems[i].government === 'Cooperative' || potentialSystems[i].government === 'Confederacy'))
              || ((input === 'Arissa Lavigny-Duval' || input === 'Denton Patreus' || input === 'Zachary Hudson')
                && (potentialSystems[i].government === 'Feudal' || potentialSystems[i].government === 'Patronage'))
              || ((input === 'Edmund Mahon' || input === 'Felicia Winters' || input === 'Li Yong-Rui')
                && (potentialSystems[i].government === 'Corporate'))
              || ((input === 'Pranav Antal' || input === 'Zemina Torval' || input === 'Yuri Grom')
                && (potentialSystems[i].government === 'Feudal' || potentialSystems[i].government === 'Communism' || potentialSystems[i].government === 'Dictatorship' || potentialSystems[i].government === 'Cooperative'))) {
					const system = {};
					system.name = potentialSystems[i].name;
					system.lead = infLead(potentialSystems[i]);
					system.updated = lastUpdated(potentialSystems[i].minor_factions_updated_at * 1000);
					system.lead_old = infLead(oldSystems[i]);
					system.updated_old = lastUpdated(oldSystems[i].minor_factions_updated_at * 1000);
					system.delta = (infLead(potentialSystems[i]) - infLead(oldSystems[i])); // change in lead

					for (let j = 0; j < (oldSystems[i].states).length; j++) { // account for expansion pop
						if (oldSystems[i].states[j].name === 'Expansion') {
							for (let k = 0; k < (potentialSystems[i].states).length; k++) {
								if (potentialSystems[i].states[k].name !== 'Expansion') {
									system.delta += 15;
								}
							}
						}
					}

					// pass objects to arrays
					if (Date.parse(`${system.updated_old.year}-${system.updated_old.month}-${system.updated_old.day}`) + 172800000 + 86400000 * daysAgo
            >= Date.parse(`${system.updated.year}-${system.updated.month}-${system.updated.day}`)) { // no entries more than 2 days out of date
						scoutedSystems.push(system);
					}
					if (system.lead < 20) {
						const tmpsystem = {};
						tmpsystem.name = system.name;
						tmpsystem.lead = system.lead;
						tmpsystem.updated = system.updated;
						dangerSystems.push(tmpsystem);
					}
				}
			} else if (scanArea === 'external' // All systems within the 'moat' around AD space
        && potentialSystems[i].power !== input
        && potentialSystems[i].power_state !== 'Contested') {
				const system = {};
				system.name = potentialSystems[i].name;
				system.lead = infLead(potentialSystems[i]);
				system.updated = lastUpdated(potentialSystems[i].minor_factions_updated_at * 1000);
				system.lead_old = infLead(oldSystems[i]);
				system.updated_old = lastUpdated(oldSystems[i].minor_factions_updated_at * 1000);
				system.delta = (infLead(potentialSystems[i]) - infLead(oldSystems[i])); // change in lead

				for (let j = 0; j < (oldSystems[i].states).length; j++) { // account for expansion pop
					if (oldSystems[i].states[j].name === 'Expansion') {
						for (let k = 0; k < (potentialSystems[i].states).length; k++) {
							if (potentialSystems[i].states[k].name !== 'Expansion') {
								system.delta += 15;
							}
						}
					}
				}
				if (Date.parse(`${system.updated_old.year}-${system.updated_old.month}-${system.updated_old.day}`) + 172800000 + 86400000 * daysAgo
          >= Date.parse(`${system.updated.year}-${system.updated.month}-${system.updated.day}`)) { // no entries more than 2 days out of date
					scoutedSystems.push(system);
				}
			}
		}

		// modify array
		for (let i = 0; i < scoutedSystems.length; i++) {
			scoutedSystems[i].updated = `${scoutedSystems[i].updated.month}/${scoutedSystems[i].updated.day}`; // make updated displayable
			scoutedSystems[i].updated_old = `${scoutedSystems[i].updated_old.month}/${scoutedSystems[i].updated_old.day}`; // make updated_old displayable
			scoutedSystems[i].delta = (scoutedSystems[i].delta).toFixed(2); // set to 100ths place
		}

		for (let i = 0; i < dangerSystems.length; i++) {
			dangerSystems[i].updated = `${dangerSystems[i].updated.month}/${dangerSystems[i].updated.day}`; // make updated displayable
		}

		// make final array
		const finalSystems = [];
		for (let i = 0; i < scoutedSystems.length; i++) {
			if (Number(scoutedSystems[i].delta) <= -5) {
				finalSystems.push(scoutedSystems[i]);
			}
		}

		// sorts
		// delta -> lead
		finalSystems.sort((a, b) => a.lead - b.lead); // sorts systems by lead lowest to highest
		finalSystems.sort((a, b) => a.delta - b.delta); // sorts systems by delta lowest to highest
		// lead
		dangerSystems.sort((a, b) => a.lead - b.lead); // sorts systems by lead lowest to highest

		// print significant deltas
		message.channel.send(`Comparing bgs data from ${today.getMonth() + 1}/${today.getDate() - 1}/${today.getFullYear()} to ${oldData.getMonth() + 1}/${oldData.getDate() - 1}/${oldData.getFullYear()} post-tick`);
		let subSystems = [];
		let x = 0;
		for (let i = 0; i < finalSystems.length; i++) {
			subSystems.push(finalSystems[i]);
			if ((i + 1) % 24 === 0) {
				const block = columnify(subSystems);
				subSystems = [];
				message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
			}
			x++;
		}
		if (x === 0) {
			message.channel.send('`No systems found`');
		} else if (x < 24) {
			const block = columnify(finalSystems);
			message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
		} else {
			const block = columnify(subSystems);
			message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
		}

		// print systems with leads <20
		message.channel.send('Systems with leads <20 inf');
		subSystems = [];
		x = 0;
		for (let i = 0; i < dangerSystems.length; i++) {
			subSystems.push(dangerSystems[i]);
			if ((i + 1) % 24 === 0) {
				const block = columnify(subSystems);
				subSystems = [];
				message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
			}
			x++;
		}
		if (x === 0) {
			message.channel.send('`No systems found`');
		} else if (x < 24) {
			const block = columnify(dangerSystems);
			message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
		} else {
			const block = columnify(subSystems);
			message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
		}

		// mem usage
		const used = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
	} else if (command === 'faction') {
		console.log('working on faction');
		message.channel.send('Calculating...');
		if (!args.length) {
			return message.channel.send('Please define a faction or power');
		}

		let targetFaction = '';
		if (args[0].slice(0, 1) !== '"' || (args[args.length - 1]).slice(-1) !== '"') {
			return message.channel.send('Please denote the faction using " "');
		}
		targetFaction = args[0].slice(1); // first arg
		for (let i = 1; i < args.length - 1; i++) { // middle args
			targetFaction += ` ${args[i]}`;
		}
		targetFaction += ` ${(args[args.length - 1]).slice(0, -1)}`;// last arg

		const targetSystems = [];
		const data = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
		const obj = JSON.parse(data);
		for (let i = 0; i < obj.length; i++) {
			if (obj[i].controlling_minor_faction === targetFaction) {
				const todate = lastUpdated(obj[i].minor_factions_updated_at * 1000);
				const system = {};
				system.name = obj[i].name;
				system.lead = infLead(obj[i]);
				system.date = `${todate.month}/${todate.day}`;
				system.pop = popToCC(obj[i].population);
				targetSystems.push(system);
			}
		}

		// sorts
		targetSystems.sort((a, b) => a.lead - b.lead); // sorts systems by lead lowest to highest

		// output
		let subSystems = [];
		let x = 0;
		for (let i = 0; i < targetSystems.length; i++) {
			subSystems.push(targetSystems[i]);
			if ((i + 1) % 24 === 0) {
				const block = columnify(subSystems);
				subSystems = [];
				message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
			}
			x++;
		}
		if (x < 20) {
			const block = columnify(targetSystems);
			message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
		} else {
			const block = columnify(subSystems);
			message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
		}
	} else if (command === 'help') {
		// readability
		const version = 'Current Version: 1.0.0';
		const preamble = 'All data is as up-to-date as possible via eddb. Jibri can receive dms, and does not log data for any commands given.\n\n';
		const sphere = '\t~sphere <-o (optional)> <power> <system> designates a system as a midpoint, and grabs data for all populated systems within a 15ly sphere. If the target system is a control system, instead automatically shows control data. Adding -o will make it so the input power name is used regardless of control state. Example: ~sphere Winters Mbambiva\n';
		const multisphere = '\t~multisphere <system 1> <system 2> ... <system n> shows all systems overlapped by the 15ly spheres of the input systems.\n';
		const scout = '\t~scout <-profitables (optional)> <power> <internal/external> <days> compares current data to user-defined days old data to find any significant lead changes, for all CCC systems within AD space, or all systems witing 30ly external to AD space. Automatically adjusts for expansion state resolutions, and trims data more than 2 days out of date. Only \'internal\' is power-flexible. -profitables only checks profitable spheres (at max OH)\n';
		const faction = '\t~faction <faction name OR power> shows all systems in desceding inf lead order belonging to the specified faction (Powers to be implemented later).\n';
		const profitables = '\t~profitables <power> shows all existing profitable expansions for a power\n';
		// const threats = '!- Beta Command -! ~threats <friendly power> <hostile power> <distance from main star, in lightseconds> shows all systems with a Large landing pad within an input amount from Aisling space. This command does not currently publicly usable due to the massive amount of data it processes, please ping @Cynder#7567 for use.\n';
		const cc = '\t~cc <power> shows the total cc and systems controlled and exploited by a power. Good for confirming if database has been updated.\n';
		const postamble = 'The dates shown reflect when the leads were last updated, and are *roughly* autocorrected to the last tick time (faulty since EDO). Data is pulled from EDDB daily at 1am CST\n';
		message.channel.send(`\`\`\`\n${version}\n ${preamble}Commands:\n${sphere}${multisphere}${scout}${faction}${profitables}${cc}\n ${postamble}\`\`\``);
	}
});
client.login(token);
