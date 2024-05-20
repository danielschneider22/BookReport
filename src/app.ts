import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  MessageComponentTypes,
  ButtonStyleTypes,
  verifyKeyMiddleware
} from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './utils.js';
// import './cron.js'; // Import the cron job
import './messageWithButtons.js'; 
import { makeEvent, processButton } from './messageWithButtons.js';
import axios from 'axios';


// Type for active games
interface ActiveGame {
  id: string;
  objectName: string;
}

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY as string) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames: Record<string, ActiveGame> = {};

app.get('/ping', async function (req, res) {
  return res.status(200).send('Pong!');
})

app.get('/cronTask', async function (req, res) {
  await makeEvent();
  return res.status(200).send('Cron task triggered successfully!');
})

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY as string), async function (req, res) {
  // Interaction type and data
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
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: 'hello world poopface llama dragon ' + getRandomEmoji(),
        },
      });
    }
    // "challenge" command
    if (name === 'challenge' && id) {
      const userId = req.body.member.user.id;
      // User's object choice
      const objectName = req.body.data.options[0].value;

      // Create active game using message ID as the game ID
      activeGames[id] = {
        id: userId,
        objectName,
      };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Rock papers scissors challenge from poopface llama <@${userId}>`,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  // Append the game ID to use later on
                  custom_id: `accept_button_${req.body.id}`,
                  label: 'Accept LOL',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        },
      });
    }
  }
  if(type === InteractionType.MESSAGE_COMPONENT) {
    await processButton(req.body.member.user.id, data.custom_id, message.id);
    
    // const copiedToken = 'Jze4KiOKW4mIz-NBbRxzFVMa1SWshYalFYC0YolZreAiAnGZEws5y1BwQfHIhIoFvSV2';
    // // const endpoint = `webhooks/${process.env.APP_ID}/${copiedToken}/messages/${message.id}`;
    // const endpoint = `webhooks/${process.env.APP_ID}/${copiedToken}/messages/${message.id}`
    // await DiscordRequest(endpoint, { method: 'DELETE' });
    // // const response = await axios.delete(`https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`);
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