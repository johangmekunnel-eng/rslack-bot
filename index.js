require("dotenv").config(); //loads things from the .env file and turns them into variables that can be used in the code

const { App } = require("@slack/bolt"); //connects to slack
const axios = require("axios"); //connects to the internet to use apis

const app = new App({ // defines the app and its settings
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/r-money-ping", async ({ command, ack, respond }) => { // app command is what tells the bot what to do. r-money-ping is what it is listening for, async allows the bot to think and let Slack know it received the message. 
  await ack(); // command stores the data of the message. ack means acknowledge, so the bot is acknowledging that it received the message.
  const latency = Date.now() - command.received_time * 1000; // latency is the variable and Date.now is getting current time in miliseconds minus the time when the command was sent by the user
  await respond(`Pong!\nLatency: ${latency}ms`); // respond is what the bot sends back and it is sending back the message Pong and the latency in milliseconds.
});

app.command("/r-money-joke", async ({ ack, respond }) => { // similar to r-money-ping
  await ack();

  try { // try is used for things that are unstable like APIs or things wiht internet. 
    const response = await axios.get( // axios connects to the internet and is getting the questions and responses fromt he API
      "https://official-joke-api.appspot.com/random_joke"
    );

    await respond({ // respond is the same as last time, showing what the bot is saying back to the user.
      text: `${response.data.setup}\n\n${response.data.punchline}` // it is getting the setup and punchline fromt he API and typing it back.
    });
  } catch { // used with try to respond if the try fails and give a response instead of crashing the bot. 
    await respond({ text: "Failed to fetch a joke." });
  }
});

app.command("/r-money-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get(
        "https://catfact.ninja/fact"
    );

    await respond({ 
        text: `Cat Fact:\n${response.data.fact}` });
  } catch {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});

app.command("/r-money-ai", async ({ ack, command, respond }) => {
  await ack();

  try {
    const answer = await getAIResponse(command.text);
    await respond({ text: answer });
  } catch (err) {
    console.log(err.response?.data || err.message);
    await respond({ text: "AI failed to respond." });
  }
});

async function getAIResponse(prompt) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}
// start bot
(async () => {
  await app.start();
  console.log("bot is running!");
})();