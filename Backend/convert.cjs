const fs = require("fs");
const mermaid = fs.readFileSync("schema.mermaid", "utf8");
const lines = mermaid.split("\n");
const dbml = [];
let currentTable = null;

for (let line of lines) {
    line = line.trim();
    if (!line || line === "erDiagram" || line.startsWith("%%")) continue;
    
    if (line.endsWith("{")) {
        const tableName = line.split("{")[0].trim();
        currentTable = tableName;
        dbml.push("Table " + tableName + " {");
        dbml.push("  id ObjectId [pk]");
        continue;
    }
    
    if (line === "}") {
        dbml.push("}");
        dbml.push("");
        currentTable = null;
        continue;
    }
    
    if (currentTable && !line.includes("||")) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
            let dtype = parts[0];
            const name = parts[1];
            if (dtype === "mongoose") dtype = "ObjectId";
            dbml.push("  " + name + " " + dtype);
        }
        continue;
    }
    
    if (line.includes("||")) {
        const parts = line.split(":");
        const relPart = parts[0].trim();
        if (relPart.includes("||--o|")) {
            const [a, b] = relPart.split("||--o|").map(x => x.trim());
            dbml.push("Ref: " + a + ".id - " + b + ".id");
        } else if (relPart.includes("||--o{")) {
            const [a, b] = relPart.split("||--o{").map(x => x.trim());
            dbml.push("Ref: " + a + ".id < " + b + ".id");
        } else if (relPart.includes("}o--o{")) {
            const [a, b] = relPart.split("}o--o{").map(x => x.trim());
            dbml.push("Ref: " + a + ".id <> " + b + ".id");
        } else if (relPart.includes("||--||")) {
            const [a, b] = relPart.split("||--||").map(x => x.trim());
            dbml.push("Ref: " + a + ".id - " + b + ".id");
        }
    }
}
fs.writeFileSync("schema.dbml", dbml.join("\n"));
