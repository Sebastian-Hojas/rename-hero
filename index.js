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

function convertFileToImages(filePath) {
    if (!filePath.toLowerCase().endsWith("pdf")) {
        return Promise.resolve([filePath]);
    }

    var path = require('path-extra');
    var PDFImage = require("pdf-image").PDFImage;
    var fs = require('fs');

    var tmpFilePath = "/tmp/" + path.base(filePath, true)
        .replace(/[^a-z0-9]/gi, '_').toLowerCase();
    fs.copyFileSync(filePath, tmpFilePath)
    var pdfImage = new PDFImage(tmpFilePath);
    return pdfImage.convertFile()
}

function possibleDatesFromText(text){
    const textToDate = require('./lib/textToDate.js');
    return new Promise(function(resolve, reject) {
        const dateOptions = textToDate.possibleDatesFromText(text)
          .map(x => {
              const dateString = formattedDate(x.date);
              return {
                  'name': x.text + " (" + dateString + ")",
                  'value': x.date
              }
          })
        if (dateOptions.length > 0) {
            // TODO filter duplicates
            resolve(dateOptions);
        } else {
            reject("No date found")
        }
    });
    return
}

function promptUserForBestDate(dateOptions, title) {
    var inquirer = require('inquirer');
    const skipText = "==> Skip"
    dateOptions.push(skipText)
    return inquirer
        .prompt([
          {
              name: "date",
              message: "Choose date for " + title,
              type: "list",
              choices: dateOptions
          }
        ])
        .then(answers => {
            const answer = answers["date"]
            if ( answer && answer != skipText) {
                return answer
            } else {
                throw("No date selected");
            }
        })
}

function prefixFileBasedOnContent(filePath) {
    var path = require('path-extra');
    const textFromImage = require('./lib/textFromImage.js')
    return textFromImage.textFromPDF(filePath)
        .then(possibleDatesFromText)
        .catch(error => { })
        .then(data => {
            if (data) {
                return data
            } else {
                console.log("Trying OCR.")
                return convertFileToImages(filePath)
                    .then(images => Promise.all(images.map(textFromImage.ocrTextFromImage)))
                    .then(text => text.join("\n"))
                    .then(possibleDatesFromText)
            }
        })
        .then(dates => promptUserForBestDate(dates, path.base(filePath)))
        .then(selectedDate => {
            renameFileByAppendingFormattedDate(filePath, selectedDate);
        })
        .catch(error => {
            console.log("Renaming failed: " + error);
        })
}

async function prefixAllFilesBasedOnContent(filePaths) {
    for (const file in filePaths) {
        await prefixFileBasedOnContent(filePaths[file])
    }
}

prefixAllFilesBasedOnContent(argv.f)
