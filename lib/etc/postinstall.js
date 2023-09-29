// the main problem is that the libraries that can encrypt
// are mostly written in c++, which creates some problems
// see: https://github.com/SPEEDCUBES-TECH/tnoodle-barcode-pdf/blob/60a3b01709c9b5811ecccc97b904bfa83c43a9eb/src/generator.js#L58
// also in version 1.0.0, the win-x64 build was not working

// on the other hand, pdf-lib has not been updated for 2 years and encryption is only in the fork


const {exec} = require("child_process");
const fs = require("fs");

fs.promises
  .writeFile("node_modules/pdf-lib/tsconfig.json", getPdfLibTsConfig())
  .then(() => exec([
    "cd node_modules",
    "cd pdf-lib",
    "npm i ",
    "npm run build:cjs",
  ].join("; ")));

function getPdfLibTsConfig() {
  return JSON.stringify({
    "compilerOptions": {
      /* Basic Options */
      "target": "es5",
      "module": "commonjs",
      "allowJs": false,
      "checkJs": false,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "outDir": "./build",
      "rootDir": "./src",
      "composite": false,
      "incremental": true,
      "tsBuildInfoFile": "./tsBuildInfo.json",
      "removeComments": false,
      "importHelpers": true,
      "downlevelIteration": false,
      "isolatedModules": false,
      "newLine": "LF",

      /* Strict Type-Checking Options */
      "strict": true,

      /* Additional Checks */
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,

      /* Module Resolution Options */
      "baseUrl": "./src",
      "paths": {
        "src/*": ["./*"]
      },
      "allowSyntheticDefaultImports": true,
      "esModuleInterop": true,
      "preserveSymlinks": true,
      "moduleResolution": "node",

      /* Plugins */
      "plugins": [{"transform": "@zerollup/ts-transform-paths"}]
    },
    "include": ["src/**/*"]
  });
}