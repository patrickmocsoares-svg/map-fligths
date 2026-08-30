# Receber as solicitações de orçamento: e-mail + painel

## Respondendo à sua dúvida

Sim, dá para a mensagem cair no **seu** WhatsApp (o cliente nem vê). É exatamente isso que o site já tenta fazer hoje. O problema é só a credencial: o token salvo tem 6 caracteres e a Meta responde "token inválido" (erro 401), então a mensagem não sai. Para funcionar de verdade a Meta ainda exige um token permanente e um modelo de mensagem aprovado — burocrático.

Por isso vamos pelo caminho simples que você escolheu: **e-mail + painel do site**, que funciona sem depender da Meta. O envio para o WhatsApp fica preparado e é só ligar depois, quando você tiver o token correto.

## O que será feito

1. **E-mail automático para patrickmoc@hotmail.com**
   Assim que um cliente enviar o formulário, você recebe um e-mail com todos os dados: nome, e-mail, WhatsApp, origem, destino, datas, passageiros, observações, data/hora e protocolo. O e-mail terá um botão "Responder pelo WhatsApp" que já abre a conversa com o cliente, com mensagem pronta.

2. **Painel do site**
   Na área administrativa, cada pedido passa a mostrar se a notificação saiu ("Enviado") ou falhou ("Falhou — motivo"). Assim nada mais some em silêncio.

3. **Nada muda para o cliente**
   O formulário, a confirmação formal e o restante do site continuam exatamente iguais.

4. **WhatsApp fica pronto para ligar depois**
   O envio pela Meta continua no código, desativado enquanto o token não for válido. Quando você quiser, é só trocar o token e eu ativo — sem refazer nada.

## O que você precisa fazer (só isso)

Para o site poder enviar e-mails, ele precisa usar um domínio seu como remetente — no seu caso `tripmoc.com.br`. Eu abro a tela de configuração de e-mail e você só confirma o domínio; os registros de DNS aparecem prontos para copiar no seu provedor. Depois disso o envio começa a funcionar sozinho.

Se você preferir não mexer no DNS agora, o painel do site já lista todas as solicitações e podemos deixar o e-mail para uma segunda etapa.

## Detalhes técnicos

- Configurar o domínio de e-mail e gerar os modelos de e-mail do projeto.
- Novo modelo `nova-solicitacao` com os dados do pedido e link de WhatsApp do cliente.
- `src/lib/orders.functions.ts` passa a enviar o e-mail ao administrador após gravar o pedido, sem bloquear a resposta ao cliente.
- `src/lib/orders/notify.server.ts` passa a validar o token antes de tentar a Meta e a registrar o resultado (enviado/falhou + motivo) para exibição no painel.
- Nenhuma alteração em layout, cores, busca, provedores, ofertas, alertas, MAB Score ou autenticação.
