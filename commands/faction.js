const { popToCC, infLead, lastUpdated } = require('../functions.js');
const fs = require('fs');
const columnify = require('columnify');
exports.run = (client, message, args) => {
    console.log('working on faction');
    message.channel.send('Calculating...');
    const today = new Date();
    if (!args.length) {
        return message.channel.send('Please define a faction or power');
    }

    let targetFaction = '';
    if (args[0].slice(0, 1) !== '"' || (args[args.length - 1]).slice(-1) !== '"') {
        return message.channel.send('Please denote the faction using " "');
    }
    targetFaction = args[0].slice(1); // first arg
    for (let i = 1; i < args.length - 1; i++) { // middle args
        targetFaction += ` ${args[i]}`;
    }
    targetFaction += ` ${(args[args.length - 1]).slice(0, -1)}`;// last arg

    const targetSystems = [];
    const data = fs.readFileSync(`./data/systems_populated.json`, 'utf8');
    const obj = JSON.parse(data);
    for (let i = 0; i < obj.length; i++) {
        if (obj[i].controlling_minor_faction === targetFaction) {
            const todate = lastUpdated(obj[i].minor_factions_updated_at * 1000);
            const system = {};
            system.name = obj[i].name;
            system.lead = infLead(obj[i]);
            system.date = `${todate.month}/${todate.day}`;
            system.pop = popToCC(obj[i].population);
            targetSystems.push(system);
        }
    }

    // sorts
    targetSystems.sort((a, b) => a.lead - b.lead); // sorts systems by lead lowest to highest

    // output
    let subSystems = [];
    let x = 0;
    for (let i = 0; i < targetSystems.length; i++) {
        subSystems.push(targetSystems[i]);
        if ((i + 1) % 24 === 0) {
            const block = columnify(subSystems);
            subSystems = [];
            message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
        }
        x++;
    }
    if (x < 20) {
        const block = columnify(targetSystems);
        message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
    } else {
        const block = columnify(subSystems);
        message.channel.send(`\`\`\`asciidoc\n${block}\n\`\`\``);
    }
};