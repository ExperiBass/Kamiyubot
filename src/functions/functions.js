const {
    MessageEmbed,
    TextChannel
} = require('discord.js')
const {
    colors,
    source,
    fallbackSources
} = require('../info.json')
const Chalk = require('chalk')

module.exports = {
    async collectReactions(m, reaction, max, filter) {
        await m.react(reaction)
        let reactions;
        if (!filter) {
            filter = (r, user) => r.emoji.id === reaction && user && !user.bot
        }
        reactions = await m.awaitReactions(filter, {
            max: max
        })

        return reactions.array()
    },
    /**
     * 
     * @param {String} message - The prompt message.
     * @param {TextChannel} channel - The channel to send the prompt to.
     * @param {Function} filter - The filter for the reactions.
     * @returns 
     */
    async confirmationPrompt(message, channel, filter) {
        const msg = await channel.send(message)
        let flag = false
        module.exports.collectReactions(msg, `✅`, 1, filter).then(yes => {
            if (yes[0]) {
                flag = true
            }
        })
        module.exports.collectReactions(msg, `❎`, 1, filter).then(no => {
            if (no[0]) {
                flag = false
            }
        })
        return flag
    },
    async sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis))
    },
    /*
      This function takes a string of words separated by hyphens and capitalizes each word,
      replacing the hyphens with spaces.
     */
    formatName(str) {
        let strSplit = str.split('-')
        str = ``
        for (split of strSplit) {
            str += `${module.exports.capitalize(split)} `
        }
        return str.trim()
    },
    /**
     * 
     * @param {String} text - The text that will be split over each embed.
     * @param {String} title - The title of the embeds.
     * @param {String} footer - The footer of the embeds.
     * @returns {[MessageEmbed]} - An array of MessageEmbeds.
     */
    generateEmbeds(text, title, footer) {
        let embeds = []
        const arr = text.match(/[\s\S]{1,1024}/gi) // Build the array
        for (let chunk of arr) { // Loop through every element
            let embed = new MessageEmbed().setColor(colors.yellow).setDescription(chunk)
            title ? embed.setTitle(title) : false
            footer ? embed.setFooter(footer) : false

            embeds.push(embed) // Wait for the embed to be sent
        }
        return embeds
    },
    capitalize(s) {
        return s[0].toUpperCase() + s.slice(1)
    },
    /**
     * Group objects in an array by a specific key.
     * @param {[Object]} array The array of objects to sort.
     * @param {String} key The key to group the objects by.
     * @returns {[Object[]]} Multiple arrays, each with a different value of `key`.
     * @example
     * const arr = [
     *      {foo: "bar"},
     *      {foo: "bar"}
     *      {foo: "baz"},
     *      {foo: "bar"},
     *      {foo: "baz"}
     * ]
     * groupBy(arr, "foo")
     * // {
     * //     "bar": [ {foo: "bar"}, {foo: "bar"}, {foo: "bar"} ],
     * //     "baz": [ {foo: "baz"}, {foo: "baz"}]
     * // }
     */
    groupBy(array, key) {
        return array.reduce(function (accumulator, currentValue) {
            (accumulator[currentValue[key]] = accumulator[currentValue[key]] || []).push(currentValue)
            return accumulator
        }, {})
    },
    randNum(max, min) {
        return min ? (Math.floor(Math.random() * (+max++ - +min)) + +min) : (Math.floor(Math.random() * Math.floor(max++)))
    },
    errorString() {
        const LENGTH = 25
        let dict = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`
        let string = 'E_'
        for (let i = 0; i < LENGTH; i++) {
            string += dict[module.exports.randNum(dict.length)]
        }
        return string
    },
    /**
     * Some arg parsing function I got in my early days of bot development.
     * @param {String} argString Discord message content, without the bot prefix.
     * @param {Number} argCount Number of arguments. The guy who wrote this is obviously a C developer.
     * @param {*} allowSingleQuote Self-descriptive.
     * @returns {[String]} Array of parsed arguments.
     */
    parseArgs(argString, argCount, allowSingleQuote = true) {
        // Replace smart quotes (i.e. “ ” ‘ ’ ) with straight double quotes " "
        argString = argString.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
        const re = allowSingleQuote ? /\s*(?:("|')([^]*?)\1|(\S+))\s*/g : /\s*(?:(")([^]*?)"|(\S+))\s*/g
        const result = []
        let match = []
        // Large enough to get all items
        argCount = argCount || argString.length
        // Get match and push the capture group that is not null to the result
        while (--argCount && (match = re.exec(argString))) result.push(match[2] || match[3])
        // If text remains, push it to the array as-is (except for wrapping quotes, which are removed)
        if (match && re.lastIndex < argString.length) {
            const re2 = allowSingleQuote ? /^("|')([^]*)\1$/g : /^(")([^]*)"$/g
            result.push(argString.substr(re.lastIndex).replace(re2, '$2'))
        }
        return result
    },
    log(message, type = 'info') {
        if (message) {

            switch (type.toLowerCase()) {
                case 'info': {
                    console.log(`${Chalk.green(`[${type.toUpperCase()}]:`)} ${message}`)
                    break
                }
                case 'warn':
                case 'warning': {
                    console.log(`${Chalk.yellow(`[${type.toUpperCase()}]:`)} ${message}`)
                    break
                }
                case 'error': {
                    console.log(`${Chalk.red(`[${type.toUpperCase()}]:`)} ${message}`)
                    break
                }
            }
        }
    },
    /**
     * Gets the relevant flavor text from the list of entries.
     * @param {Array[Object]} flavorTextEntries
     * @param {String} language
     * @param {Boolean} pokemon Whether the flavor text is from a pokemon or something else.
     * @returns {String|undefined} Either the text or undefined.
     */
    getFlavorText(flavorTextEntries, language = 'en', pokemon = false) {
        let flavorText;
        let versionGroup;
        let ver; // because PokeAPI returns entry.version and items are entry.version_group
        if (!flavorTextEntries || !flavorTextEntries[0]) {
            return {version_group: undefined} // no flavor text
        }
        const localizedEntries = flavorTextEntries.filter(v => v.language.name === language)

        if (localizedEntries.length === 0) {
            throw new Error(`Expected valid language identifier, got ${language}.`)
        }
        for (entry of localizedEntries) {
            ver = entry.version || entry.version_group
            if (source.includes(ver.name)) {
                flavorText = entry.flavor_text || entry.text
                break
            }
        }
        if (!flavorText) { // if theres no entry for the main source, redo it and look for the fallback sources
            let entry = module.exports.searchWithPreference(fallbackSources, localizedEntries, [pokemon ? 'version' : 'version_group', 'name'])
            flavorText = entry.text || entry.flavor_text
            let version;
            switch (ver.name) {
                case "ultra-sun": {}
                case "ultra-moon": {}
                case "ultra-sun-ultra-moon": {
                    version = 'US/UM'
                    break
                }
                case "sun": {}
                case "moon": {}
                case "sun-moon": {
                    version = "S/M"
                    break
                }
                case "x": {}
                case "y": {}
                case "x-y": {
                    version = 'X/Y'
                    break
                }
                default: {
                    version = module.exports.formatName(ver.name)
                }
            }
            versionGroup = ` *(Data from SW/SH not found, fell back to ${version}.*)`
        }
        if (!flavorText) { // if theres still no entry, report it back to the caller
            return undefined
        }
        return {
            text: `${flavorText}`,
            version_group: versionGroup
        }
    },
    /**
     * This one's a doozy. IIRC this was written so Kamiyu could still display info if PokeAPI didn't have
     * the requested data from the latest games. It takes a array of search terms and their precedence, gets the required data,
     * and then sorts from most important to least important. In this context thats the most recent games to the oldest games.
     *
     * ...I seriously have no idea how this works.
     * @param {String} searchTerms fallbackSources in info.json
     * @param {[any]} array The data to search through.
     * @param {[String]} lookingFor Apparently the keys to look for.
     * @returns {[any]} The requested values sorted by importance.
     */
    searchWithPreference(searchTerms, array, lookingFor) {
        const terms = searchTerms.map(v => v.term)
        let results = []

        for (entry of array) {
            if (terms.includes(entry[lookingFor[0]][lookingFor[1]])) {
                results.push(entry)
            }
        }


        results = results.sort((a, b) => {
            if (searchTerms.find((v) => v.term === a[lookingFor[0]][lookingFor[1]]).precedence < searchTerms.find((v) => v.term === b[lookingFor[0]][lookingFor[1]]).precedence) {
                return 1
            }
            return -1
        })
        return results[0]
    }
}