import test from 'ava';

import { possibleDatesFromText } from '../lib/textToDate.js'

test('find no dates from text', t => {
    const test = "Lorem Ispum 3190";
    t.deepEqual(possibleDatesFromText(test), []);
});

test('find simple date from text', t => {
    const test = `
    Date
    Single ticket Serial number Valid
    Customer group
    Card payment Archive reference
    Price
    Price without VAT Vat 10%
    22.10.2018 07:33 Regional`;
    t.deepEqual(possibleDatesFromText(test).map(x => { return x.text }),
                ['22.10.2018 07:33 ']);
});

test('find two simple dates from text', t => {
    const test = `
    22.10.2018 07:33 Regional 25.10.2018 07:33 Regional`;
    t.deepEqual(possibleDatesFromText(test).map(x => { return x.text }),
                ['22.10.2018 07:33 ', '25.10.2018 07:33 ']);
});

import { textFromPDF } from '../lib/textFromImage.js'

test('get simple text from PDF', async t => {
    t.regex(await textFromPDF("./test/bin/Tests_SimpleText.pdf"),
            /\s*What\s*The\s*Heck\s*2018-02-11\s*/gi);
});
