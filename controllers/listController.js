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
exports.updateData = async ({ calc, ld, from }) => {
  try {
    const data = await findDBDocument(from);

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

exports.updateTemplates = async (from, product, price) => {
  try {
    const data = await findDBDocument(from);

    if (!price) {
      delete data.templates[product];

      data.markModified("templates");
      return data.save();
    }

    data.templates[product] = parseFloat(price);

    data.markModified("templates");
    data.save();
  } catch (err) {
    console.error(err);
  }
};

const getTemplates = async (from) => {
  try {
    const data = await findDBDocument(from);

    return data.templates;
  } catch (err) {
    console.error(err);
  }
};

exports.checkTemplate = async (from, product) => {
  try {
    const data = await findDBDocument(from);
    let price;

    Object.keys(data.templates).forEach((key) => {
      if (key === product) price = data.templates[key];
    });

    return price ? price : false;
  } catch (err) {
    console.error(err);
  }
};

exports.createTemplateList = async (from) => {
  try {
    const templates = await getTemplates(from);

    let list = `Templates:`;

    if (Object.keys(templates).length === 0) {
      return `You have no templates`;
    }

    Object.keys(templates).forEach((key) => {
      list += `
  ${key}: ${templates[key]}`;
    });

    return list;
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
