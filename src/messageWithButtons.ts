import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder, ButtonInteraction } from 'discord.js';
import { config } from 'dotenv';
import { Database } from 'firebase-admin/lib/database/database';

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

async function doProcessButton(username: string, choice: keyof Choice, messageId: string, db: Database) {
    let choices: Choice = {
        friday: [],
        saturday: [],
        declined: [],
    };
    
    const snapshot = await db.ref(`/eventData/${messageId}`).once('value')
    if(snapshot.val() && Object.keys(snapshot.val()))
        choices = snapshot.val();

    ["friday", "saturday", "declined"].forEach((key) => {
        if(!choices[key as keyof Choice]) {
            choices[key as keyof Choice] = [];
        }
        const index = choices[key as keyof Choice].indexOf(username);
        if(index !== -1 && ((choice === key) || (choice === "declined" && key !== "declined")  || (choice !== "declined" && key === "declined"))) {
            choices[key as keyof Choice].splice(index, 1);
        } else if (index === -1 && choice === key) {
            choices[choice].push(username);
        }
    })

    await db.ref(`/eventData/${messageId}`).set(choices)

    const embed = generateEmbed(choices, messageId);

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

export async function processButton(username: string, choice: keyof Choice, messageId: string, db: Database) {
    if(!client.readyTimestamp) {
        await client.login(process.env.DISCORD_TOKEN);
    }
    if(client.channels.cache.get(CHANNEL_ID)) {
        return doProcessButton(username, choice, messageId, db);
    }
    const waitForReady = new Promise<void>(resolve => {
        client.on('ready', () => {
            resolve(); // Resolve the promise when 'ready' event occurs
        });
    });
    await waitForReady;
    return doProcessButton(username, choice, messageId, db);
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

function generateEmbed(choices?: Choice, messageId?: string) {
    if(choices && messageId) {
        const fridayUsers = choices.friday?.length ? choices.friday.map(userId => `<@${userId}>`).join('\n') : 'None';
        const saturdayUsers = choices.saturday?.length ? choices.saturday.map(userId => `<@${userId}>`).join('\n') : 'None';
        const declinedUsers = choices.declined?.length ? choices.declined.map(userId => `<@${userId}>`).join('\n') : 'None';
    
        return new EmbedBuilder()
            .setTitle('Choose one or more dates:')
            .addFields(
                { name: 'Friday (' + (choices.friday?.length || "0") + ")", value: fridayUsers, inline: false },
                { name: 'Saturday (' + (choices.saturday?.length || "0") + ")", value: saturdayUsers, inline: false },
                { name: 'Declined (' + (choices.declined?.length || "0") + ")", value: declinedUsers, inline: false }
            )
            .setColor(0x00AE86)
            .setImage("https://images.pling.com/img/00/00/11/74/84/1108370/104822-1.png")
    } else {
        return new EmbedBuilder()
            .setTitle('Choose one or more dates:')
            .addFields(
                { name: 'Friday (0)', value: "None", inline: false },
                { name: 'Saturday (0)', value: "None", inline: false },
                { name: 'Declined (0)', value: "None", inline: false }
            )
            .setColor(0x00AE86)
            .setImage("https://images.pling.com/img/00/00/11/74/84/1108370/104822-1.png")
    }
    
}