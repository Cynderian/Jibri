const { capitalize, HQDistances, removeQuotes, inputPowerFilter, distLessThan, favorability } = require('../functions');
const fs = require('fs');
const columnify = require('columnify');

function minFlipsPlurality(flips, favorables, neutrals, unfavorables) {
    if (favorables === neutrals && neutrals === unfavorables && unfavorables === 0) {
        return Infinity;
    }
    if (flips === 'unfavorable') {
        if (unfavorables > favorables && unfavorables > neutrals) {
            return 0;
        }
        if (favorables >= neutrals) {
            return 1 + minFlipsPlurality(flips, favorables - 1, neutrals, unfavorables + 1);
        }
        if (neutrals > favorables) {
            return 1 + minFlipsPlurality(flips, favorables, neutrals - 1, unfavorables + 1);
        }
    }
    if (flips === 'neutral') {
        return Math.ceil((favorables - neutrals) / 2);
    }
    return -1;
}

exports.run = (client, message, args) => {
    console.log('working on unflip');
    message.channel.send('This is an experimental command; double check its output!');
    message.channel.send('There are no automatic filters for net CC of these spheres, so that weapons may show up as targets. Please manually double check all planned targets');
    const today = new Date();
    if (!args.length) {
        return message.channel.send('Please define a power');
    }

    let inputPower = '';
    if (args[0] === 'Aisling Duval' && message.author.id !== '182976741373902848') {
        message.channel.send('No :spraybottle:');
    } else {
        inputPower = args[0];
    }

    inputPower = capitalize(removeQuotes(inputPower)); // if input is seperated with "", remove them for processing
    inputPower = inputPowerFilter(message, inputPower);
    if (inputPower === undefined) {
        return message.channel.send('Error reading power name');
    }

    let obj = fs.readFileSync(`./data/systems_populated.json`, 'utf8');
    const allSystems = JSON.parse(obj);

    obj = fs.readFileSync('./data/stations.json', 'utf8');
    const allStations = JSON.parse(obj);

    let unflippableSystems = [];
    for (let i = 0; i < allSystems.length; i++) {
        if (allSystems[i].power === inputPower && allSystems[i].power_state === 'Control') {
            // add new control system object to array
            const controlSystem = {};
            controlSystem.name = allSystems[i].name;

            // find hq distance
            const HQDistance = HQDistances(inputPower, allSystems[i].x, allSystems[i].y, allSystems[i].z);

            // check for M/L pad
            // goal is to find largest pad with shortest distance
            let maxLandingPadSize = 'M';
            let shortestDistanceToStar = -1;
            try {
                for (let j = 0; j < allStations.length; j++) {
                    if (allSystems[i].id === allStations[j].system_id) {
                        if (allStations[j].max_landing_pad_size === 'L' 
                        && (shortestDistanceToStar > allStations[j].distance_to_star || shortestDistanceToStar === -1)
                        && allStations[i].type !== 'Odyssey Station') {
                            maxLandingPadSize = 'L';
                            shortestDistanceToStar = allStations[j].distance_to_star;
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
                return message.channel.send('Error encountered, please contact Cynder#7567');
            }
            
            // check if sphere is favorable, neutral, or unfavorable
            let favorables = 0;
            let neutrals = 0;
            let unfavorables = 0;
            for (let j = 0; j < allSystems.length; j++) {
                if (distLessThan(15, allSystems[i].x, allSystems[i].y, allSystems[i].z, allSystems[j].x, allSystems[j].y, allSystems[j].z) === true
                    && allSystems[j].power_state === 'Exploited') {
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
                        if (tmp === -1) { throw 'favorability error'; }
                    } catch (e) {
                        console.error(e);
                        return message.channel.send('Error encountered, please contact Cynder#7567');
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
            controlSystem.min_flips = '';
            let minFlipsTmp = -1;
            // if favorable, find value for flipping to both neutral or unfavorable (2 entries)
            if (favorables > neutrals && favorables > unfavorables) {
                meritsAdded = Math.round(.5 * fortMerits); // favorable to neutral
                meritsAddedAgain = fortMerits; // favorable to unfavorable
                controlSystem.if = 'Neutral';
                minFlipsTmp = minFlipsPlurality('unfavorable', favorables, neutrals, unfavorables);
                controlSystem.min_flips = minFlipsPlurality('neutral', favorables, neutrals, unfavorables);
            }
            // if neutral, find value for flipping unfavorable
            if (neutrals >= favorables && neutrals >= unfavorables) {
                meritsAdded = Math.round(.5 * fortMerits); // neutral to unfavorable
                controlSystem.if = 'Unfavorable';
                controlSystem.min_flips = minFlipsPlurality('unfavorable', favorables, neutrals, unfavorables);
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
                const ladenTwo = Math.ceil(HQDistance / ladenRange);
                const unladenTwo = Math.ceil(HQDistance / unladenRange);
                const additionalTwo = Math.ceil((fortMerits + meritsAddedAgain) / cargoMax) - Math.ceil(fortMerits / cargoMax);
                let jmpsAddTmp = additionalTwo * (ladenTwo + unladenTwo);
                extraSystem.jumps_added = jmpsAddTmp;
                extraSystem.sc_distance = shortestDistanceToStar;
                extraSystem.pad = maxLandingPadSize;
                extraSystem.if = 'Unfavorable';
                extraSystem.min_flips = minFlipsTmp;
                extraSystem.value = jmpsAddTmp/minFlipsTmp;
                unflippableSystems.push(extraSystem);
            }

            const tmp = controlSystem.if;
            const tmp2 = controlSystem.min_flips;
            delete controlSystem.if;
            delete controlSystem.min_flips;
            controlSystem.jumps_added = jumpsAdded;
            controlSystem.sc_distance = shortestDistanceToStar;
            controlSystem.pad = maxLandingPadSize;
            controlSystem.if = tmp;
            controlSystem.min_flips = tmp2;
            controlSystem.value = jumpsAdded/tmp2;
            unflippableSystems.push(controlSystem);
        }
    }

    // sorts
    // value -> sc_distance
    unflippableSystems.sort((a, b) => b.sc_distance - a.sc_distance);
    unflippableSystems.sort((a, b) => b.value - a.value);
    
    for (let i = 0; i < unflippableSystems.length; i++) {
        unflippableSystems[i].value = (unflippableSystems[i].value).toFixed(1);
    }
    // write to txt
    const columns = columnify(unflippableSystems);
    fs.writeFile(`./data/unflip_${inputPower}.txt`, columns, (err) => {
        if (err) return console.log(err);
        console.log('file successfully saved');
        message.channel.send('File sucessfully saved.');
    });
    
};