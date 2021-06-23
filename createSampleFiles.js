const fs = require("fs");

console.log("Deleting src/...");
try {
  fs.rmdirSync("./src");
} catch {}

console.log("Creating src/...");
try {
  fs.mkdirSync("./src");
} catch {}

console.log("Adding files to src/...");
let index = "";
for (let i = 1; i < 9001; i += 1) {
  index += `export * from "./example${i}";\n`;
  fs.writeFileSync(
    `./src/example${i}.ts`,
    `
  class MyClass${i} {
      getValue() {
          return ${i}
      }
  }
  
  export function exampleFunction${i}() {
      return new MyClass${i}();
  }
  `.trimLeft()
  );
}

fs.writeFileSync(
  `./src/index.ts`,
  index
)

console.log("Done!");
