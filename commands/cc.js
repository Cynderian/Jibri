const { capitalize, popToCC, removeQuotes, inputPowerFilter } = require('../functions');
const fs = require('fs');
const columnify = require('columnify');
exports.run = (client, message, args) => {
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
        return message.channel.send('Power not found.');
    }

    const powerSystems = [];
    let cc = 0;
    let unique = 0;
    let control = 0;
    // grab all control systems for the power
    const today = new Date();
    const obj = fs.readFileSync(`./data/systems_populated.json`, 'utf8');
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
};