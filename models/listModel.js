const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  expenses: Number,
  list: [String],
  templates: Object,
  fromID: Number,
});

module.exports = mongoose.model("ListData", listSchema, "ListData");
