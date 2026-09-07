import { writeFileSync } from 'fs';
const b64 = process.argv[2];
writeFileSync('exported-test.pdf', Buffer.from(b64, 'base64'));
console.log('written', Buffer.from(b64,'base64').length, 'bytes');
