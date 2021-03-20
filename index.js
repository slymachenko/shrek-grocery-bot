const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const listController = require("./controllers/listController");

dotenv.config({ path: "./config.env" });

mongoose
  .connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.log(err);
  });

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

console.log("Bot has been started...");

let list = [];
let sum = 0;

(async () => {
  list = (await listController.getData()).list;
  sum = (await listController.getData()).calculations;
})();

bot.onText(/^\/start$/, (msg) => {
  const { id } = msg.chat;
  const html = `
  <strong>Oh, hello there!</strong>
  <i>My name is Shrek(you may know me from my autobiographical films) and I'll help you deal with your grocery trip!</i>
  
  <i>/help for more information</i>`;

  bot.sendMessage(id, html, {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: {
      keyboard: [["Clear", "View"]],
    },
  });
});

bot.onText(/^\/help$/, (msg) => {
  const { id } = msg.chat;
  const html = `Each text message will be added to the list (except commands and numbers)
  To view the list, click 'View'
  To remove items from the list, click on them
  To calculate the price before deleting the item, write the price like this "256.04"
  To clear the calculation, click 'Clear'`;

  bot.sendMessage(id, html, {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: {
      keyboard: [["Clear", "View"]],
    },
  });
});

bot.onText(/^View$/, (msg) => {
  const { id } = msg.chat;

  const options = {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: JSON.stringify({
      inline_keyboard: listController.createReplyMarkup(list),
    }),
  };
  let html;

  if (list.length) {
    html = `
    <strong>List</strong>
    <i>Total expenses: ${sum.toFixed(2)}$</i>`;
  } else {
    html = `
    <strong>Your list is empty</strong>
    <i>Total expenses: ${sum.toFixed(2)}$</i>`;
  }

  bot.sendMessage(id, html, options);
});

bot.onText(/^Clear$/, (msg) => {
  const { id } = msg.chat;

  sum = 0;

  const html = `
  <strong>Calculations cleared</strong>`;
  const options = {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: {
      keyboard: [["Clear", "View"]],
    },
  };

  listController.clearData();

  bot.sendMessage(id, html, options);
});

bot.on("callback_query", (msg) => {
  const { id } = msg.message.chat;

  // Remove the pressed button from the list
  list.splice(msg.data, 1);
  listController.addData({ ld: list });

  bot.editMessageReplyMarkup(
    JSON.stringify({
      inline_keyboard: listController.createReplyMarkup(list),
    }),
    {
      message_id: msg.message.message_id,
      chat_id: msg.message.chat.id,
    }
  );

  // If list is empty
  if (!list.length) {
    const html = `
  <strong>Your list is over</strong>
  <i>Total expenses: ${sum.toFixed(2)}$</i>`;
    const options = {
      parse_mode: "HTML",
      disable_notification: true,
      reply_markup: {
        keyboard: [["Clear", "View"]],
      },
    };

    bot.sendMessage(id, html, options);
  }
});

bot.onText(/^[\d.]+$/, (msg) => {
  // Add message number to sum variable
  sum += parseFloat(msg.text);
  listController.addData({ calc: sum });
});

bot.on("message", (msg) => {
  // Add message text to list
  const { id } = msg.chat;

  if (
    isNaN(msg.text) &&
    msg.text !== "Clear" &&
    msg.text !== "View" &&
    msg.text !== "/start" &&
    msg.text !== "/help"
  ) {
    list.push(msg.text);
    listController.addData({ ld: list });

    const html = `☑`;
    const options = {
      parse_mode: "HTML",
      disable_notification: true,
    };
    bot.sendMessage(id, html, options);
  }
});
