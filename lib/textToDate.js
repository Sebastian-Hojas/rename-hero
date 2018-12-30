
var chrono = require('chrono-node');
var moment = require('moment');

function possibleDatesFromText(text){
  return chrono.parse(text)
    .map(x => {
        const parsedText = x.text.replace(/[\f\n\r\t\v\u]*/gi, '');
        const date = chrono.parseDate(x.text);
        return {
          date: date,
          text: parsedText
        }
    })
    // Filter dates in the future
    .filter(date => (date.date < moment() || argv.future))
}

module.exports = {
  possibleDatesFromText
}
