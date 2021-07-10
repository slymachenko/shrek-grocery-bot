const listModel = require("../models/listModel");

exports.createDBDocument = async (userID) => {
  return listModel.create({
    expenses: 0,
    list: [],
    fromID: userID,
  });
};

exports.findDBDocument = async (userID) => {
  let data = await listModel.findOne({
    fromID: userID,
  });

  if (!data) {
    data = await createDBDocument(userID);
  }

  return data;
};
