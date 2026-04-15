# Comandos do Projeto

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar dev server (com HMR)
npm run dev

# Rodar dev server com porta específica
npm run dev -- --port 5173

# Rodar dev server aberto no browser
npm run dev -- --open
```

## Produção

```bash
# Build para produção
npm run build

# Preview do build
npm run preview

# Rodar via Deno (após build)
deno run --allow-all build/index.js
```

## Docker

```bash
# Build da imagem
docker build -t health-tracker-frontend .

# Rodar o container
docker run -p 3000:3000 \
  -e PUBLIC_API_URL=http://localhost:3000 \
  health-tracker-frontend
```

## Verificação de Tipos

```bash
# Checar tipos
npm run check

# Checar tipos em watch mode
npm run check:watch
```

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `PUBLIC_API_URL` | URL da API NestJS (cliente) | `http://localhost:3000` |
| `PORT` | Porta do servidor (produção) | `3000` |
| `HOST` | Host do servidor | `0.0.0.0` |
