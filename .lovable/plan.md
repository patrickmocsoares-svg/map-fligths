# Corrigir o envio das solicitações de orçamento para o WhatsApp

## O que está acontecendo hoje

O formulário funciona: a solicitação é salva no banco com protocolo, data e status inicial. O que falha é o envio da mensagem para o seu WhatsApp.

Diagnóstico feito agora, consultando a API oficial da Meta com as credenciais salvas no projeto:

- A resposta da Meta foi **401 — "Invalid OAuth access token"**.
- O valor salvo em `WHATSAPP_TOKEN` tem apenas 6 caracteres. Um token real da Meta tem ~200 caracteres e começa com `EAA`. Ou seja, foi salvo um valor de teste/placeholder, não o token verdadeiro.
- O ID do número (13 dígitos) e o número de destino (12 dígitos, começando com 5531) estão em formato válido.

Como o envio é "best-effort" (não pode derrubar o formulário do cliente), a falha é apenas registrada no log do servidor e ninguém percebe. Por isso a solicitação "some".

Há ainda uma segunda regra da Meta que vai bloquear o envio mesmo com o token certo: fora de uma janela de 24h de conversa, a Cloud API **só aceita mensagens de modelo (template) aprovado**. Texto livre só passa se o número de destino tiver enviado uma mensagem ao número da API nas últimas 24h. Também é obrigatório que o número de destino seja **diferente** do número conectado à Cloud API.

## O que será implementado

1. **Envio por template com fallback**
   `notify.server.ts` passa a tentar, nesta ordem:
   - mensagem de **template** (nome configurável em `WHATSAPP_TEMPLATE_NAME`, idioma `pt_BR`), com os dados da solicitação nos parâmetros;
   - se o template não estiver configurado ou for recusado, tenta o texto livre atual (funciona dentro da janela de 24h);
   - se ambos falharem, registra o erro.

2. **Nada de falha silenciosa**
   Cada tentativa passa a ser registrada na tabela `email_logs` (reaproveitando a estrutura existente, com `template = 'whatsapp_order'` e `status = sent|failed` + mensagem de erro). Assim o painel administrativo mostra se a notificação saiu ou não, com o motivo.

3. **Aviso visível no painel admin**
   Na tela de pedidos, um selo por pedido: "WhatsApp enviado" / "WhatsApp falhou — ver motivo". O pedido continua sempre salvo.

4. **Botão "Testar WhatsApp" no admin (rota protegida)**
   Dispara uma mensagem de teste para o número configurado e mostra o retorno exato da Meta (código e descrição). Isso permite validar a configuração sem precisar preencher o formulário público.

5. **Validação das credenciais**
   Se o token estiver ausente ou obviamente inválido (muito curto), o sistema registra "configuração inválida" em vez de tentar o envio.

## Passo a passo para você (obter o token correto)

1. Acesse `developers.facebook.com` → seu App → **WhatsApp → Configuração da API**.
2. Copie o **token de acesso** completo (começa com `EAA`). O token temporário dura 24h — para produção, gere um **token permanente**: Configurações do Negócio → Usuários do sistema → criar usuário do sistema com função de administrador → Gerar token → selecionar o App → permissões `whatsapp_business_messaging` e `whatsapp_business_management` → sem expiração.
3. Confirme o **ID do número de telefone** na mesma tela (é o campo "Identificação do número de telefone", não o número em si).
4. Confirme que o número que vai **receber** as solicitações (5531…) é diferente do número conectado à Cloud API e que ele está adicionado como destinatário de teste, caso o App ainda esteja em modo de desenvolvimento.
5. Me envie o aviso e eu abro o formulário seguro para você colar o token novo (o valor fica criptografado e nunca aparece no chat nem no código).
6. Crie na Meta um template de utilidade em `pt_BR` (sugestão de nome: `nova_solicitacao`) com corpo contendo variáveis para cliente, telefone, rota, datas e protocolo. Após aprovado, informo o nome no projeto.
7. Depois de tudo configurado, usamos o botão "Testar WhatsApp" no painel e, por fim, publicamos o app para valer também na versão publicada.

## Detalhes técnicos

- Arquivos afetados: `src/lib/orders/notify.server.ts` (transporte por template + log), `src/lib/orders.functions.ts` (gravação do resultado), rota admin de pedidos (selo de status) e uma nova server function protegida `sendWhatsAppTestFn` (exige papel admin).
- Novos secrets: `WHATSAPP_TEMPLATE_NAME` (opcional) e substituição do `WHATSAPP_TOKEN`.
- Nenhuma alteração no formulário público, no layout, nas cores, na busca, nos provedores ou em qualquer outra funcionalidade existente.
