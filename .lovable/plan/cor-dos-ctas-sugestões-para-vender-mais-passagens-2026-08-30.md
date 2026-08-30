# Cor dos CTAs + sugestões para vender mais passagens

## Minha sugestão de cor

Hoje esses quatro botões ("Emitir com milhas", "Conferir oferta", "Quero economizar", "Falar com um consultor") usam verde WhatsApp `#25D366`, que briga com a identidade azul/branco/laranja do site e tira a atenção do laranja de conversão.

Recomendação: **laranja coral `#FF6B35`** (hover `#E85D04`), texto branco em negrito, cantos 8px e sombra `0 4px 12px rgba(255,107,53,0.4)`. É a cor de conversão já definida na paleta CRO do site e faz esses botões serem o primeiro ponto de atenção da página.

Exceção proposta: onde o botão é literalmente "Falar no WhatsApp" (rodapé, modal de milhas), manter o verde com o ícone do WhatsApp — o usuário reconhece o canal. Todos os demais CTAs comerciais viram laranja.

Se preferir 100% laranja em tudo, também faço.

## O que muda na prática

- `MilesEmission.tsx` (Emitir com milhas / Conferir oferta) → laranja.
- `PromoDealsSection.tsx`, `OffersSections.tsx`, `RealFlightSearchSection.tsx`, `search.tsx` (Quero economizar) → laranja.
- `index.tsx` (CTA do hero / falar com consultor) → laranja.
- Verde mantido em: botão do rodapé e no modal de economia com milhas.
- Padrão único via classe utilitária `btn-cta` em `src/styles.css`, para não haver mais botões soltos com estilo próprio.

## Sugestões para alavancar faturamento (aprove as que quiser)

1. **Prova social e urgência** — selo "X pessoas consultaram esta rota hoje" e "tarifa sujeita a alteração" nos cards; aumenta cliques sem inventar dados de voo.
2. **Captura de lead antes do WhatsApp** — mini-form (nome + WhatsApp + rota) em 1 passo antes de abrir a conversa, para você recuperar quem não responde depois.
3. **Alertas de preço por WhatsApp** — usuário cadastra rota e recebe aviso; gera base recorrente de clientes.
4. **Landing pages por rota** (ex.: /passagens/montes-claros-para-lisboa) — SEO orgânico traz busca qualificada sem pagar anúncio.
5. **Barra fixa de conversão no mobile** — CTA laranja sempre visível ao rolar resultados.
6. **Depoimentos reais + protocolo de atendimento** na home, para credibilidade em compra de alto valor.
7. **Página "Como funciona a emissão com milhas"** com 3 passos e garantia — reduz objeção antes do WhatsApp.

Nesta etapa executo apenas a mudança de cor; os itens 1 a 7 entram nas próximas etapas conforme você escolher.

## Detalhes técnicos

Nova utility `btn-cta` em `src/styles.css` usando os tokens `--cta` / `--cta-hover`; substituição das classes `bg-whatsapp ...` nos arquivos listados. Nenhuma alteração em busca, provedores, milhas, aeroportos, autenticação ou admin.
