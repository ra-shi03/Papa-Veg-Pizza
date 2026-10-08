const fs = require('fs');
const file = './Frontend/src/modules/Food/pages/user/WelcomeScreen.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const currentIndexRef = useRef\(0\);/, `const currentIndexRef = useRef(0);\n  const hasRunRef = useRef(false);`);

content = content.replace(/let lastIndex = parseInt\(localStorage\.getItem\("lastShownPosterIndex"\), 10\);\n\s+let nextIndex = 0;\n\s+if \(validPosters\.length > 0\) \{\n\s+if \(isNaN\(lastIndex\)\) \{\n\s+\/\/ Very first visit \(or storage cleared\) -> show 1st active poster\n\s+nextIndex = 0;\n\s+\} else \{\n\s+\/\/ Sequential cycle on subsequent visits\n\s+nextIndex = \(lastIndex \+ 1\) % validPosters\.length;\n\s+\}\n\s+\}\n\s+localStorage\.setItem\("lastShownPosterIndex", nextIndex\.toString\(\)\);/, 
`let lastIndex = parseInt(localStorage.getItem("lastShownPosterIndex"), 10);
        let nextIndex = 0;
        
        if (validPosters.length > 0) {
          if (isNaN(lastIndex)) {
            nextIndex = 0;
          } else {
            // Prevent double-increment in React Strict Mode
            if (!hasRunRef.current) {
              nextIndex = (lastIndex + 1) % validPosters.length;
              hasRunRef.current = true;
            } else {
              nextIndex = lastIndex; // Keep the same on second strict-mode run
            }
          }
        }
        
        localStorage.setItem("lastShownPosterIndex", nextIndex.toString());`);

fs.writeFileSync(file, content);
