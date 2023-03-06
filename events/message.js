const fs = require('fs');

module.exports = (client, message) => {
    // ignore non-prefix and bot messages
    if (!message.content.startsWith(client.config.prefix) || message.author.bot) return;
    // command parsing
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    // user logging
    let trackedCommandStr = `User ${message.author.id} (${message.author.username}) used command ~${command}`;
    for (let i = 0; i < args.length; i++) {
        trackedCommandStr += ` ${args[i]}`;
    }
    fs.appendFile('./data/user_log.txt', `${trackedCommandStr}\n`, function(err) { if (err) throw err; });
    console.log(trackedCommandStr);
    // command handling
    const cmd = client.commands.get(command);
    if (!cmd) return console.log('unknown command');
    // files downloading check
    if (downloadsFlag === 1) {
        try {
            cmd.run(client, message, args);
        }
        catch (e) {
            console.log(`Error caught: ${e}\nDetails:`);
            console.log(e);
        }
    } else {
        message.channel.send('Error- Jibri is currently updating its local database. Please try again in a few minutes.');
    }
};