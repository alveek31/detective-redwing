// Builds dist/index.html from src/app.html + src/engine.js.
const fs = require('fs');
const app = fs.readFileSync(__dirname + '/src/app.html', 'utf8');
const engine = fs.readFileSync(__dirname + '/src/engine.js', 'utf8');
const counter = (require('./package.json').config || {}).goatcounter;
const analytics = counter ? '<script data-goatcounter="https://' + counter + '.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>\n' : '';
const html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important} body{margin:0}</style>\n</head>\n<body>\n' + app.replace('/*ENGINE*/', () => engine) + '\n' + analytics + '</body>\n</html>\n';
fs.mkdirSync(__dirname + '/dist', { recursive: true });
fs.writeFileSync(__dirname + '/dist/index.html', html);
console.log('Built dist/index.html');
