
var pdfUtil = require('pdf-to-text');
var tesseract = require('node-tesseract');

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

function ocrTextFromImage(imagePath) {
    // TODO Needed to change `tesseract.js`
    //`fs.unlink` to  fs.unlink(files[0],(err)=>{ if(err){ console.log(err); } });
    return new Promise(function(resolve, reject) {
        tesseract.process(imagePath, {}, function(err, text) {
            if(err) {
                reject(err)
            } else if (text) {
                resolve(text);
            } else {
                reject("No text found through OCR")
            }
        });
    });
}

module.exports = {
  textFromPDF,
  ocrTextFromImage
}
