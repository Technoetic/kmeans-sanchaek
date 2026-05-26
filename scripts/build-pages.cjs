// GitHub Pages 배포용 정적 빌드: public/index.html + src/ → dist/
// 자산 경로 ../src/ → ./src/ 로 치환.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, 'src'), { recursive: true });

// index.html
let html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
html = html.replaceAll('../src/', 'src/');
fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');

// src/* (HTML이 직접 참조하는 파일만 묶음)
for (const f of fs.readdirSync(path.join(ROOT, 'src'))) {
  fs.copyFileSync(path.join(ROOT, 'src', f), path.join(DIST, 'src', f));
}

// .nojekyll — Jekyll이 _로 시작하는 파일을 가리지 않도록
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

const sizes = fs.readdirSync(path.join(DIST, 'src')).map((f) => {
  const s = fs.statSync(path.join(DIST, 'src', f)).size;
  return `  src/${f}: ${s}B`;
}).join('\n');
const htmlSize = fs.statSync(path.join(DIST, 'index.html')).size;
console.log(`dist/index.html: ${htmlSize}B\n${sizes}`);
