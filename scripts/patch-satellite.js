const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../node_modules/satellite.js/lib/index.js');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace("export * as constants from './constants.js';", "import * as constants from './constants.js';\nexport { constants };");
  fs.writeFileSync(file, code);
  console.log('Patched satellite.js successfully');
}
