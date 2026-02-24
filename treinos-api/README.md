# 🚀 Treinos API

API REST para gerenciamento e consumo de treinos, construída com foco em **tipagem forte**, **validação robusta** e **documentação automática**.

---

## 📦 Stack Principal

### 🔹 Runtime

- [Node.js 24.x](https://nodejs.org/en/docs)
- [pnpm 10.30.1](https://pnpm.io/installation)

### 🔹 Linguagem

- [TypeScript 5.9.3](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)

### 🔹 Framework HTTP

- [Fastify 5.7.4](https://fastify.dev/docs/latest/)
- [@fastify/swagger 9.7.0](https://github.com/fastify/fastify-swagger)
- [@fastify/swagger-ui 5.2.5](https://github.com/fastify/fastify-swagger-ui)

### 🔹 Validação e Tipagem

- [Zod 4.3.6](https://zod.dev/)
- [fastify-type-provider-zod 6.1.0](https://github.com/turkerdev/fastify-type-provider-zod)

### 🔹 Variáveis de Ambiente

- [dotenv 17.3.1](https://github.com/motdotla/dotenv)

---

## 🛠️ Dev Stack

### 🔹 Lint

- [ESLint 9.39.2](https://eslint.org/docs/latest/)
- [@eslint/js 10.0.1](https://www.npmjs.com/package/@eslint/js)
- [typescript-eslint 8.56.1](https://typescript-eslint.io/)
- [eslint-config-prettier 10.1.8](https://github.com/prettier/eslint-config-prettier)
- [eslint-plugin-simple-import-sort 12.1.1](https://github.com/lydell/eslint-plugin-simple-import-sort)

### 🔹 Formatter

- [Prettier 3.8.1](https://prettier.io/docs/en/)

### 🔹 Execução em Desenvolvimento

- [tsx 4.21.0](https://github.com/esbuild-kit/tsx)

---

## ⚙️ Scripts

```json
"scripts": {
  "dev": "tsx --watch src/index.ts"
}
```
