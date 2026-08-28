# Corrigir imagens erradas dos destinos e a busca sem resultados

## O que eu confirmei agora

- **Imagem errada é real.** No catálogo de destinos (`src/lib/destinations.ts`) Florianópolis usa o mesmo código de foto do Unsplash que Porto Alegre (`1533105079780-...`) — uma foto genérica que não é de Florianópolis. O mesmo problema de foto repetida/genérica acontece em outros pares: Recife e Fortaleza compartilham a mesma imagem, e Brasília e Belo Horizonte também. São fotos externas escolhidas por ID, sem garantia do que aparece nelas.
- **A busca funciona no código atual.** O último build está OK e, no servidor, a cadeia Skyscanner → Travelpayouts → estimativa devolve voos. Ou seja, "nenhum resultado" no site que você está vendo não bate com o código atual — o mais provável é que o endereço publicado ainda sirva a versão anterior. Isso ainda **não está confirmado**, então o plano confirma isso antes de mexer na lógica.

## Plano

1. **Imagens 100% fiéis ao destino**: parar de depender de fotos externas por ID. Gerar uma imagem própria para cada destino do catálogo (Florianópolis, Rio, Salvador, Recife, Fortaleza, Manaus, Brasília, BH, Porto Alegre, Lisboa, Paris, Roma, Nova York, Miami, Buenos Aires, Santiago etc.), com o marco visual característico de cada cidade, e guardá-las dentro do projeto. Cada card de promoção passa a usar a imagem da sua própria cidade — nunca mais uma foto de outro lugar.
2. **Nenhuma imagem repetida**: cada código de aeroporto ganha a sua imagem. Cidades com dois aeroportos (Rio: GIG/SDU, São Paulo: GRU/CGH/VCP) compartilham a imagem da cidade, o que é correto.
3. **Confirmar por que a busca aparece vazia para você**: chamar a busca no ambiente publicado com a mesma rota que você testou e comparar com o resultado do servidor. Se for versão antiga, publicar de novo resolve. Se a resposta publicada vier realmente vazia, corrijo a causa antes de encerrar.
4. **Rede de segurança na busca**: garantir que, mesmo com falha de qualquer parceiro, a lista sempre traga voos estimados com companhias coerentes (nacional → LATAM/GOL/Azul; internacional → companhias que voam a rota), com o aviso de estimativa visível.
5. **Publicar** a versão corrigida para que o endereço público mostre exatamente o que já está no preview.

## Detalhes técnicos

- Novas imagens em `src/assets/destinos/<iata>.jpg`, importadas por um mapa em `src/lib/destinations.ts`; `destinationPhoto(code)` passa a devolver o asset local e mantém a mesma assinatura, então `PromoDealsSection`, `DealCard`, `flight.$id` e `opportunities` não mudam.
- Fallback de imagem apenas para códigos fora do catálogo.
- Verificação: rodar a home no navegador headless, capturar os cards de promoção e conferir visualmente que Florianópolis mostra praia/ilha do sul do Brasil, e testar uma rota nacional e uma internacional na seção "Buscar Passagens Aéreas".

Nada muda em `/solicitar`, no painel admin, no pop-up de milhas nem nos textos e cores atuais.
