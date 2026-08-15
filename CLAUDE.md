# Protocolo Raiz Nova — contexto do projeto

App estático (HTML + CSS + JS, sem backend, estado em `localStorage`) que entrega um
diagnóstico educativo de queda capilar e um plano de 90 dias. Três arquivos:
`index.html` (templates), `app.js` (conteúdo + lógica), `styles.css`.

## Regras que valem para toda edição

### 1. Tudo que nomeia alimento ou receita passa pelo filtro

Qualquer conteúdo novo que cite um alimento, ingrediente ou receita **precisa** ser
coberto pelo filtro de restrições da aba Alimentação. Sem isso, o app volta a oferecer
abacate para quem tem alergia a látex e mel para quem é vegano.

Ao adicionar um item, atualize:

| Estrutura | Para quê |
|---|---|
| `FOOD_ALLERGENS` | alérgenos comuns que o item contém (selo "⚠ contém") |
| `FOOD_RESTRICTIONS` | quais marcadores retiram o item de "Coma mais" |
| `RECIPE_RESTRICTIONS` | quais marcadores bloqueiam a receita |
| `RECIPE_REASONS` | o motivo, em texto, de cada bloqueio |
| `SUBSTITUTIONS` | alternativa que preserva o nutriente perdido (com `keys` e `intoVeg`) |

E confira as telas que **nomeiam** receita fora da aba Receitas — hoje o Passo 2 da
rotina na aba Hoje. Ela precisa continuar escolhendo só receita liberada.

Teste rápido: marque `vegano`, `couro`, `latex` e `oleaginosa` e confirme que nada
desaconselhado aparece como recomendação em nenhuma aba.

### 2. Rastreio de evidência é obrigatório

Cada item de alimentação e cada receita exibe de onde vem a justificativa
(`EVIDENCE`, `evidenceOf`, `recipeEvidenceOf`). A regra não se afrouxa: se a explicação
não sai das revisões listadas em `SOURCES`, o item **não pode** aparecer como se saísse.

- `lit` — descrito nas revisões citadas
- `geral` — nutrição de senso comum, sem estudo para queda (entre em `FOOD_GERAL`)
- `lab` — estudo laboratorial/animal
- `cosm` — uso cosmético tradicional

Antes de afirmar que algo "está na literatura", confira nos PDFs de origem. Já
aconteceu de afirmar magnésio, taninos e colágeno como achados — nenhum estava lá.

### 3. Enquadramento educativo

O material não faz diagnóstico, não é consulta médica e não substitui avaliação
profissional. Isso aparece nas telas de entrada, resultado e app, e não deve ser
removido nem suavizado. Nada de prometer resultado, prazo de cura ou reversão.

### 4. Consistência entre abas

O plano é lido como uma coisa só. Se uma aba desaconselha algo, nenhuma outra pode
recomendar. Ao mudar conteúdo, verifique Hoje, Alimentação, Receitas e Entender.

## Conteúdo por sexo

O quiz tem trilhas separadas (`QUESTIONS_F`, `QUESTIONS_M`), porque a literatura
descreve padrões e mecanismos distintos: padrão masculino começa em têmporas e vértice
e é dependente de DHT (Hamilton-Norwood); o feminino é afinamento difuso da linha média
que poupa a implantação frontal (Ludwig), com fator androgênico incerto. Perfis, red
flags e biblioteca têm variantes por sexo (`bySex`, `LIBRARY_BY_SEX`).

## Fontes

As cinco revisões que sustentam o conteúdo estão em `SOURCES`, no fim de `app.js`, e
aparecem para o usuário na aba Entender. Conteúdo que não vem delas (segurança
alimentar, alergias) é declarado como tal na própria tela.

## Rodar e testar

```bash
npx http-server -p 8080 -c-1     # servidor estático na raiz do projeto
```

Não há suíte de testes. A verificação é dirigir o app num navegador headless
(Playwright está disponível globalmente) percorrendo as duas trilhas do quiz até o
dashboard, e conferir o console sem erros.

## Integrações pendentes

- `UPSELLS.advanced.checkoutUrl` e `UPSELLS.club.checkoutUrl` ainda são placeholder.
- `CONFIG.sheetsEndpoint` liga a captura de e-mail ao Google Sheets (ver `integracoes/`).
