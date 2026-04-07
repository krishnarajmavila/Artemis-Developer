const fs = require('fs');
const zlib = require('zlib');
const path = 'C:/Users/krish/.claude/projects/D--artemis2/9981b2b9-a15a-4578-acd9-6bb2539ed9b8/tool-results/webfetch-1775559142976-y7qua0.pdf';
const buf = fs.readFileSync(path);
const str = buf.toString('binary');

// Find all stream...endstream blocks
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let match;
let streamCount = 0;
let pageContentStreams = [];

while ((match = streamRegex.exec(str)) !== null) {
  streamCount++;
  const streamData = Buffer.from(match[1], 'binary');
  try {
    const decompressed = zlib.inflateSync(streamData);
    const text = decompressed.toString('utf8');
    // Page content streams have BT/ET operators
    if (text.includes('BT') && text.includes('ET') && text.includes('Tf')) {
      pageContentStreams.push({ index: streamCount, content: text });
    }
  } catch(e) {}
}

console.log('Page content streams found:', pageContentStreams.length);

// Extract text from PDF content stream
function extractTextFromStream(content) {
  const lines = [];
  let i = 0;
  while (i < content.length) {
    // Look for ( to start a string
    if (content[i] === '(') {
      let j = i + 1;
      let s = '';
      while (j < content.length && content[j] !== ')') {
        if (content[j] === '\\' && j + 1 < content.length) {
          j++; // skip escape
          s += content[j];
        } else {
          s += content[j];
        }
        j++;
      }
      // Check what operator follows (skip whitespace)
      let k = j + 1;
      while (k < content.length && (content[k] === ' ' || content[k] === '\n' || content[k] === '\r')) k++;
      const op = content.substring(k, k + 2);
      if (op === 'Tj' || op === "' " || content[k] === "'") {
        if (s.trim()) lines.push(s.trim());
      }
      i = j + 1;
    } else if (content[i] === '[') {
      // TJ array
      let j = i + 1;
      let combined = '';
      while (j < content.length && content[j] !== ']') {
        if (content[j] === '(') {
          j++;
          while (j < content.length && content[j] !== ')') {
            if (content[j] === '\\' && j + 1 < content.length) {
              j++;
              combined += content[j];
            } else {
              combined += content[j];
            }
            j++;
          }
        }
        j++;
      }
      // Check for TJ operator
      let k = j + 1;
      while (k < content.length && (content[k] === ' ' || content[k] === '\n' || content[k] === '\r')) k++;
      const op = content.substring(k, k + 2);
      if (op === 'TJ') {
        if (combined.trim()) lines.push(combined.trim());
      }
      i = j + 1;
    } else {
      i++;
    }
  }
  return lines;
}

for (const ps of pageContentStreams) {
  const texts = extractTextFromStream(ps.content);
  if (texts.length > 0) {
    console.log('\n=== STREAM ' + ps.index + ' ===');
    texts.forEach(t => console.log(t));
  }
}
