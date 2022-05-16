module.exports = {
    name: 'hit',
    hidden: true,
    async execute({message}) {
        try {
            await message.reply(`you heckin HECKER! How *DARE* you swear in my good, ***CHRISTIAN***, ${message.channel.toString()}!`)
        } catch(e) {
            throw e
        }
    }
}