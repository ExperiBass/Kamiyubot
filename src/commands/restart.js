module.exports = {
    name: 'restart',
    hidden: true,
    execute({bot, message, args, colors}) {
        if (message.author.id !== '399447908237180939' /* replace this with your user ID */) {
            return
        }
        if (args[0]) {
            const {
                MessageEmbed
            } = require('discord.js')
            let embed = new MessageEmbed()
            embed.setDescription(`Stopping...`)
                .setColor(colors.red)

            message.channel.send({embeds: [embed]})
                .then(() => {
                    bot.destroy()
                    process.exit(0)
                })
        } else {
            const {
                MessageEmbed
            } = require('discord.js')
            let embed = new MessageEmbed()
            embed.setDescription(`Restarting...`)
                .setColor(colors.red)

            message.channel.send({embeds: [embed]})
                .then(() => {
                    bot.destroy()
                    process.exit(2)
                })
        }
    }
}