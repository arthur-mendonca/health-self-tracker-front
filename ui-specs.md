# A Visão da Interface (Mental Model)

## A Estética "Terminal Journal":

- Cores base em tons de cinza escuro (Tailwind zinc ou slate).
- Tipografia: Sans-serif limpa para a interface (ex: Inter ou Geist) e fonte Monospace (ex: JetBrains Mono) para os valores das tags e doses, reforçando a ideia de que você está "compilando" dados.
- Sem menus laterais complexos. A tela principal é o formulário do dia de hoje.

## O "Omnibar" de Tags (A Mágica do Autocomplete):

- Em vez de 5 campos de texto diferentes, você tem um campo gigante estilo "Pesquisa do Google" ou "Spotlight do Mac".
- Você aperta a barra /, e ele foca no campo. Você digita "Dor de cabeça" e dá Enter. Ele cria uma pílula (badge) vermelha. Você digita "Caminhada" e dá Enter, ele cria uma pílula verde.
- A IA deve categorizar visualmente as Tags pelas cores da categoria (Sintoma = Vermelho, Gatilho = Amarelo, Resgate = Verde).

## Vitals (Sobrevivência) em Grid Minimalista:

- Em vez de sliders lentos que exigem mouse, use botões de grupo ou inputs numéricos diretos de 1 a 5.
- Exemplo visual: [ Energia: (1) (2) (3) (4) (5) ] onde você navega com as setas do teclado e aperta espaço para marcar.

## Substâncias em Formato "Tabela Dinâmica":

- Quando você seleciona uma substância (ex: Ritalina), ela não vira apenas uma tag, ela abre uma "linha" rápida abaixo do input:
- 💊 Ritalina | Dose: [ 10mg ] | Fim do Efeito: [ 17:00 v ] | Crash? [ x ]
