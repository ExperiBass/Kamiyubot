const {
    prefix
} = require('../info.json')

module.exports = {
    name: 'help',
    description: 'List all of my commands or info about a specific command.',
    aliases: ['commands', 'h'],
    usage: '[command name]',
    cooldown: 3,
    execute({
        bot,
        message,
        args,
        colors
    }) {
        let {
            MessageEmbed
        } = require('discord.js')
        let {
            capitalize
        } = require('../functions/functions')
        const data = []
        const {
            commands
        } = message.client
        let embed = new MessageEmbed()
            // Set the title of the field
            .setTitle(`My commands!`)
            // Set the color of the embed
            .setColor(colors.gold)

        const PREFIX_REGEX = /{prefix}/ig
        const NAME_REGEX = /{name}/ig

        if (!args.length) {
            let commandList = [...commands.values()]
            let commandNames = []
            commandList.forEach(v => {
                if (!v.hidden) {
                    commandNames.push(v.name)
                }
            })

            data.push(`**COMMANDS**:\n${commandNames.join('\n')}`)
            data.push(`\n\nYou can send \`${prefix}help <command name>\` to get info on a specific command!`)
            embed.setDescription(`${data.join(' ')}`)
                .setFooter(`Total commands: ${commandNames.length}`)
            message.author.send({embeds: [embed]}).then(() => {
                message.react(`✅`)
            }).catch(() => {
                message.reply(`I can't dm you! Please check your settings and try again.`)
            })
            return
        }

        const name = args[0].toLowerCase()
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name))

        if (!command || command.hidden) {
            return message.reply('that\'s not a valid command!')
        }

        data.push(`**Name:** ${command.name}`)

        command.aliases ? data.push(`**Aliases:** ${command.aliases.join(', ')}`) : false

        command.description ? data.push(`**Description:** ${command.description}`) : false

        command.usage ? data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`) : false

        command.cooldown ? data.push(`Cooldown: ${command.cooldown} seconds`) : false

        command.example ? data.push(`Example Usage: \`\`\`${command.example.replace(PREFIX_REGEX, bot.prefix).replace(NAME_REGEX, command.name)}\`\`\``) : false

        embed.setTitle(`${capitalize(command.name)} info:`)
            .setDescription(`${data.join('\n')}`)
            .setFooter(`If a argument is wrapped in angle brackets "< >", it is required. If it is wrapped in square brackets "[ ]" or has nothing around it, it is optional.`)
        message.author.send({embeds: [embed]}).then(() => {
            message.react(`✅`)
        }).catch(e => {
            message.reply(`I can't dm you! Please check your settings and try again.`)
        })

    }
}