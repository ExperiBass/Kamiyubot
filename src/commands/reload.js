module.exports = {
    name: 'reload',
    aliases: ['r'],
    hidden: true,
    execute({bot, message, args, colors}) {
        let {
            MessageEmbed
        } = require('discord.js')
        let fs = require('fs')

        let embed = new MessageEmbed()

            // Set the title of the field
            .setTitle('Reloaded!')
            // Set the color of the embed
            .setColor(colors.boston)

        switch (message.author.id) {
            case '399447908237180939': // Replace this with your user ID
                break
            default:
                return // and exit (this doesnt run ANY code after the return statement)
        }

        function reload(c) {
            let command = bot.commands.get(c) || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(c))
            let name;
            // Check if the command exists and is valid
            if (!command) {
                let newCommand;
                try {
                    newCommand = require(`./${c}.js`)
                    name = newCommand.name
                } catch (e) {
                    return message.reply(`Er.. that’s not a command.. Not one that exists`)
                }
                bot.commands.set(name, newCommand)
                embed.setDescription(`${name} has been loaded!`)
                return message.channel.send({embeds: [embed]})
            }
            name = command.name

            // the path is relative to the *current folder*, so just ./filename.js
            delete require.cache[require.resolve(`./${name}.js`)]
            // We also need to delete and reload the command from the bot.commands Enmap
            bot.commands.delete(name)
            const props = require(`./${name}.js`)
            bot.commands.set(name, props)

            embed.setDescription(`Reloaded ${name} command!`)
            message.channel.send({embeds: [embed]})
        }

        if (!args || args.length < 1) {
            return message.reply(`*Computer tapping sounds* What am I reloading?`)
        }
        if (args[0] == 'all') {
            embed.setTitle(`Reloading...`)
            embed.setDescription(`Starting reloading of commands...`)
            message.channel.sendTyping()
            message.channel.send({embeds: [embed]})
                .then(async function (m) {

                    const commands = fs.readdirSync('./commands')
                    let commandNames = []
                    let startTime;
                    let endTime;
                    startTime = Date.now()
                    for (let i = 0; i < commands.length; i++) {
                        let commandFiles = commands[i].split('.')
                        commandNames[i] = commandFiles[0]
                    }

                    for (let i = 0; i < commandNames.length; i++) {
                        const commandName = commandNames[i]
                        // Check if the command exists and is valid
                        if (!bot.commands.has(commandName)) {
                            let command = await require(`./${commandName}.js`)
                            bot.commands.set(commandName, command)
                        } else {
                            // the path is relative to the *current folder*, so just ./filename.js
                            try {
                                await delete require.cache[require.resolve(`./${commandName}.js`)]
                            } catch (e) {
                                message.reply(`that command doesn't exist!`)
                                return
                            }

                            // We also need to delete and reload the command from the bot.commands Enmap
                            await bot.commands.delete(commandName)
                            const props = await require(`./${commandName}.js`)
                            await bot.commands.set(commandName, props)
                        }


                        embed.setDescription(`Reloaded ${commandName} command!`)
                            .setTitle(`Reloading... (${i}/${commandNames.length})`)
                        m.edit(embed)
                    }

                    endTime = Date.now()
                    embed.setTitle(`Reloaded!`)
                    embed.setDescription(`All ${commandNames.length} commands have been reloaded!`)
                    m.edit(embed)
                    
                    return true
                })
            
            return true
        }
        if (args[0] == 'json') {
            // And delete the function files
            delete require.cache[require.resolve(`../functions/functions.js`)]
            delete require.cache[require.resolve(`../info.json`)]
            delete require.cache[require.resolve(`../../package.json`)]
            message.reply('all JSON files were purged from the cache.')
            return
        }
        for (let i = 0; i < args.length; i++) {
            reload(args[i].toLowerCase())
            
        }
    }
}
