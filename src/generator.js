const fs = require('fs/promises');
const path = require('path');
const PDFDoc = require("pdf-lib").PDFDocument;
const QRCode = require("qrcode");

/**
 * @param BrowserWindow {BrowserWindow}
 * @param file {string}
 * @param opts {object}
 * @returns {Promise<Awaited<Buffer>[]>}
 */
async function generate(BrowserWindow, file, opts = {}) {
  const data = await prepareData(file, opts);
  return await Promise.all([
    generateHtml('phone', data, opts).then(html => generatePdf(BrowserWindow, html, opts)),
    generateHtml('print', data, opts).then(html => generatePdf(BrowserWindow, html, opts)),
  ]);
}

async function generateFromFile(BrowserWindow, file, password) {
  file = path.resolve(file);
  const pdfs = await generate(BrowserWindow, (await fs.readFile(file)).toString(), password);

  await Promise.all([
    fs.writeFile(file.replace(/.txt$|$/, '.mobile.pdf'), pdfs[0]),
    fs.writeFile(file.replace(/.txt$|$/, '.print.pdf'), pdfs[1]),
  ]);

}

async function generateHtml(type, data) {
  this.tplRaw = this.tplRaw || (await fs.readFile(path.join(__dirname, '../lib/tpl/main.html'))).toString();

  return this.tplRaw
    .replace(/\$page-type-class/, type)
    .replace(/\$data/, JSON.stringify(data));
}

async function generatePdf(BrowserWindow, html, opts) {
  let window = new BrowserWindow({show: false});

  await window.loadFile(path.join(__dirname, '../lib/tpl/blank.html'));

  await window.webContents.executeJavaScript(`document.write(${JSON.stringify(html)})`);

  // there are no rendering completion events after document.write()
  await new Promise(res => setTimeout(res, 500));

  let pdf = await window.webContents.printToPDF({
    marginsType: 0,
    pageSize: "A4"
  });

  window.close();

  if (opts.password) {
    pdf = await PDFDoc.load(pdf);
    await pdf.encrypt({
      userPassword: opts.password,
      ownerPassword: opts.password,
      permissions: {modifying: true},
    });

    pdf = await pdf.save({useObjectStreams: false});
  }

  return pdf;
}


async function prepareData(file, opts) {
  let result = {
    full: null,
    qrcodes: {}
  };

  const pending = [];

  opts.qrcodes = true;

  result.full = file
    .split('\n').filter(row => row.match(/.+ Round \d+.*: /))
    .reduce((out, row) => {
      // 3x3x3 Round 1: ggd68qck -> 3x3x3 Round 1 Scramble Set A: ggd68qck
      if (!row.match(/Scramble Set/))
        row = row.replace(/(Round \S+?)([ :])/, '$1 Scramble Set A$2');

      // 3x3x3 Round 1 Scramble Set A: ggd68qck -> 3x3x3 Round 1 Scramble Set A Attempt 1: ggd68qck
      if (!row.match(/Attempt/))
        row = row.replace(/: /, ' Attempt 1: ');

      row = row.match(/(.+) Round (.+) Scramble Set (.+) Attempt (.+): (\S+)/);

      deepAssign(out, row.splice(1, 4), row[1]);

      if (opts.codeType === "qrcode")
        QRCode.toString(row[1], {type: "svg", errorCorrectionLevel: "M", margin: 0})
          .then(qr => result.qrcodes[row[1]] = qr)

      return out;
    }, {});

  await Promise.all(pending);

  return result;
}


function deepAssign(base, names, value) {
  let lastName = names.pop();

  for (let i = 0; i < names.length; i++) {
    base = base[names[i]] = base[names[i]] || {};
  }

  base[lastName] = value;
}

module.exports = {
  fromBuffer: generate,
  fromFile: generateFromFile,
};