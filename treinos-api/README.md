# Treinos API

- API para consumir treinos

## Stacks:

- Node@24.x
- Typescript@5.9.3
- Eslint@10.0.1
- Prettier@3.8.1
- Eslint Config Prettier@10.1.8:

```
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node } },
  tseslint.configs.recommended,
  eslintConfigPrettier
]);

```

- Eslint Plugin Simple Sort@12.1.1

### Eslint Rules

- .vs-code/settings.json

```
{
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "always"
    }
}
```

- FastiFy@5.7.4

- Documentation API: localhost/docs
