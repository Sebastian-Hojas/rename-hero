#!/usr/bin/env node

var argv = require('yargs')
    .usage('Usage: $0 -f [files]')
    .alias('f', 'file')
    .describe('f', 'Load a file')
    .array('f')
    .default('dateformat', 'yyyymmdd')
    .describe('dateformat', 'Format the date should be parsed in')
    .default('future', false)
    .describe('future', 'Also consider dates in the future')
    .default('dry', false)
    .describe('dry', 'Do not rename any file')
    .demandOption('f')
    .epilog('Rename file based on best date guess.')
    .argv;


function formattedDate(date) {
    return require('dateformat')(date, argv.dateformat);
}

function renameFileByAppendingFormattedDate(filePath, date) {
    var fs = require('fs');
    var path = require('path-extra');

    const newFileName = path.fileNameWithPrefix(filePath, formattedDate(date) + "_");
    if (!argv.dry) {
        fs.renameSync(filePath, newFileName);
        console.log(filePath + " => " + newFileName);
    } else {
        console.log(filePath + " => " + newFileName + " (no change made)");
    }
}

function textFromPDF(filePath) {
    var pdfUtil = require('pdf-to-text');
    return new Promise(function(resolve, reject) {
        pdfUtil.pdfToText(filePath, function(err, data) {
          if (err) {
              reject(err);
          } else {
              resolve(data);
          }
        })
    })
}

function convertPDFToImages(filePath) {
    var path = require('path-extra');
    var PDFImage = require("pdf-image").PDFImage;
    var fs = require('fs');

    var tmpFilePath = "/tmp/" + path.base(filePath, true)
        .replace(/[^a-z0-9]/gi, '_').toLowerCase();
    fs.copyFileSync(filePath, tmpFilePath)
    var pdfImage = new PDFImage(tmpFilePath);
    return pdfImage.convertFile()
}

function ocrTextFromImage(imagePath) {
    // TODO Needed to change `tesseract.js`
    //`fs.unlink` to  fs.unlink(files[0],(err)=>{ if(err){ console.log(err); } });
    var tesseract = require('node-tesseract');
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

function possibleDatesFromText(text){
    var chrono = require('chrono-node');
    var moment = require('moment');

    return new Promise(function(resolve, reject) {
        const dateOptions = chrono.parse(text)
          .map(x => {
              const parsedText = x.text.replace(/(\s)+/, '');
              const date = chrono.parseDate(x.text);
              const dateString = formattedDate(date);
              return {
                  'name': parsedText + " (" + dateString + ")",
                  'value': date
              }
          })
          // Filter dates in the future
          .filter(date => (date.value < moment() || argv.future))
        if (dateOptions.length > 0) {
            // TODO filter duplicates
            resolve(dateOptions);
        } else {
            reject("No date found")
        }
    });
    return
}

function promptUserForBestDate(dateOptions) {
    var inquirer = require('inquirer');
    return inquirer
        .prompt([
          {
              name: "date",
              message: "Choose date",
              type: "list",
              choices: dateOptions
          }
        ])
}

function prefixPDFBasedOnContent(filePath) {
    return textFromPDF(filePath)
        .then(possibleDatesFromText)
        .catch(error => { })
        .then(data => {
            if (data) {
                return data
            } else {
                console.log("No dates from text found. Trying OCR.")
                return convertPDFToImages(filePath)
                    .then(images => Promise.all(images.map(ocrTextFromImage)))
                    .then(text => text.join("\n"))
                    .then(possibleDatesFromText)
            }
        })
        .then(promptUserForBestDate)
        .then(answers => {
            renameFileByAppendingFormattedDate(filePath, answers['date']);
        })
        .catch(error => {
            console.log("Renaming failed: " + error);
        })
}

// TODO Implement array support
prefixPDFBasedOnContent(argv.f[0])
