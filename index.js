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

let list; // array of user elements
let expenses; // sum of all user expenses

// If `list` variable is empty => Get data from the DB and put it in `list` and `expenses` variables
const recieveData = async (userID) => {
  ({ list, expenses } = await listController.getData(userID));
};

bot.onText(/^\/start$/, (msg) => {
  // Send greeting message with reply markup for commands (View the list and Clear expenses)
  const { id } = msg.chat;

  const html = `
  <strong>Oh, hello there!</strong>
  <i>My name is Shrek (you may know me from my autobiographical films) and I'll help you deal with your grocery trip!</i>
  
  <i>/help for more information</i>`;

  const options = {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: {
      keyboard: [["Clear", "View"]],
    },
  };

  bot.sendMessage(id, html, options);
});

bot.onText(/^\/help$/, (msg) => {
  // Send message with all help information
  const { id } = msg.chat;

  const html = `Each text message will be added to the list (except commands and numbers)
  To view the list, click 'View'
  To remove items from the list, click on them
  To calculate the price before deleting the item, write the price like this "256.04"
  To clear the calculation, click 'Clear'`;

  const options = {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: {
      keyboard: [["Clear", "View"]],
    },
  };

  bot.sendMessage(id, html, options);
});

bot.onText(/^View$/, async (msg) => {
  // Send a message with the user's list or inform him if it's empty
  const { id } = msg.chat;

  await recieveData(msg.from.id);

  let html;
  if (list.length) {
    html = `
    <strong>List</strong>`;
  } else {
    html = `
    <strong>Your list is empty</strong>`;
  }

  const options = {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: JSON.stringify({
      inline_keyboard: listController.createReplyMarkup(list),
    }),
  };

  bot.sendMessage(id, html, options);
});

bot.onText(/^Clear$/, async (msg) => {
  // Clear expenses and send message to inform the user
  const { id } = msg.chat;

  await recieveData(msg.from.id);

  expenses = 0;
  listController.clearData(msg.from.id);

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

bot.on("callback_query", async (msg) => {
  const { id } = msg.message.chat;

  await recieveData(msg.from.id);

  // Remove selected elements from the list
  list.splice(msg.data, 1);
  listController.addData({ ld: list, from: msg.from.id });

  bot.editMessageReplyMarkup(
    JSON.stringify({
      inline_keyboard: listController.createReplyMarkup(list),
    }),
    {
      message_id: msg.message.message_id,
      chat_id: msg.message.chat.id,
    }
  );

  // If list is over => send a message with expenses
  if (!list.length) {
    const html = `
  <strong>Your list is over</strong>
  <i>Total expenses: ${expenses.toFixed(2)}$</i>`;

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

bot.onText(/^[\d.]+$/, async (msg) => {
  // If user sends a number (12.345  16  28.5  etc.) => Add message number to `expenses` variable
  await recieveData(msg.from.id);

  expenses += parseFloat(msg.text);
  listController.addData({ calc: expenses, from: msg.from.id });
});

bot.on("message", async (msg) => {
  try {
    const { id } = msg.chat;

    // If user sends text for the list (not a number and not a command) => Add data to the DB and send response message
    if (
      isNaN(msg.text) &&
      !["Clear", "View", "/start", "/help"].includes(msg.text)
    ) {
      await recieveData(msg.from.id);

      list.push(msg.text);
      listController.addData({ ld: list, from: msg.from.id });

      const html = `☑`;
      const options = {
        parse_mode: "HTML",
        disable_notification: true,
      };

      bot.sendMessage(id, html, options);
    }
  } catch (err) {
    console.error(err);
  }
});
