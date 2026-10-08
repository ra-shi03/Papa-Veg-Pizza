const fs = require('fs');
const file = './Frontend/src/modules/Food/pages/user/WelcomeScreen.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/let lastIndex = parseInt\(localStorage\.getItem\("lastShownPosterIndex"\), 10\);/,
`        // Debugging logs
        console.log("Raw posters from API:", data?.posters);
        console.log("Valid posters after filter:", validPosters);
        let lastIndex = parseInt(localStorage.getItem("lastShownPosterIndex"), 10);
        console.log("Read lastIndex from localStorage:", lastIndex);`);

content = content.replace(/localStorage\.setItem\("lastShownPosterIndex", nextIndex\.toString\(\)\);/,
`        console.log("Setting nextIndex to localStorage:", nextIndex);
        localStorage.setItem("lastShownPosterIndex", nextIndex.toString());`);

fs.writeFileSync(file, content);
