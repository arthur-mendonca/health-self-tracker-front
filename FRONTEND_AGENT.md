# Guia para o Agente do Front-end

Este backend expõe uma API HTTP JSON para o Health Self Tracker. O front-end fica em outro repositório; use este documento como contrato prático dos endpoints disponíveis no estado atual do app.

## Base da API

- Local: `http://localhost:3000`
- O backend habilita CORS para origens configuradas em `CORS_ORIGINS`.
- Todas as rotas de negócio exigem JWT no header `Authorization` ou cookie de sessão `HttpOnly`.
- As rotas públicas são `POST /auth/login` e `POST /auth/logout`.
- Envie payloads JSON com `Content-Type: application/json`.
- Para autenticação por cookie no navegador, use `credentials: "include"` em todas as requests para a API.
- Campos extras no body são rejeitados pela validação global.

## Autenticação

O usuário inicial é criado no boot da API a partir das variáveis:

- `AUTH_USER_EMAIL`
- `AUTH_USER_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `AUTH_COOKIE_NAME`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAME_SITE`
- `AUTH_COOKIE_MAX_AGE_SECONDS`

Se `AUTH_USER_EMAIL` ou `AUTH_USER_PASSWORD` não estiverem configurados, o login fica desabilitado.

Em produção, com API em `https://health.gestorinvest.xyz` e front em `https://health-front.gestorinvest.xyz`, use:

```text
CORS_ORIGINS=https://health-front.gestorinvest.xyz
AUTH_COOKIE_DOMAIN=.gestorinvest.xyz
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_MAX_AGE_SECONDS=3600
```

### Login

`POST /auth/login`

Body:

```json
{
  "email": "user@example.com",
  "password": "local-password"
}
```

Resposta `201`:

```json
{
  "token": "jwt-token"
}
```

Além do body acima, a API envia `Set-Cookie` com o cookie `HttpOnly` de sessão. Para o front em SSR, prefira autenticar via cookie e não armazenar o JWT no browser.

Use `credentials: "include"` no login:

```ts
await fetch(`${apiUrl}/auth/login`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});
```

Para clientes não-browser, como Postman, scripts e testes, o token continua aceito nas demais rotas:

```http
Authorization: Bearer jwt-token
```

O token/cookie atual expira em 1 hora. Em caso de token/cookie ausente, inválido ou expirado, a API retorna `401`.

### Sessão atual

`GET /auth/me`

Autenticação: cookie `HttpOnly` ou `Authorization: Bearer`.

Resposta `200`:

```json
{
  "id": "01HV...",
  "email": "user@example.com"
}
```

Use este endpoint no server-side do front antes de renderizar páginas protegidas. Em SSR, encaminhe o cookie recebido pelo front para a API:

```ts
await fetch("https://health.gestorinvest.xyz/auth/me", {
  headers: {
    cookie: request.headers.get("cookie") ?? "",
  },
});
```

### Logout

`POST /auth/logout`

Resposta `204`: sem body. A API limpa o cookie de sessão.

No browser:

```ts
await fetch(`${apiUrl}/auth/logout`, {
  method: "POST",
  credentials: "include",
});
```

### CSRF para cookie

Requests autenticadas por cookie nos métodos `POST`, `PUT`, `PATCH` e `DELETE` precisam ter header `Origin` permitido por `CORS_ORIGINS`. Requests com `Authorization: Bearer` não passam por essa checagem.

## Enums

### TagCategory

```ts
"SYMPTOM" | "INTERFERENCE" | "TRIGGER" | "RESCUE" | "GENERAL";
```

Uso sugerido no front:

- `SYMPTOM`: sintomas.
- `INTERFERENCE`: interferências ou impactos no dia.
- `TRIGGER`: possíveis gatilhos.
- `RESCUE`: ações de resgate/alívio.
- `GENERAL`: categoria padrão.

### SubstanceType

```ts
"MEDICATION" | "SUPPLEMENT";
```

### DropTime

```ts
"MORNING" | "AFTERNOON" | "EVENING" | "NONE";
```

## Erros e Validação

Formato exato do erro segue o padrão do NestJS, mas o front pode tratar por status:

- `400`: payload inválido, enum inválido, campo obrigatório ausente/vazio, data inválida, campos extras.
- `401`: login inválido ou rota protegida sem token válido.
- `404`: recurso não encontrado em rotas por `id`.
- `201`: criação/upsert via `POST` bem-sucedido.
- `200`: consulta bem-sucedida.
- `204`: remoção bem-sucedida.

Regras importantes:

- Strings obrigatórias precisam ter pelo menos 1 caractere depois do trim.
- `date` em registros deve usar `YYYY-MM-DD`.
- `metrics` e `structuredNotes` aceitam objetos JSON livres.
- Arrays opcionais ausentes são tratados como listas vazias no upsert de registro.
- Campos extras em objetos aninhados também são rejeitados.

## Tags

Tags são usadas para registrar sintomas, gatilhos e marcadores do dia.

### Listar tags

`GET /tags`

Resposta `200`:

```json
[
  {
    "id": "01HV...",
    "name": "Headache",
    "category": "SYMPTOM",
    "createdAt": "2026-04-15T01:20:30.000Z"
  }
]
```

Ordenação atual: `name` ascendente.

### Criar ou atualizar tag por nome

`POST /tags`

Body:

```json
{
  "name": "Headache",
  "category": "SYMPTOM"
}
```

Campos:

- `name`: obrigatório.
- `category`: opcional; padrão de domínio é `GENERAL`.

Resposta `201`:

```json
{
  "id": "01HV...",
  "name": "Headache",
  "category": "SYMPTOM",
  "createdAt": "2026-04-15T01:20:30.000Z"
}
```

Comportamento: se já existir uma tag com o mesmo `name`, a API reaproveita o registro e atualiza a `category`.

### Atualizar tag por id

`PATCH /tags/:id`

Body:

```json
{
  "name": "Migraine",
  "category": "TRIGGER"
}
```

Campos:

- `name`: opcional.
- `category`: opcional.
- Pelo menos um campo deve ser enviado.

Resposta `200`:

```json
{
  "id": "01HV...",
  "name": "Migraine",
  "category": "TRIGGER",
  "createdAt": "2026-04-15T01:20:30.000Z"
}
```

Erros:

- `400`: body vazio, `name` vazio, enum inválido ou campo extra.
- `404`: tag não encontrada.

### Remover tag por id

`DELETE /tags/:id`

Resposta `204`: sem body.

Erros:

- `404`: tag não encontrada.

Observação: remover uma tag também remove a associação dela com registros diários existentes, mas não remove os registros diários.

## Substances

Substances representam medicamentos e suplementos.

### Listar substances

`GET /substances`

Resposta `200`:

```json
[
  {
    "id": "01HV...",
    "name": "Magnesium",
    "type": "SUPPLEMENT",
    "defaultDose": "200mg"
  }
]
```

Ordenação atual: `name` ascendente.

### Criar ou atualizar substance por nome

`POST /substances`

Body:

```json
{
  "name": "Magnesium",
  "type": "SUPPLEMENT",
  "defaultDose": "200mg"
}
```

Campos:

- `name`: obrigatório.
- `type`: obrigatório, `MEDICATION` ou `SUPPLEMENT`.
- `defaultDose`: opcional, string ou `null`.

Resposta `201`:

```json
{
  "id": "01HV...",
  "name": "Magnesium",
  "type": "SUPPLEMENT",
  "defaultDose": "200mg"
}
```

Comportamento: se já existir uma substance com o mesmo `name`, a API reaproveita o registro e atualiza `type` e `defaultDose`.

### Atualizar substance por id

`PATCH /substances/:id`

Body:

```json
{
  "name": "Ibuprofen",
  "type": "MEDICATION",
  "defaultDose": "400mg"
}
```

Campos:

- `name`: opcional.
- `type`: opcional, `MEDICATION` ou `SUPPLEMENT`.
- `defaultDose`: opcional, string ou `null`.
- Pelo menos um campo deve ser enviado.

Resposta `200`:

```json
{
  "id": "01HV...",
  "name": "Ibuprofen",
  "type": "MEDICATION",
  "defaultDose": "400mg"
}
```

Erros:

- `400`: body vazio, `name` vazio, enum inválido ou campo extra.
- `404`: substance não encontrada.

### Remover substance por id

`DELETE /substances/:id`

Resposta `204`: sem body.

Erros:

- `404`: substance não encontrada.

Observação: remover uma substance também remove os logs dela em registros diários existentes, mas não remove os registros diários.

## Activities

Activities representam atividades físicas ou hábitos registrados no dia.

### Listar activities

`GET /activities`

Resposta `200`:

```json
[
  {
    "id": "01HV...",
    "name": "Walk"
  }
]
```

Ordenação atual: `name` ascendente.

### Criar activity por nome

`POST /activities`

Body:

```json
{
  "name": "Walk"
}
```

Resposta `201`:

```json
{
  "id": "01HV...",
  "name": "Walk"
}
```

Comportamento: se já existir uma activity com o mesmo `name`, a API reaproveita o registro existente.

### Atualizar activity por id

`PATCH /activities/:id`

Body:

```json
{
  "name": "Run"
}
```

Campos:

- `name`: obrigatório no update.

Resposta `200`:

```json
{
  "id": "01HV...",
  "name": "Run"
}
```

Erros:

- `400`: body vazio, `name` vazio ou campo extra.
- `404`: activity não encontrada.

### Remover activity por id

`DELETE /activities/:id`

Resposta `204`: sem body.

Erros:

- `404`: activity não encontrada.

Observação: remover uma activity também remove os logs dela em registros diários existentes, mas não remove os registros diários.

## Daily Records

O registro diário é o principal recurso do produto.

### Listar registros

`GET /records`

Query params opcionais:

- `date`: filtra uma data específica em `YYYY-MM-DD`.
- `startDate`: início do período em `YYYY-MM-DD`.
- `endDate`: fim do período em `YYYY-MM-DD`.

Exemplos:

```http
GET /records
GET /records?date=1990-01-01
GET /records?date=2026-04-15
GET /records?startDate=2026-04-01&endDate=2026-04-30
GET /records?startDate=2026-04-01
GET /records?endDate=2026-04-30
```

Resposta `200`:

```json
[
  {
    "id": "01HV...",
    "date": "2026-04-15",
    "metrics": {
      "energy": 4,
      "sleepQuality": 3
    },
    "structuredNotes": {
      "mood": "stable",
      "focus": "deep work"
    },
    "tags": [
      {
        "id": "01HV...",
        "name": "Headache",
        "category": "SYMPTOM"
      }
    ],
    "substances": [
      {
        "id": "01HV...",
        "substance": {
          "id": "01HV...",
          "name": "Magnesium",
          "type": "SUPPLEMENT",
          "defaultDose": "200mg"
        },
        "exactDose": "200mg",
        "notes": null,
        "effectDropTime": "NONE",
        "experiencedCrash": false
      }
    ],
    "activities": [
      {
        "id": "01HV...",
        "activity": {
          "id": "01HV...",
          "name": "Walk"
        },
        "notes": "30 minutes"
      }
    ],
    "createdAt": "2026-04-15T01:20:30.000Z",
    "updatedAt": "2026-04-15T01:20:30.000Z"
  }
]
```

Resposta `200` para uma data ou período sem registros:

```json
[]
```

Comportamento:

- Sem query params, retorna todos os registros em ordem de `date` ascendente.
- Com `date`, retorna uma lista com zero ou um registro.
- Com `startDate` e/ou `endDate`, retorna registros no período inclusivo.
- `date` não pode ser combinado com `startDate` ou `endDate`.
- `startDate` não pode ser maior que `endDate`.
- Datas passadas e futuras são aceitas, desde que usem `YYYY-MM-DD`.

### Buscar registro de hoje

`GET /records/today`

Resposta `200` quando existe:

```json
{
  "id": "01HV...",
  "date": "2026-04-15",
  "metrics": {
    "energy": 4,
    "sleepQuality": 3
  },
  "structuredNotes": {
    "mood": "stable",
    "focus": "deep work"
  },
  "tags": [
    {
      "id": "01HV...",
      "name": "Headache",
      "category": "SYMPTOM"
    }
  ],
  "substances": [
    {
      "id": "01HV...",
      "substance": {
        "id": "01HV...",
        "name": "Magnesium",
        "type": "SUPPLEMENT",
        "defaultDose": "200mg"
      },
      "exactDose": "200mg",
      "notes": null,
      "effectDropTime": "NONE",
      "experiencedCrash": false
    }
  ],
  "activities": [
    {
      "id": "01HV...",
      "activity": {
        "id": "01HV...",
        "name": "Walk"
      },
      "notes": "30 minutes"
    }
  ],
  "createdAt": "2026-04-15T01:20:30.000Z",
  "updatedAt": "2026-04-15T01:20:30.000Z"
}
```

Resposta `200` quando não existe:

```json
null
```

Observação: "hoje" é calculado no timezone `America/Sao_Paulo`.

### Criar ou substituir registro diário

`POST /records`

Body completo de exemplo:

```json
{
  "date": "2026-04-15",
  "metrics": {
    "energy": 4,
    "sleepQuality": 3
  },
  "structuredNotes": {
    "mood": "stable",
    "focus": "deep work"
  },
  "tags": [
    {
      "name": "Headache",
      "category": "SYMPTOM"
    }
  ],
  "substances": [
    {
      "name": "Magnesium",
      "type": "SUPPLEMENT",
      "defaultDose": "200mg",
      "exactDose": "200mg",
      "notes": "Taken after lunch",
      "effectDropTime": "NONE",
      "experiencedCrash": false
    }
  ],
  "activities": [
    {
      "name": "Walk",
      "notes": "30 minutes"
    }
  ]
}
```

Campos do body:

- `date`: opcional; se ausente, usa a data atual. Quando enviado, deve ser `YYYY-MM-DD`.
- `metrics`: opcional, objeto JSON livre ou `null`.
- `structuredNotes`: opcional, objeto JSON livre ou `null`.
- `tags`: opcional, lista de `{ name, category? }`.
- `substances`: opcional, lista de `{ name, type, defaultDose?, exactDose, notes?, effectDropTime?, experiencedCrash? }`.
- `activities`: opcional, lista de `{ name, notes? }`.

Resposta `201`: mesmo formato de `GET /records/today`.

Comportamento importante para o front:

- O upsert é feito pela data.
- Enviar `POST /records` para uma data já existente substitui o conteúdo do dia.
- `metrics` e `structuredNotes` são sobrescritos.
- Tags do registro são substituídas pelo array enviado.
- Logs de substances e activities do dia são removidos e recriados a partir dos arrays enviados.
- Dentro de cada array do payload, itens com `name` repetido são deduplicados por nome, ignorando maiúsculas/minúsculas e espaços nas pontas.
- Tags, substances e activities referenciadas no registro são criadas automaticamente se ainda não existirem.
- Se `experiencedCrash` for omitido em uma substance do registro, o backend usa `false`.
- `notes`, `defaultDose` e `effectDropTime` podem ser `null` quando opcionais.

Sugestão de UX:

- Use `GET /records/today` para popular a tela inicial.
- Use `GET /records?date=YYYY-MM-DD` para navegar para ontem, amanhã ou qualquer data específica.
- Use `GET /records?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` para telas de histórico, calendário, gráficos e relatórios.
- Use `GET /tags`, `GET /substances` e `GET /activities` para autocomplete/histórico.
- Ao salvar o dia, envie o estado completo do formulário em `POST /records`, não apenas o delta.

## Export

### Export JSON

`GET /export/dump`

Também disponível como download explícito:

`GET /export/dump.json`

Query params opcionais em todas as rotas de export:

- `startDate`: início do período em `YYYY-MM-DD`.
- `endDate`: fim do período em `YYYY-MM-DD`.
- `days`: atalho para os últimos N dias, incluindo hoje em `America/Sao_Paulo`.

Regras:

- Sem query params, exporta todos os registros.
- `startDate` e `endDate` podem ser usados juntos ou isolados.
- `days` não pode ser combinado com `startDate` ou `endDate`.
- `startDate` não pode ser maior que `endDate`.

Exemplos:

```http
GET /export/dump?startDate=2026-04-01&endDate=2026-04-30
GET /export/dump.json?days=7
GET /export/dump.pdf?days=7
GET /export/dump.txt?startDate=2026-04-01&endDate=2026-04-30
```

Resposta `200`:

```json
{
  "generatedAt": "2026-04-15T01:20:30.000Z",
  "period": {
    "startDate": "2026-04-01",
    "endDate": "2026-04-30"
  },
  "records": [
    {
      "id": "01HV...",
      "date": "2026-04-15",
      "metrics": {
        "energy": 4
      },
      "structuredNotes": {
        "mood": "stable"
      },
      "tags": [
        {
          "name": "Headache",
          "category": "SYMPTOM"
        }
      ],
      "substances": [
        {
          "name": "Magnesium",
          "type": "SUPPLEMENT",
          "defaultDose": "200mg",
          "exactDose": "200mg",
          "notes": null,
          "effectDropTime": "NONE",
          "experiencedCrash": false
        }
      ],
      "activities": [
        {
          "name": "Walk",
          "notes": "30 minutes"
        }
      ],
      "createdAt": "2026-04-15T01:20:30.000Z",
      "updatedAt": "2026-04-15T01:20:30.000Z"
    }
  ]
}
```

Ordenação atual dos registros exportados: `date` ascendente.

`GET /export/dump.json` retorna o mesmo JSON, mas com headers de download:

- Header `content-type`: `application/json; charset=utf-8`
- Header `content-disposition`: `attachment; filename="health-self-tracker-dump.json"`

### Export CSV

`GET /export/dump.csv`

Resposta `200`:

- Header `content-type`: `text/csv; charset=utf-8`
- Header `content-disposition`: `attachment; filename="health-self-tracker-dump.csv"`

Colunas:

```csv
"id","date","metrics","structuredNotes","tags","substances","activities","createdAt","updatedAt"
```

As colunas complexas são serializadas como JSON dentro da célula CSV.

### Export TXT

`GET /export/dump.txt`

Resposta `200`:

- Header `content-type`: `text/plain; charset=utf-8`
- Header `content-disposition`: `attachment; filename="health-self-tracker-dump.txt"`

O corpo é texto simples com cabeçalho, período exportado, quantidade de registros e uma seção por dia.

### Export PDF

`GET /export/dump.pdf`

Resposta `200`:

- Header `content-type`: `application/pdf`
- Header `content-disposition`: `attachment; filename="health-self-tracker-dump.pdf"`

O PDF é textual e usa os mesmos dados do TXT. Para exportar os últimos 7 dias:

```http
GET /export/dump.pdf?days=7
```

## Modelo TypeScript Sugerido para o Front

```ts
export type TagCategory =
  | "SYMPTOM"
  | "INTERFERENCE"
  | "TRIGGER"
  | "RESCUE"
  | "GENERAL";
export type SubstanceType = "MEDICATION" | "SUPPLEMENT";
export type DropTime = "MORNING" | "AFTERNOON" | "EVENING" | "NONE";

export type TagResponse = {
  id: string;
  name: string;
  category: TagCategory;
  createdAt?: string;
};

export type SubstanceResponse = {
  id: string;
  name: string;
  type: SubstanceType;
  defaultDose: string | null;
};

export type ActivityResponse = {
  id: string;
  name: string;
};

export type UpdateTagPayload = {
  name?: string;
  category?: TagCategory;
};

export type UpdateSubstancePayload = {
  name?: string;
  type?: SubstanceType;
  defaultDose?: string | null;
};

export type UpdateActivityPayload = {
  name?: string;
};

export type DailyRecordResponse = {
  id: string;
  date: string;
  metrics: Record<string, unknown> | null;
  structuredNotes: Record<string, unknown> | null;
  tags: Array<{
    id: string;
    name: string;
    category: TagCategory;
  }>;
  substances: Array<{
    id: string;
    substance: SubstanceResponse;
    exactDose: string;
    notes: string | null;
    effectDropTime: DropTime | null;
    experiencedCrash: boolean;
  }>;
  activities: Array<{
    id: string;
    activity: ActivityResponse;
    notes: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type UpsertDailyRecordPayload = {
  date?: string;
  metrics?: Record<string, unknown> | null;
  structuredNotes?: Record<string, unknown> | null;
  tags?: Array<{
    name: string;
    category?: TagCategory;
  }>;
  substances?: Array<{
    name: string;
    type: SubstanceType;
    defaultDose?: string | null;
    exactDose: string;
    notes?: string | null;
    effectDropTime?: DropTime | null;
    experiencedCrash?: boolean;
  }>;
  activities?: Array<{
    name: string;
    notes?: string | null;
  }>;
};
```

## Limitações Atuais da API

- Não há paginação ou filtros além de data/período nos registros.
- Não há refresh token.
- Não há endpoint de cadastro de usuário; credenciais vêm do ambiente do backend.
- Não há contrato OpenAPI gerado automaticamente no estado atual.
