# Evitar a tela branca do preview

## Situação atual (verificada)

A home foi carregada direto no servidor de desenvolvimento e renderizou normalmente, com o título "Transformando milhas em oportunidades" e **zero erros de console**. O log do servidor mostra a causa do erro que você viu:

```text
✨ new dependencies optimized: @radix-ui/react-dialog, clsx, tailwind-merge
✨ optimized dependencies changed. reloading
```

Ou seja: ao adicionar o modal de promoções, uma dependência nova foi descoberta e reotimizada no meio da sessão. A aba que já estava aberta ficou apontando para endereços de módulo antigos, o que gera "Importing a module script failed" e tela branca. É um efeito do ambiente de preview, não um defeito do código publicado.

## O que fazer

Declarar antecipadamente as dependências de UI usadas pelo site na configuração do Vite (`optimizeDeps.include`), para que sejam preparadas no arranque e não provoquem uma reotimização com recarregamento no meio do uso.

## Detalhes técnicos

- Arquivo: `vite.config.ts`
- Acrescentar um bloco `vite: { optimizeDeps: { include: [...] } }` ao `defineConfig` existente, listando as bibliotecas de interface já usadas no projeto (componentes Radix como dialog/popover/select, `clsx`, `tailwind-merge`, `lucide-react`, `date-fns`).
- Nenhum plugin novo é adicionado, nenhuma alteração visual ou de comportamento no site.

## Resultado esperado

Menos recarregamentos forçados durante a navegação no preview e, na prática, o fim desse tipo de tela branca ao abrir novas telas com componentes ainda não usados.
