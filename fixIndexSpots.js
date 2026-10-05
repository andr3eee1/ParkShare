const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

if (!content.includes("import spotsRouter from './spots';")) {
  content = content.replace(
    "import walletRouter from './wallet';",
    "import walletRouter from './wallet';\nimport spotsRouter from './spots';"
  );
  
  content = content.replace(
    "app.use('/wallet', walletRouter);",
    "app.use('/wallet', walletRouter);\napp.use('/spots', spotsRouter);"
  );
  
  fs.writeFileSync('backend/src/index.ts', content);
}
