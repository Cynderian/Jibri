const { capitalize, removeQuotes, inputPowerFilter, popToCC, distLessThan, HQDistances } = require('../functions.js');
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
    console.log('working on profitables');
    message.channel.send('Calculating...');
    const today = new Date();
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
    let obj = fs.readFileSync(`./data/systems_populated_${today.getMonth() + 1}_${today.getDate()}_${today.getFullYear()}.json`, 'utf8');
    const allSystems = JSON.parse(obj);

    obj = fs.readFileSync('./data/stations.json', 'utf8');    
    let allStations = JSON.parse(obj);
    obj = null;

    // find all expandable systems
    console.log('finding all expandable systems');
    const viableSystems = [];
    // add filtered out control sphere's systems to list, to be filtered out later
    const toFilter = [];
    for (let i = 0; i < allSystems.length; i++) {
        // Control Spheres
        if (allSystems[i].power_state === 'Control') {
            // Control Sphere Names
            if (allSystems[i].name === 'LTT 1289'
            || allSystems[i].name === 'Gabjaujis'
            || allSystems[i].name === 'Kaukamal'
            || allSystems[i].name === 'Qi Yun Cech'
            || allSystems[i].name === 'Zhao'
            || allSystems[i].name === 'Ch\'eng'
            || allSystems[i].name === 'Theta Octantis'
            || allSystems[i].name === 'Tumuzgo'
            || allSystems[i].name === 'Munshin') {
                // within 15 ly
                if (distLessThan(15, allSystems.x, allSystems.y, allS))
                toFilter.push(allSystems.name);
            }
        }
    }
    for (let i = 0; i < allSystems.length; i++) {
        // filter out a power
        /*
        if (allSystems[i].power === 'Li Yong-Rui') {
            allSystems[i].power = null;
            allSystems[i].power_state = null;
        }*/
        // filter out spheres
        
        if (allSystems[i].power_state === 'Control') {
            if (allSystems[i].name === 'LTT1289'
            || allSystems[i].name === 'Gabjaujis'
            || allSystems[i].name === 'Kaukamal'
            || allSystems[i].name === 'Qi Yun Cech'
            || allSystems[i].name === 'Zhao'
            || allSystems[i].name === 'Ch\'eng'
            || allSystems[i].name === 'Theta Octantis'
            || allSystems[i].name === 'Tumuzgo'
            || allSystems[i].name === 'Munshin') {

                allSystems[i].power = null;
                allSystems[i].power_state = null;
            }
        }
        if (allSystems[i].power_state === null) {
            let pad = 'M';
            for (let j = 0; j < allStations.length; j++) {
                if (allSystems[i].id === allStations[j].system_id) {
                    if (allStations[j].max_landing_pad_size === 'L' && allStations[j].type !== 'Odyssey Station') {
                        pad = 'L';
                    }
                }
            }
            const HQDistance = HQDistances(power, allSystems[i].x, allSystems[i].y, allSystems[i].z);
            const system = {};
            system.name = allSystems[i].name;
            system.x = allSystems[i].x;
            system.y = allSystems[i].y;
            system.z = allSystems[i].z;
            system.cc = 0;
            system.winters = 0;
            system.hudson = 0;
            system.pad = pad;
            // triggers always display as neutral
            let triggers = ((Math.round(0.389 * (HQDistance ** 2) - 4.41 * HQDistance + 5012.5)) / (Math.round(2750000 / (HQDistance ** 1.5) + 5000))).toFixed(2);
            system.triggers = triggers;
            // optional trigger threshold
            /*
            if (triggers <= 2.6) {
                viableSystems.push(system);
            }*/
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
};