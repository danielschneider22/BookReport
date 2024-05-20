import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
config();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const CHANNEL_ID = process.env.CHANNEL_ID; // Add your channel ID to .env
const choices = {
    kangaroo: [],
    fish: [],
};
client.once(Events.ClientReady, () => {
    console.log(`POOPY Logged in as ${client.user?.tag}!`);
    // Post the initial message with buttons
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel && channel.isTextBased()) {
        channel.send({
            content: 'Choose your favorite:',
            components: [createActionRow()]
        });
    }
});
client.on('interactionCreate', async (interaction) => {
    console.log("HEREEEE");
    if (!interaction.isButton())
        return; // Ignore if interaction is not a button
    const { customId } = interaction;
    if (customId === 'kangaroo') {
        await interaction.reply('You clicked the Kangaroo button!');
    }
    else if (customId === 'fish') {
        await interaction.reply('You clicked the Fish button!');
    }
});
// client.on(Events.InteractionCreate, async interaction => {
//     console.log("interaction THINY");
//     if (!interaction.isButton()) return;
//     const userId = interaction.user.id;
//     const choice = interaction.customId as keyof Choice;
//     // Remove user from all choices
//     for (const key in choices) {
//         const index = choices[key as keyof Choice].indexOf(userId);
//         if (index !== -1) choices[key as keyof Choice].splice(index, 1);
//     }
//     // Add user to the selected choice
//     choices[choice].push(userId);
//     const embed = generateEmbed();
//     // Update the message
//     await (interaction as ButtonInteraction).update({ embeds: [embed], components: [createActionRow()] });
// });
export async function processButton(username, choice, messageId) {
    // Remove user from all choices
    for (const key in choices) {
        const index = choices[key].indexOf(username);
        if (index !== -1)
            choices[key].splice(index, 1);
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
            // channel.send({
            // });
        }
        catch (error) {
            console.error('Error deleting message:', error);
            channel.send('Error deleting message.');
        }
    }
    // Update the message
    // await (interaction as ButtonInteraction).update({ embeds: [embed], components: [createActionRow()] });
}
function createActionRow() {
    return new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
        .setCustomId('kangaroo')
        .setLabel('Kangaroo')
        .setStyle(ButtonStyle.Primary), new ButtonBuilder()
        .setCustomId('fish')
        .setLabel('Fish')
        .setStyle(ButtonStyle.Primary));
}
function generateEmbed() {
    const kangarooUsers = choices.kangaroo.map(userId => `<@${userId}>`).join('\n') || 'None';
    const fishUsers = choices.fish.map(userId => `<@${userId}>`).join('\n') || 'None';
    return new EmbedBuilder()
        .setTitle('Current Choices')
        .addFields({ name: 'Kangaroo', value: kangarooUsers, inline: true }, { name: 'Fish', value: fishUsers, inline: true })
        .setColor(0x00AE86);
}
client.login(process.env.DISCORD_BOT_TOKEN);
