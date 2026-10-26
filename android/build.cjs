const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {transformSync} = require('esbuild');

const source = fs.readFileSync(path.join(__dirname, '../wblock/fireflies.user.js'), 'utf8');
const {code} = transformSync(source, {
  loader: 'js', target: 'chrome100', minify: true, charset: 'ascii', legalComments: 'none',
  define: {FIREFLIES_BOOKMARKLET: 'true'}
});
const bookmarklet = 'javascript:' + encodeURIComponent('void ' + code.trim());
assert(bookmarklet.length < 60000, 'Bookmarklet exceeds the mobile installation size budget');
const template = fs.readFileSync(path.join(__dirname, 'install.template.html'), 'utf8');
const outputs = {
  'bookmarklet.txt': bookmarklet + '\n',
  'install.html': template.replace('{{BOOKMARKLET}}', bookmarklet)
};
for (const [name, content] of Object.entries(outputs)) {
  const file = path.join(__dirname, name);
  if (process.argv.includes('--check')) {
    assert.equal(fs.readFileSync(file, 'utf8'), content, name + ' is stale; run npm run build:android');
  } else fs.writeFileSync(file, content);
}
console.log(`Android bookmarklet ${process.argv.includes('--check') ? 'verified' : 'built'} (${bookmarklet.length} characters).`);
