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
  // Interaction type and data
  if(!req.body){
    return res.send({ type: InteractionResponseType.PONG });
  }
  const { type, id, data, token, message } = req.body;


  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test' || name === "test2") {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'hello world poopface llama dragon ' + getRandomEmoji(),
        },
      });
    }

  }
  if(type === InteractionType.MESSAGE_COMPONENT) {
    await processButton(req.body.member.user.id, data.custom_id, message.id, db);
    return res.status(200).json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: null, // No content message
      }
  });
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});