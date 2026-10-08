const fs = require('fs');
const file = './Frontend/src/modules/Food/components/user/UserLayout.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the welcome navigation logic
content = content.replace(/const welcomeShown = sessionStorage.getItem\("papa_veg_welcome_shown"\)\n\s+if \(\!welcomeShown\) \{\n\s+navigate\("\/food\/user\/welcome", \{ replace: true \}\)\n\s+\}/, 
`const welcomeShown = sessionStorage.getItem("papa_veg_welcome_shown")
    if (!welcomeShown && location.pathname !== "/food/user/welcome" && location.pathname !== "/user/welcome") {
      navigate("/food/user/welcome", { replace: true })
    }`);

fs.writeFileSync(file, content);
