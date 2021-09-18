const { capitalize, removeQuotes, inputPowerFilter, distLessThan, popToCC, HQDistances, infLead, lastUpdated } = require('../functions.js');
const fs = require('fs');
const columnify = require('columnify');
exports.run = (client, message, args) => {
    console.log('working on scout');
    message.channel.send('Calculating...');
    const today = new Date();
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
    let anyOverride = 0;
    let overrideProfitables = 0;
    let overrideTrello = 0;
    if (args[0] === '-profitables') {
        console.log('profitables override enabled');
        overrideProfitables = 1;
        anyOverride = 1;
        args.shift();
    } else if (args[0] === '-trello') {
        console.log('trello override enabled');
        overrideTrello = 1;
        anyOverride = 1;
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

            // pushes all control systems
            if (anyOverride === 0) {
                controlSystems.push(controlSystem);
            // pushes profitable control systems and favorable factions
            } else if (overrideProfitables === 1) {
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
            } else if (overrideTrello === 1) {
                const trelloSystems = fs.readFileSync('./data/trello_list.txt').toString().split('\n');
                for (let j = 0; j < trelloSystems.length; j++) {
                    if (allSystems[i].name === trelloSystems[j]) {
                        controlSystems.push(controlSystem);
                    }
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
    } else if (x < 25) {
        const block = columnify(dangerSystems);
        message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
    } else {
        const block = columnify(subSystems);
        message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
    }
};