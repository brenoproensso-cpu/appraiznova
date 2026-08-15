# Captura de e-mail no Google Sheets

O app é estático e não tem backend. Para guardar os leads numa planilha (e enviar o
plano por e-mail) usamos um **Google Apps Script publicado como app da web**: ele fica
entre o app e a sua planilha, e não custa nada.

```
app (navegador)  ──POST──▶  Apps Script  ──▶  planilha (linha nova)
                                         └──▶  e-mail para a pessoa
```

## Passo a passo

1. **Crie a planilha** no Google Sheets. Pode deixar vazia — a aba `Leads` e o
   cabeçalho são criados sozinhos no primeiro envio.

2. Nela, abra **Extensões › Apps Script**.

3. Apague o conteúdo do editor e cole o arquivo [`google-sheets.gs`](google-sheets.gs).
   Salve.

4. **Teste antes de publicar.** Na função `testar()`, troque o e-mail pelo seu e execute
   (botão ▶). O Google vai pedir autorização — é esperado, o script vai usar a sua conta
   para escrever na planilha e enviar e-mail. Confirme que a linha apareceu e que a
   mensagem chegou.

5. Clique em **Implantar › Nova implantação › App da Web** e configure:
   - **Executar como:** Eu (sua conta)
   - **Quem pode acessar:** Qualquer pessoa

   Sem essas duas opções o app não consegue enviar nada.

6. Copie a URL gerada (termina em `/exec`) e cole em `app.js`:

   ```js
   const CONFIG = {
     sheetsEndpoint: "https://script.google.com/macros/s/AKfy.../exec",
     enviarEmail: true,
   };
   ```

7. Faça o quiz no app até o fim e confirme que a linha entrou na planilha.

> **Toda vez que editar o `.gs`, publique de novo** (Implantar › Gerenciar implantações ›
> editar › Nova versão). Salvar no editor não atualiza o app da web publicado.

## O que fica gravado

| Coluna | Conteúdo |
|---|---|
| Data | quando o lead entrou |
| Nome | o primeiro nome digitado na abertura |
| E-mail | o e-mail informado |
| Sexo | trilha do quiz (feminino/masculino) |
| Perfil | o perfil calculado |
| Restrições alimentares | o que foi marcado no filtro |
| Respostas do quiz | JSON com todas as respostas |
| Origem | a URL de onde veio |

Se a mesma pessoa refizer o quiz, a linha é **atualizada** em vez de duplicada.

## Limites que valem conhecer

- **Cota de e-mail.** Conta Gmail comum envia ~100 e-mails/dia pelo Apps Script; Google
  Workspace, ~1.500. Passou disso, o envio falha silenciosamente no dia.
- **Entregabilidade.** O e-mail sai da sua conta Google, não de um domínio próprio.
  Funciona bem em volume baixo; se o funil crescer, migre para uma ferramenta de e-mail
  marketing de verdade.
- **A URL fica pública** no JavaScript do app — qualquer pessoa pode enviar dados para
  ela. Não há como esconder isso num site estático. O script já valida o e-mail e evita
  duplicatas; se aparecer lixo na planilha, o caminho é adicionar um campo isca
  (honeypot) ou trocar por um serviço com chave de API.
- **Falha não trava o usuário.** Se o envio der erro, a pessoa vê o resultado do mesmo
  jeito — o `fetch` do app ignora o erro de propósito.

## LGPD

Você passa a guardar nome e e-mail de pessoas junto com informação sobre saúde capilar.
Antes de publicar:

- deixe claro na tela de captura para que serve o e-mail (já está no texto);
- tenha uma política de privacidade acessível dizendo o que é coletado, por quê e por
  quanto tempo;
- ofereça um caminho para a pessoa pedir remoção;
- não compartilhe a planilha com quem não precisa dela.

Dado sobre saúde tem proteção mais rígida que dado comum. Se o volume crescer, vale
conversar com quem cuida do jurídico do seu negócio.
