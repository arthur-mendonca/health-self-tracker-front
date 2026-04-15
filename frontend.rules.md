# Regras de Front-end: SvelteKit & UX Fricção Zero

**Alvo:** `frontend-app` (SvelteKit + Tailwind CSS executado via Deno).
**Aviso ao Agente de IA:** Escreva Svelte idiomático. Não tente aplicar padrões de React (não crie gerenciadores de estado complexos se uma simples reatividade `$:` ou _store_ nativa resolver o problema).

## 1. Bibliotecas Obrigatórias e Stack Front-end

Para garantir acessibilidade, formulários complexos e velocidade, o projeto DEVE utilizar as seguintes bibliotecas:

- **Framework:** SvelteKit.
- **Estilização:** Tailwind CSS (com `tailwind-merge` e `clsx` para utilitários).
- **Componentes de UI:** `shadcn-svelte` (Use esta biblioteca para gerar botões, modais, inputs e, MAIS IMPORTANTE, o componente _Combobox/Popover_ para o autocompletar).
- **Gerenciamento de Formulário (CRÍTICO):** `sveltekit-superforms` combinado com `zod`. Como o formulário diário envia um payload profundo (Arrays de tags, substâncias e objetos JSON de métricas), usar Superforms garante validação em tempo real e estado limpo.
- **Ícones:** `lucide-svelte`.

## 2. Estrutura de Diretórios (Padrão SvelteKit)

Todo o código deve ser organizado dentro da pasta `src/`:

```text
src/
├── lib/                      # Código reutilizável e lógica
│   ├── components/           # Componentes de UI (ex: ui/button, ui/combobox)
│   ├── api/                  # Clientes e wrappers de fetch para o back-end NestJS
│   ├── stores/               # Svelte Stores (estado global, ex: tema, data atual selecionada)
│   └── utils/                # Funções utilitárias (ex: formatação de datas)
├── routes/                   # Roteamento baseado em arquivos do SvelteKit
│   ├── +layout.svelte        # Layout principal (Header, atalhos de teclado globais)
│   ├── +page.svelte          # PÁGINA PRINCIPAL: O Log Diário (Fricção Zero)
│   ├── +page.server.ts       # Load function: Busca o log de "Hoje" do NestJS via SSR
│   └── export/               # Rota para acionar e baixar o "Dump" de dados
└── app.html                  # Template base
```

## 3. Diretrizes de Construção de Componentes (Idiomático)

- Reatividade Nativa: Use a reatividade nativa do Svelte. Se estiver usando Svelte 4, use labels reativos ($: const isFatigued = energyLevel < 3). Se estiver usando Svelte 5, utilize Runes ($state, $derived).
- Two-way Binding: Para campos simples, sinta-se livre para usar bind:value nativo do Svelte, pois isso reduz drasticamente o boilerplate em comparação com o React.
- Evite "Div Soup": O HTML deve ser semântico.

## 4. O Componente "Creatable Autocomplete" (O Coração da UI)

- O aplicativo exige que Tags, Substâncias e Atividades sejam buscadas do histórico e criadas "on-the-fly".
- O Agente de IA DEVE criar um componente reutilizável de Combobox (sugere-se adaptar o shadcn-svelte Combobox).
- Comportamento: O usuário digita "Cafeína". O componente bate na API via debounce. Se a API não retornar "Cafeína", o componente mostra a opção [ Criar "Cafeína" ]. Se o usuário der Enter, a string "Cafeína" é adicionada ao array do formulário. A criação real no banco ocorrerá apenas quando o log diário for submetido (gerenciado pelo backend NestJS).

## 5. Regras de "Fricção Zero" (Acessibilidade e UX)

- Keyboard First: O formulário principal não deve exigir o uso do mouse. O agente deve configurar navegação via Tab, e os campos de Autocompletar devem abrir com as setas do teclado (ArrowDown/ArrowUp) e selecionar com Enter.
- Atalhos Globais: Implemente um listener na janela (usando <svelte:window on:keydown={handleKeydown} />) para focar instantaneamente no primeiro input ao pressionar uma tecla de atalho (ex: Ctrl + K ou /).
- Métricas JSON (Dinâmicas): Como o back-end aceita métricas arbitrárias em formato JSON ({ "energy": 4, "fome": 2 }), o front-end deve permitir adicionar chaves/valores dinamicamente na UI, ou renderizar campos fixos basais que serializam em JSON antes do envio.

## 6. Comunicação com a API (NestJS)

- A API backend rodará em uma porta diferente (ex: http://localhost:3000).
- O SvelteKit deve possuir uma variável de ambiente pública/privada (ex: PUBLIC_API_URL no arquivo .env) apontando para a API local.
- Server-Side Rendering (SSR): Sempre que possível, utilize as funções load do arquivo +page.server.ts para bater na API do NestJS antes de renderizar a tela. Isso garante que a página já carregue com o estado atualizado do dia.
- Cliente-Side Fetch: Para buscas em tempo real (como o autocompletar de tags), as requisições devem partir dos componentes (cliente) para a API, com um debounce adequado (ex: 300ms) para não sobrecarregar o back-end.

## 7. Instruções para o Deno

- Assim como o back-end, o front-end será executado via Deno.
- O SvelteKit inicializado deve usar o adaptador estático (@sveltejs/adapter-static) ou o adaptador Node (que roda no Deno), dependendo de como preferimos o deploy. Para uso pessoal rodando em Docker, o adapter-node rodando via Deno é perfeitamente funcional.
- Os scripts do package.json gerados pelo SvelteKit (dev, build) devem ser executados pelo agente como deno task dev e deno task build.

## 8. Infraestrutura e Docker (Deploy via Coolify)

O front-end DEVE ser conteinerizado para rodar no Deno, facilitando o deploy via Coolify em uma VPS.

- **Adaptador do SvelteKit:** Utilize obrigatoriamente o `@sveltejs/adapter-node`. Este adaptador gera um servidor Node.js padrão que o Deno consegue executar nativamente com alta performance através de sua camada de compatibilidade. Altere o `svelte.config.js` para usar este adaptador.
- **Dockerfile:** O agente deve criar um `Dockerfile` na raiz de `frontend-app`.
  - A imagem base deve ser do Deno (ex: `denoland/deno:alpine`).
  - O processo de _build_ (`deno task build`) deve gerar a pasta `build/`.
  - O comando de _start_ do container deve expor a porta (ex: 3000 ou 5173) e rodar o servidor gerado: `deno run --allow-all build/index.js`.
- **Comunicação de Container no Docker Compose:** O front-end precisará se comunicar com o back-end via SSR. O agente deve prever variáveis de ambiente (como `PUBLIC_API_URL` para o client e `PRIVATE_API_URL` para o server load functions) que permitam que o container do front-end enxergue o container da API (ex: `http://api:3000`).

## 9. Diretrizes Visuais e de UI (Design System)

O aplicativo deve ter uma estética minimalista, inspirada em ferramentas de produtividade para desenvolvedores (como Linear, Raycast ou Notion). O objetivo é que o usuário sinta que está preenchendo um arquivo de configuração estruturado, não um formulário web engessado.

**A) Estética e Tipografia:**

- **Tema Padrão:** Dark Mode preferencial, usando a paleta `zinc` do Tailwind (fundos em `bg-zinc-950`, bordas em `border-zinc-800`).
- **Fontes:** Use fontes Sans-serif para os rótulos e botões (ex: classes padrão do Tailwind) e use `font-mono` para os dados em si (ex: valores de doses, nomes de tags), reforçando a ideia de "Data Dump".

**B) Layout do "Log Diário" (A Tela Principal):**
A tela principal deve ser dividida verticalmente (Stack) em seções claras, navegáveis por `Tab`:

1.  **Header Cronológico:** Data no topo, com botões rápidos para `[< Ontem]` e `[Hoje]`.
2.  **Vitals (Métricas Base):** Um grid horizontal. Para os campos de 1 a 5 (Energia, Sono), use `RadioGroup` do `shadcn-svelte` apresentados como caixas clicáveis (`[1] [2] [3] [4] [5]`).
3.  **O "Omnibar" (Tags):** O campo de busca/criação de tags deve ser o componente de maior destaque da tela. Ao adicionar tags, elas devem renderizar como _Badges_ agrupadas abaixo do input.
    - _Codificação de Cores:_ Utilize as props do Tailwind para pintar os badges dependendo do Enum: `SYMPTOM` (Vermelho), `INTERFERENCE` (Laranja), `TRIGGER` (Amarelo), `RESCUE` (Verde/Teal), `GENERAL` (Cinza).
4.  **Gestão de Substâncias (Listagem expansível):**
    - Ao selecionar uma substância do autocompletar, ela deve ser adicionada a uma lista logo abaixo.
    - Cada item na lista deve ser um "Card" estreito ou uma linha contendo: O nome, um input pequeno para `exactDose`, um select para `DropTime`, e um checkbox/switch para `Crash`.
5.  **Distrações & Notas (Textareas limpas):**
    - Campos de texto expansíveis nativamente sem bordas agressivas (use `resize-none` e expanda conforme o usuário digita ou deixe um tamanho fixo confortável).

**C) Atalhos de Teclado (Micro-interações):**
A IA deve implementar os seguintes atalhos:

- `Ctrl + Enter` (ou `Cmd + Enter`): Submete o formulário inteiro de qualquer lugar da tela.
- `/` (Barra): Foca instantaneamente no "Omnibar" de inserção de Tags.
- `Esc`: Limpa o input focado ou fecha o dropdown do autocompletar atual.
- Use botões fantasmas (`variant="ghost"` no shadcn) para ações secundárias para manter a interface limpa e sem distrações poluidoras.
