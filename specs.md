# Product Requirements Document (PRD) & Technical Specs

**Projeto:** Health Self Tracker (App Pessoal de Registro Diário)
**Filosofia:** Fricção Zero, Assincronicidade, Orientado a Dados Longitudinais.
**Arquitetura de Repositório:** Estritamente Separados (NO MONOREPO). Front-end e Back-end são projetos isolados.

## 1. Visão Geral

Aplicativo web de uso estritamente pessoal projetado para unificar o registro diário de saúde física, estado mental, foco, uso de substâncias e atividades físicas. O objetivo principal é atuar como um coletor rápido de dados (menos de 2 minutos por dia) para gerar um "Dump" estruturado que será analisado posteriormente por LLMs atuando como cientistas de dados pessoais.

## 2. Stack Tecnológico

- **Front-end:** Svelte (Recomendado: SvelteKit) - Executado via Vite/Deno.
- **Back-end:** NestJS - Executado nativamente no **Deno Runtime** usando a camada de compatibilidade com Node.
- **Banco de Dados:** PostgreSQL (Híbrido: Relacional para Hard-Data + JSONB para Métricas Dinâmicas e Soft-Data).
- **ORM:** Prisma ORM.

* **Infraestrutura:** Docker e Docker Compose (para conteinerização isolada do Back-end e do Banco de Dados).

## 3. Diretrizes de UX/UI (Regras para o Front-end)

- **Fricção Zero:** A entrada de dados deve ser agrupada em um log único por dia.
- **Teclado em Primeiro Lugar:** A interface deve ser navegável via `Tab`, `Enter` e atalhos de teclado.
- **Autocompletar Inteligente:** Campos de Tags, Substâncias e Atividades devem sugerir opções do histórico em tempo real.
- **Criação "On-the-fly":** Se uma tag, substância ou atividade não existir, deve ser criada automaticamente no banco de dados durante o envio do log.

## 4. Domínio de Dados (O que será rastreado)

1.  **Métricas Dinâmicas:** Variáveis quantitativas opcionais (ex: Energia, Qualidade do Sono). Serão salvas de forma flexível em uma coluna JSONB, sem engessar colunas estritas.
2.  **Sistema de Tags Dinâmicas:** Categorizadas (Sintoma, Interferência, Gatilho, Resgate, Geral).
3.  **Substâncias:** Remédios e Suplementos. Registro de dose exata, horário de queda de efeito (DropTime) e ocorrência de "Crash".
4.  **Atividades Físicas:** Modalidades praticadas.
5.  **Anotações e Multifoco:** Textos estruturados e contextuais (armazenados em JSON livre).

## 5. Schema do Banco de Dados (Prisma)

**Nota Crítica para a IA (IDs e Deno):**

- O back-end DEVE gerar os IDs usando a biblioteca `ulid` (importação compatível com Deno: `import { ulid } from "npm:ulid"`) antes de inserir no banco.
- O generator do Prisma deve estar configurado para gerar o cliente Node padrão, que o Deno consumirá.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 1. O NÚCLEO: REGISTRO DIÁRIO
model DailyRecord {
  id                   String            @id // Gerado via ULID no backend
  date                 DateTime          @unique @db.Date
  metrics              Json?             @db.JsonB // Ex: { "energy": 4, "sleep": 3 }
  structuredNotes      Json?             @db.JsonB // Anotações flexíveis

  tags                 Tag[]
  substances           DailySubstance[]
  activities           DailyActivity[]

  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
}

// 2. SISTEMA DE TAGS DINÂMICAS
model Tag {
  id        String       @id // Gerado via ULID no backend
  name      String       @unique
  category  TagCategory  @default(GENERAL)
  records   DailyRecord[]
  createdAt DateTime     @default(now())
}

// 3. MAPEAMENTO DE SUBSTÂNCIAS
model Substance {
  id          String           @id // Gerado via ULID no backend
  name        String           @unique
  type        SubstanceType
  defaultDose String?
  log         DailySubstance[]
}

model DailySubstance {
  id               String      @id // Gerado via ULID no backend
  dailyRecordId    String
  substanceId      String
  exactDose        String
  notes            String?     @db.Text
  effectDropTime   DropTime?
  experiencedCrash Boolean     @default(false)

  record           DailyRecord @relation(fields: [dailyRecordId], references: [id], onDelete: Cascade)
  substance        Substance   @relation(fields: [substanceId], references: [id])

  @@unique([dailyRecordId, substanceId])
}

// 4. MAPEAMENTO DE ATIVIDADE FÍSICA
model Activity {
  id   String @id // Gerado via ULID no backend
  name String @unique
  logs DailyActivity[]
}

model DailyActivity {
  id            String      @id // Gerado via ULID no backend
  dailyRecordId String
  activityId    String
  notes         String?     @db.Text

  record        DailyRecord @relation(fields: [dailyRecordId], references: [id], onDelete: Cascade)
  activity      Activity    @relation(fields: [activityId], references: [id])
}

// 5. ENUMS DE APOIO
enum TagCategory {
  SYMPTOM
  INTERFERENCE
  TRIGGER
  RESCUE
  GENERAL
}

enum DropTime {
  MORNING
  AFTERNOON
  EVENING
  NONE
}

enum SubstanceType {
  MEDICATION
  SUPPLEMENT
}
```

## 6. Rotas da API (NestJS Especificações)

- DailyRecordModule:
  - O Service deve injetar os IDs gerados pela biblioteca npm:ulid.
  - POST /records: Cria/Atualiza (Upsert pela data). Cria tags/substâncias on-the-fly. O payload deve aceitar um objeto JSON livre no campo metrics.

- GET /records/today: Busca registro do dia.

- ExportModule:
  - GET /export/dump: Agrega todos os dados do banco e exporta um JSON minificado/CSV estruturado para LLMs.

## REGRA ABSOLUTA DE EXECUÇÃO (STATE TRACKING)

**Atenção:** Este projeto será construído de forma iterativa, em múltiplos prompts. Para que o contexto não se perca, você é **OBRIGADO** a seguir este protocolo estritamente:

1. **Arquivo de Progresso:** Na sua primeira interação com este repositório, crie um arquivo chamado `PROGRESS.md` na raiz. Transforme todos os itens do "Plano de Implementação" abaixo em uma checklist Markdown (`[ ]`).
2. **Atualização Obrigatória:** Sempre que concluir uma tarefa que eu pedir, você deve abrir o arquivo `PROGRESS.md` e marcar a tarefa correspondente como concluída (`[x]`).
3. **Relatório de Fim de Interação:** Sempre que você concluir uma etapa do plano de implementação você deve incluir um breve bloco de status exatamente neste formato na sua resposta:
   - **✅ Concluído agora:** [Resumo rápido do que acabou de fazer]
   - **🔄 Status do PROGRESS.md:** [Atualizado / Não necessitou atualização]
   - **⏳ Próximo passo pendente:** [A próxima tarefa desmarcada no PROGRESS.md]
   - **Aguardando aprovação:** "Devo prosseguir para o próximo passo?"

## 7. Plano de Implementação (Instruções Estritas para o Agente de IA)

- Aviso ao Agente de IA: PROIBIDO O USO DE MONOREPO. Você deve criar dois diretórios separados, independentes, sem nenhuma ferramenta de workspace (como npm workspaces ou nx).
- **O Runtime alvo é o DENO**.

### Fase 1: Setup do Back-end, Banco de Dados e Docker (Pasta `backend-api`)

1.  Inicialize um projeto NestJS padrão, na raiz do projeto, com Deno (crie o `deno.json` conforme configurado acima).
2.  Configure o Prisma e aplique o `schema.prisma`.
3.  Crie um `Dockerfile` na raiz do `backend-api` utilizando uma imagem oficial do Deno (`denoland/deno:alpine` ou `debian`). O `Dockerfile` deve garantir que o Prisma Client seja gerado internamente (`deno run -A npm:prisma generate`) antes de rodar o comando de start.
4.  Crie um arquivo `docker-compose.yml` na raiz do projeto contendo dois serviços: o banco de dados `postgres` e a aplicação `api` (buildando a partir do `Dockerfile`). Configure as redes e volumes adequadamente.

### Fase 2: Construção da API (NestJS)

Ainda em backend-api: Gere os recursos (Tag, Substance, Activity). Implemente a lógica nos Services para gerar ULIDs nativamente.
Desenvolva o DailyRecordService com lógica transacional para criar o log, as relações n:n, e salvar o campo metrics (JSONB) corretamente.
Implemente o ExportModule (/export/dump). Configure o CORS no main.ts para permitir requisições do frontend.

### Fase 3: Setup e Construção do Front-end (Pasta `frontend-app`) e Docker

1. Crie uma pasta independente chamada `frontend-app`. Inicialize um projeto SvelteKit e instale Tailwind CSS, `shadcn-svelte`, `sveltekit-superforms` e `zod`.
2. Configure o SvelteKit com `@sveltejs/adapter-node` e ajuste o `deno.json`/`package.json` para rodar os scripts via Deno.
3. Crie o `Dockerfile` do front-end utilizando a imagem base do Deno.
4. Atualize o `docker-compose.yml` principal (ou crie instruções claras caso rode em redes separadas) para incluir o serviço do `frontend`, expondo sua porta e garantindo que ele consiga se comunicar com o serviço do `backend-api` na rede interna do Docker.
5. Construa o formulário principal ("Fricção Zero") aplicando o autocompletar e os atalhos de teclado globais.

### Fase 4: Integração e Testes

Execute ambos os projetos independentemente (em terminais separados usando o Deno).
Teste o fluxo ponta a ponta (Frontend Svelte comunicando com API NestJS).
Verifique no Postgres se os IDs gerados são ULIDs válidos.
Valide o output da rota de Dump.
