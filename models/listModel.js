const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  expenses: Number,
  list: [String],
  fromID: Number,
});

module.exports = mongoose.model("ListData", listSchema, "ListData");
