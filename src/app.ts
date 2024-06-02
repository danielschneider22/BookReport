import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  MessageComponentTypes,
  ButtonStyleTypes
} from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './utils.js';
import './messageWithButtons.js'; 
import { makeEvent, processButton } from './messageWithButtons.js';
import admin from 'firebase-admin';
import { firebaseConfig } from './firebaseConfig.js';
import { ModalBuilder, TextInputBuilder, ActionRowBuilder } from '@discordjs/builders';
import { Client, GatewayIntentBits, TextChannel, ButtonBuilder, ButtonStyle, TextInputStyle, ModalActionRowComponentBuilder, EmbedBuilder } from 'discord.js';
import { searchBook } from './findBook.js';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY as string) }));

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: "https://discordeventtracker-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.get('/ping', async function (req, res) {
  const myData = { "hello": "world" };

  // Write data to Firebase Realtime Database
  db.ref('/data').set(myData)
      .then(() => {
          console.log('Data set successfully');
      })
      .catch((error) => {
          console.error('Error setting data:', error);
      });
  return res.status(200).send('Pong!');
})

app.get('/cronTask', async function (req, res) {
  await makeEvent();
  return res.status(200).send('Cron task triggered successfully!');
})

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  const interaction = req.body;

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        if (interaction.data.name === 'bookreport') {
            const modal = new ModalBuilder()
                .setCustomId('book-title-modal')
                .setTitle('Book Report');
            
            const title = new TextInputBuilder()
              .setCustomId('title')
              .setLabel("Book title:")
              .setStyle(TextInputStyle.Short);

            // const genre = new TextInputBuilder()
            //   .setCustomId('genre')
            //   .setLabel("Genre")
            //   .setStyle(TextInputStyle.Short);

            const rating = new TextInputBuilder()
              .setCustomId('rating')
              .setLabel("Rating (0-10)")
              .setStyle(TextInputStyle.Short);

            const review = new TextInputBuilder()
              .setCustomId('review')
              .setLabel("Book Review")
              .setStyle(TextInputStyle.Paragraph);
            
            const firstActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(title);
		        const secondActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(rating);
            // const thirdActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(genre);
            const fourthActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(review);
            modal.addComponents(firstActionRow, secondActionRow, fourthActionRow);

            res.send({
              type: InteractionResponseType.MODAL,
              data: modal.toJSON(),
            });

            return;
        }
      }
      if (interaction.type === InteractionType.MODAL_SUBMIT) {
        const bookTitle = interaction.data.components[0].components[0].value;
          const book = await searchBook(bookTitle);
          const content = `New book review from ${interaction.member.user.username}!`
          if(book) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content,
                embeds: [
                  {
                      title: `${book.title} by ${book.author}`,
                      description: `${interaction.data.components[2].components[0].value}\n\n**Rating: ${interaction.data.components[1].components[0].value}/10**\n\nReviewed by ${interaction.member.user.username}`,
                      image: {
                          url: book.imageUrl,
                      },
                  },
                ]
              },
            });
          } else {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content,
                embeds: [
                  {
                      title: bookTitle,
                      description: `**${interaction.data.components[2].components[0].value}\n\n Reviewed by ${interaction.member.user.username}**`,
                  },
                ]
              },
            });
          }
      }
    });

app.listen(PORT, () => {
  // const bookTitle = 'Red rising'; // Replace with your desired book title
  // searchBook(bookTitle)
  //     .then(book => {
  //         if (book) {
  //             console.log(`Author: ${book.author}`);
  //             console.log(`Genre: ${book.genre}`);
  //             console.log(`Image URL: ${book.imageUrl}`);
  //         } else {
  //             console.log('Book not found.');
  //         }
  //     })
  //     .catch(err => console.error('Error searching for book:', err));

  console.log('Listening on port', PORT);
});