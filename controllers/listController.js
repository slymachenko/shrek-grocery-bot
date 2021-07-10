const documentController = require("./documentController");

// Generate a Reply Markup buttons with items from a list
exports.createReplyMarkup = (list) => {
  const arr = [];

  list.forEach((el, index) => {
    arr.push([{ text: el, callback_data: index }]);
  });

  return arr;
};

// Find user DB document and add data to it
exports.updateData = async ({ calc, ld, from }) => {
  try {
    const data = await documentController.findDBDocument(from);

    if (calc >= 0) data.expenses = calc;
    data.list = ld || data.list;

    data.save();
  } catch (err) {
    console.error(err);
  }
};

// Find user DB document and reset its expenses
exports.clearData = async (from) => {
  try {
    const data = await documentController.findDBDocument(from);

    data.expenses = 0;

    data.save();
  } catch (err) {
    console.error(err);
  }
};

// Find user DB document and return its data
exports.getData = async (from) => {
  try {
    const data = await documentController.findDBDocument(from);

    return { list: data.list, expenses: data.expenses };
  } catch (err) {
    console.error(err);
  }
};
