const fs = require('fs');
const path = require('path');
const jsFile = path.join(__dirname, '../node_modules/satellite.js/dist/index.js');
const dtsFile = path.join(__dirname, '../node_modules/satellite.js/dist/index.d.ts');

[jsFile, dtsFile].forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace("export * as constants from './constants.js';", "import * as constants from './constants.js';\nexport { constants };");
    fs.writeFileSync(file, code);
  }
});
console.log('Patched satellite.js successfully');
