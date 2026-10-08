const fs = require('fs');
const file = './Frontend/src/modules/Food/pages/user/WelcomeScreen.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/if \(validPosters\.length === 0\) \{/,
`if (validPosters.length === 0) {
          console.log("No valid posters found! Raw posters:", data?.posters);`);

fs.writeFileSync(file, content);
