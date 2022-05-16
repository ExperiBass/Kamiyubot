module.exports = {
    name: `earch`,
    description: `Searches for info on a pokemon by name!`,
    usage: `[ item | pokemon | moves ] [sub-commands]`,
    example: `# Getting info on a Pokémon:\n{prefix}{name} pokemon <Pokémon_name>\n# Getting info on a item:\n{prefix}{name} item <item_name>\n# Here, we get info on Pikachu:\n{prefix}{name} pokemon Pikachu\n# And here, we get info on a Rawst berry:\n{prefix}{name} item Rawst Berry\n# Want info on a move? Look no further!\n{prefix}{name} move roar`,
    cooldown: 3,
    async execute({
        bot,
        message,
        args,
        colors,
        P
    }) {
        const Axios = require('axios')
        const FIELD_LIMIT = 1024
        const NO_DESCRIPTION_FOUND = "No Description Found (This item may not be in the database yet.)"
        const Numeral = require('numeral')
        const {
            capitalize,
            formatName,
            generateEmbeds,
            groupBy,
            getFlavorText
        } = require('../functions/functions')
        const {
            MessageEmbed
        } = require('discord.js')
        const {
            EmbedBuilder
        } = require('discord-embedbuilder')

        let embeds = []

        /**
         * Builds the evolution chain.
         * @param {Object} v Evolution data.
         * @param {String} givenName Pokemon searched by the user.
         * @param {*} embed Embed.
         */
        function chainGenerator(v, givenName, embed) {
            let name, trigger, item, timeOfDay,
                turnUpsideDown, needsRain, minLevel,
                minHappiness, minBeauty, minAffection
            let details = v.evolution_details[0]

            name = capitalize(v.species.name)
            trigger = details.trigger.name
            item = details.item === null ? 'No Item Needed' : details.item.name
            itemSplit = item.split('-')
            itemSplit[1] ? item = `${itemSplit[0]} ${capitalize(itemSplit[1])}` : false
            itemSplit = undefined
            timeOfDay = details.time_of_day === '' ? 'Any Time' : details.time_of_day
            turnUpsideDown = details.turn_upside_down
            needsRain = details.needs_overworld_rain
            minLevel = details.min_level === null ? 'Not Specified' : `${details.min_level}`
            minHappiness = details.min_happiness === null ? 'Not Specified' : `${details.min_happiness}`
            minBeauty = details.min_beauty === null ? 'Not Specified' : `${details.min_beauty}`
            minAffection = details.min_affection === null ? 'Not Specified' : `${details.min_affection}`
            let almostDone = `Trigger: ${capitalize(trigger)}\nItem Needed: ${capitalize(item)}\nTime of Day: ${capitalize(timeOfDay)}\nNeeds to be Upside-down: ${turnUpsideDown ? 'Yes' : 'No'}\nNeeds rain: ${needsRain ? 'Yes' : 'No'}\nMinimum level: ${minLevel}\nMinimum happiness: ${minHappiness}\nMimimum beauty: ${minBeauty}\nMimimum affection: ${minAffection}`

            if (name === givenName) {
                almostDone = `**${almostDone}**`
                name = `▶︎ ${name}`
            }
            embed.addField(`${name}`, almostDone)
        }

        async function getPokemon() {
            const usage = `${bot.prefix}${module.exports.name} pokemon <pokemon-name> [abilities | stats | moves | info | evolutions | locations]`
            const SUBCOMMANDS = `Sub-commands: "abilities", "stats", "moves", "info", "evolutions", "locations"`
            let pokemon = args[0]
            let movesArray = []
            let data, evolutions
            const embed = new MessageEmbed()

            if (pokemon === undefined) {
                return message.channel.send(`Usage:\n\`${usage}\`\nExamples:\n\`Search pokemon pikachu moves\`\n\`Search pokemon pikachu locations fire red\``)
            }
            message.channel.sendTyping()
            try {
                data = await P.getPokemonByName(pokemon.toLowerCase())
                evolutions = await P.getPokemonSpeciesByName(data.name)
            } catch (e) {
                if (e.response.data === 'Not Found') {
                    return message.channel.send(`That's not a Pokémon, you can't fool me!`)
                }
                throw e
            }

            embed.setColor(colors.yellow)

            // Top-level
            // - Singletons
            // Units are deci, so divide by 10 to get the proper value (fuck you shintendo)
            let name = formatName(data.name)
            let sprite = data.sprites.front_default
            let id = data.id
            let height = `${data.height / 10} m`
            let weight = `${data.weight / 10} kg`
            let order = data.order
            let baseXP = data.base_experience
            // - Arrays
            let abilities = data.abilities
            let forms = data.forms
            let species = data.species // seemed to match `name` all the time, so unused
            let gameIndices = data.game_indices
            let locationAreaEncounters = await Axios.get(data.location_area_encounters)
            locationAreaEncounters = locationAreaEncounters.data
            let moves = data.moves
            let stats = data.stats
            let types = data.types
            // - Fields
            let abilityField = ``
            let statsField = ``
            let evolutionChain = await Axios.get(evolutions.evolution_chain.url)
            evolutionChain = evolutionChain.data

            let texts = evolutions.flavor_text_entries

            let descriptionField = getFlavorText(texts, 'en', true)
            if (descriptionField.version_group) {
                descriptionField.text += descriptionField.version_group
            }

            let typesField = ``
            types.forEach(v => {
                typesField += `Type: ${capitalize(v.type.name)}\nSlot: ${v.slot}\n\n`
            })

            let indiceField = ``
            const indices = groupBy(gameIndices, 'game_index')
            const indiceKeys = Object.keys(indices)
            for (let i = 0; i < indiceKeys.length; i++) {
                const currKey = indiceKeys[i]
                indiceField += `Pokedex entry **#${currKey}** in these games:\n**-** ${indices[currKey].map(v => formatName(v.version.name)).sort().join('\n**-** ')}\n\n`
            }

            embed.setThumbnail(sprite)
                .setTitle(`Basic info for ${name}:`)
                .addField(`Order:`, `${order}`)
                .addField(`Pokedex ID:`, `${id}`)
                .addField(`Height:`, `${height}`)
                .addField(`Weight:`, `${weight}`)
                .addField(`Description:`, descriptionField ? descriptionField.text : NO_DESCRIPTION_FOUND)
                .addField(`Types:`, typesField)
                .addField(`Pokedex Indices:`, indiceField === "" ? "No Indices in the API" : indiceField.trim()) // remove the trailing newlines
            evolutions.evolves_from_species ? embed.addField(`Evolves from:`, formatName(evolutions.evolves_from_species.name)) : false
            embed.setFooter(`Idea by Rinku Inku, developed by ExperiBass\nAll Pokémon descriptions taken from Sword unless otherwise stated.\n${SUBCOMMANDS}`)

            if (args[1]) {
                args[1] = args[1].toLowerCase()
            }

            switch (args[1]) {
                case 'abilities': {
                    abilities.forEach(v => {
                        let name = v.ability.name
                        let slot = v.slot
                        let isHidden = v.is_hidden
                        abilityField += `❖ ${formatName(name)}:\nIs hidden: ${isHidden ? `Yes` : `No`}\nSlot: ${slot}\n\n`
                    })
                    embeds = generateEmbeds(abilityField, `Abilities:`, `${SUBCOMMANDS}`)
                    break
                }
                case 'stats': {
                    stats.forEach(v => {
                        let name = formatName(v.stat.name)
                        let base = v.base_stat
                        let effort = v.effort
                        statsField += `◖ ${formatName(name)}:\nBase value: ${base}\nEffort: ${effort}\n\n`
                    })
                    embeds = generateEmbeds(statsField, `Stats:`, `${SUBCOMMANDS}`)
                    break
                }
                case 'moves': {
                    let movesField = ``
                    // Sort the moves...
                    moves.sort((a, b) => {
                        if (a.move.name > b.move.name) {
                            return 1
                        }
                        return -1
                    })
                    // ...then start generating the strings...
                    moves.forEach((v, index) => {
                        let name = formatName(v.move.name)
                        let lvlLearnedAt = v.version_group_details[0].level_learned_at
                        let learnMethod = v.version_group_details[0].move_learn_method.name
                        movesField += `⦿ Move: ${capitalize(name)}\n - Level learned at: ${lvlLearnedAt}\n - Learn Method: ${capitalize(learnMethod)}\n\n`
                        if (index % 5 == 0 && index != moves.length - 1 && index !== 0) {
                            // every 5 moves, break off the string...
                            movesArray.push(new MessageEmbed().setDescription(movesField))
                            // ^ create a embed for the string...
                            movesField = ''
                            // ^ then prepare the string for the next 5 moves
                        }
                    })
                    // ...then create the embed...
                    const builder = new EmbedBuilder(message.channel)
                    builder.setEmbeds(movesArray)
                        .setPageFormat(`Page %p of %m | ${SUBCOMMANDS}`)
                        .setTitle('Moves:')
                        .setColor(colors.yellow)
                        .build() // and send it

                    builder.on('stop', (m) => {
                        builder.setColor(colors.red)
                        return m.reactions.removeAll()
                    })
                    break // ...since the embed is already created, no need to pass it in
                }
                case 'info': {
                    // prepare the embed
                    let embed = new MessageEmbed()
                    embed.setColor(colors.yellow)
                        .setTitle(`Detailed info on ${capitalize(name)}:`)

                    // create the data
                    let formsField = ``
                    // start with forms...
                    forms.forEach(v => {
                        formsField += `${capitalize(v.name)}\n\n`
                    })
                    embed.addField(`Forms:`, formsField)
                    // ...then with base XP
                    embed.addField(`Base XP:`, `${baseXP}`)
                        .setFooter(`${SUBCOMMANDS}`)
                    embeds.push(embed)
                    break
                }
                case 'locations': {
                    let embed = new MessageEmbed()
                    embed.setTitle(`Spawn Locations:`)
                        .setColor(colors.yellow)

                    let locationField = ``
                    if (!args[2]) {

                        return message.channel.send(`You need to give me a Pokemon version, like \`fire red\` or \`black 2\`!`)
                    }
                    let version = args[2].toLowerCase()
                    // try and check for black 2 or white 2
                    if (args[3]) {
                        version = `${args[2]}-${args[3]}`.toLowerCase()
                    }

                    function getLocationData() {
                        locationAreaEncounters.forEach(v => {
                            let details = v.version_details
                            details.forEach(w => {
                                if (w.version.name === version) {
                                    let location = formatName(v.location_area.name)
                                    let encounterDetails = w.encounter_details[0]
                                    let conditions = encounterDetails.condition_values
                                    let conditionsText = ``
                                    conditions.forEach(x => {
                                        let name = formatName(x.name)

                                        conditionsText += `- - Condition: ${name}\n`
                                    })
                                    locationField += `Location: ${location}\n- Chance: ${encounterDetails.chance}%\n${encounterDetails.max_chance ? `- Maximum Chance: ${encounterDetails.max_chance}%\n` : ``}- Maximum Level: **${encounterDetails.max_level}**\n- Minumum Level: **${encounterDetails.min_level}**\n- Method: **${formatName(encounterDetails.method.name)}**\n${conditionsText !== `` ? `- Conditions:\n${conditionsText}` : ``}\n`
                                }
                            })
                        })
                    }
                    getLocationData()
                    if (locationField === ``) {
                        version = `${args[2]}${args[3]}`.toLowerCase() // try searching for terms like `fire red`
                        getLocationData()
                    }
                    // after the recursive call
                    if (locationField === ``) {

                        return message.channel.send(`That's either not a valid version, that pokemon isn't in that game, or the API I'm using doesn't have that data yet!`)
                    }
                    embed.setDescription(locationField)
                        .setFooter(`${SUBCOMMANDS}`)
                    embeds.push(embed)
                    break
                }
                case 'evolutions': {
                    let evoEmbed = new MessageEmbed()
                    evoEmbed.setColor(embed.color)
                        .setFooter(`${SUBCOMMANDS}`)
                        .setTitle(`Evolution Path for ${name}:`)
                        .setThumbnail(embed.thumbnail.url)
                    evolutionChain.chain.evolves_to.forEach(v => {
                        data.name === evolutionChain.chain.species.name ? evoEmbed.addField(`▶︎ ${capitalize(evolutionChain.chain.species.name)}`, `↓`) :
                            evoEmbed.addField(`${capitalize(evolutionChain.chain.species.name)}`, `↓`)
                        chainGenerator(v, name, evoEmbed)

                        if (v.evolves_to.length > 0) {
                            chainGenerator(v.evolves_to[0], name, evoEmbed)
                        }
                    })
                    embeds.push(evoEmbed)
                    break
                }
                default: {
                    embeds.push(embed)
                }
            }
        }
        async function getItem() {
            const USAGE = `${bot.prefix}${module.exports.name} item <item-name>`
            const embed = new MessageEmbed()
            embed.setColor(colors.blue)
                .setFooter(`All item descriptions taken from SW/SH unless otherwise noted.`)
            let itemName = args[0]

            let data;

            if (itemName === undefined) {
                return message.channel.send(`Usage:\n\`${USAGE}\`\nExample:\n\`Search item oran berry\``)
            }
            for (let i = 1; i < args.length; i++) {
                const arg = args[i]
                itemName += `-${arg}`
            }
            itemName = itemName.toLowerCase()
            try {
                data = await P.getItemByName(itemName)
            } catch (e) {
                if (e.response.data === 'Not Found') {

                    return message.channel.send(`That item doesn't exist!`)
                }

                return message.channel.send(`There was a error getting data!\n${e}`)
            }

            // Singletons
            let name = formatName(data.name)
            let cost = data.cost
            let flingPower = data.fling_power || 'None'

            // get the berry data (if the item is a berry)
            let berryField;
            let harvestingField;
            let flavors;
            let firmness;
            let growthTime;
            let maxHarvest;
            let naturalGiftPower;
            let naturalGiftType;
            let size;
            let smoothness;
            let soilDryness;
            try {
                let berryData = await P.getBerryByName(itemName.split('-')[0])
                flavors = berryData.flavors
                firmness = formatName(berryData.firmness.name)
                growthTime = berryData.growth_time
                maxHarvest = berryData.max_harvest
                naturalGiftPower = berryData.natural_gift_power
                naturalGiftType = formatName(berryData.natural_gift_type.name)
                size = berryData.size
                smoothness = berryData.smoothness
                soilDryness = berryData.soil_dryness
            } catch (e) {
                // ignore it, its not a berry
            }
            if (flavors) {
                // assume the rest of the data exists
                let flavorText = ``
                for (let flavor of flavors) {
                    if (flavor.potency > 0) {
                        flavorText += `*Flavor*: ${capitalize(flavor.flavor.name)}\n*Potency*: ${flavor.potency}\n`
                    }
                }
                flavorText = flavorText.slice(0, flavorText.length - 1) // get rid of the last \n
                berryField = `**Size**: ${size}mm\n**Smoothness**: ${smoothness}\n**Firmness**: ${firmness}\n**Flavors**:\n${flavorText}\n**"Natural Gift" Type**: ${naturalGiftType}\n- ***Power***: ${naturalGiftPower}\n`
                harvestingField = `**Soil Dryness**: ${soilDryness}\n**Growth Time (stage)**: ~${growthTime} Hours\n**Growth Time (total)**: ~${growthTime * 4} Hours\n**Maximum Harvest Amount**: ${maxHarvest}\n`
            }

            // objects
            let flingEffect = data.fling_effect ? formatName(data.fling_effect.name) : 'None'
            let attributes = data.attributes
            let attributeArray = []
            for (let attr of attributes) {
                attributeArray.push(`${formatName(attr.name)}`)
            }
            attributeArray[0] ? true : attributeArray = [`None`]
            let category = formatName(data.category.name)
            let effectEntries = data.effect_entries
            let effects = []
            for (let effect of effectEntries) {
                if (effect.language.name === 'en') {
                    // get rid of the unnessecary newline
                    effectSplit = effect.effect.split('\n')
                    effectSplit = effectSplit.join(' ')
                    // now get rid of the spaces around the ":"...
                    effectSplit = effectSplit.replace(/\ :\ /g, ': ')
                        // ...seperate each sentence...
                        .replace(/\.\ /g, `\n\n`)
                        // ...and put in any missing "."s
                        .replace(/\b[^\.]$/gmi, '.')
                    effects.push(capitalize(effectSplit))
                }
            }
            let description = getFlavorText(data.flavor_text_entries)
            if (description.version_group) {
                description.text += description.version_group
            }
            let names = data.names
            /*description.forEach(v => {
                if (v.language.name === 'en' && v.version_group.name === source) {
                    description = v.text
                    return
                }
            })*/
            let sprites = data.sprites
            let heldByPokemon = data.held_by_pokemon
            let babyTriggerFor = data.baby_trigger_for

            //console.log(JSON.stringify(babyTriggerFor))
            embed.setTitle(`Info for ${name}:`).setThumbnail(sprites.default)
                .addField(`Effects:`, `${effects.join(`\n`)}`)
                .addField(`Fling Effect:`, `${flingEffect}`)
                .addField(`Fling Power:`, `${flingPower}`)
                .addField(`Description:`, `${description.text ? description.text : NO_DESCRIPTION_FOUND }`)
                .addField(`Category:`, `${capitalize(category)}`)
                .addField(`Attributes:`, `${attributeArray.join('\n')}`)
                .addField(`Buy Price:`, `${cost === 0 ? `No price (Not buyable from a shop)` : `¥${Numeral(cost).format('0,0')}`}`)
            berryField ? embed.addField(`Berry Info:`, `${berryField}`).addField(`Growth Info:`, `${harvestingField}`) : false

            embeds.push(embed)
        }
        async function getMove() {
            const USAGE = `${bot.prefix}${module.exports.name} move <move name>`
            const embed = new MessageEmbed()
            embed.setColor(colors.boston)

            let move = args.join('-').toLowerCase()
            let data;

            if (!move) {
                return message.channel.send(`Usage: ${USAGE}`)
            }
            try {
                data = await P.getMoveByName(move)
            } catch (e) {
                if (e.response.data === 'Not Found') {
                    return message.channel.send(`That move doesn't exist!`)
                }
                throw e
            }

            let accuracy = data.accuracy
            let pp = data.pp
            let priority = data.priority
            if (priority > 0) {
                priority = `Increased Priority (+${priority})`
            } else if (priority < 0) {
                priority = `Decreased Priority (${priority})`
            } else {
                priority = `Normal Priority`
            }
            let power = data.power
            let meta = data.meta
            let metaStr = ``
            if (meta) {
                metaStr = `${meta.min_hits ? `**Minimum Hits**: ${meta.min_hits}\n` : ''}${meta.max_hits ? `**Maximum Hits**: ${meta.max_hits}\n` : ''}${meta.min_turns ? `**Minumum Turns**: ${meta.min_turns}\n` : ''}${meta.min_turns ? `**Maximum Turns**: ${meta.max_turns}\n` : ''}${meta.drain ? `**Drain**: ${meta.drain}\n` : ''}${meta.healing ? `**Healing**: ${meta.healing}\n` : ''}${meta.crit_rate ? `**Critical Rate Bonus**: ${meta.crit_rate}%\n` : ''}${meta.ailment_chance ? `**Ailment Chance**: ${meta.ailment_chance}%\n` : ''}${meta.flinch_chance ? `**Flinch Chance**: ${meta.flinch_chance}%\n` : ''}${meta.stat_chance ? `**Stat Change Chance**: ${meta.stat_chance}%` : ''}`
            }
            if (metaStr === ``) {
                metaStr = `No Metadata Given`
            }
            let damageClass = formatName(data.damage_class ? data.damage_class.name : "No Damage Class")
            let effectEntries = data.effect_entries
            let entries = []
            for (entry of effectEntries) {
                if (entry.language.name === 'en') {
                    let effect = entry.effect
                    if (effect.length > FIELD_LIMIT || effect.length === 0) {
                        effect = entry.short_effect
                    }
                    let varRegex = /\$\w+/gmi
                    let key = effect.match(varRegex)
                    if (key && key[0]) {
                        key = key[0]
                        key = key.split('')
                        key.shift()
                        key = key.join('')

                        entries.push(effect.replace(varRegex, `${data[key]}`))
                    } else {
                        entries.push(effect)
                    }
                }
            }
            let effectChance = data.effect_chance
            let effectChanges = data.effect_changes || 'No Changes Across Generations'
            let generation = data.generation.name
            let generationNum = generation.split('-')[1] // grab the vii
            generation = `Generation `
            generationNum.split('').forEach(v => {
                generation += capitalize(v)
            })
            let statChanges = data.statChanges || []
            let statChangeArr = []
            for (change of statChanges) {
                statChangeArr.push(change)
            }
            let flavorText = getFlavorText(data.flavor_text_entries)
            if (flavorText.version_group) {
                flavorText.text += flavorText.version_group
            }

            let name = formatName(data.name)
            // contests
            /*let contestType = data.contest_type.name
            let contestCombos = data.contest_combos
            let contestEffectURL = data.contest_effect.url
            let contestEffect;
            let superContestEffectURL = data.super_contest_effect.url
            let superContestEffect;
            try {
                let data = await Axios.get(contestEffectURL)
                contestEffect = data.data
                let superData = await Axios.get(superContestEffectURL)
                superContestEffect = superData.data
            } catch (e) {
                contestEffect = 'No Effect'
                superContestEffect = 'No Effect'
            }*/
            // build the embed
            embed.setTitle(`Info on ${name}:`)
                .addField(`PP:`, `${pp ? pp : "No PP defined" }`)
                .addField(`Accuracy:`, `${accuracy ? `${accuracy}%` : '--'}`)
                .addField(`Power:`, `${power === (0 || null) ? `--` : power}`)
                .addField(`Priority:`, `${priority}`)
                .addField(`Damage Class:`, `${damageClass}`)
                .addField(`Effects:`, `${entries[0] ? entries.join('\n') : 'No Effect'}`)
                .addField(`Effect Chance:`, `${effectChance ? `${effectChance}%` : 'No Effect'}`)
                .addField(`Stat Changes:`, `${statChangeArr[0] ? statChangeArr.join('\n') : 'No Stat Changes'}`)
                .addField(`Description:`, `${flavorText.text ? flavorText.text : NO_DESCRIPTION_FOUND}`)
                .addField(`Generation:`, `${generation}`)
                .addField(`Meta:`, `${metaStr}`)
            embeds.push(embed)
        }

        message.channel.sendTyping()
        let group = args[0]
        args.shift() // fix args for parsing by functions
        // Handle sub-commands
        if (group) {
            group = group.toLowerCase()
        }

        switch (group) {
            case 'pokémon': {} // fallthrough
            case 'pokemon': {
                await getPokemon()
                break
            }
            case 'item': {
                await getItem()
                break
            }
            case 'move': {} // let this fallthrough to moves
            case 'moves': {
                await getMove()
                break
            }
            default: {
                return message.channel.send(`Usage: \`${module.exports.usage}\``)
            }
        }
        if (embeds.length > 0) {
            await message.channel.send({
                embeds: embeds
            })
        }
    }
}