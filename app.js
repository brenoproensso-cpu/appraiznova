/* =============================================================================
   Protocolo Raiz Nova — app.js
   App estático, sem backend. Estado persistido em localStorage para que a
   pessoa possa fechar e voltar sem perder o diagnóstico e o progresso.

   AVISO DE CONTEÚDO: todo o material aqui é EDUCATIVO. Não faz diagnóstico,
   não é consulta médica e não substitui avaliação profissional. Os textos de
   base científica vêm das revisões listadas em SOURCES (fim do arquivo).

   O quiz tem TRILHAS SEPARADAS por sexo: a literatura descreve padrões,
   gatilhos e mecanismos distintos entre homens e mulheres — inclusive o
   argumento de que a alopecia androgenética masculina e a feminina são
   desordens diferentes. Perguntar a mesma coisa para os dois seria impreciso.
   ============================================================================= */

const STORAGE_KEY = "raizNova.v2";
const TOTAL_DAYS = 90;

/* =============================================================================
   ██  ACOMPANHAMENTO — EDITE AQUI  ██
   O app é entregável pós-compra: quem chega aqui já é cliente. O progresso vai
   para uma planilha para você acompanhar quem está seguindo o plano e quem
   parou. Passo a passo em integracoes/README.md.

   O que NÃO sobe, por decisão de projeto: o humor e as anotações do diário.
   São da pessoa. O que serve para acompanhar é constância, não desabafo.
   ============================================================================= */

const CONFIG = {
  // URL do app da web do Apps Script (termina em /exec).
  // Vazio = nada é enviado e o app funciona 100% offline.
  sheetsEndpoint: "",
};

/* ---------------------------------------------------------------------------
   1) QUIZ — pergunta de entrada + trilhas por sexo
   --------------------------------------------------------------------------- */

const Q_SEX = {
  id: "sexo",
  type: "single",
  title: "Para começar: este plano é para uma mulher ou para um homem?",
  hint: "A partir daqui as perguntas mudam. Padrão de queda, gatilhos e mecanismos são descritos de forma diferente para cada sexo. Se você está respondendo por outra pessoa, escolha o sexo dela.",
  options: [
    {
      id: "f", label: "Para uma mulher", tags: {},
      insight: "Na mulher, o padrão típico é o afinamento difuso da linha média, que poupa a implantação frontal — e o fator androgênico é considerado incerto. É por isso que as próximas perguntas vão para outro lugar.",
    },
    {
      id: "m", label: "Para um homem", tags: {},
      insight: "No homem, a queda de padrão começa nas regiões temporais e no vértice e é dependente de DHT. As próximas perguntas seguem esse mapa.",
    },
  ],
};

const Q_TEMPO = {
  id: "tempo",
  type: "single",
  title: "Há quanto tempo você notou esse aumento na queda?",
  hint: "",
  options: [
    { id: "menos1", label: "Menos de 1 mês", tags: { estresse: 1 } },
    { id: "1a3", label: "De 1 a 3 meses", tags: { estresse: 1, nutricional: 1 } },
    { id: "3a6", label: "De 3 a 6 meses", tags: { nutricional: 1 } },
    {
      id: "mais6", label: "Mais de 6 meses, sem melhora", tags: { genetico: 1 }, chronic: true,
      insight: "Seis meses sem melhora é o marco que muda a conduta. O eflúvio ligado a um gatilho costuma se resolver nesse intervalo — quando não se resolve, a investigação profissional deixa de ser opcional.",
    },
  ],
};

const Q_ALIMENTACAO = {
  id: "alimentacao",
  type: "single",
  title: "Como está sua alimentação hoje?",
  hint: "",
  options: [
    {
      id: "restritiva", label: "Faço dieta restritiva ou corto grupos alimentares", tags: { nutricional: 2 },
      insight: "Restrição dietética e perda de peso rápida estão entre os desencadeadores clássicos de eflúvio telógeno. Emagrecer e recuperar cabelo ao mesmo tempo costuma ser um pedido contraditório para o corpo.",
    },
    { id: "pouca_proteina", label: "Como pouca proteína no dia a dia", tags: { nutricional: 2 } },
    { id: "variada", label: "Alimentação variada e regular", tags: {} },
  ],
};

const Q_PRIORIDADE = {
  id: "prioridade",
  type: "single",
  title: "E hoje, o que mais te incomoda?",
  hint: "Vamos usar isso pra ordenar o seu plano.",
  options: [
    { id: "afinamento", label: "Sensação geral de cabelo mais fino", tags: {} },
    { id: "queda_visivel", label: "Ver muito fio no travesseiro, escova ou ralo", tags: {} },
    { id: "crescimento", label: "Cabelo que não cresce / demora a recuperar", tags: {} },
    { id: "forca", label: "Falta de brilho e força nos fios", tags: {} },
  ],
};

/* ------------------------------ trilha feminina ---------------------------- */

const QUESTIONS_F = [
  {
    id: "padrao",
    type: "single",
    title: "Como você descreveria a sua queda hoje?",
    hint: "Escolha a opção mais parecida com o que você vê no espelho.",
    options: [
      {
        id: "risca", label: "A risca do meio está mais larga — vejo mais couro cabeludo no topo", tags: { genetico: 2 },
        insight: "Esse é exatamente o padrão descrito na alopecia de padrão feminino: afinamento difuso, mais percebido na linha média, poupando a implantação frontal — a classificação de Ludwig. Note que ele NÃO é a mesma coisa que a calvície masculina.",
      },
      {
        id: "difusa", label: "Cai por toda a cabeça — mais fio solto em geral", tags: { estresse: 1, nutricional: 1 },
        insight: "Queda difusa costuma apontar para gatilho recente ou carência nutricional. É a família de causas mais reversível — e a que mais responde a rotina e prato.",
      },
      {
        id: "tracao", label: "Afinou nas têmporas e laterais, onde eu prendo o cabelo", tags: { habito: 2 },
        insight: "Afinamento no ponto onde o cabelo é tracionado é o sinal clássico de alopecia por tração. A boa notícia: é o tipo que mais responde a simplesmente mudar o penteado — desde que não vire quadro cicatricial.",
      },
      {
        id: "placas", label: "Em placas ou falhas bem delimitadas", tags: {}, redFlag: "placas",
        insight: "Falhas delimitadas têm causas próprias e pedem avaliação antes de qualquer rotina. Vamos continuar, mas isso vai aparecer com destaque no seu resultado.",
      },
    ],
  },
  Q_TEMPO,
  {
    id: "gatilho",
    type: "multi",
    title: "Algo destes aconteceu nos últimos 12 meses?",
    hint: "Pode marcar mais de um.",
    options: [
      {
        id: "parto", label: "Parto ou pós-parto", tags: { estresse: 2 },
        insight: "A queda pós-parto é um dos eflúvios telógenos mais bem descritos: vem 2 a 3 meses depois e costuma se resolver sozinha. Você provavelmente está no meio dela, não no começo.",
      },
      {
        id: "hormonio", label: "Comecei, troquei ou parei anticoncepcional / reposição hormonal", tags: { estresse: 2 },
        insight: "Mudanças hormonais são gatilho descrito de eflúvio telógeno — e o intervalo de 2 a 3 meses vale aqui também.",
      },
      {
        id: "menopausa", label: "Entrei na menopausa ou perimenopausa", tags: { genetico: 1, estresse: 1 },
        insight: "A alopecia de padrão feminino tem início mais tardio, por volta da quarta década, e piora após a menopausa. Não é coincidência de idade — é parte do quadro descrito.",
      },
      { id: "dieta", label: "Dieta restritiva ou perda de peso rápida", tags: { nutricional: 2 } },
      { id: "estresse_forte", label: "Período de estresse ou luto intenso", tags: { estresse: 2 } },
      { id: "cirurgia", label: "Cirurgia, febre alta ou doença recente", tags: { nutricional: 1, estresse: 1 } },
      { id: "nenhum_gatilho", label: "Nenhum desses", tags: { genetico: 1 }, exclusive: true },
    ],
  },
  {
    id: "ciclo",
    type: "single",
    title: "E sobre a sua menstruação hoje?",
    hint: "Esta pergunta parece deslocada — não é. Ela é uma das mais informativas do questionário.",
    options: [
      {
        id: "intenso", label: "Fluxo intenso ou prolongado", tags: { nutricional: 2 },
        insight: "Aqui está o motivo da pergunta: fluxo intenso é uma das principais rotas para deficiência de ferro — a carência nutricional mais comum do mundo e frequente em mulheres com queda capilar. Um exame de ferritina resolve a dúvida.",
      },
      { id: "irregular", label: "Ciclo irregular, ou tenho diagnóstico de SOP", tags: { genetico: 1, estresse: 1 } },
      { id: "regular", label: "Regular, sem alterações", tags: {} },
      { id: "sem_ciclo", label: "Não menstruo mais, ou uso método que suspende", tags: { genetico: 1 } },
    ],
  },
  {
    id: "habitos",
    type: "multi",
    title: "Quais desses fazem parte da sua rotina?",
    hint: "Pode marcar mais de um.",
    options: [
      { id: "calor", label: "Secador/chapinha quase todo dia, sem protetor térmico", tags: { habito: 2 } },
      { id: "tracao", label: "Rabo, coque ou trança apertada com frequência", tags: { habito: 2 } },
      { id: "quimica", label: "Alisamento, coloração ou química em sequência", tags: { habito: 2 } },
      {
        id: "aplique", label: "Apliques, mega hair ou tranças pesadas", tags: { habito: 2 },
        insight: "Peso e tração contínua no mesmo ponto de implantação são causa mecânica descrita de queda — e, mantidos por muito tempo, podem evoluir para dano permanente do folículo.",
      },
      { id: "lavagem", label: "Lavagem bem irregular (de mais ou de menos)", tags: { habito: 1 } },
      { id: "nenhum_habito", label: "Nenhum desses — já cuido bem por fora", tags: {}, exclusive: true },
    ],
  },
  {
    id: "sinais",
    type: "multi",
    title: "Você tem notado algum destes sinais?",
    hint: "Pode marcar mais de um.",
    options: [
      { id: "coceira", label: "Coceira, vermelhidão ou descamação no couro cabeludo", tags: {}, redFlag: "coceira" },
      { id: "familiar", label: "Mãe, avó ou irmã com rarefação parecida", tags: { genetico: 2 } },
      {
        id: "androgenico", label: "Mais pelos no rosto, acne ou oleosidade que aumentou", tags: { genetico: 1 },
        insight: "Esse conjunto costuma motivar investigação hormonal. Vale registrar e levar para a consulta — não para se assustar, mas porque muda o que o médico vai pedir.",
      },
      { id: "nenhum_sinal", label: "Nenhum desses", tags: {}, exclusive: true },
    ],
  },
  Q_ALIMENTACAO,
  Q_PRIORIDADE,
];

/* ------------------------------ trilha masculina --------------------------- */

const QUESTIONS_M = [
  {
    id: "padrao",
    type: "single",
    title: "Como você descreveria a sua queda hoje?",
    hint: "Escolha a opção mais parecida com o que você vê no espelho.",
    options: [
      {
        id: "entradas", label: "As entradas estão recuando — a linha frontal subiu", tags: { genetico: 2 },
        insight: "A queda de padrão masculino começa justamente pelas regiões temporais. É a base da classificação Hamilton-Norwood, que descreve sete estágios de evolução.",
      },
      {
        id: "coroa", label: "Está afinando no topo / na coroa", tags: { genetico: 2 },
        insight: "Vértice e têmporas são as duas frentes iniciais da miniaturização folicular no homem — e o processo é dependente de DHT.",
      },
      {
        id: "difusa", label: "Cai por toda a cabeça, sem padrão definido", tags: { estresse: 1, nutricional: 1 },
        insight: "Queda sem padrão definido aponta menos para herança e mais para gatilho recente ou carência — as causas mais reversíveis.",
      },
      {
        id: "placas", label: "Em placas ou falhas bem delimitadas", tags: {}, redFlag: "placas",
        insight: "Falhas delimitadas têm causas próprias e pedem avaliação antes de qualquer rotina.",
      },
    ],
  },
  Q_TEMPO,
  {
    id: "inicio",
    type: "single",
    title: "Com que idade você notou os primeiros sinais?",
    hint: "",
    options: [
      {
        id: "antes25", label: "Antes dos 25 anos", tags: { genetico: 2 },
        insight: "Quanto mais precoce a manifestação, mais exuberante tende a ser o quadro. Isso não é sentença — é o argumento mais forte para não adiar a avaliação, já que aqui o tempo conta a favor de quem age cedo.",
      },
      { id: "25a35", label: "Entre 25 e 35 anos", tags: { genetico: 1 } },
      {
        id: "depois35", label: "Depois dos 35 anos", tags: { genetico: 1 },
        insight: "A prevalência sobe com a idade: cerca de 30% dos homens aos 30 anos e 50% aos 50. É comum — o que não quer dizer que só reste aceitar.",
      },
      { id: "derrepente", label: "Não foi progressivo — começou de repente", tags: { estresse: 1 } },
    ],
  },
  {
    id: "familia",
    type: "single",
    title: "Tem histórico de rarefação ou calvície na família?",
    hint: "",
    options: [
      {
        id: "forte", label: "Sim — pai e/ou avô materno", tags: { genetico: 2 },
        insight: "O componente hereditário é forte e bem documentado, com agregação familiar clara em estudos com gêmeos. Herança define a tendência, não o ritmo: o que muda a curva é o acompanhamento.",
      },
      { id: "algum", label: "Sim, algum parente", tags: { genetico: 1 } },
      { id: "ninguem", label: "Ninguém que eu saiba", tags: {} },
      { id: "naosei", label: "Não sei dizer", tags: {} },
    ],
  },
  {
    id: "gatilho",
    type: "multi",
    title: "Algo destes aconteceu nos últimos 12 meses?",
    hint: "Pode marcar mais de um.",
    options: [
      { id: "estresse_forte", label: "Período de estresse ou luto intenso", tags: { estresse: 2 } },
      { id: "dieta", label: "Dieta restritiva ou perda de peso rápida", tags: { nutricional: 2 } },
      { id: "cirurgia", label: "Cirurgia, febre alta ou doença recente", tags: { nutricional: 1, estresse: 1 } },
      {
        id: "anabolizante", label: "Uso de anabolizante ou reposição de testosterona", tags: { genetico: 2 },
        insight: "Vale saber: a queda de padrão masculino é um processo dependente de di-hidrotestosterona. Aumentar a oferta de andrógenos em quem tem predisposição tende a acelerar o que já estava em curso. Converse sobre isso com quem acompanha o seu uso.",
      },
      { id: "medicamento", label: "Comecei algum medicamento contínuo novo", tags: { estresse: 1 } },
      { id: "nenhum_gatilho", label: "Nenhum desses", tags: { genetico: 1 }, exclusive: true },
    ],
  },
  {
    id: "couro",
    type: "single",
    title: "Como está o seu couro cabeludo?",
    hint: "",
    options: [
      {
        id: "seborreia", label: "Oleoso, com caspa ou descamação", tags: {}, redFlag: "coceira",
        insight: "Dermatite seborreica é comum, tratável e frequentemente ignorada. A literatura recomenda tratar as afecções do couro cabeludo justamente para obter melhores resultados no cuidado capilar — ou seja, resolver isso melhora tudo o mais que você fizer.",
      },
      { id: "coceira", label: "Coça, arde ou fica vermelho", tags: {}, redFlag: "coceira" },
      { id: "normal", label: "Normal, sem queixas", tags: {} },
    ],
  },
  Q_ALIMENTACAO,
  Q_PRIORIDADE,
];

const QUESTIONS_BY_SEX = { f: QUESTIONS_F, m: QUESTIONS_M };

function questionList(sex) {
  return sex ? [Q_SEX, ...QUESTIONS_BY_SEX[sex]] : [Q_SEX];
}

/* --------------------------- receitas (passo a passo) ---------------------- */

const RECIPES = {
  "tonico-alecrim": {
    name: "Tônico de alecrim fortalecedor",
    text: "Óleo de coco + alecrim, massageado no couro cabeludo — estimula a circulação da raiz.",
    freq: "2× por semana, à noite",
    time: "10 min de preparo · 3 min de massagem",
    ingredients: [
      "3 colheres (sopa) de óleo de coco",
      "2 ramos de alecrim fresco (ou 1 colher de chá seco)",
    ],
    steps: [
      "Aqueça o óleo de coco em banho-maria até ficar líquido — morno, nunca quente.",
      "Acrescente o alecrim e deixe em infusão por 10 minutos, fora do fogo.",
      "Coe e espere chegar à temperatura do corpo.",
      "Aplique só no couro cabeludo, dividindo o cabelo em partes.",
      "Massageie com as polpas dos dedos por 3 minutos, sem unha e sem esfregar.",
      "Deixe agir de 30 min a 1 hora e lave normalmente.",
    ],
    why: "O alecrim é um dos poucos ingredientes caseiros com investigação laboratorial: extratos hidroalcoólicos de alecrim aplicados em camundongos mostraram inibição da enzima 5-alfa-redutase, ligada à queda de padrão androgenético. É um resultado de laboratório e em animais — não equivale a tratamento comprovado em pessoas, mas explica por que o ingrediente aparece tanto.",
    caution: "Use alecrim em infusão, não óleo essencial puro na pele. Teste no antebraço 24 h antes.",
  },
  "mascara-abacate": {
    name: "Máscara nutritiva de abacate",
    text: "Repõe maciez em fios ressecados pelo calor e pela química.",
    freq: "1× por semana",
    time: "5 min de preparo · 20 min de pausa",
    ingredients: [
      "1/2 abacate bem maduro",
      "1 colher (sopa) de azeite de oliva extravirgem",
      "1 colher (sopa) do seu creme de sempre",
    ],
    steps: [
      "Amasse o abacate até não sobrar nenhum pedaço — grumo não sai do cabelo.",
      "Misture o azeite e o creme até virar um creme liso.",
      "Aplique do meio às pontas, com o cabelo úmido. Evite a raiz.",
      "Deixe 20 minutos e enxágue bem, com água morna.",
    ],
    why: "Abacate e azeite entram como emolientes: reduzem o atrito e a quebra do fio já formado. É cuidado da fibra — o que já cresceu — e não age no folículo.",
    caution: "Se o seu cabelo é fino e satura fácil, use só nas pontas.",
  },
  "enxague-vinagre": {
    name: "Enxágue de vinagre de maçã",
    text: "Fecha a cutícula e equilibra o pH do couro cabeludo.",
    freq: "1× a cada 15 dias",
    time: "2 min",
    ingredients: [
      "1 colher (sopa) de vinagre de maçã",
      "500 ml de água filtrada",
    ],
    steps: [
      "Dilua o vinagre na água — nunca aplique puro.",
      "Depois do condicionador, despeje devagar da raiz às pontas.",
      "Deixe 1 minuto e enxágue com água fria.",
    ],
    why: "O enxágue ácido ajuda a fechar a cutícula e dar brilho depois de produtos alcalinos. É efeito cosmético e imediato, no fio — não altera a queda.",
    caution: "Não use se houver ferida, descamação intensa ou couro cabeludo irritado.",
  },
  "mascara-babosa": {
    name: "Máscara de babosa (aloe vera)",
    text: "Ação calmante; ajuda a desobstruir resíduos ao redor do folículo.",
    freq: "1× por semana",
    time: "10 min de preparo · 20 min de pausa",
    ingredients: [
      "1 folha de babosa (só o gel transparente de dentro)",
      "1 colher (chá) de mel",
    ],
    steps: [
      "Corte a folha e deixe escorrer em pé por 15 minutos, para sair a seiva amarela.",
      "Lave bem o gel em água corrente e bata no liquidificador.",
      "Misture o mel e aplique no couro cabeludo.",
      "Deixe 20 minutos e lave.",
    ],
    why: "A babosa entra pelo conforto: sensação de alívio em couro cabeludo sensibilizado. Não trata dermatite nem caspa — se há descamação persistente, isso é avaliação médica.",
    caution: "A seiva amarela irrita a pele. Escorra sempre antes de usar.",
  },
  "oleo-ricino": {
    name: "Óleo de rícino para as pontas",
    text: "Sela a fibra capilar e reduz a quebra nas pontas.",
    freq: "2× por semana, nas pontas",
    time: "2 min",
    ingredients: [
      "3 gotas de óleo de rícino",
      "3 gotas de óleo vegetal leve (coco fracionado, girassol)",
    ],
    steps: [
      "Misture os dois óleos na palma da mão.",
      "Esfregue as mãos e aplique só nos últimos centímetros do cabelo.",
      "Use no cabelo úmido, depois da lavagem, sem enxaguar.",
    ],
    why: "Rícino é espesso e reduz a perda de água da fibra, o que diminui a quebra. Quebra não é queda: o fio parte no meio, não sai da raiz. Se o que você vê é fio curto e partido, este é o ponto certo.",
    caution: "Puro e em excesso, embaraça. Comece com 3 gotas.",
  },
  "spray-arroz": {
    name: "Spray de água de arroz",
    text: "Ritual tradicional para dar mais corpo e resistência ao fio.",
    freq: "2× por semana",
    time: "5 min de preparo",
    ingredients: [
      "1/2 xícara de arroz cru",
      "2 xícaras de água filtrada",
    ],
    steps: [
      "Lave o arroz, cubra com a água e deixe de molho por 30 minutos.",
      "Coe e guarde o líquido em um borrifador, na geladeira.",
      "Borrife no comprimento antes de pentear.",
      "Descarte o que sobrar em até 4 dias.",
    ],
    why: "A água de arroz deposita amido no fio e dá sensação de corpo. É efeito cosmético e temporário — sai na lavagem seguinte.",
    caution: "Guarde na geladeira. Fermentado por dias, cheira mal e irrita.",
  },
};

/* ------------------------------- perfis ------------------------------------ */

const PROFILES = {
  estresse: {
    name: "Eflúvio por Estresse & Hormônios",
    desc: "Suas respostas apontam para um gatilho recente — estresse, uma fase hormonal ou um evento físico forte. Esse tipo de queda costuma ser temporário e responde bem a rotina consistente + tempo.",
    bySex: {
      f: {
        desc: "Suas respostas apontam para um gatilho recente — parto, mudança hormonal, estresse ou um evento físico forte. É o eflúvio telógeno: a queda aparece 2 a 3 meses depois do evento, o que explica a sensação de que 'não aconteceu nada'. Costuma ser reversível, com reposição quase total dos fios em alguns meses.",
      },
      m: {
        desc: "Suas respostas apontam para um gatilho recente — estresse intenso, doença, cirurgia ou mudança forte de rotina. É o eflúvio telógeno: a queda aparece 2 a 3 meses depois do evento e costuma se resolver quando o fator é removido.",
      },
    },
    focus: [
      { icon: "🌙", title: "Priorize a calma no ritual", text: "A massagem do Passo 1 antes de dormir ajuda o corpo a sair do modo de alerta." },
      { icon: "🕰️", title: "Dê tempo ao ciclo", text: "Removido o gatilho, a literatura descreve reposição quase total dos fios em alguns meses — e há casos de resolução espontânea." },
      { icon: "📝", title: "Registre o gatilho", text: "Anotar o que mudou nos últimos meses ajuda a não repetir o padrão." },
    ],
    recipes: ["tonico-alecrim", "mascara-babosa"],
  },
  nutricional: {
    name: "Eflúvio Nutricional",
    desc: "Seu perfil aponta para uma possível lacuna nutricional — dieta restritiva, pouca proteína ou baixa reposição de ferro e zinco. O folículo costuma ser um dos primeiros lugares a sentir essa falta.",
    bySex: {
      f: {
        desc: "Seu perfil aponta para uma possível lacuna nutricional — dieta restritiva, pouca proteína, ou perda de ferro. A deficiência de ferro é a carência nutricional mais comum do mundo e aparece com frequência em mulheres com queda capilar; fluxo menstrual intenso é uma das rotas mais comuns para chegar nela. O folículo é um dos primeiros lugares do corpo a sentir a falta.",
      },
    },
    focus: [
      { icon: "🍽️", title: "O prato entra na rotina", text: "Seguir o guia alimentar aqui não é opcional — é onde a mudança real acontece." },
      { icon: "🥩", title: "Proteína em toda refeição", text: "Garanta uma fonte de proteína em pelo menos 3 refeições do dia." },
      { icon: "🩸", title: "Vale um exame", text: "Um exame de sangue simples confirma se ferro, zinco ou vitamina D estão baixos." },
    ],
    recipes: ["spray-arroz", "mascara-abacate"],
  },
  habito: {
    name: "Desgaste por Hábito",
    desc: "A maior parte da sua queda parece ligada a hábitos do dia a dia — calor, tração ou química em excesso — mais do que a uma causa interna. A boa notícia: isso está no seu controle.",
    focus: [
      { icon: "🔥", title: "Corte o calor sem proteção", text: "É o hábito com mais impacto imediato — nunca sem protetor térmico." },
      { icon: "🎀", title: "Solte o penteado", text: "Prenda com menos força e varie o ponto de tração." },
      { icon: "🛡️", title: "Proteja à noite", text: "Fronha de cetim/seda reduz o atrito que quebra o fio enquanto você dorme." },
    ],
    recipes: ["oleo-ricino", "enxague-vinagre"],
  },
  genetico: {
    name: "Padrão com Possível Componente Genético",
    desc: "O padrão descrito pode ter componente hereditário. Este guia ajuda a fortalecer e cuidar — mas aqui o acompanhamento profissional faz toda a diferença no resultado.",
    bySex: {
      f: {
        name: "Padrão Feminino com Componente Hormonal",
        desc: "Suas respostas se aproximam do que a literatura descreve como alopecia de padrão feminino: afinamento difuso, mais evidente na linha média, poupando a implantação frontal — o que a classificação de Ludwig organiza. Um detalhe importante: nas mulheres o fator androgênico é considerado incerto, e há argumento consolidado de que a forma feminina e a masculina são desordens distintas. Ou seja, o que vale para eles não vale automaticamente para você — inclusive em tratamento. Este material apoia o cuidado diário; quem define conduta é o dermatologista.",
      },
      m: {
        name: "Padrão Masculino (Hamilton-Norwood)",
        desc: "Suas respostas se aproximam do que a literatura descreve como alopecia androgenética masculina: miniaturização folicular começando pelas regiões temporais e pelo vértice, em um processo dependente de di-hidrotestosterona. É a forma mais comum de queda no homem — cerca de 30% aos 30 anos e 50% aos 50 — e é progressiva, o que torna o tempo a variável mais valiosa. Existem condutas consagradas e estudadas; quem indica é o dermatologista, e chegar cedo amplia o que é possível fazer.",
      },
    },
    focus: [
      { icon: "🩺", title: "Marque uma avaliação", text: "Um dermatologista confirma o padrão e indica o que mais somar ao seu cuidado." },
      { icon: "🌿", title: "Cuide do que está no seu controle", text: "A rotina do Protocolo Raiz Nova ainda ajuda a manter o couro cabeludo saudável." },
      { icon: "📸", title: "Acompanhe com fotos", text: "Fotos mensais, mesma luz e ângulo, ajudam a enxergar mudanças reais." },
    ],
    recipes: ["tonico-alecrim", "oleo-ricino"],
  },
};

const REDFLAG_MESSAGES = {
  placas: "Queda concentrada em placas específicas pode ter causas variadas — o ideal é um dermatologista avaliar antes de seguir qualquer rotina.",
  coceira: "Coceira, vermelhidão ou descamação no couro cabeludo podem indicar uma condição que pede avaliação profissional. Tratar a afecção do couro cabeludo costuma melhorar o resultado de todo o resto do cuidado.",
  chronic: "Mais de 6 meses de queda persistente, sem melhora, é motivo suficiente para buscar uma avaliação profissional junto com a rotina.",
};

/* ---------------------------------------------------------------------------
   RASTREIO DE EVIDÊNCIA
   Cada recomendação de comida e cada receita carrega, na tela, de onde vem a
   justificativa. A regra é simples e não deve ser afrouxada: se a explicação
   não sai das revisões listadas em SOURCES, o item NÃO pode aparecer como se
   saísse. Um plano alimentar que mistura achado de revisão com senso comum,
   sem distinguir os dois, engana mesmo quando cada frase isolada é verdadeira.
   --------------------------------------------------------------------------- */

const EVIDENCE = {
  lit:   { label: "descrito nas revisões citadas", cls: "src--lit" },
  geral: { label: "prática alimentar geral, sem estudo para queda", cls: "src--geral" },
  lab:   { label: "estudo em laboratório e em animais", cls: "src--lab" },
  cosm:  { label: "uso cosmético tradicional, sem estudo para queda", cls: "src--cosm" },
};

/* Itens cuja justificativa é nutrição geral — verdadeira, porém sem estudo
   específico ligando aquilo à queda capilar nas revisões que sustentam o app. */
const FOOD_GERAL = new Set([
  "Carboidrato integral (arroz integral, aveia, batata-doce)",
  "Excesso de cafeína",
  "Álcool com frequência",
  "Ultraprocessado como base do dia",
  "Ultraprocessado como base",
  "Ultraprocessado e excesso de gordura saturada",
  "Arroz com feijão (o prato inteiro)",
  "Cortar grupos alimentares inteiros por conta própria",
  "Café e chá preto junto das refeições",
  "Água",
  "Café ou chá preto",
  "Proteína",
  "Proteína no café da manhã",
  "Fotos a cada 30 dias",
  "Cuidado alimentar",
]);

const evidenceOf = (label) => (FOOD_GERAL.has(label) ? "geral" : "lit");

/* Só o alecrim tem investigação laboratorial nas revisões. As demais receitas
   são cuidado cosmético de tradição — e são apresentadas como tal. */
const RECIPE_EVIDENCE = { "tonico-alecrim": "lab" };
const recipeEvidenceOf = (id) => RECIPE_EVIDENCE[id] || "cosm";

/* ---------------------------------------------------------------------------
   ALERGIAS E INTOLERÂNCIAS
   O plano alimentar recomenda peixe, frutos do mar, castanhas, ovo, leite e
   aveia — seis dos alimentos que mais causam reação. Um plano que sugere
   comida sem sinalizar isso transfere para o leitor um risco que é nosso.
   Esta seção NÃO vem das revisões sobre queda capilar: é informação de
   segurança alimentar, e está marcada como tal na tela.
   --------------------------------------------------------------------------- */

const ALLERGEN_LABELS = {
  peixe: "peixe",
  frutosdomar: "frutos do mar",
  oleaginosa: "castanhas e nozes",
  ovo: "ovo",
  leite: "leite",
  gluten: "glúten",
};

const FOOD_ALLERGENS = {
  "Peixes gordos (sardinha, salmão, atum)": ["peixe"],
  "Ovos": ["ovo"],
  "Castanhas, nozes, chia e linhaça": ["oleaginosa"],
  "Carboidrato integral (arroz integral, aveia, batata-doce)": ["gluten"],
  "Carne vermelha magra, frango, peixe": ["peixe"],
  "Semente de abóbora, castanha de caju, carne, frutos do mar": ["oleaginosa", "frutosdomar"],
  "Ovos, laticínios, peixes gordos": ["ovo", "leite", "peixe"],
  "Peixes, castanhas e sementes": ["peixe", "oleaginosa"],
  "Peixes, legumes, frutas, leguminosas e oleaginosas": ["peixe", "oleaginosa"],
};

const ANAPHYLAXIS = "Inchaço de lábios, língua ou garganta, falta de ar, tontura ou urticária espalhada depois de comer é emergência médica — procure atendimento imediatamente, não espere passar. E nunca reintroduza por conta própria um alimento que já causou reação: isso se faz com acompanhamento.";

/* Filtro da aba Alimentação: a pessoa marca o que não pode comer e o plano
   se reorganiza. Vale mais que avisar depois — o alimento problemático nem
   chega a ser recomendado. */
const DIET_OPTIONS = [
  { id: "peixe", label: "Alergia a peixe" },
  { id: "frutosdomar", label: "Alergia a frutos do mar" },
  { id: "oleaginosa", label: "Alergia a castanhas e nozes" },
  { id: "ovo", label: "Alergia a ovo" },
  { id: "leite", label: "Alergia ao leite ou intolerância à lactose" },
  { id: "gluten", label: "Doença celíaca ou sem glúten" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "vegano", label: "Vegano" },
  { id: "latex", label: "Alergia a látex (abacate, banana, kiwi)" },
  { id: "couro", label: "Couro cabeludo sensível, com dermatite ou ferida" },
  { id: "gestante", label: "Grávida ou amamentando" },
];

/* Quais marcadores desaconselham cada receita. O critério aqui é diferente do
   da comida: uso tópico com teste de contato não é o mesmo que ingerir um
   alérgeno. Por isso a receita não some — ela aparece bloqueada, com o motivo. */
const RECIPE_RESTRICTIONS = {
  "tonico-alecrim": ["oleaginosa", "couro", "gestante"],
  "mascara-abacate": ["latex"],
  "enxague-vinagre": ["couro"],
  "mascara-babosa": ["vegano", "couro"],
  "oleo-ricino": ["oleaginosa"],
  "spray-arroz": [],
};

/* Por que cada marcador desaconselha — texto mostrado no lugar da receita. */
const RECIPE_REASONS = {
  oleaginosa: "leva óleo de coco ou de girassol; coco é tratado como castanha em várias classificações de alérgenos",
  latex: "leva abacate, que reage cruzado com alergia a látex (a chamada síndrome látex-fruta)",
  couro: "é aplicada no couro cabeludo, e pele lesada, inflamada ou com dermatite não deve receber preparo caseiro",
  vegano: "leva mel, de origem animal",
  gestante: "leva alecrim, cujo uso costuma ser evitado na gestação sem orientação profissional",
};

/* Quais restrições conflitam com cada item do plano. */
const FOOD_RESTRICTIONS = {
  "Peixes gordos (sardinha, salmão, atum)": ["peixe", "vegetariano"],
  "Ovos": ["ovo", "vegano"],
  "Castanhas, nozes, chia e linhaça": ["oleaginosa"],
  "Carboidrato integral (arroz integral, aveia, batata-doce)": ["gluten"],
  "Carne vermelha magra, frango, peixe": ["peixe", "vegetariano"],
  "Semente de abóbora, castanha de caju, carne, frutos do mar": ["oleaginosa", "frutosdomar", "vegetariano"],
  "Ovos, laticínios, peixes gordos": ["ovo", "leite", "peixe", "vegetariano"],
  "Peixes, castanhas e sementes": ["peixe", "oleaginosa", "vegetariano"],
  "Peixes, legumes, frutas, leguminosas e oleaginosas": ["peixe", "oleaginosa", "vegetariano"],
};

/* Gestação não retira alimento do plano — muda o que precisa ser conversado
   no pré-natal. Por isso entra como nota, e não como filtro. */
const GESTANTE_NOTES = [
  "Peixes de grande porte (tubarão, peixe-espada, cavala-rei e atum em excesso) acumulam mercúrio e têm consumo limitado na gestação. Sardinha e salmão continuam entre as opções bem aceitas — confirme a frequência no seu pré-natal.",
  "Fígado e suplementos de vitamina A são desaconselhados no período, pelo risco próprio do excesso de vitamina A. Este plano já não inclui fígado por esse motivo.",
  "Chá verde tem cafeína e taninos: a recomendação de cafeína é mais restrita na gestação, e os taninos competem com a absorção do ferro — que costuma ser exatamente o ponto de atenção da fase.",
  "Nenhum suplemento por conta própria. Ferro, vitamina D e ácido fólico na gestação são prescritos e acompanhados, e a dose faz diferença nos dois sentidos.",
];

const SUBSTITUTIONS = [
  {
    keys: ["peixe", "frutosdomar"],
    out: "Não come peixe ou frutos do mar",
    keep: "ômega-3 e vitamina D",
    into: "Chia, linhaça e nozes cobrem a gordura insaturada. Para vitamina D, ovo, alimentos fortificados e exposição solar — e, se houver suspeita de deficiência, exame antes de qualquer reposição.",
    intoVeg: "Chia, linhaça, nozes e algas cobrem a gordura insaturada. A vitamina D passa a depender de sol e de alimentos fortificados — é um dos pontos que mais pedem exame e acompanhamento em dieta sem produto animal.",
  },
  {
    keys: ["oleaginosa"],
    out: "Alergia a castanhas e nozes",
    keep: "gordura boa e zinco",
    into: "Azeite de oliva, abacate e sementes (abóbora, girassol) quando toleradas. Zinco também vem de carnes. Atenção à contaminação cruzada: produtos 'pode conter' não servem para alergia verdadeira.",
    intoVeg: "Azeite de oliva, abacate e sementes (abóbora, girassol) quando toleradas. Sem castanhas e sem carne, o zinco fica restrito a leguminosas e grãos integrais, de onde se absorve menos — essa combinação de restrições é a que mais pede acompanhamento profissional. Atenção à contaminação cruzada: produtos 'pode conter' não servem para alergia verdadeira.",
  },
  {
    keys: ["ovo"],
    out: "Alergia a ovo",
    keep: "proteína completa",
    into: "Carnes, peixes, e a combinação de leguminosa com cereal (arroz com feijão) fecham o perfil de aminoácidos sem ovo.",
    intoVeg: "Leguminosa com cereal — arroz com feijão, grão-de-bico com trigo — fecha o perfil de aminoácidos sem nenhum produto animal.",
  },
  {
    keys: ["leite"],
    out: "Alergia à proteína do leite ou intolerância à lactose",
    keep: "proteína e cálcio",
    into: "Carnes, ovos, leguminosas e vegetais verde-escuros. Intolerância à lactose e alergia ao leite são coisas diferentes — a primeira admite versões sem lactose, a segunda exige exclusão total.",
    intoVeg: "Leguminosas, tofu, gergelim e vegetais verde-escuros. Sem laticínio e sem carne, cálcio e B12 passam a exigir atenção específica e acompanhamento.",
  },
  {
    keys: ["gluten"],
    out: "Doença celíaca ou sensibilidade ao glúten",
    keep: "carboidrato integral",
    into: "Arroz integral, batata-doce, mandioca, milho e quinoa. Aveia é o ponto de atenção: costuma ser contaminada por trigo no processamento, então só a certificada sem glúten.",
  },
  {
    keys: ["vegetariano", "vegano"],
    out: "Vegetariano ou vegano",
    keep: "ferro, zinco e B12",
    into: "Leguminosas e folhas escuras com fonte de vitamina C na mesma refeição melhoram o aproveitamento do ferro vegetal. B12 é o ponto que exige acompanhamento profissional — não se resolve só com escolha de alimento.",
  },
];

/* Avisos de segurança que valem para qualquer perfil. */
const SAFETY_FOOD = [
  "<strong>Gestação e amamentação mudam tudo.</strong> Necessidades, limites e alimentos desaconselhados são outros — inclusive fígado e suplementos de vitamina A. Nesta fase, qualquer ajuste alimentar deve passar por quem faz o seu pré-natal.",
  "<strong>Condições de saúde e medicamentos vêm antes deste plano.</strong> Doença renal, hepática, diabetes, distúrbios da tireoide, doença celíaca, hemocromatose (excesso de ferro) e uso contínuo de medicamentos exigem orientação individual. Se você tem qualquer uma, trate este material como leitura, não como plano.",
  "<strong>Alergias e intolerâncias têm prioridade sobre qualquer recomendação daqui.</strong> Nenhum alimento citado é indispensável — todos têm substituto, e a tabela logo abaixo mostra qual.",
  "<strong>Quantidade não é conteúdo educativo.</strong> As frequências sugeridas são pontos de partida de bom senso, não prescrição. Dose de nutriente e reposição só com médico ou nutricionista, a partir de exames.",
  "<strong>Nada aqui é indicação de suplemento.</strong> As revisões usadas apontam o contrário do que o mercado sugere: repor sem deficiência não traz ganho e, em vitamina A e selênio, causa queda.",
];

const SAFETY_RECIPES = [
  "<strong>Teste antes.</strong> Aplique uma pequena quantidade no antebraço e espere 24 horas. Vermelhidão, ardência ou coceira significam não usar — em nenhuma diluição.",
  "<strong>Couro cabeludo com ferida, dor, descamação intensa ou inflamação não recebe receita caseira.</strong> Isso é avaliação médica, e insistir pode piorar o quadro.",
  "<strong>Nada de óleo essencial puro na pele.</strong> Alecrim aqui é infusão. Óleos essenciais concentrados são causa comum de dermatite de contato.",
  "<strong>Gestantes, lactantes, crianças e pessoas com dermatite, psoríase ou alergia a plantas</strong> devem confirmar com um profissional antes de usar qualquer preparo — inclusive os 'naturais'.",
  "<strong>Alergia alimentar também reage na pele.</strong> Quem tem alergia a látex pode reagir a abacate (a chamada síndrome látex-fruta, que envolve ainda banana e kiwi); quem reage a plantas aromáticas pode reagir ao alecrim; a babosa é da mesma família do alho e da cebola. Se um ingrediente te faz mal comendo, não o use no cabelo.",
  "<strong>Preparo caseiro estraga.</strong> Respeite a validade indicada em cada receita e descarte o que sobrar.",
];

/* ---------------------------------------------------------------------------
   ALIMENTAÇÃO — plano por perfil
   --------------------------------------------------------------------------- */

const FOOD_PLAN = {
  estresse: {
    kicker: "alimentação · perfil estresse e hormônios",
    headline: "Comer para sair do modo de alerta",
    lede: "Em fases de estresse o corpo trabalha com o custo aumentado e o cortisol alto — e o cortisol degrada as substâncias que integram a matriz ao redor do folículo. Aqui a alimentação não é o gatilho da sua queda, mas é o que sustenta a recuperação enquanto o ciclo se reorganiza. Regularidade importa mais que perfeição: pular refeição e passar horas em jejum mantém o corpo exatamente no estado do qual você quer sair.",
    plate: [
      { label: "Vegetais e frutas coloridas", pct: 40, color: "var(--sage)" },
      { label: "Proteína", pct: 25, color: "var(--terracota)" },
      { label: "Carboidrato integral", pct: 25, color: "var(--plum)" },
      { label: "Gordura boa", pct: 10, color: "var(--warn-line)" },
    ],
    plateFoot: "Três refeições com essa proporção valem mais que um dia perfeito seguido de dois pulando o almoço.",
    yes: [
      { food: "Peixes gordos (sardinha, salmão, atum)", how: "2 a 3× por semana", why: "Fonte de ômega-3 e de vitamina D — a vitamina D atua sobre os queratinócitos por meio do seu receptor (VDR), e a deficiência é comum na população." },
      { food: "Ovos", how: "diariamente, se possível", why: "Proteína completa e barata. O fio é feito de queratina: sem aporte proteico constante, o folículo entra na fila das prioridades do corpo." },
      { food: "Folhas verde-escuras (couve, espinafre, rúcula)", how: "no almoço e no jantar", why: "Trazem folato e ferro não-heme — os dois aparecem entre os micronutrientes ligados ao ciclo do folículo. Alterações em cabelo, pele e unhas estão entre os sinais descritos de falta de folato." },
      { food: "Castanhas, nozes, chia e linhaça", how: "1 punhado por dia", why: "Gordura insaturada e polifenóis, o núcleo do padrão alimentar mediterrâneo, associado na literatura a menor risco de alopecia." },
      { food: "Chá verde", how: "1 a 2 xícaras por dia, fora das refeições", why: "Rico em EGCG, polifenol que em estudos mostrou inibição da 5-alfa-redutase — embora revisão brasileira trate o efeito como possível, e não estabelecido. Importante: chá também tem taninos, que atrapalham a absorção do ferro. Tome longe do almoço e do jantar." },
      { food: "Carboidrato integral (arroz integral, aveia, batata-doce)", how: "em todas as refeições principais", why: "Evita as quedas de glicose que puxam mais cortisol. Cortar carboidrato numa fase de estresse costuma piorar os dois problemas." },
    ],
    no: [
      { food: "Jejum prolongado e dieta muito restritiva", how: "evite nesta fase", why: "Restrição calórica intensa e jejum prolongado estão entre os desencadeadores clássicos de eflúvio telógeno. Não é hora de somar um gatilho a outro." },
      { food: "Excesso de cafeína", how: "no máximo 2 a 3 xícaras, e não após as 16h", why: "Não causa queda — mas piora o sono, e o sono ruim mantém o cortisol elevado." },
      { food: "Álcool com frequência", how: "modere", why: "Atrapalha o sono profundo e o aproveitamento de vitaminas do complexo B." },
      { food: "Ultraprocessado como base do dia", how: "troque o que der", why: "Substitui alimento denso em micronutriente por caloria vazia, justamente quando a demanda está alta." },
    ],
    combos: [
      { a: "Feijão ou lentilha", b: "Suco de laranja / limão na salada", gain: "A vitamina C melhora a absorção intestinal do ferro não-heme — é a dupla mais custo-efetiva do prato." },
      { a: "Café ou chá preto", b: "Longe das refeições", gain: "Os taninos competem com a absorção do ferro. Deixe pelo menos 1 hora depois do almoço." },
    ],
  },

  nutricional: {
    kicker: "alimentação · perfil nutricional",
    headline: "Aqui, o prato é o tratamento",
    lede: "Nos outros perfis a alimentação é suporte. No seu, ela é a intervenção principal. Cerca de 90% dos folículos do couro cabeludo estão na fase de crescimento a qualquer momento — e essa fase depende de aporte contínuo de proteína, vitaminas e minerais. Quando falta, o corpo desliga o que é menos essencial à sobrevivência primeiro, e o cabelo está bem no topo dessa lista. A deficiência de ferro é a carência nutricional mais comum do mundo e aparece com frequência em mulheres com queda.",
    plate: [
      { label: "Proteína", pct: 35, color: "var(--terracota)" },
      { label: "Vegetais e frutas", pct: 35, color: "var(--sage)" },
      { label: "Carboidrato integral", pct: 20, color: "var(--plum)" },
      { label: "Gordura boa", pct: 10, color: "var(--warn-line)" },
    ],
    plateFoot: "A meta prática: uma fonte de proteína em pelo menos 3 refeições, todos os dias, sem exceção.",
    yes: [
      { food: "Carne vermelha magra, frango, peixe", how: "proteína em 3 refeições/dia", why: "Ferro heme — a forma que o corpo absorve melhor. O ferro é cofator da enzima que limita a velocidade da síntese de DNA, essencial em células que se dividem rápido, como as da matriz do folículo. (Fígado é riquíssimo em ferro, mas também em vitamina A pré-formada, cujo excesso causa queda — e é desaconselhado na gestação. Por isso ele não entra aqui como recomendação de rotina.)" },
      { food: "Feijão, lentilha, grão-de-bico, ervilha", how: "no almoço e no jantar", why: "Ferro não-heme + proteína vegetal. Absorve menos que o da carne, por isso a combinação com vitamina C importa tanto." },
      { food: "Frutas cítricas, acerola, pimentão, goiaba", how: "junto das refeições com ferro", why: "A vitamina C tem efeito quelante e redutor que favorece a absorção e a mobilização do ferro — a literatura a recomenda especificamente para quem tem queda por deficiência de ferro." },
      { food: "Semente de abóbora, castanha de caju, carne, frutos do mar", how: "diariamente em pequenas porções", why: "Zinco. A deficiência de zinco está descrita como causa de eflúvio telógeno e de fio fino e quebradiço." },
      { food: "Ovos, laticínios, peixes gordos", how: "todos os dias", why: "Proteína completa mais vitamina D — os dois pilares que costumam faltar em quem cortou grupos alimentares." },
      { food: "Arroz com feijão (o prato inteiro)", how: "o básico, feito direito", why: "A combinação clássica fecha o perfil de aminoácidos. Não é conselho nostálgico: é a base mais acessível de proteína completa do país." },
    ],
    no: [
      { food: "Dieta restritiva, jejum prolongado, 'detox'", how: "interrompa enquanto houver queda", why: "Restrição dietética e perda de peso rápida são causas descritas de eflúvio telógeno. Continuar restringindo enquanto o cabelo cai é remar contra a própria recuperação." },
      { food: "Cortar grupos alimentares inteiros por conta própria", how: "não faça sem acompanhamento", why: "Dietas que excluem carne, laticínio ou grãos podem funcionar — mas exigem planejamento para não abrir lacuna de ferro, zinco e B12." },
      { food: "Café e chá preto junto das refeições", how: "afaste 1 hora", why: "Taninos reduzem a absorção do ferro exatamente na refeição em que você mais precisa dele." },
      { food: "Suplementar por conta própria 'para o cabelo'", how: "faça exame antes", why: "Reposição sem deficiência não traz ganho e pode fazer mal — veja os mitos abaixo. Ferritina, vitamina D, zinco e tireoide são exames simples." },
    ],
    combos: [
      { a: "Feijão / lentilha / folhas escuras", b: "Laranja, limão ou acerola na mesma refeição", gain: "Aumenta a absorção do ferro vegetal. É a mudança de maior impacto e de menor esforço deste plano." },
      { a: "Proteína", b: "Em toda refeição, não só no jantar", gain: "Distribuir ao longo do dia aproveita melhor que concentrar tudo em uma refeição." },
      { a: "Exame de ferritina", b: "Antes de qualquer suplemento de ferro", gain: "A ferritina reflete o estoque corporal de ferro e é o marcador usado nos estudos de queda capilar." },
    ],
  },

  habito: {
    kicker: "alimentação · perfil hábito",
    headline: "A comida não é a vilã do seu caso — é o material de reconstrução",
    lede: "Seja honesto com o diagnóstico: a sua queda aponta muito mais para calor, tração e química do que para o prato. Mudar radicalmente a alimentação não vai resolver o que a chapinha faz. O papel da comida aqui é outro e mais modesto — dar ao fio novo a matéria-prima para nascer forte enquanto você tira o pé do dano. Não invente restrição onde não há problema.",
    plate: [
      { label: "Vegetais e frutas", pct: 40, color: "var(--sage)" },
      { label: "Proteína", pct: 30, color: "var(--terracota)" },
      { label: "Carboidrato integral", pct: 20, color: "var(--plum)" },
      { label: "Gordura boa", pct: 10, color: "var(--warn-line)" },
    ],
    plateFoot: "Um prato equilibrado e constante já entrega o que o seu caso precisa. A energia vale mais aplicada na aba Hoje.",
    yes: [
      { food: "Proteína em quantidade adequada", how: "3 refeições por dia", why: "O fio é queratina — proteína. Fio que nasce em corpo bem nutrido resiste melhor ao atrito e ao calor que você ainda vai aplicar nele." },
      { food: "Frutas cítricas e vegetais coloridos", how: "todos os dias", why: "Vegetais e frutas são a base do padrão alimentar associado na literatura a menor risco de alopecia, pela carga de polifenóis antioxidantes. E a vitamina C melhora a absorção do ferro da refeição — útil mesmo quando o ferro não é o seu problema principal." },
      { food: "Azeite de oliva extravirgem", how: "cru, sobre a comida pronta", why: "Os ácidos graxos do azeite aparecem na literatura com efeito inibitório sobre a 5-alfa-redutase, e ele é o centro do padrão mediterrâneo." },
      { food: "Água", how: "ao longo do dia", why: "Não 'hidrata o fio' por dentro — mas cabelo e couro cabeludo saudáveis dependem de um corpo hidratado como qualquer outro tecido." },
      { food: "Peixes, castanhas e sementes", how: "algumas vezes por semana", why: "Gordura insaturada e antioxidantes: o pano de fundo anti-inflamatório associado a menor risco de alopecia." },
    ],
    no: [
      { food: "Dietas restritivas 'pelo cabelo'", how: "não há motivo no seu caso", why: "Restringir sem necessidade é o caminho mais rápido para transformar um problema de hábito em um problema nutricional também." },
      { food: "Coquetéis de suplemento capilar", how: "desnecessário sem deficiência", why: "Sem carência comprovada, não há ganho — e há risco. Veja os mitos abaixo." },
      { food: "Ultraprocessado como base", how: "modere", why: "Não é o seu gatilho, mas ocupa o lugar de alimento denso em nutriente sem entregar nada em troca." },
    ],
    combos: [
      { a: "Proteína no café da manhã", b: "Em vez de só pão e café", gain: "Distribui o aporte proteico e evita concentrar tudo à noite." },
      { a: "Cuidado alimentar", b: "Cuidado térmico e mecânico", gain: "No seu perfil, a segunda parte é a que move o ponteiro. Não troque uma pela outra." },
    ],
  },

  genetico: {
    kicker: "alimentação · perfil com componente genético",
    headline: "A comida não reverte genética — define o melhor cenário possível",
    lede: "Ser honesto aqui vale mais que animar: nenhum alimento reverte um padrão hereditário de miniaturização do folículo. O que a alimentação faz é outra coisa — mantém a base nutricional em dia, reduz a carga inflamatória e cria o melhor terreno possível para qualquer tratamento que você venha a fazer com acompanhamento médico. Estudos apontam que quem segue o padrão mediterrâneo tem menor risco de alopecia; é um dado de associação, não uma promessa de reversão.",
    plate: [
      { label: "Vegetais e frutas", pct: 45, color: "var(--sage)" },
      { label: "Proteína (peixe, ovo, leguminosa)", pct: 25, color: "var(--terracota)" },
      { label: "Grãos integrais", pct: 20, color: "var(--plum)" },
      { label: "Azeite e oleaginosas", pct: 10, color: "var(--warn-line)" },
    ],
    plateFoot: "Este é, na prática, o desenho do padrão mediterrâneo: muito vegetal, peixe, azeite, pouca carne vermelha e pouco processado.",
    yes: [
      { food: "Azeite de oliva extravirgem", how: "diariamente, cru", why: "Seus ácidos graxos essenciais mostraram efeito inibitório sobre a 5-alfa-redutase — a mesma enzima envolvida na conversão de testosterona em DHT, central no padrão androgenético." },
      { food: "Chá verde", how: "1 a 2 xícaras por dia, fora das refeições", why: "O EGCG, principal polifenol do chá, foi descrito como capaz de reduzir risco associado à alopecia androgenética por inibição da 5-alfa-redutase. Revisão brasileira lista o chá verde entre os fitoterápicos que podem ter essa ação e pondera que faltam estudos para afirmar eficácia — trate como aposta de baixo custo, não como tratamento. Tome longe das refeições: os taninos do chá atrapalham a absorção do ferro." },
      { food: "Peixes, legumes, frutas, leguminosas e oleaginosas", how: "a base do dia", why: "Conjunto rico em polifenóis e gordura insaturada, com ação antioxidante e anti-inflamatória descrita na literatura." },
      { food: "Maçã com casca", how: "quando quiser", why: "Fonte de procianidina oligomérica, derivada da maçã, estudada por estimular a proliferação de células epiteliais do fio e induzir a fase de crescimento em testes iniciais." },
      { food: "Proteína e ferro adequados", how: "sem exagero, sem falta", why: "Não reverte o padrão, mas uma deficiência somada ao componente genético piora um quadro que já tende a progredir." },
    ],
    no: [
      { food: "Megadoses de vitamina A e derivados", how: "nunca por conta própria", why: "O excesso de vitamina A é causa descrita de queda de cabelo. Mais não é melhor — há um intervalo ideal, e os dois extremos prejudicam." },
      { food: "Suplemento de selênio sem indicação", how: "risco real", why: "A intoxicação por selênio causa queda: entre pessoas diagnosticadas com toxicidade, 72% apresentaram perda de cabelo, variando de 10% a 100% dos fios." },
      { food: "Ultraprocessado e excesso de gordura saturada", how: "modere", why: "É o oposto do padrão associado a menor risco na literatura." },
    ],
    combos: [
      { a: "Alimentação mediterrânea", b: "Avaliação com dermatologista", gain: "Neste perfil existem tratamentos consagrados e estudados. O prato apoia; quem indica conduta é o médico." },
      { a: "Fotos a cada 30 dias", b: "Mesma luz, mesmo ângulo", gain: "Padrão genético evolui devagar. Sem registro, você não consegue distinguir progressão real de impressão de um dia ruim." },
    ],
  },
};

/* ------------------- nutrientes (comum a todos os perfis) ------------------ */

const NUTRIENTS = [
  {
    id: "ferro", name: "Ferro", level: "forte",
    role: "Cofator da ribonucleotídeo redutase, a enzima que limita a velocidade da síntese de DNA — crítica em células de divisão rápida, como as da matriz do folículo.",
    food: "Carne vermelha magra, fígado, feijão, lentilha, folhas verde-escuras.",
    evidence: "A deficiência de ferro é a carência nutricional mais comum do mundo e causa eflúvio telógeno. A ferritina sérica é o marcador usado como referência de estoque corporal nos estudos de queda. É frequente em mulheres com queda capilar.",
  },
  {
    id: "vitc", name: "Vitamina C", level: "apoio",
    role: "Não age diretamente no fio: melhora a absorção intestinal e a mobilização do ferro.",
    food: "Laranja, limão, acerola, goiaba, pimentão, brócolis.",
    evidence: "A literatura recomenda vitamina C especificamente para quem tem queda associada à deficiência de ferro. Não há evidência de relação direta entre nível de vitamina C e queda em quem não tem essa deficiência.",
  },
  {
    id: "zinco", name: "Zinco", level: "moderada",
    role: "Atua em enzimas e fatores de transcrição envolvidos na regulação gênica e na morfogênese do folículo.",
    food: "Semente de abóbora, castanha de caju, carne, frutos do mar.",
    evidence: "A deficiência está descrita como causa de eflúvio telógeno e de fio fino, branco e quebradiço. Um estudo com 312 pessoas com queda encontrou zinco baixo em pacientes com alopecia areata e eflúvio telógeno — mas os dados no conjunto ainda são heterogêneos, e rastreio de rotina não é recomendado.",
  },
  {
    id: "vitd", name: "Vitamina D", level: "moderada",
    role: "Hormônio esteroide que, pelo receptor VDR, regula desenvolvimento e diferenciação dos queratinócitos.",
    food: "Peixes gordos, ovo, alimentos fortificados — e exposição solar.",
    evidence: "A imunorreatividade do VDR é maior na fase de crescimento do fio, e modelos animais sem o receptor desenvolvem alopecia. A relação com eflúvio telógeno e padrão androgenético ainda é discutida, mas há consenso majoritário de que pessoas com alopecia e insuficiência de vitamina D devem repor — com indicação médica.",
  },
  {
    id: "proteina", name: "Proteína", level: "forte",
    role: "Matéria-prima do fio. A maior parte dos cerca de 100 mil folículos do couro cabeludo está em fase de crescimento e precisa de aporte constante.",
    food: "Ovos, carnes, peixes, laticínios, leguminosas.",
    evidence: "Dieta desequilibrada, perda de peso súbita e restrição calórica estão entre os desencadeadores descritos de queda. O aporte proteico adequado é premissa de qualquer plano.",
  },
  {
    id: "omega", name: "Ácidos graxos essenciais", level: "moderada",
    role: "Compõem membranas celulares e modulam processos inflamatórios ao redor do folículo.",
    food: "Peixes gordos, azeite extravirgem, chia, linhaça, nozes.",
    evidence: "Deficiência de ácido linoleico e alfa-linolênico está associada a queda e despigmentação de cabelos e sobrancelhas. Ácidos graxos do azeite mostraram efeito inibitório sobre a 5-alfa-redutase.",
  },
  {
    id: "biotina", name: "Biotina (B7)", level: "fraca",
    role: "Vitamina do complexo B envolvida em carboxilases, sinalização celular e regulação gênica.",
    food: "Ovo, oleaginosas, fígado — a deficiência é rara em quem se alimenta de forma equilibrada.",
    evidence: "Apesar da popularidade, não há evidência em ensaios clínicos randomizados de que suplementar biotina previna ou trate queda em quem não tem deficiência. Atenção: biotina exógena interfere em vários exames laboratoriais, gerando resultados falsamente positivos ou negativos.",
  },
  {
    id: "b12", name: "B12 e folato", level: "fraca",
    role: "Essenciais para síntese e reparo de DNA, o que teoricamente afetaria a proliferação do folículo.",
    food: "Carnes, ovos, laticínios (B12); folhas verdes e leguminosas (folato).",
    evidence: "Estudo caso-controle não encontrou diferença nos valores de B12 entre pessoas com e sem alopecia areata. A pesquisa sobre o tema ainda é escassa e não sustenta recomendação específica.",
  },
];

const NUTRIENT_LEVELS = {
  forte: { label: "evidência consistente", cls: "lvl--forte" },
  moderada: { label: "evidência moderada", cls: "lvl--moderada" },
  apoio: { label: "papel de suporte", cls: "lvl--apoio" },
  fraca: { label: "evidência insuficiente", cls: "lvl--fraca" },
};

const MYTHS = [
  {
    claim: "“Tomo biotina, é bom para o cabelo.”",
    truth: "Sem deficiência comprovada, não há evidência em ensaios clínicos de que a biotina previna ou trate a queda. E há um efeito colateral pouco conhecido: a biotina interfere em exames de sangue e pode gerar resultado falso — inclusive nos exames que investigariam a causa real da sua queda. Se usa, avise o laboratório antes de coletar.",
  },
  {
    claim: "“Vitamina não faz mal, no máximo não faz efeito.”",
    truth: "Faz. O excesso de vitamina A é causa descrita de queda de cabelo, e a toxicidade por selênio também: entre pessoas com intoxicação diagnosticada, 72% perderam cabelo — de 10% a 100% dos fios. Micronutriente tem faixa ideal, com prejuízo nos dois extremos.",
  },
  {
    claim: "“Vitamina E fortalece o fio.”",
    truth: "Não há evidência de que a vitamina E tenha função no padrão androgenético ou no eflúvio telógeno. O excesso, esse sim, aparece entre as substâncias associadas a queda quando suplementadas sem necessidade.",
  },
  {
    claim: "“Vou tomar um suplemento capilar e resolver.”",
    truth: "Reposição só tem sentido onde há falta. O caminho descrito na literatura é o inverso do que o mercado sugere: primeiro os exames (ferritina, vitamina D, zinco, tireoide, B12), depois a reposição do que realmente estiver baixo, com indicação profissional.",
  },
];

/* ---------------------------- biblioteca educativa ------------------------- */

const LIBRARY = [
  {
    id: "ciclo", kicker: "fundamento", read: "3 min",
    title: "O fio tem um ciclo — e quase toda queda é uma questão de tempo",
    body: [
      "O couro cabeludo humano abriga em média de 100 mil a 150 mil folículos, e cada um funciona no seu próprio ritmo, independente dos vizinhos. É por isso que ninguém fica careca de um dia para o outro: os fios não caem em bloco.",
      "Cada folículo percorre três fases. A anágena é a de crescimento e dura de dois a sete anos — nela está cerca de 90% do seu cabelo agora. A catágena é a de transição e dura por volta de duas semanas, com apenas 1% dos folículos. A telógena é a de repouso, dura de dois a três meses e concentra cerca de 10% dos fios: são eles que se soltam.",
      "Perder de 20 a 150 fios telógenos por dia é normal — é o ciclo funcionando. O que chama atenção não é o fio no ralo, é o aumento sustentado desse número por semanas.",
      "Entender isso muda a expectativa. Quando um gatilho empurra muitos folículos para a fase de repouso ao mesmo tempo, você só vê a queda quando esses fios se soltam, dois a três meses depois. E só vê a recuperação quando os novos crescem o suficiente para aparecer — o que leva mais alguns meses. A rotina que você começa hoje trabalha para um cabelo que ainda vai nascer. É por isso que este plano tem 90 dias, e não 21.",
    ],
  },
  {
    id: "gatilho", kicker: "eflúvio telógeno", read: "3 min",
    title: "Por que a queda aparece dois a três meses depois do susto",
    body: [
      "O eflúvio telógeno é a perda que acontece quando muitos folículos passam bruscamente da fase de crescimento para a de repouso. Os desencadeadores descritos são bem conhecidos: estresse físico ou psicológico intenso, parto, restrição dietética, perda de peso rápida, febre alta, cirurgia, doenças da tireoide e alguns medicamentos.",
      "O detalhe que confunde quase todo mundo é o intervalo. A queda costuma aparecer de dois a três meses depois do evento. Quando você finalmente percebe o cabelo caindo, a fase difícil muitas vezes já passou — e é por isso que tanta gente jura que não aconteceu nada. Aconteceu; foi antes.",
      "A conduta descrita na literatura é direta: identificar e remover o fator desencadeante, repor as deficiências que existirem (ferro, vitamina D, zinco, vitaminas do complexo B) e aguardar. A evolução costuma ser boa, com reposição quase total dos fios perdidos em alguns meses, e há casos de resolução espontânea.",
      "Duas consequências práticas. Primeira: procurar o gatilho no que aconteceu há três meses, não ontem. Segunda: paciência não é resignação aqui — é a conduta correta.",
    ],
  },
  {
    id: "estresse", kicker: "estresse", read: "2 min",
    title: "O que o cortisol faz com a raiz",
    body: [
      "Estresse é uma das causas mais frequentes de distúrbio do crescimento capilar, e o mecanismo é razoavelmente descrito: o cortisol elevado degrada hialuronano e proteoglicanos, substâncias que integram a matriz extracelular ao redor do folículo. Além do cortisol, outros mediadores do estresse — substância P, ACTH, prolactina — foram descritos como inibidores do crescimento do fio.",
      "O estresse crônico também agrava quadros cuja origem principal é hormonal, imunológica ou tóxica. Em estudos com animais, foi associado a parada do crescimento e inflamação ao redor do folículo.",
      "Há ainda um laço que vale nomear: a queda de cabelo gera estresse, e esse estresse mantém a queda. Quem está no meio disso não está imaginando coisas — o ciclo é real e descrito. Cuidar do sono e reduzir a carga não é conselho genérico de bem-estar aqui; é parte do manejo.",
    ],
  },
  {
    id: "comida", kicker: "nutrição", read: "4 min",
    title: "O que a ciência sustenta sobre alimentação e queda",
    body: [
      "Comece pela parte incômoda: a literatura sobre nutrição e queda capilar ainda é limitada e, em vários pontos, contraditória. Qualquer material que prometa certeza absoluta sobre o assunto está vendendo alguma coisa.",
      "Dito isso, há pontos com base razoável. A deficiência de ferro é a carência nutricional mais comum do mundo e causa eflúvio telógeno, sendo frequente em mulheres com queda; a ferritina é o marcador de referência. A vitamina C melhora a absorção do ferro e por isso é recomendada junto, para quem tem essa deficiência. A deficiência de zinco está descrita como causa de eflúvio telógeno e de fio fino e quebradiço. A vitamina D regula a diferenciação dos queratinócitos pelo receptor VDR, e há consenso majoritário de repor quando há insuficiência associada à alopecia.",
      "Sobre padrão alimentar, o achado mais citado é o da dieta mediterrânea — muito vegetal, fruta, leguminosa, oleaginosa, grão, peixe e gordura insaturada, com pouca carne e pouco laticínio. Estudos apontam menor risco de alopecia em quem a segue, atribuído principalmente aos polifenóis, com ação antioxidante e anti-inflamatória.",
      "Alguns ingredientes específicos aparecem por mecanismo: o EGCG do chá verde e os ácidos graxos do azeite mostraram inibição da 5-alfa-redutase; a procianidina da maçã estimulou proliferação de células epiteliais do fio; extratos de alecrim inibiram a ligação ao receptor de DHT em teste laboratorial, com crescimento observado em camundongos.",
      "Guarde a proporção certa: são resultados de laboratório, de modelos animais e de estudos de associação. Ajudam a escolher o que colocar no prato — não substituem tratamento, e não devem virar promessa.",
    ],
  },
  {
    id: "medico", kicker: "limite do autocuidado", read: "3 min",
    title: "Quando parar de tentar sozinho e procurar um dermatologista",
    body: [
      "Este material é educativo e tem um limite claro. Existem sinais em que o cuidado em casa deixa de ser a resposta certa — e insistir só custa tempo, que neste assunto é justamente o recurso mais caro.",
      "Procure avaliação se a queda for em placas ou áreas bem delimitadas; se houver coceira, vermelhidão, descamação, dor ou ferida no couro cabeludo; se a queda passar de seis meses sem melhora; se for súbita e intensa; se o afinamento estiver progredindo de forma consistente; ou se vier acompanhada de cansaço, alterações de peso, unhas frágeis e mudanças de humor, que podem apontar tireoide ou anemia.",
      "O que costuma ser investigado: exame clínico do couro cabeludo, tricoscopia e exames de sangue conforme a suspeita — ferritina, vitamina D, zinco, função tireoidiana, B12. A biópsia fica reservada a casos de dúvida diagnóstica.",
      "Vale saber que existem condutas consagradas e estudadas para os principais quadros, e que elas são escolhidas caso a caso, com prescrição — inclusive porque o que se indica para homens e para mulheres não é o mesmo. Não faz sentido descrevê-las aqui como se fossem opção de prateleira; o ponto é que existem, e que chegar cedo amplia o que é possível fazer.",
      "Nada disso invalida a sua rotina. Cuidado em casa e acompanhamento profissional trabalham juntos: um sustenta o dia a dia, o outro identifica a causa e define o tratamento.",
    ],
  },
];

/* leitura extra, específica por sexo */
const LIBRARY_BY_SEX = {
  f: {
    id: "padrao_f", kicker: "padrão feminino", read: "3 min",
    title: "Por que a queda feminina não é 'a calvície masculina mais leve'",
    body: [
      "É a confusão mais comum — e ela atrapalha, porque leva mulheres a procurarem soluções pensadas para outro quadro.",
      "A apresentação é diferente. No homem, a miniaturização começa pelas regiões temporais e pelo vértice, formando os padrões que a classificação Hamilton-Norwood organiza em sete estágios. Na mulher, o que se descreve é um afinamento difuso, mais percebido na linha média, que poupa a implantação frontal — a lógica da classificação de Ludwig. Por isso a queixa costuma ser 'a risca está mais larga', e não 'as entradas subiram'.",
      "O mecanismo também difere. No homem, o processo é dependente de di-hidrotestosterona. Na mulher, o fator androgênico é considerado incerto: não há necessariamente aumento dos níveis circulantes de andrógenos, e outros mecanismos estão envolvidos. Há argumento consolidado de que a forma masculina e a feminina são desordens distintas — não versões da mesma coisa.",
      "O tempo é outro: o padrão feminino tem início mais tardio, por volta da quarta década de vida, com piora após a menopausa.",
      "E há um ponto que costuma ficar de fora dos materiais técnicos: nas mulheres a alopecia tem maior impacto emocional e social, com contribuição descrita para quadros como a depressão. Se você sente que isso pesa mais do que 'deveria', não é fragilidade sua — é um achado da literatura.",
      "A consequência prática: tratamento feminino é decidido com critérios próprios, e há medicações usadas em homens que não são preconizadas para mulheres. Mais uma razão para a conduta vir de um dermatologista, e não de um vídeo na internet.",
    ],
  },
  m: {
    id: "padrao_m", kicker: "padrão masculino", read: "3 min",
    title: "O que exatamente acontece na queda de padrão masculino",
    body: [
      "A alopecia androgenética masculina é a forma mais comum de queda progressiva no homem e piora com a idade. Os números ajudam a dimensionar: cerca de 30% aos 30 anos e 50% aos 50 — e, em estudo conduzido em Singapura, prevalência de 100% após os 80 anos. Ou seja, é praticamente uma característica do envelhecimento masculino, com ritmo muito variável entre pessoas.",
      "O processo é a miniaturização folicular: o fio terminal — grosso, longo, pigmentado — vai sendo substituído por velo, fino e claro. Começa nas regiões temporais e no vértice, e a classificação Hamilton-Norwood descreve sete estágios dessa evolução.",
      "O motor é hormonal e genético. O quadro é dependente de di-hidrotestosterona, com atividade aumentada da 5-alfa-redutase no folículo do couro cabeludo. A predisposição genética é forte: estudos com gêmeos mostram agregação familiar clara. Historicamente, foi a observação de que eunucos não desenvolviam calvície — enquanto seus irmãos desenvolviam — que apontou para a origem endócrina do quadro.",
      "Dois pontos práticos. Primeiro: quanto mais precoce o início, mais exuberante tende a ser a evolução — o que faz do tempo a variável mais valiosa. Segundo: por ser progressivo, é um quadro de manejo contínuo, não de solução pontual.",
      "Existem tratamentos consagrados e bem estudados, com indicações e efeitos adversos próprios, escolhidos caso a caso por um dermatologista. Este material não substitui essa conversa — ele existe para que você chegue nela sabendo o que está em jogo, e mais cedo.",
    ],
  },
};

/* ---------------------------------------------------------------------------
   AS 3 FASES DOS 90 DIAS
   21 dias constroem hábito; cabelo responde em meses. Cada fase tem objetivo,
   rotina própria e uma expectativa declarada — inclusive quando a expectativa
   correta é "nada visível ainda".
   --------------------------------------------------------------------------- */

const PHASES = [
  {
    id: 1, name: "Fundação", from: 1, to: 21,
    tagline: "Fazer a rotina existir",
    goal: "O objetivo desta fase é um só: transformar três passos em automatismo. Não é aqui que o cabelo muda — é aqui que a rotina para de depender da sua motivação.",
    steps: (r) => [
      "Passo 1 — Higienizar e massagear o couro cabeludo (2–3 min)",
      `Passo 2 — Nutrir a raiz com ${r}`,
      "Passo 3 — Proteger: protetor térmico e fronha de cetim/seda à noite",
    ],
    expect: "O que esperar: nada visível. O fio que cai hoje entrou em repouso há dois ou três meses — nenhuma rotina alcança isso em três semanas.",
  },
  {
    id: 2, name: "Consolidação", from: 22, to: 60,
    tagline: "Sustentar sem depender de vontade",
    goal: "A rotina já não é novidade. Agora o prato entra como parte do protocolo, e não como um extra — é a fase em que o plano alimentar do seu perfil passa a valer todo dia.",
    steps: (r) => [
      "Passo 1 — Rotina capilar dos 3 passos",
      `Passo 2 — Prato do dia dentro do seu plano alimentar (+ ${r} na frequência indicada)`,
      "Passo 3 — Sono: proteger as horas, porque cortisol alto atrapalha a raiz",
    ],
    expect: "O que esperar: em alguns casos, menos fio na escova. No espelho, ainda nada. Esta é a fase em que a maioria desiste — e é exatamente por isso que ela está desenhada aqui.",
  },
  {
    id: 3, name: "Leitura", from: 61, to: 90,
    tagline: "Comparar e decidir com dado",
    goal: "Primeira janela em que uma mudança real pode aparecer. Aqui você compara as fotos e decide o próximo passo com evidência sua, não com impressão de um dia bom ou ruim.",
    steps: (r) => [
      "Passo 1 — Rotina capilar dos 3 passos",
      `Passo 2 — Prato do dia + ${r}`,
      "Passo 3 — Registro: anotar o que mudou (queda, brilho, coceira, fios novos)",
    ],
    expect: "O que esperar: fios curtos nascendo perto da raiz são o primeiro sinal concreto de recuperação. Compare a foto do dia 1 com a do dia 90 — não com a sua memória.",
  },
];

const PHOTO_DAYS = [
  { day: 1, label: "Dia 1", note: "ponto de partida" },
  { day: 30, label: "Dia 30", note: "primeira comparação" },
  { day: 60, label: "Dia 60", note: "meio do caminho" },
  { day: 90, label: "Dia 90", note: "comparação final" },
];

function phaseOfDay(day) {
  return PHASES.find((p) => day >= p.from && day <= p.to) || PHASES[PHASES.length - 1];
}

/* =============================================================================
   ██  CONFIGURAÇÃO DE UPSELL — EDITE AQUI  ██
   Troque textos, preços e "checkoutUrl" pelos links reais assim que tiver a
   plataforma de checkout escolhida (Kiwify/Hotmart/Youshop/etc.). Os links
   abrem em nova aba; nada aqui depende de backend.
   ============================================================================= */

const UPSELLS = {
  // OFERTA A — compra única. Aparece na tela de Resultado (texto por perfil)
  // e como "Bônus 4" travado na aba Hoje.
  advanced: {
    checkoutUrl: "https://SEU-CHECKOUT-AQUI.com/protocolo-avancado", // <- troque pelo link real
    price: "R$67",
    priceFrom: "R$147", // ancoragem de preço (opcional, deixe "" pra esconder)
    badge: "Protocolo Avançado",

    resultByProfile: {
      estresse: {
        title: "Acelere com um plano específico pra esse tipo de queda",
        text: "O Protocolo Avançado inclui um plano de manejo de estresse focado em queda capilar — técnicas de respiração, cronograma de sono e uma versão estendida da rotina para os casos ligados a estresse e hormônios.",
      },
      nutricional: {
        title: "Leve a parte nutricional pronta, sem montar nada sozinho",
        text: "O Protocolo Avançado inclui um cardápio semanal completo com lista de compras pronta, pensado especificamente pra quem precisa repor nutrientes rápido.",
      },
      habito: {
        title: "Acelere a recuperação do dano por hábito",
        text: "O Protocolo Avançado traz um guia de transição de rotina (redução gradual de calor/química) e um cronograma de descanso capilar para recuperar a fibra mais rápido.",
      },
      genetico: {
        title: "Tenha um roteiro pra levar ao seu dermatologista",
        text: "O Protocolo Avançado inclui um roteiro de perguntas para consulta profissional e um acompanhamento mais de perto, pensado para quem tem componente genético envolvido.",
      },
    },

    bonusCard: {
      title: "Bônus 4 — Protocolo Avançado",
      text: "Rotinas avançadas, cardápio completo e acompanhamento mais de perto para acelerar seus resultados.",
    },
  },

  // OFERTA B — recorrência. Aparece só ao completar os 90 dias: é a maior
  // prova de comprometimento possível dentro do app.
  club: {
    checkoutUrl: "https://SEU-CHECKOUT-AQUI.com/clube-raiz-nova", // <- troque pelo link real
    price: "R$19,90/mês",
    title: "Você fechou os 90 dias 🎉",
    text: "Noventa dias de constância é o que separa quem tenta de quem acompanha. Continue no Clube Raiz Nova: novos ciclos todo mês, conteúdo extra e acompanhamento contínuo pra não perder o que você construiu.",
    cta: "Conhecer o Clube",
  },
};

/* ---------------------------------------------------------------------------
   2) ESTADO
   Guardamos as RESPOSTAS, não o perfil calculado: assim, quando os textos do
   plano forem melhorados, quem já respondeu passa a ver a versão nova.
   --------------------------------------------------------------------------- */

const TABS = [
  { id: "hoje", label: "Hoje", tpl: "tpl-tab-hoje" },
  { id: "comida", label: "Alimentação", tpl: "tpl-tab-comida" },
  { id: "receitas", label: "Receitas", tpl: "tpl-tab-receitas" },
  { id: "entender", label: "Entender", tpl: "tpl-tab-entender" },
];

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

const ANALISE_STEPS = [
  "Cruzando padrão de queda e tempo de evolução",
  "Pesando gatilhos hormonais, nutricionais e mecânicos",
  "Comparando com os padrões descritos na literatura",
  "Montando rotina, prato e leituras do seu perfil",
];

function freshState() {
  return {
    screen: "welcome",
    name: "",
    email: "",        // e-mail usado na compra — identifica a pessoa na planilha
    startedAt: "",
    quizIndex: 0,
    answers: {},
    tab: "hoje",
    days: Array(TOTAL_DAYS).fill(false),
    todayChecklist: [false, false, false],
    photos: {},   // { "1": true, "30": true, ... }
    notes: {},    // { "<índice do dia>": { mood: 3, text: "..." } }
    openNutrient: null,
    openArticle: null,
    openPhase: 1,
    diet: {},          // restrições marcadas na aba Alimentação
    dietAnswered: false,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    const merged = { ...freshState(), ...parsed };
    delete merged.profile; // versões antigas guardavam o perfil calculado
    if (!Array.isArray(merged.days) || merged.days.length !== TOTAL_DAYS) {
      const old = Array.isArray(merged.days) ? merged.days : [];
      merged.days = Array(TOTAL_DAYS).fill(false).map((_, i) => !!old[i]);
    }
    return merged;
  } catch (e) {
    return freshState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

const sexOf = () => state.answers.sexo || null;

/* ---------------------------------------------------------------------------
   3) SCORING
   --------------------------------------------------------------------------- */

function computeProfile(answers) {
  const scores = { estresse: 0, nutricional: 0, habito: 0, genetico: 0 };
  const redFlags = new Set();
  let chronic = false;
  const sex = answers.sexo || null;

  questionList(sex).forEach((q) => {
    const val = answers[q.id];
    if (val === undefined) return;
    const chosenIds = q.type === "multi" ? val : [val];
    chosenIds.forEach((optId) => {
      const opt = q.options.find((o) => o.id === optId);
      if (!opt) return;
      Object.entries(opt.tags || {}).forEach(([k, v]) => { scores[k] = (scores[k] || 0) + v; });
      if (opt.redFlag) redFlags.add(opt.redFlag);
      if (opt.chronic) chronic = true;
    });
  });

  if (chronic) redFlags.add("chronic");

  const order = ["estresse", "nutricional", "habito", "genetico"];
  let top = order[0];
  order.forEach((k) => { if (scores[k] > scores[top]) top = k; });
  // se placas foi marcado, força o perfil informativo mesmo com score baixo
  if (redFlags.has("placas") && scores.genetico >= scores[top] - 1) top = "genetico";

  const base = PROFILES[top];
  const variant = (base.bySex && sex && base.bySex[sex]) || {};
  const redFlagList = Array.from(redFlags).map((k) => REDFLAG_MESSAGES[k]);

  const priority = answers.prioridade;
  let recipes = [...base.recipes];
  // pequenos ajustes pela prioridade declarada, mantendo o core do perfil
  if (priority === "forca" && !recipes.includes("oleo-ricino")) recipes[1] = "oleo-ricino";
  if (priority === "crescimento" && !recipes.includes("tonico-alecrim")) recipes[0] = "tonico-alecrim";

  return {
    key: top,
    sex,
    name: variant.name || base.name,
    desc: variant.desc || base.desc,
    focus: variant.focus || base.focus,
    recipes,
    food: FOOD_PLAN[top],
    redFlag: redFlags.size > 0,
    redFlagList,
  };
}

const currentProfile = () => computeProfile(state.answers);

/* ---------------------------------------------------------------------------
   4) RENDER
   --------------------------------------------------------------------------- */

const app = document.getElementById("app");
const clone = (tplId) => document.getElementById(tplId).content.cloneNode(true);

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

const firstName = () => (state.name || "").trim().split(/\s+/)[0] || "";

function render() {
  const r = {
    welcome: renderWelcome, quiz: renderQuiz, analise: renderAnalise,
    result: renderResult, dashboard: renderApp,
  }[state.screen] || renderWelcome;
  r();
}

function renderWelcome() {
  app.innerHTML = "";
  app.appendChild(clone("tpl-welcome"));

  const nome = document.getElementById("nameInput");
  const email = document.getElementById("emailInput");
  nome.value = state.name || "";
  email.value = state.email || "";
  nome.addEventListener("input", () => { state.name = nome.value; });
  email.addEventListener("input", () => {
    state.email = email.value;
    document.getElementById("emailErr").hidden = true;
  });
  [nome, email].forEach((el) => el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.querySelector('[data-action="start-quiz"]').click();
  }));

  // a linha de transparência só aparece quando algo de fato sai do dispositivo
  document.getElementById("syncNote").hidden = !CONFIG.sheetsEndpoint;
  saveState();
}

const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || "").trim());

function renderQuiz() {
  app.innerHTML = "";
  app.appendChild(clone("tpl-quiz"));

  const list = questionList(sexOf());
  const q = list[state.quizIndex];
  // enquanto o sexo não foi escolhido, o total é uma estimativa (as trilhas têm o mesmo tamanho)
  const total = sexOf() ? list.length : 1 + QUESTIONS_F.length;
  const pct = Math.round((state.quizIndex / total) * 100);
  document.getElementById("progressFill").style.width = pct + "%";

  const who = firstName() ? `${firstName()} · ` : "";
  document.getElementById("progressLabel").textContent =
    `${who}Pergunta ${state.quizIndex + 1} de ${total}`;

  const qBox = document.getElementById("quizQuestion");
  const currentAns = state.answers[q.id] ?? (q.type === "multi" ? [] : null);

  const optionsHtml = q.options.map((opt) => {
    const selected = q.type === "multi" ? currentAns.includes(opt.id) : currentAns === opt.id;
    return `<button type="button" class="option ${q.type === "single" ? "option--radio" : ""} ${selected ? "is-selected" : ""}"
      data-opt="${opt.id}" role="${q.type === "single" ? "radio" : "checkbox"}" aria-checked="${selected}">
      <span class="option__mark">${selected ? (q.type === "single" ? "●" : "✓") : ""}</span>
      <span class="option__text">${opt.label}</span>
    </button>`;
  }).join("");

  qBox.innerHTML = `
    <h2>${q.title}</h2>
    ${q.hint ? `<p class="q-hint">${q.hint}</p>` : ""}
    <div class="option-list" role="${q.type === "single" ? "radiogroup" : "group"}">${optionsHtml}</div>
  `;

  qBox.querySelectorAll(".option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const optId = btn.dataset.opt;
      const opt = q.options.find((o) => o.id === optId);
      if (q.type === "single") {
        state.answers[q.id] = optId;
        // trocar de sexo invalida as respostas da trilha anterior
        if (q.id === "sexo") {
          const keep = { sexo: optId };
          state.answers = keep;
        }
      } else {
        let arr = state.answers[q.id] ? [...state.answers[q.id]] : [];
        if (opt.exclusive) {
          arr = arr.includes(optId) ? [] : [optId];
        } else {
          arr = arr.filter((o) => !(q.options.find((oo) => oo.id === o) || {}).exclusive);
          if (arr.includes(optId)) arr = arr.filter((o) => o !== optId);
          else arr.push(optId);
        }
        state.answers[q.id] = arr;
      }
      renderQuiz();
    });
  });

  // insight da opção selecionada — é o que dá ritmo e apelo ao quiz
  const ans = state.answers[q.id];
  const chosen = q.type === "multi" ? (ans || []) : (ans ? [ans] : []);
  const insight = chosen
    .map((id) => (q.options.find((o) => o.id === id) || {}).insight)
    .filter(Boolean)
    .slice(-1)[0];
  document.getElementById("quizInsight").innerHTML = insight
    ? `<div class="insight"><span class="insight__mark">✦</span><p>${esc(insight)}</p></div>` : "";

  const btnBack = document.getElementById("btnBack");
  const btnNext = document.getElementById("btnNext");
  btnBack.textContent = state.quizIndex === 0 ? "← Início" : "← Voltar";

  const answered = q.type === "multi" ? (state.answers[q.id] || []).length > 0 : !!state.answers[q.id];
  btnNext.disabled = !answered;
  // sem sexo escolhido a trilha ainda nem existe — nunca é a última pergunta
  const isLast = !!sexOf() && state.quizIndex === list.length - 1;
  btnNext.textContent = isLast ? "Ver meu resultado →" : "Continuar →";

  saveState();
}

/* ------------------------------- tela de análise --------------------------- */

let analiseTimers = [];

function renderAnalise() {
  app.innerHTML = "";
  app.appendChild(clone("tpl-analise"));
  const who = firstName();
  document.getElementById("analiseTitle").textContent =
    who ? `${who}, cruzando as suas respostas…` : "Cruzando as suas respostas…";

  const ul = document.getElementById("analiseSteps");
  ul.innerHTML = ANALISE_STEPS.map((s, i) => `
    <li class="analise-step" data-i="${i}"><span class="analise-step__mark"></span>${esc(s)}</li>
  `).join("");

  analiseTimers.forEach(clearTimeout);
  analiseTimers = [];
  ANALISE_STEPS.forEach((_, i) => {
    analiseTimers.push(setTimeout(() => {
      const el = ul.querySelector(`[data-i="${i}"]`);
      if (el) el.classList.add("is-done");
    }, 450 + i * 520));
  });
  analiseTimers.push(setTimeout(() => {
    state.screen = "result";
    render();
  }, 450 + ANALISE_STEPS.length * 520 + 450));
}

/* ---------------------------------------------------------------------------
   SINCRONIZAÇÃO DO PROGRESSO
   Best-effort e silenciosa: falha de rede nunca pode atrapalhar quem está
   usando o app. Sobe constância, não conteúdo pessoal — humor e anotações do
   diário ficam no dispositivo.
   --------------------------------------------------------------------------- */

let syncTimer = null;

function syncProgresso() {
  if (!CONFIG.sheetsEndpoint || !emailValido(state.email)) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const p = currentProfile();
    const dias = state.days.filter(Boolean).length;
    const diaAtual = Math.min(currentDayIndex() + 1, TOTAL_DAYS);
    const payload = {
      email: state.email.trim().toLowerCase(),
      nome: state.name || "",
      sexo: p.sex === "f" ? "feminino" : p.sex === "m" ? "masculino" : "",
      perfil: p.name,
      restricoes: DIET_OPTIONS.filter((o) => state.diet[o.id]).map((o) => o.label).join(", "),
      inicio: state.startedAt || "",
      ultimaAtividade: new Date().toISOString(),
      diasConcluidos: dias,
      fase: `${phaseOfDay(diaAtual).id} · ${phaseOfDay(diaAtual).name}`,
      fotos: PHOTO_DAYS.filter((f) => state.photos[f.day]).map((f) => f.label).join(", "),
      respostas: JSON.stringify(state.answers),
    };
    fetch(CONFIG.sheetsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    }).catch(() => { /* sem rede, tenta de novo na próxima interação */ });
  }, 1500);
}

/* ---------------------------------- resultado ------------------------------ */

function renderResult() {
  app.innerHTML = "";
  app.appendChild(clone("tpl-result"));
  const p = currentProfile();
  const who = firstName();

  document.getElementById("resultFlagKicker").textContent =
    who ? `${who} · seu diagnóstico` : "seu diagnóstico";
  document.getElementById("resultTitle").textContent = p.name;
  document.getElementById("resultDesc").textContent = p.desc;

  const redBox = document.getElementById("redFlagBox");
  if (p.redFlag && p.redFlagList.length) {
    redBox.hidden = false;
    document.getElementById("redFlagText").innerHTML =
      `<ul class="alert__list">${p.redFlagList.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }

  document.getElementById("focusGrid").innerHTML = p.focus.map((f) => `
    <div class="focus-card">
      <div class="focus-card__icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.text}</p>
    </div>
  `).join("");

  const offer = UPSELLS.advanced.resultByProfile[p.key];
  syncProgresso();

  document.getElementById("resultUpsell").innerHTML = `
    <div class="upsell-card">
      <span class="upsell-card__badge">${UPSELLS.advanced.badge}</span>
      <h3 class="upsell-card__title">${offer.title}</h3>
      <p class="upsell-card__text">${offer.text}</p>
      <div class="upsell-card__foot">
        <span class="upsell-card__price">
          ${UPSELLS.advanced.priceFrom ? `<s>${UPSELLS.advanced.priceFrom}</s> ` : ""}${UPSELLS.advanced.price}
        </span>
        <a class="btn btn--upsell" href="${UPSELLS.advanced.checkoutUrl}" target="_blank" rel="noopener">
          Quero acelerar meus resultados →
        </a>
      </div>
    </div>
  `;

  saveState();
}

/* ------------------------------- shell do app ------------------------------ */

function currentDayIndex() {
  const idx = state.days.findIndex((d) => !d);
  return idx === -1 ? TOTAL_DAYS - 1 : idx;
}

function renderApp() {
  app.innerHTML = "";
  app.appendChild(clone("tpl-app"));
  const p = currentProfile();
  const dayIdx = currentDayIndex();
  const day = Math.min(dayIdx + 1, TOTAL_DAYS);
  const streak = state.days.filter(Boolean).length;
  const phase = phaseOfDay(day);

  const who = firstName();
  document.getElementById("dashKicker").textContent =
    `${who ? who + " · " : ""}dia ${day} de ${TOTAL_DAYS} · fase ${phase.id} de 3`;
  document.getElementById("dashProfileName").textContent = p.name;
  document.getElementById("streakNum").textContent = streak;
  document.getElementById("dashProgressFill").style.width = `${(streak / TOTAL_DAYS) * 100}%`;

  const nav = document.getElementById("tabNav");
  nav.innerHTML = TABS.map((t) => `
    <button class="tab ${state.tab === t.id ? "is-active" : ""}" data-tab="${t.id}"
      role="tab" aria-selected="${state.tab === t.id}">${t.label}</button>
  `).join("");
  nav.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      renderApp();
      document.querySelector(".tabs").scrollIntoView({ block: "start", behavior: "smooth" });
    });
  });

  const panel = document.getElementById("tabPanel");
  panel.innerHTML = "";
  const tab = TABS.find((t) => t.id === state.tab) || TABS[0];
  panel.appendChild(clone(tab.tpl));

  syncProgresso();

  if (tab.id === "hoje") renderTabHoje(p, dayIdx, day, streak, phase);
  if (tab.id === "comida") renderTabComida(p);
  if (tab.id === "receitas") renderTabReceitas(p);
  if (tab.id === "entender") renderTabEntender(p);

  saveState();
}

/* --------------------------------- aba HOJE -------------------------------- */

function renderTabHoje(p, dayIdx, day, streak, phase) {
  // a rotina não pode mandar usar uma receita que o filtro bloqueou para a pessoa
  const liberadaDoPerfil = p.recipes.find((rid) => recipeBlocks(rid).length === 0)
    || Object.keys(RECIPES).find((rid) => recipeBlocks(rid).length === 0);
  const recipeName = liberadaDoPerfil
    ? RECIPES[liberadaDoPerfil].name.toLowerCase()
    : "uma receita liberada para você na aba Receitas";

  document.getElementById("phaseCard").innerHTML = `
    <div class="phase-head">
      <div>
        <span class="phase-badge">Fase ${phase.id} · ${esc(phase.name)}</span>
        <h2 class="card__title">${esc(phase.tagline)}</h2>
      </div>
      <span class="phase-range">dias ${phase.from}–${phase.to}</span>
    </div>
    <p class="card__text">${esc(phase.goal)}</p>
    <p class="phase-expect">${esc(phase.expect)}</p>
  `;

  const steps = phase.steps(recipeName);
  document.getElementById("routineHint").textContent = `fase ${phase.id} · 3 passos`;

  const todayList = document.getElementById("todayChecklist");
  todayList.innerHTML = steps.map((s, i) => `
    <li class="${state.todayChecklist[i] ? "done" : ""}" data-i="${i}">
      <span class="step-mark">${state.todayChecklist[i] ? "✓" : ""}</span>
      <span class="step-text">${esc(s)}</span>
    </li>
  `).join("");
  todayList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const i = Number(li.dataset.i);
      state.todayChecklist[i] = !state.todayChecklist[i];
      if (state.todayChecklist.every(Boolean)) {
        state.days[currentDayIndex()] = true;
        state.todayChecklist = [false, false, false];
        state.openPhase = phaseOfDay(Math.min(currentDayIndex() + 1, TOTAL_DAYS)).id;
      }
      renderApp();
    });
  });

  const done = state.todayChecklist.filter(Boolean).length;
  document.getElementById("todayFoot").textContent =
    done === 0 ? "Marque os três passos para fechar o dia."
      : `${done} de 3 passos marcados — falta ${3 - done} para fechar o dia.`;

  // fotos de acompanhamento
  document.getElementById("photoRow").innerHTML = PHOTO_DAYS.map((ph) => {
    const taken = !!state.photos[ph.day];
    const reached = day >= ph.day;
    return `
      <button class="photo-cell ${taken ? "is-done" : ""} ${reached ? "" : "is-future"}" data-photo="${ph.day}">
        <span class="photo-cell__mark">${taken ? "✓" : "📷"}</span>
        <strong>${ph.label}</strong>
        <span>${ph.note}</span>
      </button>`;
  }).join("");
  document.getElementById("photoRow").querySelectorAll("[data-photo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.dataset.photo;
      if (state.photos[d]) delete state.photos[d];
      else state.photos[d] = true;
      renderApp();
    });
  });

  // tracker por fases — 90 quadradinhos de uma vez desanimam; por fase, não
  document.getElementById("phaseTracker").innerHTML = PHASES.map((ph) => {
    const from = ph.from - 1, to = ph.to;
    const slice = state.days.slice(from, to);
    const doneCount = slice.filter(Boolean).length;
    const total = to - from;
    const open = state.openPhase === ph.id;
    return `
      <div class="phase-block ${open ? "is-open" : ""}">
        <button class="phase-block__head" data-phase="${ph.id}" aria-expanded="${open}">
          <span class="phase-block__name">Fase ${ph.id} · ${esc(ph.name)}</span>
          <span class="phase-block__count">${doneCount}/${total}</span>
          <span class="phase-block__bar"><i style="width:${(doneCount / total) * 100}%"></i></span>
          <span class="nutrient__chev">${open ? "−" : "+"}</span>
        </button>
        <div class="tracker-grid" ${open ? "" : "hidden"}>
          ${slice.map((d, i) => {
            const abs = from + i;
            return `<div class="day-cell ${d ? "done" : ""} ${abs === currentDayIndex() && !d ? "today" : ""}"
              data-i="${abs}" title="Dia ${abs + 1}">${d ? "✓" : abs + 1}</div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");

  const tracker = document.getElementById("phaseTracker");
  tracker.querySelectorAll("[data-phase]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.phase);
      state.openPhase = state.openPhase === id ? 0 : id;
      renderApp();
    });
  });
  tracker.querySelectorAll(".day-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const i = Number(cell.dataset.i);
      state.days[i] = !state.days[i];
      renderApp();
    });
  });

  // registro do dia (humor + anotação)
  const note = state.notes[dayIdx] || { mood: null, text: "" };
  const moodRow = document.getElementById("moodRow");
  moodRow.innerHTML = MOODS.map((m, i) => `
    <button class="mood ${note.mood === i ? "is-active" : ""}" data-mood="${i}"
      aria-label="Humor ${i + 1} de 5">${m}</button>
  `).join("");
  moodRow.querySelectorAll(".mood").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.mood);
      const cur = state.notes[dayIdx] || { mood: null, text: "" };
      state.notes[dayIdx] = { ...cur, mood: cur.mood === i ? null : i };
      renderApp();
    });
  });

  const field = document.getElementById("dayNote");
  const status = document.getElementById("noteStatus");
  field.value = note.text || "";
  field.addEventListener("input", () => {
    const cur = state.notes[dayIdx] || { mood: null, text: "" };
    state.notes[dayIdx] = { ...cur, text: field.value };
    status.textContent = "Salvo neste navegador.";
    saveState();
  });
  const filled = Object.values(state.notes).filter((n) => n && (n.text || n.mood !== null)).length;
  status.textContent = filled ? `${filled} dia(s) registrados.` : "";

  // bônus 4 — travado, oferta A
  const bc = UPSELLS.advanced.bonusCard;
  document.getElementById("bonus4Card").innerHTML = `
    <div class="card__title-row">
      <h2 class="card__title">${bc.title}</h2>
      <span class="lock-icon">🔒</span>
    </div>
    <p class="card__text card__text--muted">${bc.text}</p>
    <a class="btn btn--upsell btn--sm" href="${UPSELLS.advanced.checkoutUrl}" target="_blank" rel="noopener">
      Desbloquear agora — ${UPSELLS.advanced.price}
    </a>
  `;

  // oferta B — só ao fechar os 90 dias
  const banner = document.getElementById("finalBanner");
  if (streak >= TOTAL_DAYS) {
    const c = UPSELLS.club;
    banner.innerHTML = `
      <div class="club-banner">
        <div>
          <h3 class="club-banner__title">${c.title}</h3>
          <p class="club-banner__text">${c.text}</p>
        </div>
        <a class="btn btn--club" href="${c.checkoutUrl}" target="_blank" rel="noopener">
          ${c.cta} — ${c.price}
        </a>
      </div>`;
  } else {
    banner.innerHTML = "";
  }
}

/* ------------------------------ aba ALIMENTAÇÃO ---------------------------- */

/* vegano implica vegetariano — quem marca um está sujeito aos dois filtros */
function dietHas(key) {
  if (key === "vegetariano") return !!(state.diet.vegetariano || state.diet.vegano);
  return !!state.diet[key];
}

/* restrições marcadas que conflitam com um item do plano */
function conflictsOf(label) {
  return (FOOD_RESTRICTIONS[label] || []).filter(dietHas);
}

function renderDietFilter(elId, contexto) {
  const box = document.getElementById(elId);
  if (!box) return;
  const marcadas = DIET_OPTIONS.filter((o) => state.diet[o.id]);

  const textos = {
    comida: {
      titulo: "Tem algo que você não pode comer?",
      texto: "Marque o que se aplica a você e o plano abaixo se reorganiza: o alimento sai da lista e a alternativa que preserva o mesmo nutriente entra no lugar. Vale também para a aba de Receitas, e fica salvo neste navegador.",
    },
    receitas: {
      titulo: "Tem alergia, restrição ou couro cabeludo sensível?",
      texto: "As mesmas marcações da aba Alimentação valem aqui. Receitas com ingrediente desaconselhado para você aparecem bloqueadas, com o motivo — em vez de sumirem sem explicação.",
    },
  }[contexto];

  box.innerHTML = `
    <div class="card__title-row">
      <h3 class="card__title">${textos.titulo}</h3>
      <span class="card__hint">${marcadas.length ? `${marcadas.length} marcado(s)` : "opcional"}</span>
    </div>
    <p class="card__text card__text--muted">${textos.texto}</p>
    <div class="diet-chips">
      ${DIET_OPTIONS.map((o) => `
        <button class="diet-chip ${state.diet[o.id] ? "is-on" : ""}" data-diet="${o.id}"
          aria-pressed="${!!state.diet[o.id]}">${esc(o.label)}</button>`).join("")}
      <button class="diet-chip diet-chip--none ${state.dietAnswered && !marcadas.length ? "is-on" : ""}"
        data-diet="__nenhuma">Nenhuma restrição</button>
    </div>
  `;

  box.querySelectorAll("[data-diet]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.diet;
      if (id === "__nenhuma") state.diet = {};
      else state.diet[id] = !state.diet[id];
      state.dietAnswered = true;
      renderApp();
    });
  });
}

function renderTabComida(p) {
  const f = p.food;
  renderDietFilter("dietFilter", "comida");

  document.getElementById("foodKicker").textContent = f.kicker;
  document.getElementById("foodHeadline").textContent = f.headline;
  document.getElementById("foodLede").textContent = f.lede;

  let acc = 0;
  const stops = f.plate.map((s) => {
    const from = acc; acc += s.pct;
    return `${s.color} ${from}% ${acc}%`;
  }).join(", ");
  document.getElementById("plateViz").style.background = `conic-gradient(${stops})`;

  document.getElementById("plateLegend").innerHTML = f.plate.map((s) => `
    <li><span class="dot" style="background:${s.color}"></span>
      <strong>${s.pct}%</strong> ${esc(s.label)}</li>
  `).join("");
  document.getElementById("plateFoot").textContent = f.plateFoot;

  const srcTag = (tier) => {
    const e = EVIDENCE[tier];
    return `<span class="src ${e.cls}">${e.label}</span>`;
  };
  const allergenTags = (label) => {
    const tags = FOOD_ALLERGENS[label] || [];
    if (!tags.length) return "";
    return `<span class="allergens" title="Contém alérgeno comum">⚠ contém ${
      tags.map((t) => esc(ALLERGEN_LABELS[t])).join(" · ")}</span>`;
  };
  const foodItem = (i, kind) => `
    <div class="food-item food-item--${kind}">
      <h4>${esc(i.food)}</h4>
      <span class="food-item__how">${esc(i.how)}</span>
      <p>${esc(i.why)}</p>
      <div class="food-item__tags">${srcTag(evidenceOf(i.food))}${allergenTags(i.food)}</div>
    </div>`;

  // separa o que a pessoa pode comer do que precisa sair pelas restrições dela
  const liberados = f.yes.filter((i) => conflictsOf(i.food).length === 0);
  const retirados = f.yes.filter((i) => conflictsOf(i.food).length > 0);

  document.getElementById("foodYes").innerHTML = liberados.map((i) => foodItem(i, "yes")).join("");
  document.getElementById("foodNo").innerHTML = f.no.map((i) => foodItem(i, "no")).join("");

  // bloco de trocas — só existe quando há restrição marcada
  const swapBox = document.getElementById("foodSwaps");
  if (!retirados.length) {
    swapBox.innerHTML = "";
    swapBox.hidden = true;
  } else {
    swapBox.hidden = false;
    // as substituições cobrem tanto a restrição marcada quanto os nutrientes
    // que saíram junto: quem vira vegano perde peixe, ovo e leite de uma vez
    const usadas = new Set();
    retirados.forEach((i) => {
      conflictsOf(i.food).forEach((k) => usadas.add(k));
      (FOOD_ALLERGENS[i.food] || []).forEach((k) => usadas.add(k));
    });
    const subs = SUBSTITUTIONS.filter((s) => s.keys.some((k) => usadas.has(k)));

    swapBox.innerHTML = `
      <div class="card__title-row">
        <h3 class="card__title">Trocado para você</h3>
        <span class="card__hint">${retirados.length} item(ns) fora do seu plano</span>
      </div>
      <p class="card__text card__text--muted">
        Estes itens saíram da sua lista pelas restrições que você marcou. Eles continuam
        visíveis de propósito — para você saber o que foi retirado e por quê, em vez de
        receber um plano encurtado sem explicação.
      </p>
      <div class="swap-list">
        ${retirados.map((i) => `
          <div class="swap">
            <span class="swap__food">${esc(i.food)}</span>
            <span class="swap__why">fora por: ${conflictsOf(i.food)
              .map((k) => esc((DIET_OPTIONS.find((o) => o.id === k) || {}).label || k)).join(", ")}</span>
          </div>`).join("")}
      </div>
      <div class="subs-list">
        ${subs.map((s) => `
          <div class="sub">
            <div class="sub__head">
              <span class="sub__out">${esc(s.out)}</span>
              <span class="sub__keep">manter: ${esc(s.keep)}</span>
            </div>
            <p>${esc(dietHas("vegetariano") && s.intoVeg ? s.intoVeg : s.into)}</p>
          </div>`).join("")}
      </div>`;
  }

  // notas de gestação — não retiram alimento, mudam a conversa
  const gest = document.getElementById("gestanteNotes");
  if (!state.diet.gestante) {
    gest.innerHTML = "";
    gest.hidden = true;
  } else {
    gest.hidden = false;
    gest.innerHTML = `
      <div class="card__title-row">
        <h3 class="card__title">Gestação e amamentação</h3>
        <span class="card__hint">converse no pré-natal</span>
      </div>
      <p class="card__text card__text--muted">
        Nada foi removido do seu plano por causa disso — o que muda são os pontos abaixo,
        que precisam passar por quem acompanha a sua gestação.
      </p>
      <ul class="safety-list">${GESTANTE_NOTES.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
  }

  document.getElementById("foodCombos").innerHTML = f.combos.map((c) => `
    <div class="combo">
      <div class="combo__pair">
        <span class="combo__a">${esc(c.a)}</span>
        <span class="combo__plus">+</span>
        <span class="combo__b">${esc(c.b)}</span>
      </div>
      <p>${esc(c.gain)}</p>
      ${srcTag(evidenceOf(c.a))}
    </div>
  `).join("");

  document.getElementById("safetyFood").innerHTML = SAFETY_FOOD
    .map((s) => `<li>${s}</li>`).join("");

  document.getElementById("anaphylaxis").textContent = ANAPHYLAXIS;
  document.getElementById("subsList").innerHTML = SUBSTITUTIONS.map((s) => `
    <div class="sub">
      <div class="sub__head">
        <span class="sub__out">${esc(s.out)}</span>
        <span class="sub__keep">manter: ${esc(s.keep)}</span>
      </div>
      <p>${esc(s.into)}</p>
    </div>
  `).join("");

  const nl = document.getElementById("nutrientList");
  nl.innerHTML = NUTRIENTS.map((n) => {
    const lvl = NUTRIENT_LEVELS[n.level];
    const open = state.openNutrient === n.id;
    return `
      <div class="nutrient ${open ? "is-open" : ""}">
        <button class="nutrient__head" data-nutrient="${n.id}" aria-expanded="${open}">
          <span class="nutrient__name">${esc(n.name)}</span>
          <span class="lvl ${lvl.cls}">${lvl.label}</span>
          <span class="nutrient__chev">${open ? "−" : "+"}</span>
        </button>
        <div class="nutrient__body" ${open ? "" : "hidden"}>
          <p><strong>O que faz:</strong> ${esc(n.role)}</p>
          <p><strong>Onde encontrar:</strong> ${esc(n.food)}</p>
          <p class="nutrient__ev">${esc(n.evidence)}</p>
        </div>
      </div>`;
  }).join("");
  nl.querySelectorAll(".nutrient__head").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.nutrient;
      state.openNutrient = state.openNutrient === id ? null : id;
      renderApp();
    });
  });

  document.getElementById("mythList").innerHTML = MYTHS.map((m) => `
    <div class="myth">
      <p class="myth__claim">${esc(m.claim)}</p>
      <p class="myth__truth">${esc(m.truth)}</p>
    </div>
  `).join("");
}

/* -------------------------------- aba RECEITAS ----------------------------- */

/* marcadores que desaconselham uma receita para esta pessoa */
function recipeBlocks(rid) {
  return (RECIPE_RESTRICTIONS[rid] || []).filter(dietHas);
}

function renderTabReceitas(p) {
  renderDietFilter("dietFilterRecipes", "receitas");

  const todas = [...p.recipes, ...Object.keys(RECIPES).filter((k) => !p.recipes.includes(k))];
  const liberadas = todas.filter((rid) => recipeBlocks(rid).length === 0);
  const bloqueadas = todas.filter((rid) => recipeBlocks(rid).length > 0);

  const aviso = document.getElementById("recipeFilterNote");
  aviso.hidden = bloqueadas.length === 0;
  if (bloqueadas.length) {
    aviso.innerHTML = `<strong>${bloqueadas.length} receita(s) fora do seu perfil.</strong>
      Elas continuam listadas no fim, bloqueadas e com o motivo — porque saber por que
      algo não serve para você vale mais que a receita sumir da tela.`;
  }

  const bloqueadasHtml = bloqueadas.map((rid) => {
    const r = RECIPES[rid];
    const motivos = recipeBlocks(rid).map((k) => RECIPE_REASONS[k]).filter(Boolean);
    return `
      <article class="recipe-card recipe-card--blocked">
        <header class="recipe-card__head">
          <div>
            <span class="pill pill--blocked">não indicada para você</span>
            <h3>${esc(r.name)}</h3>
            <p class="recipe-card__sub">${esc(r.text)}</p>
          </div>
        </header>
        <p class="recipe-card__blockwhy">
          Está bloqueada porque ${motivos.join("; e ")}.
          O preparo fica oculto de propósito — se quiser usar mesmo assim, converse antes
          com um profissional de saúde.
        </p>
      </article>`;
  }).join("");

  document.getElementById("recipeFull").innerHTML = liberadas.map((rid) => {
    const r = RECIPES[rid];
    const mine = p.recipes.includes(rid);
    return `
      <article class="recipe-card ${mine ? "recipe-card--mine" : ""}">
        <header class="recipe-card__head">
          <div>
            ${mine ? `<span class="pill pill--mine">do seu perfil</span>` : ""}
            <h3>${esc(r.name)}</h3>
            <p class="recipe-card__sub">${esc(r.text)}</p>
          </div>
          <div class="recipe-card__meta">
            <span>${esc(r.freq)}</span>
            <span>${esc(r.time)}</span>
          </div>
        </header>
        <div class="recipe-card__cols">
          <div>
            <h4>Ingredientes</h4>
            <ul class="ingredients">${r.ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          </div>
          <div>
            <h4>Passo a passo</h4>
            <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
          </div>
        </div>
        <div class="recipe-card__why">
          <h4>Por que esta receita está aqui</h4>
          <p>${esc(r.why)}</p>
          <span class="src ${EVIDENCE[recipeEvidenceOf(rid)].cls}">${EVIDENCE[recipeEvidenceOf(rid)].label}</span>
        </div>
        <p class="recipe-card__caution">⚠︎ ${esc(r.caution)}</p>
      </article>`;
  }).join("") + bloqueadasHtml;

  document.getElementById("safetyRecipes").innerHTML = SAFETY_RECIPES
    .map((s) => `<li>${s}</li>`).join("");
}

/* -------------------------------- aba ENTENDER ----------------------------- */

function renderTabEntender(p) {
  const list = document.getElementById("libraryList");
  const extra = p.sex ? LIBRARY_BY_SEX[p.sex] : null;
  const articles = extra ? [extra, ...LIBRARY] : LIBRARY;

  const perfilCard = `
    <article class="article is-open article--profile">
      <div class="article__head article__head--static">
        <div>
          <span class="article__kicker">seu perfil</span>
          <h3>${esc(p.name)}</h3>
        </div>
        <span class="article__read">leitura sob medida</span>
      </div>
      <div class="article__body">
        <p>${esc(p.desc)}</p>
        ${p.redFlag ? `<div class="alert alert--warn"><strong>Vale uma atenção a mais:</strong>
          <ul class="alert__list">${p.redFlagList.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
      </div>
    </article>`;

  const html = articles.map((a) => {
    const open = state.openArticle === a.id;
    return `
      <article class="article ${open ? "is-open" : ""}">
        <button class="article__head" data-article="${a.id}" aria-expanded="${open}">
          <div>
            <span class="article__kicker">${esc(a.kicker)}</span>
            <h3>${esc(a.title)}</h3>
          </div>
          <span class="article__read">${esc(a.read)} ${open ? "−" : "+"}</span>
        </button>
        <div class="article__body" ${open ? "" : "hidden"}>
          ${a.body.map((par) => `<p>${esc(par)}</p>`).join("")}
        </div>
      </article>`;
  }).join("");

  const sources = `
    <div class="sources">
      <h4>De onde vem o que você leu aqui</h4>
      <ul>${SOURCES.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <p>
        Os textos foram escritos para leitura leiga a partir dessas revisões. Simplificação
        implica perda de nuance: nenhuma delas foi produzida para orientar um caso individual,
        e este material também não.
      </p>
    </div>`;

  list.innerHTML = perfilCard + html + sources;

  list.querySelectorAll(".article__head[data-article]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.article;
      state.openArticle = state.openArticle === id ? null : id;
      renderApp();
    });
  });
}

/* ------------------------------- fontes citadas ---------------------------- */

const SOURCES = [
  "Gokce N. et al. An overview of the genetic aspects of hair loss and its connection with nutrition. J Prev Med Hyg. 2022;63(Suppl.3):E228-E238.",
  "Pizzol M. H. et al. Classificação, diagnóstico e opções terapêuticas para a queda capilar. (capítulo, 2024).",
  "Döering T. P. et al. Alopécia androgenética: diagnóstico e manejo clínico.",
  "Cortez G. L. et al. Alopecia androgenética masculina. Anais Brasileiros de Dermatologia. 2025;100(2):308-321.",
  "Rossoni B. T. et al. Alopecia areata: padrões de queda de cabelo, modalidades de tratamento e impacto psicológico. Rev. Ibero-Americana de Humanidades, Ciências e Educação. 2024;10(7).",
];

/* ---------------------------------------------------------------------------
   5) AÇÕES GLOBAIS
   --------------------------------------------------------------------------- */

document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "start-quiz") {
    const nome = document.getElementById("nameInput");
    const email = document.getElementById("emailInput");
    if (nome) state.name = nome.value;
    if (email) state.email = email.value.trim();
    // o e-mail da compra só é exigido quando há planilha ligada do outro lado
    if (CONFIG.sheetsEndpoint && !emailValido(state.email)) {
      document.getElementById("emailErr").hidden = false;
      email.focus();
      return;
    }
    if (!state.startedAt) state.startedAt = new Date().toISOString();
    state.screen = "quiz";
    state.quizIndex = 0;
    render();
  }
  if (action === "quiz-back") {
    if (state.quizIndex === 0) state.screen = "welcome";
    else state.quizIndex -= 1;
    render();
  }
  if (action === "quiz-next") {
    const list = questionList(sexOf());
    if (state.quizIndex < list.length - 1) {
      state.quizIndex += 1;
      render();
    } else {
      state.screen = "analise";
      render();
    }
  }
  if (action === "go-dashboard") {
    state.screen = "dashboard";
    state.tab = "hoje";
    state.openPhase = phaseOfDay(Math.min(currentDayIndex() + 1, TOTAL_DAYS)).id;
    render();
  }
});

document.getElementById("btnReset").addEventListener("click", () => {
  if (!confirm("Isso vai apagar seu diagnóstico e progresso salvo neste navegador. Continuar?")) return;
  state = freshState();
  render();
});

/* ---------------------------------------------------------------------------
   6) INIT
   --------------------------------------------------------------------------- */
render();
