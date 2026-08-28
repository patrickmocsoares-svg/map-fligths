# Executar tudo: cores, imagens dos destinos e preços sempre visíveis

Aprove aqui e eu executo tudo de uma vez (é o único jeito de eu sair do modo de planejamento e mexer no site).

## 1. Imagens dos destinos — fim das fotos erradas

Hoje o catálogo usa fotos externas por código do Unsplash e algumas não correspondem à cidade (Florianópolis mostra imagem da Grécia; Recife/Fortaleza e Brasília/BH repetem a mesma foto).

- Gerar uma imagem própria para cada destino do catálogo (Florianópolis, Rio, Salvador, Recife, Fortaleza, Manaus, Brasília, BH, Porto Alegre, Lisboa, Paris, Roma, Madri, Nova York, Miami, Orlando, Buenos Aires, Santiago, Cancún, Dubai etc.), com o marco visual característico de cada cidade.
- Guardar dentro do projeto e ligar cada imagem ao código do aeroporto. Nenhuma cidade compartilha foto com outra (exceto aeroportos da mesma cidade: GIG/SDU, GRU/CGH/VCP).

## 2. Preços sempre aparecendo na busca

- Ao buscar qualquer rota, se nenhum parceiro devolver tarifa real, a lista mostra voos estimados: rota nacional só com LATAM, GOL e Azul; rota internacional com companhias que realmente voam aquele trecho.
- A lista nunca mais volta em branco: mesmo com falha de parceiro, aparecem voos com horário, duração, conexões e preço, com o aviso de "estimativa" e o botão QUERO ECONOMIZAR.
- Clicar na imagem de uma promoção também abre a lista de voos daquela rota com preços.

## 3. Cores persuasivas (aplicadas de verdade no site)

Paleta nova aplicada nos tokens de estilo, valendo para o site inteiro:

- Fundo obsidiana `#0B0B0C` com dourado `#C9A227` nos detalhes e preços de destaque.
- Vermelho de urgência `#E11D2E` só em selos de promoção e contadores.
- Verde WhatsApp `#25D366` em todos os botões de conversão.
- Âmbar `#F59E0B` para selos de estimativa e "oferta quente".
- A seção "Buscar Passagens Aéreas" deixa de ser azul/branca e passa a seguir a mesma identidade preta e dourada do resto do site.

## 4. Frases persuasivas

Aplicar nos cards e chamadas: "Sua próxima viagem pode custar metade do que você imagina.", "Quem viaja com milhas paga menos. Sempre.", "Tarifa boa dura pouco — garanta a sua agora.", "Últimos assentos nesta tarifa".

## 5. Verificação e publicação

- Abrir o site no navegador e conferir com captura de tela: cores novas, card de Florianópolis com imagem correta e busca MOC → CNF e GRU → LIS mostrando preços.
- Publicar no fim, para que goldwing-travels.lovable.app fique igual ao preview.

## Detalhes técnicos

- Imagens em `src/assets/destinos/<iata>.jpg`, mapeadas em `src/lib/destinations.ts`; `destinationPhoto(code)` mantém a mesma assinatura, sem mexer em `PromoDealsSection`, `DealCard`, `flight.$id` ou `opportunities`.
- Cores nos tokens de `src/styles.css` e reescrita das classes azuis fixas de `RealFlightSearchSection.tsx` para tokens semânticos.
- Busca: `searchFlightsFallbackFn` já cai para o provedor estimado; ajustar o componente para nunca exibir estado vazio quando houver estimativas, e revisar `promo-flights.ts` para o clique na promoção.

Nada muda em `/solicitar`, no painel admin nem no pop-up de milhas.
