const fs = require('fs');
const process = require('process');
exports.run = (client, message, args) => {
    const today = new Date();
    console.log('working on objectives');
    message.channel.send('Beta feature: Only works for maitenance targets currently\n\n');
    message.channel.send('Controlled stations are picked in priority of: L spaceport > L planetary => M spaceport > M planetary > closest');
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
    for (let i = 0; i < allSystems.length; i++) {
        for (let j = 0; j < inputSystems.length; j++) {
            if ((allSystems[i].name).toLowerCase() === (inputSystems[j]).toLowerCase()) {
                // get name, controlling faction, closest controlled star station, closest controlled Horizions planetary landable (if any), largest controlled pad
                // find closest controlled landing pad, then 
                let system = {};
                system.id = allSystems[i].id;
                system.controlling_minor_faction_id = allSystems[i].controlling_minor_faction_id;
                system.name = allSystems[i].name;
                system.faction = allSystems[i].controlling_minor_faction;
                system.stations = [];
                system.maxLandingPadSize = 'M';
                objectivesSystems.push(system);
                break;
            }
        }
    }

    allSystems = undefined;
    data = fs.readFileSync('./data/stations.json', 'utf8');
    let allStations = JSON.parse(data);
    data = undefined;

    for (let i = 0; i < objectivesSystems.length; i++) {
        for (let j = 0; j < allStations.length; j++) {
            // station is in system, and controlled by system owner, and not odyssey only
            if (objectivesSystems[i].id === allStations[j].system_id 
            && objectivesSystems[i].controlling_minor_faction_id === allStations[j].controlling_minor_faction_id
            && allStations[j].type !== 'Odyssey Settlement') {
                if (allStations[j].max_landing_pad_size === 'L') {
                    objectivesSystems[i].maxLandingPadSize = 'L';
                }
                let station = {};
                station.name = allStations[j].name;
                station.landingPadSize = allStations[j].max_landing_pad_size;
                station.isPlanetary = allStations[j].is_planetary;
                station.distance = allStations[j].distance_to_star;
                (objectivesSystems[i].stations).push(station);
            }
        }
    }
    

    allStations = undefined;

    if (objectivesSystems.length !== inputSystems.length) {
        return message.channel.send('One or more system names were not found, program stopping.');
    }
    // filter system stations
    for (let i = 0; i < objectivesSystems.length; i++) {
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
    // plug needed data into format (lead faction name, station types/pads)
    const messageStart = '\n```\n';
    let messageBody = '';
    for (let i = 0; i < objectivesSystems.length; i++) {
        if (i > 0) {
            messageBody += '-\n';
        }
        messageBody += `:globe_with_meridians: **${objectivesSystems[i].name}** - Run missions and passengers for "${objectivesSystems[i].faction}", turn in their bounties, and turn in cartographic data and trade for a profit at `;
        for (let j = 0; j < (objectivesSystems[i].stations).length; j++) {
            let messageSurface = '';
            if (objectivesSystems[i].stations[j].isPlanetary) {
                messageSurface = ' Surface';
            }
            messageBody += `${objectivesSystems[i].stations[j].name} (${objectivesSystems[i].stations[j].landingPadSize}${messageSurface}), `;
        }
        messageBody = messageBody.slice(0, -2);
        messageBody += `. Largest landable pad is ${objectivesSystems[i].maxLandingPadSize}.\n`;
    }
    const messageEnd = '\n```';

    // output
    message.channel.send(messageStart + messageBody + messageEnd);

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
};