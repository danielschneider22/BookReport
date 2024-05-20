import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder, ButtonInteraction } from 'discord.js';
import { config } from 'dotenv';
import cron from 'node-cron';
config();

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

const CHANNEL_ID = process.env.CHANNEL_ID as string; // Add your channel ID to .env
const TIMEZONE = 'UTC'; // Add your timezone to .env

interface Choice {
    kangaroo: string[];
    fish: string[];
}

const choices: Choice = {
    kangaroo: [],
    fish: [],
};

// client.once(Events.ClientReady, () => {
//     // cron.schedule(
//     //     '00 15 * * 2', // Should run Tuesdays at 12
//     //     () => { makeEvent() },
//     //     { timezone: TIMEZONE }
//     //   );
//     makeEvent();
//     cron.schedule(
//         '* * * * *', // Should run Tuesdays at 12
//         () => { makeEvent() },
//         { timezone: TIMEZONE }
//     );
    
// });

async function sendPrompt() {
    // Post the initial message with buttons
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel && channel.isTextBased()) {
        await channel.send({
            content: 'Choose your favorite:',
            components: [createActionRow()]
        });
    }
    return true;
}

export async function makeEvent() {
    await client.login(process.env.DISCORD_TOKEN);
    if(client.channels.cache.get(CHANNEL_ID)) {
        return sendPrompt();
    }
    const waitForReady = new Promise<void>(resolve => {
        client.on('ready', () => {
            resolve(); // Resolve the promise when 'ready' event occurs
        });
    });
    await waitForReady;
    return sendPrompt();
}

async function doProcessButton(username: string, choice: keyof Choice, messageId: string) {
    // Remove user from all choices
    for (const key in choices) {
        const index = choices[key as keyof Choice].indexOf(username);
        if (index !== -1) choices[key as keyof Choice].splice(index, 1);
    }

    // Add user to the selected choice
    choices[choice].push(username);

    const embed = generateEmbed();

    const channel = client.channels.cache.get(CHANNEL_ID);
    console.log(!!channel)
    if (channel && channel.isTextBased()) {
        try {
            const fetchedMessage = await channel.messages.fetch(messageId);
            if (fetchedMessage) {
                await fetchedMessage.edit({
                    embeds: [embed],
                    components: [createActionRow()]
                });
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            channel.send('Error deleting message.');
        }
    }
}

export async function processButton(username: string, choice: keyof Choice, messageId: string) {
    await client.login(process.env.DISCORD_TOKEN);
    if(client.channels.cache.get(CHANNEL_ID)) {
        console.log("I AM HEREEEEEEE")
        return doProcessButton(username, choice, messageId);
    }
    const waitForReady = new Promise<void>(resolve => {
        client.on('ready', () => {
            resolve(); // Resolve the promise when 'ready' event occurs
        });
    });
    console.log("banana")
    await waitForReady;
    console.log("cheese")
    return doProcessButton(username, choice, messageId);
}

function createActionRow() {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('kangaroo')
                .setLabel('Kangaroo')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('fish')
                .setLabel('Fish')
                .setStyle(ButtonStyle.Primary)
        );
}

function generateEmbed() {
    const kangarooUsers = choices.kangaroo.map(userId => `<@${userId}>`).join('\n') || 'None';
    const fishUsers = choices.fish.map(userId => `<@${userId}>`).join('\n') || 'None';

    return new EmbedBuilder()
        .setTitle('Current Choices')
        .addFields(
            { name: 'Kangaroo', value: kangarooUsers, inline: true },
            { name: 'Fish', value: fishUsers, inline: true }
        )
        .setColor(0x00AE86);
}