const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  calculations: Number,
  list: [String],
  fromID: Number,
});

module.exports = mongoose.model("ListData", listSchema, "ListData");
