const fs = require('fs');
const StreamArray = require( 'stream-json/streamers/StreamArray');
exports.run = (client, message, args) => {
    const today = new Date();
    console.log('working on objectives');
    message.channel.send('Beta feature: Only works for maitenance targets currently\n\n');
    // message.channel.send('Controlled stations are picked in priority of: L spaceport > L planetary => M spaceport > M planetary > closest');
    // tell machine list of comma delineated systems
    const inputSystems = [];
    if (!args.length) {
        return message.channel.send('Please provide a comma-delineated list of systems');
    } else {
        let argString = args[0];
        args.shift();
        args.forEach(arg => argString += ` ${arg}`);
        while(argString !== '') {
            if (argString.includes(',')) {
                let tmp = argString.substring(0, argString.indexOf(','));
                inputSystems.push(tmp.trim());
                argString = argString.replace(`${tmp},`, '');
                argString.trim();
            } else {
                inputSystems.push(argString.trim());
                break;
            }
        }
    }
    // find system in EDDB
    let data = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
    let allSystems = JSON.parse(data);
    data = undefined;

    const objectivesSystems = [];
    for (let i = 0; i < inputSystems.length; i++) {
        for (let j = 0; j < allSystems.length; j++) {
            if ((allSystems[j].name).toLowerCase() === (inputSystems[i]).toLowerCase()) {
                // get name, controlling faction, closest controlled star station, closest controlled Horizions planetary landable (if any), largest controlled pad
                // find closest controlled landing pad, then 
                let system = {};
                let inConflict = 0;
                for (let k = 0; k < (allSystems[j].states).length; k++) {
                    if (allSystems[j].states[k].name === 'Election' || allSystems[j].states[k].name === 'War' || allSystems[j].states[k].name === 'Civil War') {
                        inConflict = 1;
                    }
                }
                if (inConflict === 1) {
                    system.id = '<Unknown>';
                    system.controlling_minor_faction_id = '<Unknown>';
                    system.name = '<Unknown>';
                    system.faction = '<Unknown>';
                    system.stations = [];
                    system.maxLandingPadSize = '<Unknown>';

                    let station = {};
                    station.name = '<Unknown>';
                    station.landingPadSize = '<Unknown>';
                    station.isPlanetary = false;
                    station.distance = 0;
                    (system.stations).push(station);
                } else {
                    system.id = allSystems[j].id;
                    system.controlling_minor_faction_id = allSystems[j].controlling_minor_faction_id;
                    system.name = allSystems[j].name;
                    system.faction = allSystems[j].controlling_minor_faction;
                    system.stations = [];
                    system.maxLandingPadSize = 'M';
                }
                objectivesSystems.push(system);
                break;
            }
        }
    }

    allSystems = undefined;

    message.channel.send('Searching for stations... this may take some time.');
    const jsonStream = StreamArray.withParser();
    fs.createReadStream('./data/stations.json').pipe(jsonStream.input);
    jsonStream.on('data', ({key, value}) => {
        // station is in system, and controlled by system owner, and not odyssey only
        if (value.type !== 'Odyssey Settlement') {
            for (let i = 0; i < objectivesSystems.length; i++) {
                if (objectivesSystems[i].name !== '<Unknown>'
                && objectivesSystems[i].id === value.system_id 
                && objectivesSystems[i].controlling_minor_faction_id === value.controlling_minor_faction_id) {
                    // on station/system match
                    if (value.max_landing_pad_size === 'L') {
                        objectivesSystems[i].maxLandingPadSize = 'L';
                    }
                    let station = {};
                    station.name = value.name;
                    station.landingPadSize = value.max_landing_pad_size;
                    station.isPlanetary = value.is_planetary;
                    station.distance = value.distance_to_star;
                    (objectivesSystems[i].stations).push(station);
                    break;
                }
            }
        }
    });
    jsonStream.on('end', () => {
        if (objectivesSystems.length !== inputSystems.length) {
            return message.channel.send('One or more system names were not found, program stopping.');
        }
        // filter system stations
        for (let i = 0; i < objectivesSystems.length; i++) {
            if (objectivesSystems[i].stations[0].name === '<Unknown>') {
                break;
            } else {
                if ((objectivesSystems[i].stations).length === 0) {
                    return message.channel.send(`Something went wrong; no controlled stations found in ${objectivesSystems[i].name}, exiting...`);
                }
                // sort by distance, ascending
                (objectivesSystems[i].stations).sort((a, b) => a.distance - b.distance);
    
                let iter = 0;
                if (objectivesSystems[i].stations[iter].landingPadSize === 'M' && objectivesSystems[i].stations[iter].isPlanetary === true) {
                    for (let j = iter + 1; j < objectivesSystems[i].stations.length; j++) {
                        if (objectivesSystems[i].stations[j].landingPadSize === 'M' && objectivesSystems[i].stations[j].isPlanetary === true) {
                            (objectivesSystems[i].stations).splice(j, j);
                        }
                    }
                    iter += 1;
                }
                if (objectivesSystems[i].stations[iter] !== undefined && objectivesSystems[i].stations[iter].landingPadSize === 'M') {
                    for (let j = iter + 1; j < objectivesSystems[i].stations.length; j++) {
                        if (objectivesSystems[i].stations[j].landingPadSize === 'M') {
                            (objectivesSystems[i].stations).splice(j, j);
                        }
                    }
                    iter += 1;
                }
                if (objectivesSystems[i].stations[iter] !== undefined && objectivesSystems[i].stations[iter].landingPadSize === 'L' && objectivesSystems[i].stations[iter].isPlanetary === true) {
                    for (let j = iter + 1; j < objectivesSystems[i].stations.length; j++) {
                        if (objectivesSystems[i].stations[j].landingPadSize === 'L' && objectivesSystems[i].stations[j].isPlanetary === true) {
                            (objectivesSystems[i].stations).splice(j, j);
                        }
                    }
                    iter += 1;
                }
                if (objectivesSystems[i].stations[iter] !== undefined && objectivesSystems[i].stations[iter].landingPadSize === 'M') {
                    for (let j = iter + 1; j < objectivesSystems[i].stations.length; j++) {
                        if (objectivesSystems[i].stations[j].landingPadSize === 'M') {
                            (objectivesSystems[i].stations).splice(j, j);
                        }
                    }
                    iter += 1;
                }
                if (objectivesSystems[i].stations[iter] !== undefined && objectivesSystems[i].stations[iter].landingPadSize === 'L' && objectivesSystems[i].stations[iter].isPlanetary === false) {
                    iter += 1;
                }
                // remove all remaining systems
                (objectivesSystems[i].stations).splice(iter);
            }
        }
        // plug needed data into format (lead faction name, station types/pads)
        const messageStart = '\n```\n';
        let messageBody = '';
        for (let i = 0; i < objectivesSystems.length; i++) {
            if (i > 0) {
                messageBody += '-\n';
            }
            let maxLandingPadEmote = '';
            if (objectivesSystems[i].maxLandingPadSize === 'M') {
                maxLandingPadEmote = ':m:';
            } else {
                maxLandingPadEmote = ':regional_indicator_l:';
            }
            messageBody += `:globe_with_meridians: ${maxLandingPadEmote} **${objectivesSystems[i].name}** - Run missions and passengers for "${objectivesSystems[i].faction}", turn in their bounties, and turn in cartographic data and trade for a profit at `;
            for (let j = 0; j < (objectivesSystems[i].stations).length; j++) {
                let messageSurface = '';
                if (objectivesSystems[i].stations[j].isPlanetary) {
                    messageSurface = ' Surface';
                }
                messageBody += `${objectivesSystems[i].stations[j].name} (${objectivesSystems[i].stations[j].landingPadSize}${messageSurface}), `;
            }
            messageBody = messageBody.slice(0, -2);
            messageBody += '.\n';
        }
        const messageEnd = '\n```';
    
        // output
        message.channel.send(messageStart + messageBody + messageEnd);
    });
};