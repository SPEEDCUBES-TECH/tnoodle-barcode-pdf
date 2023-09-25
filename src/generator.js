const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const pdfDoc = require("muhammara").Recipe;
const crypto = require("crypto");

/**
 * @param BrowserWindow {BrowserWindow}
 * @param file {string}
 * @param password {string|null}
 * @returns {Promise<void>}
 */
async function generate(BrowserWindow, file, password) {
  const data = parseData(file);
  return await Promise.all([
    generateHtml('phone', data).then(html => generatePdf(BrowserWindow, html, password)),
    generateHtml('print', data).then(html => generatePdf(BrowserWindow, html, password)),
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

async function generatePdf(BrowserWindow, html, pass) {
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

  if (pass) {
    // muhammara cant encrypt from Buffer
    const file = tmpFile('pdf');
    await fs.writeFile(file, pdf);
    pdf = new pdfDoc(file, file);
    await pdf.encrypt({
      userPassword: pass,
      ownerPassword: pass,
      userProtectionFlag: 4,
    }).endPDF();

    pdf = await fs.readFile(file);
    await fs.unlink(file);
  }

  return pdf;
}


function parseData(file) {
  return file
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
      return out;
    }, {});
}


function deepAssign(base, names, value) {
  let lastName = names.pop();

  for (let i = 0; i < names.length; i++) {
    base = base[names[i]] = base[names[i]] || {};
  }

  base[lastName] = value;
}

function tmpFile(ext) {
  return path.join(os.tmpdir(), `tmp_${crypto.randomBytes(16).toString("hex")}.${ext}`);
}

module.exports = {
  fromBuffer: generate,
  fromFile: generateFromFile,
};