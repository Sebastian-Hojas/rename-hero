
var pdfUtil = require('pdf-to-text');

function textFromPDF(filePath) {
    return new Promise(function(resolve, reject) {
        pdfUtil.pdfToText(filePath, function(err, data) {
          if (err) {
              reject(err);
          } else {
              resolve(data);
          }
        });
    });
}

module.exports = {
  textFromPDF
}
