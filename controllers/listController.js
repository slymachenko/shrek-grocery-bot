const listModel = require("./../models/listModel");

// Generate a Reply Markup buttons with items from a list
exports.createReplyMarkup = (list) => {
  const arr = [];

  list.forEach((el, index) => {
    arr.push([{ text: el, callback_data: index }]);
  });

  return arr;
};

// Find user DB document and add data to it
exports.addData = async ({ calc, ld, from }) => {
  try {
    const data = await findDBDocument(from);

    data.expenses = calc || data.expenses;
    data.list = ld || data.list;

    data.save();
  } catch (err) {
    console.error(err);
  }
};

// Find user DB document and reset its expenses
exports.clearData = async (from) => {
  try {
    const data = await findDBDocument(from);

    data.expenses = 0;

    data.save();
  } catch (err) {
    console.error(err);
  }
};

// Find user DB document and return its data
exports.getData = async (from) => {
  try {
    const data = await findDBDocument(from);

    return { list: data.list, expenses: data.expenses };
  } catch (err) {
    console.error(err);
  }
};

const createDBDocument = async (userID) => {
  return listModel.create({
    expenses: 0,
    list: [],
    fromID: userID,
  });
};

const findDBDocument = async (userID) => {
  let data = await listModel.findOne({
    fromID: userID,
  });

  if (!data) {
    data = await createDBDocument(userID);
  }

  return data;
};
