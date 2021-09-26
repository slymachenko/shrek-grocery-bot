const documentController = require("./documentController");

exports.getTemplates = async (from) => {
  try {
    const data = await documentController.findDBDocument(from);

    return data.templates;
  } catch (err) {
    console.error(err);
  }
};

exports.updateTemplates = async (from, product, price) => {
  try {
    const data = await documentController.findDBDocument(from);

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

exports.checkTemplate = async (from, product) => {
  try {
    const data = await documentController.findDBDocument(from);
    let price;

    Object.keys(data.templates).forEach((key) => {
      if (key === product) price = data.templates[key];
    });

    return price ? price : false;
  } catch (err) {
    console.error(err);
  }
};
