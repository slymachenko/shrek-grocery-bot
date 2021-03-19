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

const list = [];
let sum = 0;

// Generating a Reply Markup with items from a list
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
      inline_keyboard: createReplyMarkup(),
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
  bot.sendMessage(id, html, options);
});

bot.on("callback_query", (msg) => {
  const { id } = msg.message.chat;

  // Remove the pressed button from the list
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
    const html = `☑`;
    const options = {
      parse_mode: "HTML",
      disable_notification: true,
    };
    bot.sendMessage(id, html, options);
  }
});
