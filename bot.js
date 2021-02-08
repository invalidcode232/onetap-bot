//#region Imports
const { prefix, token, id, secret, key, config_id, script_id, script_register_channel, config_register_channel } = require('./config.json');
//#endregion

//#region Dependencies
const https = require("https");
const querystring = require("querystring");
const Discord = require('discord.js');
//#endregion

//#region generate_options
function generate_options(method, path, query) {
    switch (method) {
        case 'GET':
            return {
                'hostname': 'api.onetap.com',
                'path': path,
                'method': 'GET',
                'headers': {
                    "X-Api-Id": id,
                    "X-Api-Secret": secret,
                    "X-Api-Key": key,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            };

        case 'POST':
            return {
                'hostname': 'api.onetap.com',
                'path': path,
                'method': 'POST',
                'headers': {
                    "X-Api-Id": id,
                    "X-Api-Secret": secret,
                    "X-Api-Key": key,
                    "Content-Length": Buffer.byteLength(query),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            };

        case 'DELETE':
            return {
                'hostname': 'api.onetap.com',
                'path': path,
                'method': 'DELETE',
                'headers': {
                    "X-Api-Id": id,
                    "X-Api-Secret": secret,
                    "X-Api-Key": key,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }

        case 'DELETE_PARAM':
            return {
                'hostname': 'api.onetap.com',
                'path': path,
                'method': 'DELETE',
                'headers': {
                    "X-Api-Id": id,
                    "X-Api-Secret": secret,
                    "X-Api-Key": key,
                    "Content-Length": query.length,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
    }
}
//#endregion

//#region Script functions
function add_script_subscription(script_id, user_id) {
    const query = querystring.stringify({
        'user_id': user_id
    });

    const req = https.request(generate_options('POST', '/cloud/scripts/' + script_id.toString() +'/subscriptions/', 'user_id=' + user_id.toString()), res => {
        console.log(`Status code: ${res.statusCode}`);
        res.on('data', d => {
            process.stdout.write(d);
        })
    })

    req.on('error', error => {
        console.error(error);
    })

    req.write(query);

    req.end();
}

function add_config_subscription(config_id, user_id) {
    const query = querystring.stringify({
        'user_id': user_id
    });

    const req = https.request(generate_options('POST', '/cloud/configs/' + config_id.toString() +'/subscriptions/', 'user_id=' + user_id.toString()), res => {
        console.log(`Status code: ${res.statusCode}`)

        res.on('data', d => {
            process.stdout.write(d);
        })
    })

    req.on('error', error => {
        console.error(error);
    })

    req.write(query);

    req.end();
}
//#endregion

//#region Bot
const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/); // Get arguments
	const command = args.shift().toLowerCase(); // Set all arguments to lower case

	if (command === 'ping') { // Simple ping-pong command to see if bot is working
		message.channel.send('Pong.');
    }
    else if (command === 'sreg' || command === 'sregister') { // Script registration
        if (message.channel.name != script_register_channel) {
            return message.channel.send(`You can not do that command here, ${message.author}`);;
        }

        if (!args.length) {
            return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        }

        const user_id = parseInt(args[0]);
        if (isNaN(user_id) || user_id > 300000) {
            return message.channel.send(`Please enter a valid UID, ${message.author}!`);
        }

        let role = message.guild.roles.cache.find(role => role.name === "whitelisted");
        if (message.member.roles.cache.has(role.id)) {
            return message.channel.send(`${message.author}, you're already whitelisted!`);
        }
        
        message.member.roles.add(role).catch(console.error);

        add_script_subscription(script_id, user_id);

        message.channel.send(`Successfully sent UID **${user_id.toString()}** a script subscription!`);
    }
    else if (command === 'creg' || command === 'cregister') { // Config registration
        if (message.channel.name != config_register_channel) {
            return message.channel.send(`You can not do that command here, ${message.author}`);;
        }

        if (!args.length) {
            return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        }

        const user_id = parseInt(args[0]);
        if (isNaN(user_id) || user_id > 300000) {
            return message.channel.send(`Please enter a valid UID, ${message.author}!`);
        }

        add_config_subscription(config_id, user_id);

        message.channel.send(`${message.author}, Successfully sent UID **${user_id.toString()}** a config subscription!`);
	}
});

client.login(token);
//#endregion