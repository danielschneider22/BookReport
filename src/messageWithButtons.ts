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
    friday: string[];
    saturday: string[];
    declined: string[];
}

const choices: Choice = {
    friday: [],
    saturday: [],
    declined: [],
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
        const embed = generateEmbed();
        await channel.send({
            content: 'Weekly Magic the Gathering!',
            components: [createActionRow()],
            embeds: [embed]
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
        if(index !== -1 && ((choice === key) || (choice === "declined" && key !== "declined")  || (choice !== "declined" && key === "declined"))) {
            choices[key as keyof Choice].splice(index, 1);
        } else if (index === -1 && choice === key) {
            choices[choice].push(username);
        }
    }

    const embed = generateEmbed();

    const channel = client.channels.cache.get(CHANNEL_ID);
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
    if(!client.readyTimestamp) {
        await client.login(process.env.DISCORD_TOKEN);
    }
    if(client.channels.cache.get(CHANNEL_ID)) {
        return doProcessButton(username, choice, messageId);
    }
    const waitForReady = new Promise<void>(resolve => {
        client.on('ready', () => {
            resolve(); // Resolve the promise when 'ready' event occurs
        });
    });
    await waitForReady;
    return doProcessButton(username, choice, messageId);
}

function createActionRow() {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('friday')
                .setLabel('Friday 6:30pm')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('saturday')
                .setLabel('Saturday 11am')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('declined')
                .setLabel('Declined')
                .setStyle(ButtonStyle.Danger),
        );
}

function generateEmbed() {
    const fridayUsers = choices.friday.map(userId => `<@${userId}>`).join('\n') || 'None';
    const saturdayUsers = choices.saturday.map(userId => `<@${userId}>`).join('\n') || 'None';
    const declinedUsers = choices.declined.map(userId => `<@${userId}>`).join('\n') || 'None';

    return new EmbedBuilder()
        .setTitle('Choose one or more dates:')
        .addFields(
            { name: 'Friday (' + choices.friday.length + ")", value: fridayUsers, inline: false },
            { name: 'Saturday (' + choices.saturday.length + ")", value: saturdayUsers, inline: false },
            { name: 'Declined (' + choices.declined.length + ")", value: declinedUsers, inline: false }
        )
        .setColor(0x00AE86)
        .setImage("https://images.pling.com/img/00/00/11/74/84/1108370/104822-1.png")
}