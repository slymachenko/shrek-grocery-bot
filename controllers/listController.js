const listModel = require("./../models/listModel");

// Generating a Reply Markup with items from a list
exports.createReplyMarkup = (list) => {
  const arr = [];
  list.forEach((el, index) => {
    arr.push([{ text: el, callback_data: index }]);
  });
  return arr;
};

exports.addData = async ({ calc, ld, from }) => {
  try {
    const data = await listModel.findOne({
      fromID: from,
    });

    data.calculations = calc || data.calculations;
    data.list = ld || data.list;

    data.save();
  } catch (err) {
    console.error(err);
  }
};

exports.clearData = async (from) => {
  try {
    const data = await listModel.findOne({
      fromID: from,
    });

    data.calculations = 0;
    data.list = [];

    data.save();
  } catch (err) {
    console.error(err);
  }
};

exports.getData = async (from) => {
  try {
    const data = await listModel.findOne({
      fromID: from,
    });

    const list = data.list;
    const calculations = data.calculations;

    return { list, calculations };
  } catch (err) {
    console.error(err);
  }
};
