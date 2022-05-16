module.exports = {
    name: 'tatus',
    description: `Display the PokéAPI status and my own!`,
    cooldown: 5,
    async execute({
        message,
        colors,
        P
    }) {
        const {
            MessageEmbed
        } = require('discord.js')
        const numeral = require('numeral')
        const {
            version,
            formattedName
        } = require('../../package.json')
        const {
            repo
        } = require('../info.json')

        let embed = new MessageEmbed()
        let description = `Getting data (this may take a while)...`
        // Set the title of the field
        embed.setTitle('Status')
            // Set the color of the embed
            .setColor(colors.boston)
            .setDescription(description)

        const m = await message.channel.send({embeds: [embed]}) // send initial message...

        let mem = process.memoryUsage()

        description = `**${formattedName} Info:**\nVersion: ${version}\nLatency: ${m.createdTimestamp - message.createdTimestamp} ms\nMemory Usage: ${numeral(mem.heapUsed).format('0.00b')}/${numeral(mem.heapTotal).format('0.00b')}\nPokémon Cache Size: ${numeral(P.cacheSize()).format('0,0')}\n\n`
        description += `If you have any suggestions or issues, don't hesitate to go to the [repo](${repo}/issues)!`
        description += `\nIf you want to view the changelog, [click me](${repo}/releases/latest)!`
        embed.setDescription(description)

        await m.edit({embeds: [embed]})
    }
}