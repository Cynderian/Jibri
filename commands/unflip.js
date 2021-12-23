const { capitalize, HQDistances, removeQuotes, inputPowerFilter, distLessThan } = require('../functions');
const fs = require('fs');
const columnify = require('columnify');
exports.run = (client, message, args) => {
    console.log('working on unflip');
    const today = new Date();
    if (!args.length) {
        return message.channel.send('Please define a power');
    }

    inputPower = '';
    if (args[0] === 'Aisling Duval' && message.author.id !== '182976741373902848') {
        message.channel.send("No :spraybottle:");
    } else {
        inputPower = args[0];
    }

    inputPower = capitalize(removeQuotes(inputPower)); // if input is seperated with "", remove them for processing
    inputPower = inputPowerFilter(message, inputPower);
    if (inputPower === undefined) {
        return message.channel.send("Error reading power name");
    }

    let obj = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
    const allSystems = JSON.parse(obj);

    obj = fs.readFileSync('./data/stations.json', 'utf8')
    const allStations = JSON.parse(obj);

    let unflippableSystems = [];
    for (i = 0; i < allSystems.length; i++) {
        if (allSystems[i].power === inputPower && allSystems[i].power_state === "Control") {
            // add new control system object to array
            const controlSystem = {};
            controlSystem.name = allSystems[i].name;

            // find hq distance
            const HQDistance = HQDistances(inputPower, allSystems[i].x, allSystems[i].y, allSystems[i].z);

            // check for M/L pad
            // goal is to find largest pad with shortest distance
            let maxLandingPadSize = 'M';
            let shortestDistanceToStar = -1;
            let odysseyOnly = 0;
            try {
                for (j = 0; j < allStations.length; j++) {
                    if (allSystems[i].id === allStations[j].system_id) {
                        if (allStations[j].max_landing_pad_size === 'L') {
                            // if L pad is Odyssey only (only type 13), make a addendum
                            if (allStations[j].body_id === null && allStations[j].type_id === 13) {
                                maxLandingPadSize = 'L';
                                shortestDistanceToStar = allStations[j].distance_to_star;
                                odysseyOnly = 1;
                            } else {
                                maxLandingPadSize = 'L';
                                shortestDistanceToStar = allStations[j].distance_to_star;
                            }
                        }
                        // update clostest M pad if no L pad is yet found
                        if (maxLandingPadSize === 'M') {
                            shortestDistanceToStar = allStations[j].distance_to_star;
                        }
                    }
                }
                if (shortestDistanceToStar === -1) { throw 'No stations found within control system'; }
            } catch (e) {
                console.error(e);
                message.channel.send('Error encountered, please contact Cynder#7567');
            }
            
            // check if sphere is favorable, neutral, or unfavorable
            let favorables = 0;
            let neutrals = 0;
            let unfavorables = 0;
            for (j = 0; j < allSystems.length; j++) {
                if (distLessThan(15, allSystems[i].x, allSystems[i].y, allSystems[i].z, allSystems[j].x, allSystems[j].y, allSystems[j].z) === true
                    && allStations[j].power_state === 'Exploited') {
                    try {
                        let tmp = favorability(inputPower, allSystems[j].government, allSystems[j].power_state, inputPower, 'Control');
                        if (tmp === 'favorable') {
                            favorables += 1;
                        }
                        if (tmp === 'unfavorable') {
                            unfavorables += 1;
                        }
                        if (tmp === 'neutral') {
                            neutrals += 1;
                        }
                        if (tmp === -1) { throw 'favorability error' }
                    } catch (e) {
                        console.error(e);
                        message.channel.send('Error encountered, please contact Cynder#7567');
                    }
                }
            }
            // if unfavorable, ignore
            if (unfavorables > neutrals && unfavorables > favorables) {
                continue;
            }
            // find merits needed to haul at neutral
            const fortMerits = Math.round(1 * (0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5));
            let meritsAdded = 0;
            let meritsAddedAgain = 0;
            controlSystem.if = '';
            // if favorable, find value for flipping to both neutral or unfavorable (2 entries)
            if (favorables > neutrals && favorables > unfavorables) {
                meritsAdded = Math.round(.5 * fortMerits); // favorable to neutral
                meritsAddedAgain = fortMerits // favorable to unfavorable
                controlSystem.if = 'Neutral';
            }
            // if neutral, find value for flipping unfavorable
            if (neutrals >= favorables && neutrals >= unfavorables) {
                meritsAdded = Math.round(.5 * fortMerits); // neutral to unfavorable
                controlSystem.if = 'Unfavorable';
            }

            // calculate trips required and ly per one-way trip
            // counting final return trip
            // 720t, 40/30ly for a Cutter
            let unladenRange = 0;
            let ladenRange = 0;
            let cargoMax = 0;
            let jumpsAdded = 0;
            if (maxLandingPadSize === 'L') {
                unladenRange = 40;
                ladenRange = 30;
                cargoMax = 720;
            }
            // 280t, 40/30ly for a Python
            if (maxLandingPadSize === 'M') {
                unladenRange = 40;
                ladenRange = 30;
                cargoMax = 280;
            }
            // calculate jumps added to fortify unflipped target
            const ladenJumps = Math.ceil(HQDistance / ladenRange);
            const unladenJumps = Math.ceil(HQDistance / unladenRange);
            const additionalRoundTrips = Math.ceil((fortMerits + meritsAdded) / cargoMax) - Math.ceil(fortMerits / cargoMax);
            jumpsAdded = additionalRoundTrips * (ladenJumps + unladenJumps);
            
            // for favorable systems
            if (meritsAddedAgain !== 0) {
                const extraSystem = {};
                extraSystem.name = allSystems[i].name;
                extraSystem.jumps_added = Math.ceil((fortMerits + meritsAddedAgain) / cargoMax) - Math.ceil(fortMerits / cargoMax);
                extraSystem.if = "Unfavorable";
                unflippableSystems.push(extraSystem);
            }

            controlSystem.jumps_added = jumpsAdded;
            unflippableSystems.push(controlSystem);
        }
    }

    // sorts
    // jumps_added
    unflippableSystems.sort((a, b) => b.jumps_added - a.jumps_added);

    // output main block(s)
    let block = '';
    let subSystems = [];
    if (unflippableSystems.length === 0) {
        message.channel.send('`No systems found`');
    } else if (unflippableSystems.length <= 20) {
        const columns = columnify(unflippableSystems); // tabularize info
    } else {
        let i = 0;
        // print with header and first 20 systems
        for (; i < 20; i++) {
            subSystems.push(unflippableSystems[i]);
        }
        block = columnify(subSystems);
        // loop out rest of the systems in 25 system increments
        subSystems = [];
        for (; i < unflippableSystems.length; i++) {
            subSystems.push(unflippableSystems[i]);
            // every 25 after the first 20 systems
            if (i > 25 && i % 25 === 0) {
                block = columnify(subSystems);
                message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
                subSystems = [];
            }
        }
        // print remainder of systems
        if (subSystems.length !== 0) {
            block = columnify(subSystems);
            message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
        }
    }
    
};