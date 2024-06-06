import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
} from 'discord-interactions';
import { VerifyDiscordRequest } from './utils.js';
import './messageWithButtons.js'; 
import { getFirebaseAdmin } from './firebaseConfig.js';
import { ModalBuilder, TextInputBuilder, ActionRowBuilder } from '@discordjs/builders';
import { TextInputStyle, ModalActionRowComponentBuilder, EmbedBuilder } from 'discord.js';
import { searchBook } from './findBook.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY as string) }));

const admin = getFirebaseAdmin();
const db = admin.database();

app.get('/ping', async function (req, res) {
  const myData = { "hello": "world" };

  // Write data to Firebase Realtime Database
  await db.ref('/data').set(myData)
  return res.status(200).send('Pong2 edddd!');
})


app.post('/interactions', async function (req, res) {
  if(!req.body || Object.keys(req.body).length === 0){
    return res.send({ type: InteractionResponseType.PONG });
  }
  const { type } = req.body;
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  const interaction = req.body;

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        if (interaction.data.name === 'mybookreports') {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `View your book reports here: https://book-report-site.vercel.app/?username=${interaction.member.user.username}`,
            },
          });
        }
        if (interaction.data.name === 'allbookreports') {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `View all book reports here: https://book-report-site.vercel.app`,
            },
          });
        }
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
              .setLabel("Stars (0-5)")
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
          let rating = Number(interaction.data.components[1].components[0].value);
          const review = interaction.data.components[2].components[0].value;
          sendBookReview(bookTitle, rating, interaction.member.user.username, review, book)
          const content = `:book: from **${interaction.member.user.username}**!\n\n See all book reports here: https://book-report-site.vercel.app`
          function getStars(rating: number): string {
            const fullStars = Math.floor(rating);
            const customStarId = "<:customstar:1247389728702205976>"
            const customHalfStarId =  "<:halfstar:1247389728094031923>"
            const halfStar = rating % 1 >= 0.5 ? customHalfStarId : '';
            
            return customStarId.repeat(fullStars) + halfStar;
          }
          if(rating > 5) {
            rating = rating / 2;
          }
          const starsText = getStars(rating)

          if(book) {
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content,
                embeds: [
                  {
                      title: `${book.title} by ${book.author}`,
                      description: `**${starsText}**\n\n${review}`,
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
                      description: `**${starsText}**\n\n**${review}`,
                  },
                ]
              },
            });
          }
      }
    });

    function sendBookReview(bookTitle: string, rating: number, username: string, review: string, book?: any) {
      const bookReview = { 
        title: book?.title || bookTitle,
        typedTitle: bookTitle,
        author: book?.author,
        genre: book?.genre,
        rating,
        image: book?.imageUrl,
        date: new Date().getTime(),
        username,
        review
      };
      db.ref(`/bookreviews/${username}/${book?.title || bookTitle}`).set(bookReview)
        .then(() => {
            console.log('Data set successfully');
        })
        .catch((error) => {
            console.error('Error setting data:', error);
        });
    }

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});