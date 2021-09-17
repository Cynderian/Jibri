const { capitalize, removeQuotes, inputPowerFilter, distLessThan, popToCC, HQDistances } = require('../functions.js');
const fs = require('fs');
const columnify = require('columnify');
exports.run = (client, message, args) => {
    if (message.author.id !== '182976741373902848' // Cynder
    && message.author.id !== '187391406111850496' // Aero
    && message.author.id !== '202852077993590785' // Oraki
    && message.author.id !== '522888275283673092' // Gwar
    && message.author.id !== '552524920643518465' // Momo
    && message.author.id !== '209888324930764800' // :ocean:
    && message.author.id !== '174069540563451905' // Andalyn
    && message.author.id !== '100903405358190592' // DivadREX
    && message.author.id !== '256475063975542784' // Bones
    && message.author.id !== '173834440227684352' // Ikuo
    && message.author.id !== '404662765299433472' // Schielman
    && message.author.id !== '133358103201710080') { // Mantis
        console.log('- - Unauthorized command \'threats\' attempted - -');
        return message.channel.send('You do not have permission to use this command.');
    }
    console.log('working on threats');
    message.channel.send('Calculating...');
    const today = new Date();
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
        delete threatSystems[i].z;
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
    }

    // write to txt
    fs.writeFile('./data/targets.txt', columns, (err) => {
        if (err) return console.log(err);
        console.log('file successfully saved');
    });
};