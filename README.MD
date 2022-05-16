# Kamiyu
Pokedex Discord bot.

Most of the source is untouched. I've only added more documentation and removed tokens and the like.
This may work, or it may not, hasn't been run in a while since Discord restricted message content.

# Prerequisites
- Discord bot token (goes in `src/info.json`) - Get from https://discord.com/developers
- Node.JS/NPM - Get from https://nodejs.org/
- Some computer to run it on

# Installation

1. Clone the repository (using either `git clone https://github.com/experibass/kamiyubot` or `gh repo clone experibass/kamiyubot`).
2. Install dependencies with `npm i`.
3. Run with `npm start`.

# Design
Kamiyu is a full-fledged Pokedex bot. You can get all the info on [most(\*)](#most) Pokemon and items in the games, without needing to leave Discord.  
It was created after I got fed up with how long it took Bulbapedia to load and how much useless information it displayed, along with all the ads. I wanted a fast and easy-to-use source of information, in a readable and informative format. I also wanted something that could be easily used without a physical keyboard and without angering autocorrect. That resulted in these design choices:

## Display information quickly, accurately, and in a readable and informative format.
I looked around and stumbled across [PokeAPI.co](https://pokeapi.co). It was accurate, as it pulled its data directly from the games, it was fast, splitting different bits of information over different endpoints, and it was easy to use, returning data in a easy-to-parse format.  
For the readable format part, I spent a while tweaking the embeds, and ended up settling on the Markdown format to display as much information as possible in a layout that would be easy to skim over. Bold keys are easy to distinguish from their values, and I used dashes to mark each key in a list. I also made Kamiyu explicitly tell the user which games it's pulling data from.

## Easy to use without a physical keyboard and without triggering autocorrect.
### The prefix is a capital S
Most autocorrects automatically capitalize the first letter of the first word, as it believes you are starting a sentence. Using capital S and being case-sensitive helps mobile users without affecting PC users too much.  
This is also why Kamiyu does not support slash commands. More info below.
- Related, Kamiyu ignores any message that is not a command, even if the message starts with its prefix. This is to avoid interrupting any conversations going on until its needed.

### Avoiding autocorrect
Kamiyu avoids using anything other than alphanumeric characters. This is for two reasons:
1. To avoid autocorrect thinking you're using punctuation wrong, and
2. To make it easier for non-PC users. Most keyboards have special characters on the secondary keyboard, and switching modes, especially on phones, is tedious. Typing `Search item rawst berry` is easier than typing `Search item rawst-berry`.
Reducing the amount of taps needed makes using Kamiyu feel smoother than using other bots with typical prefixes.

# Most?
[PokeAPI](https://github.com/PokeAPI/pokeapi), the API Kamiyu pulls from, doesn't have all the data on the latest games. If you have a modded Switch and the games, head on over to see how you can help provide data!

# Why slash commands aren't supported
Slash commands aren't supported for two reasons:
1. Either Discords slash command implementation, Discord.JS slash command implementation, or both, would require me to strip Kamiyu to the bare minimum or promote sub-commands up to main commands, as I am not allowed to have more than one nested command. For most of those sub-commands it would violate the design principle, so moving is out of the question. Stripping the sub-commands would severly reduce the amount of information it could give, which gives it no reason to exist as you would still have to pull up Bulbapedia. Discord blames Discord.JS, if that means anything. Discord claims that Kamiyu would be easy 
2. I personally don't like slash commands. [Danny (the creator of Discord.py) goes into more depth here.](https://gist.github.com/Rapptz/4a2f62751b9600a31a0d3c78100287f1#slash-commands) Personally, I believe they impose unnecessary restrictions on perfectly fine bots, and restrict them all to doing the same thing, instead of using and bending Discord to their full potential and becoming their own, unique bot.