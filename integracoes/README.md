# Acompanhamento dos compradores no Google Sheets

O app é entregável pós-compra. Esta integração serve para você **acompanhar quem está
seguindo o plano e quem parou** — não para captar lead.

O app é estático e não tem backend. Um **Google Apps Script publicado como app da web**
recebe o progresso e mantém uma linha por pessoa na sua planilha.

```
app (navegador)  ──POST──▶  Apps Script  ──▶  planilha (1 linha por e-mail, atualizada)
```

## Passo a passo

1. **Crie a planilha** no Google Sheets. Pode deixar vazia — a aba `Acompanhamento` e o
   cabeçalho se criam sozinhos.

2. Nela, abra **Extensões › Apps Script**.

3. Apague o conteúdo do editor, cole o [`google-sheets.gs`](google-sheets.gs) e salve.

4. **Teste antes de publicar.** Execute a função `testar()` (botão ▶). O Google vai pedir
   autorização — é esperado, o script escreve na sua planilha. Confirme que a linha
   apareceu.

5. **Implantar › Nova implantação › App da Web**:
   - **Executar como:** Eu (sua conta)
   - **Quem pode acessar:** Qualquer pessoa

   Sem essas duas opções o app não consegue enviar nada.

6. Copie a URL gerada (termina em `/exec`) e cole em `app.js`:

   ```js
   const CONFIG = {
     sheetsEndpoint: "https://script.google.com/macros/s/AKfy.../exec",
   };
   ```

7. Faça o quiz no app e confirme que a linha entrou.

> **Toda vez que editar o `.gs`, publique de novo** (Implantar › Gerenciar implantações ›
> editar › Nova versão). Salvar no editor não atualiza o app publicado.

## O que a planilha mostra

| Coluna | Para quê |
|---|---|
| E-mail | o da compra — é o que cruza com a lista da plataforma de checkout |
| Nome, Sexo, Perfil | quem é e qual diagnóstico recebeu |
| Restrições alimentares | o que foi marcado no filtro |
| Início / Última atividade | quando começou e quando abriu pela última vez |
| **Dias parada** | fórmula automática — **é a coluna que você vai olhar** |
| Dias concluídos (de 90) | constância real |
| Fase atual | Fundação, Consolidação ou Leitura |
| Fotos registradas | quais dos 4 registros ela marcou |
| Respostas do quiz | JSON completo, para consulta |

Ordene por **Dias parada** (maior primeiro) e você tem, em cinco segundos, a lista de
quem abandonou e merece uma mensagem.

Uma linha por pessoa, sempre atualizada — a planilha não cresce sem controle.

## Quando o app envia

Ao concluir o quiz e a cada vez que a pessoa abre ou usa o app. O envio é adiado em
1,5 s para agrupar cliques em sequência.

## O que NÃO é enviado

**Humor e anotações do diário.** Decisão de projeto: a pessoa escreve coisas pessoais
ali, e ela é avisada na tela de que aquilo não sai do aparelho. Acompanhar constância
não exige ler desabafo. Não adicione esses campos ao payload.

## Limites que valem conhecer

- **O app não sabe quem comprou.** É um site estático: quem tiver o link entra. O e-mail
  pedido na abertura é declarado pela pessoa, não verificado. Cruzando a planilha com a
  lista de compradores da plataforma, e-mails que não batem aparecem — é assim que você
  descobre link vazado.
- **A URL do script fica pública** no JavaScript do app. Não há como esconder num site
  estático.
- **Falha não trava ninguém.** Sem rede, o app funciona normalmente e tenta enviar na
  próxima interação.
- **Sem endpoint configurado, nada sai do navegador** e o app não pede e-mail nenhum.

## LGPD

Você passa a guardar e-mail, nome e informação sobre saúde capilar de pessoas
identificadas. Aqui a base é boa — é execução do serviço que a pessoa comprou — mas as
obrigações continuam:

- deixe claro na tela o que é coletado e para quê (o app já mostra, quando o endpoint
  está configurado);
- tenha uma política de privacidade acessível;
- ofereça caminho para a pessoa pedir remoção dos dados;
- restrinja o acesso à planilha a quem realmente precisa;
- não use esses dados para outra finalidade sem avisar — acompanhamento é o combinado.

Dado sobre saúde tem proteção mais rígida que dado comum. Se a base crescer, vale uma
conversa com quem cuida do jurídico do seu negócio.
