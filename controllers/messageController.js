module.exports = getResponse = (source, options) => {
  options = options || {};
  let response;

  switch (source) {
    case "/start":
      response =
        "<strong>Oh, hello there!</strong>\n<i>My name is Shrek (you may know me from my autobiographical films) and I'll help you deal with your grocery trip!</i>\n\n<i>/help for more information</i>";
      break;
    case "/help":
      response =
        'Each text message will be added to the list (except commands and numbers)\nTo view the list => /view\nTo remove items from the list, click on them\nTo calculate your expenses before deleting the item, write the price like this "256.04"\nTo subtract your expenses type \'-\' before number (for example: "-11.6")\nTo check your current expenses => /expenses\nTo clear the calculation => /clear\nTo check your templates => /templates\nTo add your template => /settemplate *product name* *price*\nTo delete your template => /removetemplate *product name*';
      break;
    case "/view":
      response = {
        list: "<strong>List</strong>",
        listEmpty: "<strong>Your list is empty</strong>",
      };
      break;
    case "/clear":
      response = "<strong>Calculations cleared</strong>";
      break;
    case "/expenses":
      response = `<strong>Current expenses: ${options.expenses.toFixed(
        2
      )}$</strong>`;
      break;
    case "/templates":
      response = `Templates:`;

      if (Object.keys(options.templates).length === 0) {
        return `You have no templates`;
      }

      Object.keys(options.templates).forEach((key) => {
        response += `
  ${key}: ${options.templates[key]}`;
      });
      break;
    case "/settemplate":
      response = {
        success: "template has been added",
        textErr:
          "Please provide template name and price\nExmaple:\n/settemplate Chips 35.8",
      };
      break;
    case "/removetemplate":
      response = {
        success: `<strong>${options.product}</strong> has been deleted from templates list`,
        textErr:
          "Please provide template name\nExample:\n/removetemplate Chips",
        err: `there's no <strong>${options.product}</strong> in the templates list`,
      };
      break;
    case "list":
      response = `<strong>Your list is over</strong>\n<i>Total expenses: ${options.expenses.toFixed(
        2
      )}$</i>`;
      break;
    case "product":
      response = `☑`;
  }

  return response;
};
