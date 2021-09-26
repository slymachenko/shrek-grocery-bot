const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const listController = require("./controllers/listController");
const templatesController = require("./controllers/templatesController");
const getResponse = require("./controllers/messageController");

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
  webHook: {
    port: process.env.PORT,
  },
});

bot.setWebHook(`${process.env.URL}/bot/${process.env.TOKEN}`);

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

// Send greeting message
bot.onText(/^\/start$/, (msg, [source]) => {
  const { id } = msg.chat;
  const response = getResponse(source);

  bot.sendMessage(id, response, options);
});

// Send message with all help information
bot.onText(/^\/help$/, (msg, [source]) => {
  const { id } = msg.chat;
  const response = getResponse(source);

  bot.sendMessage(id, response, options);
});

// Send a message with the user's list or inform them if it's empty
bot.onText(/^\/view$/, async (msg, [source]) => {
  const { id } = msg.chat;
  const response = getResponse(source);

  await recieveData(msg.from.id);
  const options = {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: JSON.stringify({
      inline_keyboard: listController.createReplyMarkup(list),
    }),
  };

  if (list.length) return bot.sendMessage(id, response.list, options);

  bot.sendMessage(id, response.listEmpty, options);
});

// Clear expenses and send message to inform the user
bot.onText(/^\/clear$/, async (msg, [source]) => {
  const { id } = msg.chat;

  await listController.clearData(msg.from.id);
  await recieveData(msg.from.id);
  const response = getResponse(source);

  bot.sendMessage(id, response, options);
});

// Show current expenses
bot.onText(/^\/expenses$/, async (msg, [source]) => {
  const { id } = msg.chat;

  await recieveData(msg.from.id);

  const response = getResponse(source, { expenses });

  bot.sendMessage(id, response, options);
});

bot.onText(/^\/settemplate/, async (msg, [source]) => {
  const { id } = msg.chat;
  await recieveData(msg.from.id);
  const [, product, price] = msg.text.split(" ");
  const response = getResponse(source, { product });

  // set template if there's product name and price
  if (!product || !price) return bot.sendMessage(id, response.textErr, options);
  templatesController.updateTemplates(msg.from.id, product, price);

  return bot.sendMessage(id, response.success, options);
});

bot.onText(/^\/removetemplate/, async (msg, [source]) => {
  const { id } = msg.chat;
  await recieveData(msg.from.id);
  const [, product] = msg.text.split(" ");
  const response = getResponse(source, { product });

  // delete template if there's product name
  if (!product) return bot.sendMessage(id, response.textErr);
  const isTemplate = await templatesController.checkTemplate(
    msg.from.id,
    product
  );
  if (!isTemplate) return bot.sendMessage(id, response.err, options);

  templatesController.updateTemplates(msg.from.id, product);

  return bot.sendMessage(id, response.success, options);
});

bot.onText(/^\/templates$/, async (msg, [source]) => {
  const { id } = msg.chat;
  await recieveData(msg.from.id);
  const templates = await templatesController.getTemplates(msg.from.id);
  const response = getResponse(source, { templates });

  bot.sendMessage(id, response, options);
});

bot.on("callback_query", async (msg) => {
  const { id } = msg.message.chat;
  const callback_query_id = msg.id;

  await recieveData(msg.from.id);
  const response = getResponse("list", { expenses });

  // if there's template for that product => add its price to expenses
  if (await templatesController.checkTemplate(msg.from.id, list[msg.data])) {
    expenses += await templatesController.checkTemplate(
      msg.from.id,
      list[msg.data]
    );
  }

  // remove selected elements from the list
  list.splice(msg.data, 1);

  listController.updateData({ ld: list, calc: expenses, from: msg.from.id });
  bot.answerCallbackQuery(callback_query_id);

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
  if (!list.length) bot.sendMessage(id, response, options);
});

// If user sends a number (12.345  16  28.5  etc.) => Add message number to `expenses` variable
// If user sends a number (-12.345  -16  -28.5  etc.) => Subtract message number from `expenses` variable
bot.onText(/^[-\d.]+$/, async (msg) => {
  await recieveData(msg.from.id);

  expenses += parseFloat(msg.text);
  if (expenses < 0) expenses = 0;

  listController.updateData({ calc: expenses, from: msg.from.id });
});

// If user sends text for the list (not a number and not a command) => Add data to the DB and send response message
bot.on("message", async (msg) => {
  const { id } = msg.chat;
  const response = getResponse("product");

  if (
    msg.entities ||
    !isNaN(msg.text) ||
    new RegExp("^/templates").test(msg.text)
  )
    return;

  await recieveData(msg.from.id);

  list.push(msg.text);
  listController.updateData({ ld: list, from: msg.from.id });

  bot.sendMessage(id, response, options);
});
