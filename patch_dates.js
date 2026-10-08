const fs = require('fs');
const file = './Frontend/src/modules/Food/pages/user/WelcomeScreen.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\?\.filter\(p => !p\.startDate \|\| new Date\(p\.startDate\) <= now\)\n\s+\?\.filter\(p => !p\.endDate \|\| new Date\(p\.endDate\) >= now\)/, 
`?.filter(p => {
            if (!p.startDate) return true;
            const d = new Date(p.startDate);
            return isNaN(d) || d <= now; // If invalid date, assume valid to prevent hiding
          })
          ?.filter(p => {
            if (!p.endDate) return true;
            const d = new Date(p.endDate);
            return isNaN(d) || d >= now;
          })`);

fs.writeFileSync(file, content);
