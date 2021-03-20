const listModel = require("./../models/listModel");

// Generating a Reply Markup with items from a list
exports.createReplyMarkup = (list) => {
  const arr = [];
  list.forEach((el, index) => {
    arr.push([{ text: el, callback_data: index }]);
  });
  return arr;
};

exports.addData = async ({ calc, ld }) => {
  const data = await listModel.findOne({
    _id: "605662427659470424ab0c4f",
  });

  data.calculations = calc || data.calculations;
  data.list = ld || data.list;

  data.save();
};

exports.clearData = async () => {
  const data = await listModel.findOne({
    _id: "605662427659470424ab0c4f",
  });

  data.calculations = 0;
  data.list = [];

  data.save();
};

exports.getData = async () => {
  const data = await listModel.findOne({
    _id: "605662427659470424ab0c4f",
  });
  const list = data.list;
  const calculations = data.calculations;

  return { list, calculations };
};
