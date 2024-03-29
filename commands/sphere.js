const { capitalize, removeQuotes, inputPowerFilter, lastUpdated, infLead, popToCC, distLessThan, favorability, HQDistances } = require('../functions.js');
const fs = require('fs');
const columnify = require('columnify');
exports.run = (client, message, args) => {
    const today = new Date();
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
    let contests = 0;
    if (args[0] === '-contests') {
        console.log('detailed contests enabled');
        message.channel.send('Detailed contests display enabled');
        contests = 1;
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
    const data = fs.readFileSync(`./data/systems_populated.json`, 'utf8');
    const allSystems = JSON.parse(data);

    // variable declarations
    const targetSystems = [];
    const contestedSystems = [];
    const detailedContestedSystems = [];
    let grossCC = 0;
    let contestedCC = 0;
    let controlledSystems = 0;
    let favorables = 0;
    let unfavorables = 0;
    let neutrals = 0;
    let favor = '';
    let warningFlag = '';
    let contestsMagic = 0;
    //let expansionControlTrigger = 0;
    let previouslyContestedCC = 0;

    // find input system's coords to use in distLessThan
    let sphereType = 'Expansion';
    const controlSphereSystem = {};
    // central system to base sphere off of (control system)
    for (let i = 0; i < allSystems.length; i++) {
        if (sphere === (allSystems[i].name).toLowerCase()
        && allSystems[i].population > 0) {
            sphere = allSystems[i].name;

            // add to control data object to insert later
            const lastTick = lastUpdated(allSystems[i].minor_factions_updated_at * 1000); // convert from unix timestamp

            controlSphereSystem.x = allSystems[i].x;
            controlSphereSystem.y = allSystems[i].y;
            controlSphereSystem.z = allSystems[i].z;
            controlSphereSystem.name = allSystems[i].name;
            controlSphereSystem.government = allSystems[i].government;
            controlSphereSystem.lead = infLead(allSystems[i]);
            controlSphereSystem.date = `${lastTick.month}/${lastTick.day}`;
            controlSphereSystem.cc = popToCC(allSystems[i].population);
            controlSphereSystem.power = allSystems[i].power;
            controlSphereSystem.state = allSystems[i].power_state;

            if ((allSystems[i].power_state === 'Control' || allSystems[i].power_state === 'Expansion')
            && override === 0) {
                power = allSystems[i].power;
            }
            if (override === 1) {
                sphereType = 'Expansion';
                controlSphereSystem.power_state = null;
            }
            if (allSystems[i].power_state === 'Control') {
                grossCC += popToCC(allSystems[i].population);
                sphereType = 'Control';
            }
            if (allSystems[i].power_state === 'Expansion') {
                warningFlag = 'Expansion';
                if (allSystems[i].power === power) {
                    grossCC += popToCC(allSystems[i].population);
                } else {
                    contestedCC += popToCC(allSystems[i].population);
                }
            }
            if (allSystems[i].power_state === 'Exploited') {
                warningFlag = 'Exploited';
            }
            break;
        }
    }
    // exit if system does not exist
    if (controlSphereSystem.x === undefined) {
        console.log('command aborted. args:');
        console.log(args)
        console.log(sphere)
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
        && allSystems[i].name !== 'Wolfsegen'
        && allSystems[i].population > 0) {
            // count control systems of input power
            if (allSystems[i].power === power && allSystems[i].power_state === 'Control') {
                controlledSystems += 1;
            }
            if (distLessThan(15, controlSphereSystem.x, controlSphereSystem.y, controlSphereSystem.z, allSystems[i].x, allSystems[i].y, allSystems[i].z) === true) {
                // filter out control system
                if (sphere === allSystems[i].name) {
                    // contests modification
                    if (contests === 1 || controlSphereSystem.state !== 'Control' || controlSphereSystem.power !== power) {
                        contestsMagic = 1;
                    }
                }
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

                // contests - extra data
                if (contests === 1) {
                    for (let j = 0; j < allSystems.length; j++) {
                        if (allSystems[j].name !== 'Shinrarta Dezhra' // you know where this is
                        && allSystems[j].name !== 'Azoth' // 10 starter systems
                        && allSystems[j].name !== 'Dromi'
                        && allSystems[j].name !== 'Lia Fall'
                        && allSystems[j].name !== 'Matet'
                        && allSystems[j].name !== 'Orna'
                        && allSystems[j].name !== 'Otegine'
                        && allSystems[j].name !== 'Sharur'
                        && allSystems[j].name !== 'Tarnkappe'
                        && allSystems[j].name !== 'Tyet'
                        && allSystems[j].name !== 'Wolfsegen'
                        && allSystems[j].population > 0
                        && distLessThan(15, allSystems[i].x, allSystems[i].y, allSystems[i].z, allSystems[j].x, allSystems[j].y, allSystems[j].z) === true
                        && allSystems[j].power_state === 'Control'
                        && (allSystems[j].name !== controlSphereSystem.name || (controlSphereSystem.state !== 'Control' && controlSphereSystem.power !== power))) {
                            // contested systems
                            const contestedSystem = {};
                            contestedSystem.name = allSystems[i].name;
                            contestedSystem.control_name = allSystems[j].name;
                            contestedSystem.power = allSystems[j].power;
                            contestedSystem.cc = popToCC(allSystems[i].population);
                            let repeat = 0;
                            for (let k = 0; k < detailedContestedSystems.length; k++) {
                                if (allSystems[i].name === detailedContestedSystems[k].name && allSystems[j].power === detailedContestedSystems[k].power) {
                                    repeat = 1;
                                }
                            }
                            if (repeat === 0) {
                                detailedContestedSystems.push(contestedSystem);
                            }
                        }
                    }
                }
                // footer data
                // Favorable / Neutral / Unfavorable
                if (allSystems[i].name !== sphere // not target sphere system
                    && ((allSystems[i].power === power || allSystems[i].power === null) || override === 1)) { // only collision systems are checked
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
                }
                // Gross CC
                // Expansion
                if (sphereType === 'Expansion' && (allSystems[i].power_state !== 'Exploited' && allSystems[i].power_state !== 'Control')) {
                    grossCC += popToCC(allSystems[i].population);
                }
                if (sphereType === 'Expansion' && allSystems[i].power_state === 'Contested') {
                    previouslyContestedCC += popToCC(allSystems[i].population);
                }
                // Control
                if (sphereType === 'Control' && allSystems[i].power_state === 'Exploited') {
                    grossCC += popToCC(allSystems[i].population);
                }
                // Control - Contested
                if (sphereType === 'Control' && allSystems[i].power_state === 'Contested') {
                    let tmp2 = 0;
                    let tmpnum = 0;
                    const system2 = {};
                    for (let j = 0; j < allSystems.length; j++) {
                        if (distLessThan(15, allSystems[i].x, allSystems[i].y, allSystems[i].z, allSystems[j].x, allSystems[j].y, allSystems[j].z)
                        && allSystems[j].power_state === 'Control' && allSystems[j].power != power) {
                            system2.power = allSystems[j].power;
                            system2.cc = popToCC(allSystems[i].population);
                            tmp2 = popToCC(allSystems[i].population);
                            tmpnum += 1;
                        }
                    }
                    if (tmpnum === 1 ) {
                        contestedSystems.push(system2);
                        contestedCC += tmp2;
                    }
                    if (tmpnum > 1) {
                        system2.power = 'multiple powers';
                        contestedSystems.push(system2);
                        contestedCC += tmp2;
                    }
                }
                // Expansion - Contested
                if (sphereType === 'Expansion' && allSystems[i].power_state !== 'Contested' && allSystems[i].power_state !== null) {
                    const system2 = {};
                    system2.power = allSystems[i].power;
                    system2.cc = popToCC(allSystems[i].population);
                    if (sphere !== allSystems[i].name) {
                        contestedCC += popToCC(allSystems[i].population);
                    }
                    /*if (expansionControlTrigger === 0) { // What is this code block for lol
                        contestedCC += controlSphereSystem.cc;
                        expansionControlTrigger = 1;
                    }*/
                    contestedSystems.push(system2);
                }
            }
        }
    }
    // Control - Contested systems string-ification
    // generate blank objects for indexes
    let contestedStr = '';
    const onelineContestedSystems = [];
    if (contests === 1) {
        // the total contested cc is...
        // total self contested cc
        // cc contested for n power is.. (contested control system 1, system 2..)
        // cc contested for n+1 is...
        let otherContestedCC = 0;
        let selfContestedCC = 0;

        // sorts
        // system -> power -> control name
        detailedContestedSystems.sort((a, b) => {
            const nameA = a.control_name;
            const nameB = b.control_name;
            if (nameA < nameB) { return -1; }
            if (nameA > nameB) { return 1; }
            return 0;
        });
        detailedContestedSystems.sort((a, b) => {
            const nameA = a.power;
            const nameB = b.power;
            if (nameA < nameB) { return -1; }
            if (nameA > nameB) { return 1; }
            return 0;
        });
        detailedContestedSystems.sort((a, b) => {
            const nameA = a.name;
            const nameB = b.name;
            if (nameA < nameB) { return -1; }
            if (nameA > nameB) { return 1; }
            return 0;
        });

        // total contested CC counts
        let tmp = [];
        for (let i = 0; i < detailedContestedSystems.length; i++) {
            let tmp2 = 0;
            if (detailedContestedSystems[i].power !== controlSphereSystem.power) {
                for (let j = 0; j < tmp.length; j++) {
                    if (tmp[j] === detailedContestedSystems[i].name) {
                        tmp2 = 1;
                    }
                }
                if (tmp2 === 0) {
                    otherContestedCC += detailedContestedSystems[i].cc;
                    tmp.push(detailedContestedSystems[i].name);
                }
            }
        }
        tmp = [];
        for (let i = 0; i < detailedContestedSystems.length; i++) {
            if (detailedContestedSystems[i].power === controlSphereSystem.power) {
                selfContestedCC += detailedContestedSystems[i].cc;
            }
        }
        tmp = [];
        contestedStr = `Contested CC with other powers: ${otherContestedCC}CC\nSelf-contested CC: ${selfContestedCC}CC\n`;
        for (let i = 0; i < 12; i++) { // 12 = number of powers + 1
            const system = {};
            system.power = undefined;
            system.cc = 0;
            onelineContestedSystems.push(system);
        }
        for (let i = 0; i < detailedContestedSystems.length; i++) {
            if (detailedContestedSystems[i].power === 'Zachary Hudson') {
                onelineContestedSystems[0].power = detailedContestedSystems[i].power;
                onelineContestedSystems[0].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Felicia Winters') {
                onelineContestedSystems[1].power = detailedContestedSystems[i].power;
                onelineContestedSystems[1].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Arissa Lavigny-Duval') {
                onelineContestedSystems[2].power = detailedContestedSystems[i].power;
                onelineContestedSystems[2].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Edmund Mahon') {
                onelineContestedSystems[3].power = detailedContestedSystems[i].power;
                onelineContestedSystems[3].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Archon Delaine') {
                onelineContestedSystems[4].power = detailedContestedSystems[i].power;
                onelineContestedSystems[4].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Denton Patreus') {
                onelineContestedSystems[5].power = detailedContestedSystems[i].power;
                onelineContestedSystems[5].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Yuri Grom') {
                onelineContestedSystems[6].power = detailedContestedSystems[i].power;
                onelineContestedSystems[6].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Li Yong-Rui') {
                onelineContestedSystems[7].power = detailedContestedSystems[i].power;
                onelineContestedSystems[7].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Zemina Torval') {
                onelineContestedSystems[8].power = detailedContestedSystems[i].power;
                onelineContestedSystems[8].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Pranav Antal') {
                onelineContestedSystems[9].power = detailedContestedSystems[i].power;
                onelineContestedSystems[9].cc += detailedContestedSystems[i].cc;
            } else if (detailedContestedSystems[i].power === 'Aisling Duval') {
                onelineContestedSystems[10].power = detailedContestedSystems[i].power;
                onelineContestedSystems[10].cc += detailedContestedSystems[i].cc;
            } else {
                console.log('error');
                console.log(detailedContestedSystems[i]);
            }
        }
        for (let i = 0; i < onelineContestedSystems.length; i++) {
            if (onelineContestedSystems[i].power !== undefined) {
                contestedStr += `Contested with ${(onelineContestedSystems[i].power).split(' ')[0]}: ${onelineContestedSystems[i].cc}CC\n`;
            }
        }
    }
    else {
        for (let i = 0; i < 12; i++) {
            const system = {};
            system.power = undefined;
            system.cc = 0;
            onelineContestedSystems.push(system);
        }
        contestedSystems.push(controlSphereSystem);
        for (let i = 0; i < contestedSystems.length; i++) {
            if (contestedSystems[i].power === 'Zachary Hudson') {
                onelineContestedSystems[0].power = contestedSystems[i].power;
                onelineContestedSystems[0].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Felicia Winters') {
                onelineContestedSystems[1].power = contestedSystems[i].power;
                onelineContestedSystems[1].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Arissa Lavigny-Duval') {
                onelineContestedSystems[2].power = contestedSystems[i].power;
                onelineContestedSystems[2].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Edmund Mahon') {
                onelineContestedSystems[3].power = contestedSystems[i].power;
                onelineContestedSystems[3].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Archon Delaine') {
                onelineContestedSystems[4].power = contestedSystems[i].power;
                onelineContestedSystems[4].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Denton Patreus') {
                onelineContestedSystems[5].power = contestedSystems[i].power;
                onelineContestedSystems[5].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Yuri Grom') {
                onelineContestedSystems[6].power = contestedSystems[i].power;
                onelineContestedSystems[6].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Li Yong-Rui') {
                onelineContestedSystems[7].power = contestedSystems[i].power;
                onelineContestedSystems[7].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Zemina Torval') {
                onelineContestedSystems[8].power = contestedSystems[i].power;
                onelineContestedSystems[8].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Pranav Antal') {
                onelineContestedSystems[9].power = contestedSystems[i].power;
                onelineContestedSystems[9].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'Aisling Duval') {
                onelineContestedSystems[10].power = contestedSystems[i].power;
                onelineContestedSystems[10].cc += contestedSystems[i].cc;
            } else if (contestedSystems[i].power === 'multiple powers') {
                onelineContestedSystems[11].power = contestedSystems[i].power;
                onelineContestedSystems[11].cc += contestedSystems[i].cc;
            }
        }
        contestedSystems.pop();
        for (let i = 0; i < onelineContestedSystems.length; i++) {
            if (onelineContestedSystems[i].power !== undefined && onelineContestedSystems[i].power !== power) {
                contestedStr += `Contested with ${(onelineContestedSystems[i].power).split(' ')[0]}: ${onelineContestedSystems[i].cc}CC\n`;
            }
        }
    }

    // add back in control system
    const HQDistance = HQDistances(power, controlSphereSystem.x, controlSphereSystem.y, controlSphereSystem.z);
    if (contestsMagic !== 1) {
        delete controlSphereSystem.x;
        delete controlSphereSystem.y;
        delete controlSphereSystem.z;
        targetSystems.push(controlSphereSystem);
    }

    // math for cc calculations
    // Upkeep
    const upkeep = Math.ceil((HQDistance ** 2) * 0.001 + 20);
    // Overhead
    // Control
    const overhead = (Math.min(((11.5 * (controlledSystems)) / 42) ** 3, 5.4 * 11.5 * controlledSystems)) / controlledSystems;
    const overheadMax = (Math.min(((11.5 * (99)) / 42) ** 3, 5.4 * 11.5 * 99)) / 99;
    // Expansion
    let overheadEdge = 0;
    if (sphereType === 'Expansion') {
        const overheadDiff = ((Math.min(((11.5 * (controlledSystems + 1)) / 42) ** 3, 5.4 * 11.5 * (controlledSystems + 1))) / (controlledSystems + 1)) - overhead;
        overheadEdge = overheadDiff * (controlledSystems + 1);
    }
    // Net CC
    const netCC = grossCC - overhead - upkeep;
    const netCCMax = grossCC - overheadMax - upkeep;

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
    let oppOrFortNumber = (fort / umOpp).toFixed(2);

    // Shenanigans to get the sorts to work correctly when null values exist
    for (let i = 0; i < targetSystems.length; i++) {
        if (targetSystems[i].power === null) {
            targetSystems[i].power = '';
        }
        if (targetSystems[i].state === null) {
            targetSystems[i].state = '';
        }
        // contests modifier
        if (contests === 1) {
            targetSystems[i].contests = '';
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
    // contests display adjustments
    if (contests === 1) {
        for (let i = 0; i < targetSystems.length; i++) {
            delete targetSystems[i].government;
            delete targetSystems[i].lead;
            delete targetSystems[i].date;
            let contestPowerStrFirst = '';
            let contestPowerStrSecond = '';
            let otherContestCounter = 0;
            let selfContestCounter = 0;
            for (let j = 0; j < detailedContestedSystems.length; j++) {
                if (detailedContestedSystems[j].name === targetSystems[i].name) {
                    // other contest
                    if (!(targetSystems[i].power).includes(detailedContestedSystems[j].power)
                        && !(targetSystems[i].power).includes(controlSphereSystem.power)) {
                        if (contestPowerStrSecond.includes(detailedContestedSystems[j].power)) {
                            otherContestCounter += 1;
                            contestPowerStrSecond += ` x${otherContestCounter}`;
                        }
                        if (contestPowerStrSecond === '' || contestPowerStrFirst === `${controlSphereSystem.power} (self-contested)`) {
                            contestPowerStrSecond += detailedContestedSystems[j].power;
                            otherContestCounter = 1;
                        } else if (!contestPowerStrSecond.includes(detailedContestedSystems[j].power)) {
                            contestPowerStrSecond += `, ${detailedContestedSystems[j].power}`;
                            otherContestCounter = 1;
                        }
                        // self-contest
                    } else if ((targetSystems[i].power).includes(controlSphereSystem.power)) {
                        if (selfContestCounter >= 1) {
                            selfContestCounter += 1;
                        } else {
                            selfContestCounter = 1;
                            contestPowerStrFirst = `${controlSphereSystem.power} (self-contested)`;
                        }
                    }
                    // contested spheres
                    if (targetSystems[i].contests === '') {
                        targetSystems[i].contests = detailedContestedSystems[j].control_name;
                    } else {
                        targetSystems[i].contests += `, ${detailedContestedSystems[j].control_name}`;
                    }
                }
            }
            if (selfContestCounter > 1) {
                contestPowerStrFirst += ` x${selfContestCounter}`;
            }
            targetSystems[i].power = `${contestPowerStrFirst}${contestPowerStrSecond}`;
        }
    }
    // warning addition
    let warningStr = '';
    if (warningFlag === 'Exploited') {
        warningStr = '[ Warning: Target system is already exploited, footer favorability ratios may be inaccurate ]\n';
    } else if (warningFlag === 'Expansion') {
        warningStr = '[ Warning: Target system is currently being expanded from ]\n';
    } 

    // Control system adjustments
    let oppOrFortInfo = '';
    if (sphereType === 'Control') {
        if (favorables > neutrals && favorables > unfavorables) {
            oppOrFortInfo = `= ${fort} to fortify =`;
        } else if (unfavorables > neutrals && unfavorables > favorables) {
            oppOrFortInfo = `${fort} to fortify::`;
        } else {
            oppOrFortInfo = `| ${fort} to fortify |`;
        }
    }
    let infoStart = '';
    let infoEnd = '';
    if (sphereType === 'Expansion') {
        if (favorables > neutrals && favorables > unfavorables) {
            infoStart = '= ';
            infoEnd = ' (favorable) =';
        } else if (unfavorables > neutrals && unfavorables > favorables) {
            infoStart = '';
            infoEnd = '::';
        } else {
            infoStart = '| ';
            infoEnd = ' |';
        }
        oppOrFortInfo = `${oppOrFortNumber}:1 triggers`;
    }

    // output main block(s)
    let block = '';
    let subSystems = [];
    // info start/end (favorability)

    // header
    const header = `= ${sphere} ${sphereType} Sphere Analysis =\n${infoStart}${oppOrFortInfo}${infoEnd} ${HQDistance.toFixed(2)}ly from HQ\n${warningStr}\n`;
    // body
    let i = 0;
    let firstDisp = 20;
    let secDisp = 25;
    if (contests === 1) {
        firstDisp = 15;
        secDisp = 17;
    }
    if (targetSystems.length === 0) {
        message.channel.send('`No systems found`');
    } else if (targetSystems.length <= firstDisp) {
        const columns = columnify(targetSystems); // tabularize info
        message.channel.send(`\`\`\`asciidoc\n${header}${columns}\`\`\``);
    } else {
        // print with header and first 20 systems
        for (; i < firstDisp; i++) {
            subSystems.push(targetSystems[i]);
        }
        block = columnify(subSystems);
        message.channel.send(`\`\`\`asciidoc\n${header}${block}\`\`\``);
        // loop out rest of the systems in 25 system increments
        subSystems = [];
        for (; i < targetSystems.length; i++) {
            subSystems.push(targetSystems[i]);
            // every 25 after the first 20 systems
            if (i > secDisp && i % secDisp === 0) {
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

    // Correction for no systems found
    if (favor === '') {
        favor = '0/0/0'
    }

    // footer
    // add max overhead if power is not at max already
    let overheadStr = overhead.toFixed(1);
    let overheadMaxStr = '';
    if (overhead.toFixed(1) !== '62.1' && sphereType === 'Expansion') {
        overheadStr = `(${overhead.toFixed(1)} + ${overheadEdge.toFixed(1)})`;
        overheadMaxStr = ` / ${netCCMax.toFixed(1)} at max overhead`;
    }
    const favorStr = `${favor} favorable/neutral/unfavorable systems for ${power}`;
    const grossStr = `Sphere gross value: ${grossCC + contestedCC}CC`;
    const grossMinusContestsStr = `Gross value not including contests: ${grossCC - previouslyContestedCC}CC`;
    const upkeepOverheadStr = `Upkeep + Overhead: ${upkeep} + ${overheadStr}`;
    const netStr = `Net CC: ${netCC.toFixed(1)}CC${overheadMaxStr}`;
    let powerChange = '';
    if (sphereType === 'Expansion') {
        powerChange = `${power} total CC change: ${(netCC - overheadEdge).toFixed(1)}`;
    }
    message.channel.send(`\`\`\`\n${favorStr}\n${grossStr}\n${grossMinusContestsStr}\n${contestedStr}${upkeepOverheadStr}\n${netStr}\n${powerChange}\n\`\`\``);
};