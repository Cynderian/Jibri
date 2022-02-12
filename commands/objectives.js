const { } = require('../functions.js');
exports.run = (client, message, args) => {
    console.log('working on objectives');
    message.channel.send('Beta feature: Only works for maitenance targets currently\n\n');

    // tell machine list of comma delineated systems
    inputSystems = [];
    if (!args.length) {
        return message.channel.send("Please provide a comma-delineated list of systems");
    } else {
        let argString = args[0];
        args.shift();
        args.forEach(arg => argString += ` ${arg}`);
        while(argString !== '') {
            if (argString.includes(',')) {
                let tmp = inputSystems.push(argString.substring(0, argString.indexOf(',')));
                argString.replace(tmp, '');
            } else {
                break;
            }
            console.log(argString)
        }
    }
    console.log(inputSystems)
    // find system in EDDB

    // add to list of objects

    // plug needed data into format (lead faction name, station types/pads)
    
    // print output

}