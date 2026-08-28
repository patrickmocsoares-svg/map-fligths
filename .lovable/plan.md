# Corrigir a busca vazia e a tela branca do preview

## O que os testes mostraram

Rodei a rota que aparece no seu último uso do site (MOC → CNF, 03/09) direto no servidor:

- O parceiro Travelpayouts devolveu **0 ofertas** (a API só retorna rota+data que já foram pesquisadas recentemente e estão em cache).
- O gerador de voos estimados devolveu **15 ofertas** corretas para essa mesma rota (LATAM/GOL/Azul, por ser rota nacional, a partir de R$ 1.682).

Ou seja: a regra de "se não achar voo real, mostrar voo estimado" funciona no código atual, mas a resposta que o seu navegador recebeu no preview veio marcada como `travelpayouts` com lista vazia — o resultado antigo, sem o passo de estimativa. Isso indica que a aba do preview ainda está servida por uma versão anterior do aplicativo, o mesmo motivo da tela branca ("Importing a module script failed").

A causa exata dessa resposta desatualizada ainda não está 100% confirmada, então o primeiro passo do plano é confirmá-la antes de mexer em qualquer lógica.

## Plano

1. **Confirmar o diagnóstico**: chamar a função de busca do servidor já publicada, com a mesma rota MOC → CNF, e comparar a resposta com o teste local. Isso diz se o problema é bundle antigo no navegador ou uma falha da estimativa no ambiente de produção.
2. **Garantir que a busca nunca volte vazia**: se a estimativa falhar no ambiente de produção (por exemplo, por um erro silencioso na geração), tratar a exceção e devolver as ofertas estimadas mesmo assim, sempre marcadas como estimativa.
3. **Deixar a origem do resultado visível**: a resposta passa a indicar claramente se veio de preço real ou de estimativa, e a seção "Buscar Passagens Aéreas" mostra esse selo no topo dos resultados — hoje o selo só aparece por card.
4. **Estado vazio honesto**: se ainda assim não houver nada, manter a mensagem com datas próximas sugeridas em vez de uma lista em branco.
5. **Reduzir a tela branca do preview**: declarar as dependências de interface em `optimizeDeps` do Vite, para que o Vite não faça uma reotimização com recarregamento no meio da navegação (foi isso que quebrou a aba quando o modal de promoções foi adicionado).

## Detalhes técnicos

- `src/lib/flights-fallback.functions.ts`: envolver as chamadas de Skyscanner e do provedor real em `try/catch` individuais e sempre cair para `devProvider.search(data)`; acrescentar um campo `source: "real" | "estimated"` ao retorno.
- `src/components/RealFlightSearchSection.tsx`: ler `source` e exibir o aviso de estimativa uma única vez acima da lista, mantendo o design e os botões "QUERO ECONOMIZAR".
- `vite.config.ts`: acrescentar `vite: { optimizeDeps: { include: [...] } }` com as bibliotecas de UI já usadas (Radix dialog/popover/select, `clsx`, `tailwind-merge`, `lucide-react`, `date-fns`).
- Verificação: nova execução da busca MOC → CNF e de uma rota internacional (GRU → LIS) confirmando ofertas retornadas com companhias coerentes com a rota.

Nada muda em `/solicitar`, no painel admin nem no pop-up de milhas.
