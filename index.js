const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');
const { mirrorEddb} = require('./functions');
const client = new Discord.Client();
client.config = config;

mirrorEddb();

fs.readdir('./events/', (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const event = require(`./events/${file}`);
        const eventName = file.split('.')[0];
        client.on(eventName, event.bind(null, client));
        delete require.cache[require.resolve(`./events/${file}`)];
    });
});

client.commands = new Discord.Collection();
fs.readdir('./commands/', (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const props = require(`./commands/${file}`);
        const commandName = file.split('.')[0];
        console.log(`Loading command ${commandName}`);
        client.commands.set(commandName, props);
    });
});

client.login(config.token);