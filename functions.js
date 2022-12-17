const request = require('request');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');
const StreamArray = require( 'stream-json/streamers/StreamArray');
const message = require('./events/message');

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
    if (casedInput === 'archon' || casedInput === 'delaine' || casedInput === 'kumo') {
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
    if (casedInput === 'zemina' || casedInput === 'torval' || casedInput === 'granny') {
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
        // Control Contested Systems
        if (state === 'Contested') {
            return 0;
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
        // Expansion Contested Systems
        if (state !== null) {
            return 0;
        }
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
    const newTick = new Date();
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
    const today = new Date();
    const download = (url, path, callback) => {
        request.head(url, () => {
            request(url)
                .pipe(fs.createWriteStream(path))
                .on('close', callback);
        });
    };

    const urlOne = 'https://eddb.io/archive/v6/systems_populated.json';
    const urlTwo = 'https://eddb.io/archive/v6/stations.json';
    const pathOne = './data/systems_raw.json';
    const pathTwo = './data/stations_raw.json';
    let systemsFlag = 0;
    let stationsFlag = 0;

    exec('mkdir data');
    download(urlOne, pathOne, () => {
        const now = new Date();
        console.log(`EDDB populated systems json mirrored at ${now}`);
        popSystemsFilter();
        if (systemsFlag === 1 && stationsFlag === 1) {
            downloadCompleted();
        }
        systemsFlag = 1;
    });
    download(urlTwo, pathTwo, () => {
        const now = new Date();
        console.log(`EDDB station json mirrored at ${now}`);
        objectivesStationsFilter();
        if (systemsFlag === 1 && stationsFlag === 1) {
            downloadCompleted();
        }
        stationsFlag = 1;
    });
}

function downloadCompleted() {
    downloadsFlag = 1
    console.log("All data is updated!")
}

function removeQuotes(input) {
    if (input[0] === '"' && input[0] === input[input.length - 1]) {
        return input.slice(1, -1);
    }
    return input;
}

async function popSystemsFilter() {
    const today = new Date();
    // find systems in EDDB
    let data = fs.readFileSync('./data/systems_raw.json', 'utf8');
    let allSystems = JSON.parse(data);
    data = undefined;
    // initialize and clear file
    fs.writeFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, '[');
    // append to file
    for (let i = 0; i < allSystems.length; i++) {
        let content = `{"id":${allSystems[i].id},\
"name":"${allSystems[i].name}",\
"x":${allSystems[i].x},\
"y":${allSystems[i].y},\
"z":${allSystems[i].z},\
"population":${allSystems[i].population},\
"government":"${allSystems[i].government}",\
"states":[`;
        for (let j = 0; j < (allSystems[i].states).length; j++) {
            content += `{"name":"${allSystems[i].states[j].name}"}`;
            if (j !== (allSystems[i].states).length - 1) {
                content += ',';
            }
        }
        content += `],`;
        content += (allSystems[i].power === null) ? `"power":null,`:`"power":"${allSystems[i].power}",`;
        content += (allSystems[i].power_state === null) ? `"power_state":null,`:`"power_state":"${allSystems[i].power_state}",`;
        content += `"updated_at":${allSystems[i].updated_at},\
"minor_factions_updated_at":${allSystems[i].minor_factions_updated_at},\
"controlling_minor_faction_id":${allSystems[i].controlling_minor_faction_id},\
"controlling_minor_faction":"${allSystems[i].controlling_minor_faction}",\
"minor_faction_presences":[`;
        for (let j = 0; j < (allSystems[i].minor_faction_presences).length; j++) {
            content += `{"minor_faction_id":${allSystems[i].minor_faction_presences[j].minor_faction_id},"influence":${allSystems[i].minor_faction_presences[j].influence}}`;
            if (j !== (allSystems[i].minor_faction_presences).length - 1) {
                content += ',';
            }
        }
        content += `]}`

        if (i !== (allSystems).length - 1) {
            content += ',';
        } else {
            content += ']'
        }
        fs.appendFile(`./data/systems_populated`, content, err=> {
            if (err) {
                console.error(err);
            }
        });
    }
    console.log("Filtered system data complete")
}
async function objectivesStationsFilter() {
    const today = new Date();
    const jsonStream = StreamArray.withParser();
    let sep = '';
    // initialize and clear file
    fs.writeFileSync('./data/stations.json', '[');
    // loop through stations
    fs.createReadStream('./data/stations_raw.json').pipe(jsonStream.input);
    jsonStream.on('data', ({key, value}) => {
        // append to file
        let content = `${sep}\
{"id":${value.id},\
"name":"${value.name}",\
"system_id":${value.system_id},\
"updated_at":${value.updated_at},\
"max_landing_pad_size":"${value.max_landing_pad_size}",\
"distance_to_star":${value.distance_to_star},\
"government":"${value.government}",\
"type":"${value.type}",\
"is_planetary":${value.is_planetary},\
"controlling_minor_faction_id":${value.controlling_minor_faction_id}}`;
        fs.appendFile(`./data/stations.json`, content, err=> {
            if (err) {
                console.error(err);
            }
        });
        sep = ',';
    });
    jsonStream.on('end', () => {
        fs.appendFileSync('./data/stations.json', ']');
        console.log('Filtered station data complete');
    });
}

module.exports = { inputPowerFilter, HQDistances, favorability, getURL, infLead, capitalize, popToCC, distLessThan, lastUpdated, mirrorEddb, removeQuotes, objectivesStationsFilter };