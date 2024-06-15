const { execSync } = require('child_process');
const fs = require('fs');

const orig = execSync('git show HEAD:src/app/dashboard/mentorship/page.tsx', { encoding: 'utf8' });

let out = orig;

// Remove the graduate dashboard view entirely from the new mentees page
const splitPoint = out.indexOf('// ================= GRADUATE / MENTEE PROGRESSION VIEW =================');
out = out.substring(0, splitPoint);

// Replace `if (isMentor) {`
out = out.replace(/\n  if \(isMentor\) \{\n/, '\n');

let lines = out.split('\n');
let insideComponent = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function Mentorship() {')) {
    lines[i] = 'export default function Mentees() {';
    insideComponent = true;
  }
  
  // Un-indent lines inside the mentor block
  if (insideComponent && lines[i].startsWith('    ')) {
    lines[i] = lines[i].substring(2);
  }
}

let joined = lines.join('\n');
joined = joined.replace(/  \}\n$/, '');
joined += '\n}\n';

fs.writeFileSync('src/app/dashboard/mentees/page.tsx', joined, 'utf8');
