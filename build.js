// Builds the Brainbrew site: dist/index.html (game shelf) and dist/redwing/index.html (Detective Redwing).
const fs = require('fs');
const src = (f) => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const counter = (require('./package.json').config || {}).goatcounter;
const analytics = counter ? '<script data-goatcounter="https://' + counter + '.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>\n' : '';
const page = (body) => '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important} body{margin:0}</style>\n</head>\n<body>\n' + body + '\n' + analytics + '</body>\n</html>\n';
const write = (path, html) => { fs.mkdirSync(require('path').dirname(path), { recursive: true }); fs.writeFileSync(path, html); console.log('Built ' + path.replace(__dirname + '/', '')); };

write(__dirname + '/dist/index.html', page(src('hub.html')));
write(__dirname + '/dist/redwing/index.html', page(src('app.html')
  .replace('/*ENGINE*/', () => src('engine.js'))
  .replace('<!--HOME-->', '<a class="home" href="../">← Brainbrew</a>')));
