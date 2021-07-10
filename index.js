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

const options = {
  parse_mode: "HTML",
  disable_notification: true,
};

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

  bot.sendMessage(id, html, options);
});

bot.onText(/^\/help$/, (msg) => {
  // Send message with all help information
  const { id } = msg.chat;

  const html = `Each text message will be added to the list (except commands and numbers)
  To view the list => /view
  To remove items from the list, click on them
  To calculate your expenses before deleting the item, write the price like this "256.04"
  To subtract your expenses type '-' before number (for example: "-11.6")
  To check your current expenses => /expenses
  To clear the calculation => /clear`;

  bot.sendMessage(id, html, options);
});

bot.onText(/^\/view$/, async (msg) => {
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

bot.onText(/^\/clear$/, async (msg) => {
  // Clear expenses and send message to inform the user
  const { id } = msg.chat;

  await recieveData(msg.from.id);

  expenses = 0;
  listController.clearData(msg.from.id);

  const html = `
  <strong>Calculations cleared</strong>`;

  bot.sendMessage(id, html, options);
});

bot.onText(/^\/expenses$/, async (msg) => {
  // Show current expenses
  const { id } = msg.chat;

  await recieveData(msg.from.id);

  const html = `<strong>Current expenses: ${expenses.toFixed(2)}$</strong>`;

  bot.sendMessage(id, html, options);
});

bot.onText(/^\/templates/, async (msg) => {
  const { id } = msg.chat;

  await recieveData(msg.from.id);

  const [, product, price] = msg.text.split(" ");

  // set template if there's product and price
  if (product && price) {
    listController.updateTemplates(msg.from.id, product, price);

    const html = `templates has been updated`;

    return bot.sendMessage(id, html, options);
  }

  // delete template if there's only product
  if (product) {
    if (!(await listController.checkTemplate(msg.from.id, product))) {
      const html = `there's no <strong>${product}</strong> in the templates list`;

      return bot.sendMessage(id, html, options);
    }

    listController.updateTemplates(msg.from.id, product);

    const html = `<strong>${product}</strong> has been deleted from templates list`;

    return bot.sendMessage(id, html, options);
  }

  const html = await listController.createTemplateList(msg.from.id);

  bot.sendMessage(id, html, options);
});

bot.on("callback_query", async (msg) => {
  const { id } = msg.message.chat;

  await recieveData(msg.from.id);

  // if there's template for that product => add its price to expenses
  if (await listController.checkTemplate(msg.from.id, list[msg.data])) {
    expenses += await listController.checkTemplate(msg.from.id, list[msg.data]);
  }

  // remove selected elements from the list
  list.splice(msg.data, 1);

  listController.updateData({ ld: list, calc: expenses, from: msg.from.id });

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

    bot.sendMessage(id, html, options);
  }
});

bot.onText(/^[-\d.]+$/, async (msg) => {
  // If user sends a number (12.345  16  28.5  etc.) => Add message number to `expenses` variable
  // If user sends a number (-12.345  -16  -28.5  etc.) => Subtract message number from `expenses` variable
  await recieveData(msg.from.id);

  expenses += parseFloat(msg.text);
  if (expenses < 0) expenses = 0;

  listController.updateData({ calc: expenses, from: msg.from.id });
});

bot.on("message", async (msg) => {
  try {
    const { id } = msg.chat;

    // If user sends text for the list (not a number and not a command) => Add data to the DB and send response message
    if (
      !isNaN(msg.text) ||
      ["/clear", "/view", "/start", "/help", "/expenses"].includes(msg.text) ||
      new RegExp("^/templates").test(msg.text)
    )
      return;

    await recieveData(msg.from.id);

    list.push(msg.text);
    listController.updateData({ ld: list, from: msg.from.id });

    const html = `☑`;

    bot.sendMessage(id, html, options);
  } catch (err) {
    console.error(err);
  }
});

// Sending an empty HTTP response on request
require("http")
  .createServer()
  .listen(process.env.PORT || 5000)
  .on("request", function (req, res) {
    res.end("");
  });
