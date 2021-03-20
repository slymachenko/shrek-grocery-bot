const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  calculations: Number,
  list: [String],
});

module.exports = mongoose.model("ListData", listSchema, "ListData");
