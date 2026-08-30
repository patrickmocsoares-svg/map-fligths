# Nova paleta CRO: azul oceano, branco e laranja coral

Troca completa da identidade atual (preto obsidiana + dourado) por um tema claro focado em conversão, seguindo 60-30-10.

## Minha sugestão (leia antes de aprovar)

A paleta proposta funciona muito bem para conversão e credibilidade — é o padrão de Booking/Kayak/Decolar. O único ponto de atenção: o site hoje é "premium noturno" (preto/dourado, imagens cinematográficas). O tema claro deixa o visual mais comercial e menos luxuoso, mas tende a converter mais. Recomendo seguir com a mudança e manter o dourado apenas como detalhe fino no MAB Score (selo de qualidade), sem competir com o laranja.

## 1. Tokens de cor (base de tudo)

Reescrever os tokens em `src/styles.css`:

- Fundo geral `#FFFFFF`; seções alternadas e cards `#F8FAFC`.
- Azul dominante `#1A365D` para header, footer, painel de busca, títulos H1/H2, ícones institucionais; `#0077B6` nas barras secundárias, links e estados ativos.
- Texto principal em azul-escuro sobre claro, e `#FFFFFF` dentro de blocos escuros.
- Laranja de conversão `#FF6B35`, hover `#E85D04`, exclusivo para CTAs, badges de desconto/urgência, sliders e radios ativos.
- Verde WhatsApp mantido apenas nos botões de WhatsApp; vermelho de urgência sai (o laranja assume esse papel) para não poluir.
- Bordas, sombras e superfícies passam a claras (sombra suave cinza-azulada no lugar das sombras douradas).

## 2. Botões de conversão

Padrão único aplicado ao `btn-primary` e a todos os CTAs:

- Fundo `#FF6B35`, texto branco em negrito, cantos 8px.
- Hover: `#E85D04` com elevação e `box-shadow: 0 4px 12px rgba(255,107,53,0.4)`.
- Botões secundários viram contorno azul, nunca laranja, para o laranja continuar sendo o único ponto de atração.

## 3. Componentes a atualizar

Todos os pontos que hoje usam preto/dourado passam para o novo tema:

- Header e menu (azul `#1A365D`, texto branco, item ativo em `#0077B6`).
- Footer e barra de selos de segurança (azul, texto branco).
- Hero da home: imagem de destino com overlay azul-escuro em vez de preto, título branco, CTA laranja em destaque.
- Seção "Buscar Passagens Aéreas" e formulário de busca: painel azul com inputs brancos, botão de busca laranja.
- Promoções, cards de ofertas, resultados de busca, página de detalhe do voo, oportunidades, deals: cards brancos sobre `#F8FAFC`, preço em azul-escuro grande, badge de desconto laranja.
- Calendário, autocomplete de aeroportos, filtros e sliders: azul nos estados, laranja no ativo selecionado.
- Modais (economia com milhas, emissão com milhas), páginas de conta, alertas, login, `/solicitar` e painel admin seguem o mesmo tema claro.

## 4. Acessibilidade e verificação

- Garantir contraste WCAG AA: texto sobre laranja sempre branco negrito; texto secundário em cinza-azulado escuro, nunca cinza claro sobre branco.
- Conferir no navegador em desktop e mobile: home, busca com resultados, detalhe do voo, promoções, `/solicitar` e admin, com capturas de tela antes de finalizar.

## Detalhes técnicos

- Reescrita dos tokens `:root` e das utilities (`gold-gradient`, `card-luxe`, `hero-overlay`, `glass`, `header-scrolled`, `btn-primary`, `nav-link`) em `src/styles.css`, mantendo os nomes das classes para não quebrar componentes.
- Substituição das classes fixas `text-white`, `bg-white`, `text-*/70` e classes `gold` espalhadas em ~23 arquivos `.tsx` por tokens semânticos (`primary`, `accent`, `muted-foreground`, `card`).
- O token `gold` permanece definido, porém remapeado como detalhe do MAB Score; nenhuma lógica de negócio, provider, i18n ou fluxo de milhas é alterada.
