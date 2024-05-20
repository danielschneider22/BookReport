import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder, ButtonInteraction } from 'discord.js';
import { config } from 'dotenv';
config();

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

const CHANNEL_ID = process.env.CHANNEL_ID as string; // Add your channel ID to .env

  
interface Choice {
    kangaroo: string[];
    fish: string[];
}

const choices: Choice = {
    kangaroo: [],
    fish: [],
};

client.once(Events.ClientReady, () => {
    // Post the initial message with buttons
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel && channel.isTextBased()) {
        channel.send({
            content: 'Choose your favorite:',
            components: [createActionRow()]
        });
    }
});

export async function processButton(username: string, choice: keyof Choice, messageId: string) {
    // Remove user from all choices
    for (const key in choices) {
        const index = choices[key as keyof Choice].indexOf(username);
        if (index !== -1) choices[key as keyof Choice].splice(index, 1);
    }

    // Add user to the selected choice
    choices[choice].push(username);

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

client.login(process.env.DISCORD_BOT_TOKEN);