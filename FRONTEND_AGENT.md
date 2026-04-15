# Guia para o Agente do Front-end

Este backend expõe uma API HTTP JSON para o Health Self Tracker. O front-end fica em outro repositório; use este documento como contrato prático dos endpoints disponíveis no estado atual do app.

## Base da API

- Local: `http://localhost:3000`
- O backend habilita CORS globalmente.
- Todas as rotas de negócio exigem JWT no header `Authorization`.
- A única rota pública é `POST /auth/login`.
- Envie payloads JSON com `Content-Type: application/json`.
- Campos extras no body são rejeitados pela validação global.

## Autenticação

O usuário inicial é criado no boot da API a partir das variáveis:

- `AUTH_USER_EMAIL`
- `AUTH_USER_PASSWORD`
- `JWT_SECRET`

Se `AUTH_USER_EMAIL` ou `AUTH_USER_PASSWORD` não estiverem configurados, o login fica desabilitado.

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

Use o token nas demais rotas:

```http
Authorization: Bearer jwt-token
```

O token atual expira em 1 hora. Em caso de token ausente, inválido ou expirado, a API retorna `401`.

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
- `201`: criação/upsert via `POST` bem-sucedido.
- `200`: consulta bem-sucedida.

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

Resposta `200`:

```json
{
  "generatedAt": "2026-04-15T01:20:30.000Z",
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

- Não há endpoints de edição parcial, delete, paginação ou filtros além de data/período.
- Não há refresh token.
- Não há endpoint de cadastro de usuário; credenciais vêm do ambiente do backend.
- Não há contrato OpenAPI gerado automaticamente no estado atual.
