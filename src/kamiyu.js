process.chdir('./src')

const Discord = require('discord.js')
const fs = require('fs')
const Pokedex = require('pokedex-promise-v2')
const Numeral = require('numeral')

const options = {
    protocol: 'https',
    hostName: 'pokeapi.co',
    versionPath: '/api/v2/',
    timeout: 5 * 1000, // 5 seconds
    cacheLimit: 86400 * 1000 // 24 hours
}

const Intents = Discord.Intents.FLAGS

let P = new Pokedex(options)
const bot = new Discord.Client({
    intents: [Intents.DIRECT_MESSAGES, Intents.GUILDS, Intents.GUILD_MESSAGES, Intents.GUILD_MESSAGE_REACTIONS, Intents.GUILD_MESSAGE_TYPING],
    makeCache: Discord.Options.cacheWithLimits({
        MessageManager: {
            sweepInterval: 300,
            sweepFilter: Discord.LimitedCollection.filterByLifetime({
                lifetime: 600,
                getComparisonTimestamp: e => e.editedTimestamp ? e.editedTimestamp : e.createdTimestamp,
            })
        },
        PresenceManager: 0
    })
})
bot.commands = new Discord.Collection()
const cooldowns = new Discord.Collection()

const {
    prefix,
    token,
    colors,
    channels,
    repo,
    permInt
} = require('./info.json')
const {
    errorString,
    parseArgs,
    log
} = require('./functions/functions')
bot.prefix = prefix

let cycle;

// `let` because its updated
let CYCLE = [
    {
        message: `Handling all your Pokémon needs!${END}`,
        type: `PLAYING`
    },
    {
        message: `All da Pokémanz!${END}`,
        type: `PLAYING`
    },
    {
        message: `a Pokémon gym!${END}`,
        type: `COMPETING`
    },
    {
        message: `LGBTQ+ people are valid!${END}`,
        type: `PLAYING`
    },
    {
        message: `Memory usage: ${Numeral(memUsage.heapUsed).format('0.00b')}/${Numeral(memUsage.heapTotal).format('0.00b')} | External Memory Usage: ${Numeral(memUsage.external).format('0.00b')} | Cache Size: ${P.cacheSize()}${END}`,
        type: "LISTENING"
    }
]

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    bot.commands.set(command.name, command)
}

bot.on('ready', () => { // when the bot is ready...
    bot.user.setActivity("Starting...", {
        type: "PLAYING"
    })

    try {
        log('Loading slash commands...')

        await rest.put(Routes.applicationCommands(clientID), {
            body: bot.slashCommands
        })

        log('Slash commands loaded.')
    } catch (error) {
        log(error, "ERROR")
    }

    let cyclei = 1 // shift it forward a bit

    bot.user.setActivity(CYCLE[0].message, {
        type: CYCLE[0].type
    })
    cycle = setInterval(() => {
        cyclei++
        if (cyclei === CYCLE.length) {
            cyclei = 0
        }
        let currCycle = CYCLE[cyclei]
        bot.user.setActivity(currCycle.message, {
            type: currCycle.type
        })
    }, 60 * 1000)
    //bot.generateInvite(${permInt}).then(r => {console.log(r); bot.destroy(); process.exit(0)})
    // uncomment this line to generate a bot invite link, recomment to run the bot
    log('Kamiyu, ready to serve!') // ...and log into the console that its online
})
bot.on('messageCreate', message => {
    const c = message.content
    // set the memory usage and cache size
    if (!c.startsWith(prefix) || message.author.bot || !message.guild) { // if the message doesnt start with the prefix...
        // ...or is sent by a bot...
        return; // ...ignore it
    }
    const args = parseArgs(c.slice(prefix.length)) // slices the prefix from the command
    if (!args[0]) {
        return
    }
    const commandName = args.shift().toLowerCase()

    const command = bot.commands.get(commandName) ||
        bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
    if (!command) {
        return
    }
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection())
    }
    const now = Date.now()
    const timestamps = cooldowns.get(command.name)
    const cooldownAmount = (command.cooldown || 3) * 1000
    if (timestamps.has(message.channel.id)) {
        const expirationTime = timestamps.get(message.channel.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000
            return message.reply(`you're going faster than a speeding Raikou! Please wait ${timeLeft.toFixed(1)} more seconds before reusing \`${prefix}${command.name}\`!`)
        }
    }
    try {
        command.execute({
            bot,
            message,
            args,
            colors,
            P
        })
    } catch (e) {
        const ERROR_CODE = errorString()
        log(`${ERROR_CODE} - Command Error:\n\n${e.stack}\n\n`, 'ERROR')

        message.reply(`There was an error trying to execute that command! Please report this to the GitHub (${repo}) with this code: \`${ERROR_CODE}\``)
    }
    timestamps.set(message.channel.id, now)
    setTimeout(() => timestamps.delete(message.channel.id), cooldownAmount)
})

// Update memory usage every 5 minutes
setInterval(() => {
    const memUsage = process.memoryUsage()
    CYCLE[5] = {
        message: `Memory usage: ${Numeral(memUsage.heapUsed).format('0.00b')}/${Numeral(memUsage.heapTotal).format('0.00b')} | External Memory Usage: ${Numeral(memUsage.external).format('0.00b')} | Cache Size: ${Numeral(P.cacheSize()).format('0,0')}`,
        type: "LISTENING"
    }
}, 300 * 100)

bot.on('invalidated', () => {
    log(`My session is invalid! Restarting...`, 'ERROR')
    bot.destroy()
    bot.login(token)
})

bot.on('error', (e) => {
    log(`Uh oh! There's been a error! Here it is:\n${JSON.stringify(e, null, 2)}`, 'ERROR')
})

process.on('unhandledRejection', function (error) {
    const ERROR_CODE = errorString()
    log(`${ERROR_CODE} - Uncaught Promise Rejection:\n${error.stack}`, 'ERROR')
})

process.on('uncaughtException', function (err) {
    const ERROR_CODE = errorString()
    log(`${ERROR_CODE} - Uncaught Exception\n\n${err}`, 'ERROR')
})

process.on('SIGINT', () => {
    console.log('Clearing cache and stopping bot.')
    bot.destroy()
    clearInterval(cycle)
    P.clearCache()
    process.exit(0)
})

bot.login(token)