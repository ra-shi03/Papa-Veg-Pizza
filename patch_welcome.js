const fs = require('fs');
const file = './Frontend/src/modules/Food/pages/user/WelcomeScreen.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/console\.error\("Failed to load welcome screen config", err\);/,
`console.error("Failed to load welcome screen config", err);
        alert("API Error: " + err.message);`);

fs.writeFileSync(file, content);
