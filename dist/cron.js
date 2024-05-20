import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import 'dotenv/config';
// Create a new Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const CHANNEL_ID = process.env.CHANNEL_ID; // Add your channel ID to .env
const TIMEZONE = process.env.TIMEZONE || 'UTC'; // Add your timezone to .env
// client.once('ready', () => {
//   console.log(`Logged in as ${client.user?.tag}!`);
//   // Schedule the task to run every 30 seconds
//   cron.schedule(
//     '*/30 * * * * *',
//     () => {
//       const channel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
//       if (channel) {
//         channel.send('hello');
//       } else {
//         console.error('Channel not found');
//       }
//     },
//     {
//       timezone: TIMEZONE,
//     }
//   );
// });
// Example poll data
const pollQuestions = [
    { question: "Do you like coffee?", option1: "Yes", option2: "No" },
    { question: "Do you like tea?", option1: "Yes", option2: "No" },
    // Add more questions as needed
];
let pollIndex = 0;
client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel) {
        const poll = pollQuestions[pollIndex];
        pollIndex = (pollIndex + 1) % pollQuestions.length; // Loop through the questions
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
            .setCustomId('option1')
            .setLabel(poll.option1)
            .setStyle(ButtonStyle.Primary), new ButtonBuilder()
            .setCustomId('option2')
            .setLabel(poll.option2)
            .setStyle(ButtonStyle.Primary));
        channel.send({ content: poll.question, components: [row] });
    }
    // cron.schedule(
    //   '* * * * *', // Run every minute
    //   () => {
    //     const channel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
    //     if (channel) {
    //       const poll = pollQuestions[pollIndex];
    //       pollIndex = (pollIndex + 1) % pollQuestions.length; // Loop through the questions
    //       const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    //         new ButtonBuilder()
    //           .setCustomId('option1')
    //           .setLabel(poll.option1)
    //           .setStyle(ButtonStyle.Primary),
    //         new ButtonBuilder()
    //           .setCustomId('option2')
    //           .setLabel(poll.option2)
    //           .setStyle(ButtonStyle.Primary)
    //       );
    //       channel.send({ content: poll.question, components: [row] });
    //     } else {
    //       console.error('Channel not found');
    //     }
    //   },
    //   {
    //     timezone: TIMEZONE,
    //   }
    // );
});
client.login(process.env.DISCORD_TOKEN);
