const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

console.log("Bot have been started...");

const list = [
  "Apples",
  "Bananas",
  "Lemonade",
  "Popcorn",
  "Chips",
  "Fish",
  "Eggs",
  "Potato",
  "Salat",
  "Watermelon",
  "Cookies",
  "Milk",
];

const createReplyMarkup = () => {
  const arr = [];
  list.forEach((el, index) => {
    arr.push([{ text: el, callback_data: index }]);
  });
  return arr;
};

bot.onText(/^\/start$/, (msg) => {
  const { id } = msg.chat;
  const html = `
  <strong>Oh, hello there!</strong>
  <i>My name is Shrek(you may know me from my autobiographical films) and I'll help you deal with your grocery trip!</i>`;
  bot.sendMessage(id, html, {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: {
      keyboard: [["Edit", "View"]],
    },
  });
});

bot.onText(/^View$/, (msg) => {
  const { id } = msg.chat;

  const html = `
    <strong>List</strong>`;
  const options = {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: JSON.stringify({
      inline_keyboard: createReplyMarkup(),
    }),
  };

  bot.sendMessage(id, html, options);
});

bot.onText(/^Edit$/, (msg) => {
  const { id } = msg.chat;
});

bot.on("callback_query", (msg) => {
  list.splice(msg.data, 1);

  bot.editMessageReplyMarkup(
    JSON.stringify({
      inline_keyboard: createReplyMarkup(),
    }),
    {
      message_id: msg.message.message_id,
      chat_id: msg.message.chat.id,
    }
  );
});
