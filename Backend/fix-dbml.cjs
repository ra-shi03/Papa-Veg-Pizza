const fs = require('fs');
let dbml = fs.readFileSync('schema.dbml', 'utf8');
dbml = dbml.replace(/Table\s+([A-Za-z0-9_]+)\s*\{/g, 'Table  {\n  id ObjectId [pk]');
fs.writeFileSync('schema.dbml', dbml);
