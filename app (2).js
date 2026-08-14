/* =============================================================================
   Protocolo Raiz Nova — app.js
   App estático, sem backend. Estado persistido em localStorage para que a
   pessoa possa fechar e voltar sem perder o diagnóstico e o progresso.
   ============================================================================= */

const STORAGE_KEY = "raizNova.v1";

/* ---------------------------------------------------------------------------
   0) ÍCONES — SVG inline, um traço só (sem emoji)
   --------------------------------------------------------------------------- */

function svgIcon(paths) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="1em" height="1em">${paths}</svg>`;
}

// cores de destaque que giram entre os cards repetidos (foco, capítulos,
// receitas) — é o que dá variação visual em vez de tudo branco/uniforme
const ACCENT_CLASSES = ["accent-coral", "accent-teal", "accent-gold", "accent-violet"];
function accentClass(i) {
  return ACCENT_CLASSES[i % ACCENT_CLASSES.length];
}

const ICONS = {
  moon: svgIcon('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  clock: svgIcon('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>'),
  pencil: svgIcon('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/>'),
  plate: svgIcon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/>'),
  egg: svgIcon('<path d="M12 21c4.4 0 7-3.6 7-8 0-5-3.6-10-7-10S5 8 5 13c0 4.4 2.6 8 7 8Z"/>'),
  droplet: svgIcon('<path d="M12 2.7l5.7 6.5a7 7 0 1 1-11.4 0z"/>'),
  flame: svgIcon('<path d="M12 2c3 4 6 7 6 11a6 6 0 0 1-12 0c0-1.5.6-2.5 1.5-3.5.2 1.4 1 2.2 1.8 2.2.9 0 1.2-1 .7-2.4C9 7.8 10 5 12 2Z"/>'),
  wind: svgIcon('<path d="M4 10h9a3 3 0 1 0-2.8-4"/><path d="M2 15h13a3 3 0 1 1-2.8 4"/>'),
  shield: svgIcon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>'),
  calendar: svgIcon('<rect x="3" y="4.5" width="18" height="16" rx="2"/><line x1="16" y1="2.5" x2="16" y2="6.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  leaf: svgIcon('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
  camera: svgIcon('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  lock: svgIcon('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  check: svgIcon('<polyline points="20 6 9 17 4 12"/>'),
  chevron: svgIcon('<polyline points="6 9 12 15 18 9"/>'),
};

/* ---------------------------------------------------------------------------
   1) CONTEÚDO — perguntas, receitas, capítulos, perfis
   --------------------------------------------------------------------------- */

const QUESTIONS = [
  {
    id: "genero",
    type: "single",
    title: "Pra começar, você é:",
    hint: "Isso ajusta algumas perguntas e o seu plano final.",
    options: [
      { id: "feminino", label: "Mulher", tags: {} },
      { id: "masculino", label: "Homem", tags: {} },
    ],
  },
  {
    id: "padrao",
    type: "single",
    title: "Como você descreveria o padrão da sua queda?",
    hint: "Escolha a opção mais parecida com o que você observa hoje.",
    options: [
      { id: "difusa", label: "Espalhada por toda a cabeça — mais fios soltos em geral", tags: { estresse: 1, nutricional: 1 } },
      { id: "entradas_coroa", label: "Mais concentrada nas entradas e no topo/coroa", tags: { genetico: 2 } },
      { id: "placas", label: "Em placas ou áreas específicas, sem cabelo", tags: {}, redFlag: "placas" },
    ],
  },
  {
    id: "tempo",
    type: "single",
    title: "Há quanto tempo você notou esse aumento na queda?",
    hint: "",
    options: [
      { id: "menos1", label: "Menos de 1 mês", tags: { estresse: 1 } },
      { id: "1a3", label: "De 1 a 3 meses", tags: { estresse: 1, nutricional: 1 } },
      { id: "3a6", label: "De 3 a 6 meses", tags: { nutricional: 1 } },
      { id: "mais6", label: "Mais de 6 meses, sem melhora", tags: { genetico: 1 }, chronic: true },
    ],
  },
  {
    id: "gatilho",
    type: "multi",
    title: "Algo destes aconteceu nos últimos 6 meses?",
    hint: "Pode marcar mais de um.",
    options: [
      { id: "parto", label: "Parto ou pós-parto", tags: { estresse: 2 }, hideFor: "masculino" },
      { id: "dieta", label: "Dieta restritiva ou perda de peso rápida", tags: { nutricional: 2 } },
      { id: "estresse_forte", label: "Período de estresse ou luto intenso", tags: { estresse: 2 } },
      { id: "hormonio", label: "Início, troca ou suspensão de hormônio (anticoncepcional, tireoide, testosterona etc.)", tags: { estresse: 2 } },
      { id: "cirurgia", label: "Cirurgia, febre alta ou doença recente", tags: { nutricional: 1, estresse: 1 } },
      { id: "nenhum_gatilho", label: "Nenhum desses", tags: { genetico: 1 }, exclusive: true },
    ],
  },
  {
    id: "habitos",
    type: "multi",
    title: "Quais desses hábitos fazem parte da sua rotina?",
    hint: "Pode marcar mais de um.",
    options: [
      { id: "calor", label: "Secador/chapinha quase todo dia, sem protetor térmico", tags: { habito: 2 } },
      { id: "quimica", label: "Alisamento, coloração ou química em sequência", tags: { habito: 2 } },
      { id: "lavagem", label: "Lavagem bem irregular (de mais ou de menos)", tags: { habito: 1 } },
      { id: "tracao", label: "Rabo, coque ou trança apertada com frequência", tags: { habito: 2 }, hideFor: "masculino" },
      { id: "extensao", label: "Extensão, aplique, box braids ou peruca com tração por tempo prolongado", tags: { habito: 2 }, hideFor: "masculino" },
      { id: "bone", label: "Boné, gorro ou capacete apertado por várias horas seguidas", tags: { habito: 1 }, hideFor: "feminino" },
      { id: "maquina", label: "Corte na máquina bem curto e recorrente (menos de 2 semanas entre cortes)", tags: { habito: 1 }, hideFor: "feminino" },
      { id: "pomada", label: "Pomada, gel ou pó fixador em excesso no couro cabeludo", tags: { habito: 1 }, hideFor: "feminino" },
      { id: "nenhum_habito", label: "Nenhum desses — já cuido bem por fora", tags: {}, exclusive: true },
    ],
  },
  {
    id: "alimentacao",
    type: "single",
    title: "Como está sua alimentação hoje?",
    hint: "",
    options: [
      { id: "restritiva", label: "Faço dieta restritiva ou corto grupos alimentares", tags: { nutricional: 2 } },
      { id: "pouca_proteina", label: "Como pouca proteína no dia a dia", tags: { nutricional: 2 } },
      { id: "variada", label: "Alimentação variada e regular", tags: {} },
    ],
  },
  {
    id: "sinais",
    type: "multi",
    title: "Você tem notado algum destes sinais?",
    hint: "Pode marcar mais de um.",
    options: [
      { id: "coceira", label: "Coceira, vermelhidão ou descamação no couro cabeludo", tags: {}, redFlag: "coceira" },
      { id: "familiar", label: "Histórico familiar forte de calvície", tags: { genetico: 2 } },
      { id: "nenhum_sinal", label: "Nenhum desses", tags: {}, exclusive: true },
    ],
  },
  {
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
  },
];

const RECIPES = {
  "tonico-alecrim": {
    name: "Tônico de alecrim fortalecedor",
    text: "Óleo de coco + alecrim, massageado no couro cabeludo — estimula a circulação da raiz.",
    ingredientes: ["2 colheres de sopa de óleo de coco (ou jojoba)", "5 gotas de óleo essencial de alecrim"],
    modo: "Misture os dois óleos em um potinho pequeno. Aplique no couro cabeludo com a ponta dos dedos, massageando por 2 a 3 minutos. Deixe agir pelo menos 1 hora (ou durante a noite) e lave normalmente.",
    frequencia: "2 a 3x por semana",
  },
  "mascara-abacate": {
    name: "Máscara nutritiva de abacate",
    text: "Repõe maciez em fios ressecados pelo calor e pela química.",
    ingredientes: ["1/2 abacate maduro amassado", "1 colher de sopa de óleo de coco", "1 colher de chá de mel"],
    modo: "Misture até formar uma pasta homogênea. Aplique do comprimento até as pontas (evite a raiz). Deixe agir 20-30 min com touca e enxágue bem.",
    frequencia: "1x por semana",
  },
  "enxague-vinagre": {
    name: "Enxágue de vinagre de maçã",
    text: "Fecha a cutícula e equilibra o pH do couro cabeludo.",
    ingredientes: ["1 colher de sopa de vinagre de maçã", "1 xícara de água filtrada"],
    modo: "Misture e use como último enxágue após lavar o cabelo, sem precisar enxaguar de novo.",
    frequencia: "Toda lavagem",
  },
  "mascara-babosa": {
    name: "Máscara de babosa (aloe vera)",
    text: "Ação calmante; ajuda a desobstruir resíduos ao redor do folículo.",
    ingredientes: ["2 colheres de sopa de gel de babosa (folha fresca ou gel puro)"],
    modo: "Aplique diretamente no couro cabeludo limpo, massageie por 5 min e deixe agir 30 min antes de lavar.",
    frequencia: "1 a 2x por semana",
  },
  "oleo-ricino": {
    name: "Óleo de rícino para as pontas",
    text: "Sela a fibra capilar e reduz a quebra nas pontas.",
    ingredientes: ["1 colher de sopa de óleo de rícino", "1 colher de sopa de óleo de coco"],
    modo: "Misture e aplique só nas pontas duplas ou mais ressecadas, antes de dormir.",
    frequencia: "1 a 2x por semana",
  },
  "spray-arroz": {
    name: "Spray de água de arroz",
    text: "Ritual tradicional para dar mais corpo e resistência ao fio.",
    ingredientes: ["1/2 xícara de arroz cru", "2 xícaras de água filtrada"],
    modo: "Deixe o arroz de molho por 30 min, coe e guarde o líquido em um borrifador na geladeira (dura até 3 dias). Borrife no couro cabeludo antes da lavagem, deixe agir 15-20 min e enxágue.",
    frequencia: "Antes da lavagem, quando quiser variar",
  },
};

const CHAPTERS = {
  c1: "Capítulo 1 — Por que o seu cabelo está caindo",
  c2: "Capítulo 2 — Os 7 hábitos que pioram a queda",
  c3: "Capítulo 3 — O Protocolo Raiz Nova (rotina de 3 passos)",
  c4: "Capítulo 4 — Óleo de alecrim: o que a ciência mostra",
  c5: "Capítulo 5 — Quando procurar ajuda profissional",
};

// conteúdo real de cada capítulo, resumido do guia principal em PDF — o app não
// é só um índice de títulos, dá pra ler o essencial de cada capítulo aqui dentro.
const CHAPTER_CONTENT = {
  c1: {
    paragraphs: [
      "Perder cabelo é normal — o couro cabeludo tem ciclos, e o esperado é perder entre 60 e 100 fios por dia. O problema é quando a queda foge desse padrão e você sente que está perdendo densidade.",
      "A causa mais comum de queda difusa (espalhada, sem falhas localizadas) tem nome: eflúvio telógeno — um desequilíbrio temporário no ciclo capilar, geralmente provocado por estresse, dietas restritivas, alterações hormonais, deficiências nutricionais ou alterações de tireoide.",
      "O cabelo leva cerca de 3 meses pra começar a cair depois do gatilho, e de 6 a 12 meses pra se recuperar quando a causa é tratada — por isso constância importa mais que qualquer produto milagroso.",
      "Isso é diferente de calvície hereditária (alopecia androgenética), que costuma aparecer em padrão — entradas, coroa, repartido alargado — e ser progressiva. Se é o seu caso, este guia ainda ajuda a fortalecer os fios, mas o acompanhamento com um dermatologista é o que faz a diferença real no resultado.",
    ],
  },
  c2: {
    intro: "Antes de somar mais coisa na rotina, vale tirar estas sete do caminho:",
    habits: [
      ["Calor em excesso sem proteção", "Secador, chapinha e babyliss no talo, sem protetor térmico, ressecam e enfraquecem a fibra — o fio fica quebradiço antes de crescer o suficiente."],
      ["Prender o cabelo com muita força", "Rabos, coques e tranças apertadas todos os dias puxam a raiz e podem causar queda por tração, principalmente nas laterais e na testa."],
      ["Lavar bagunçado — de mais ou de menos", "Excesso de lavagem resseca o couro cabeludo; de menos, acumula oleosidade e resíduo que sufocam o folículo."],
      ["Escovar o cabelo molhado com força", "O fio molhado é mais frágil e estica antes de arrebentar. Pente de dentes largos e delicadeza fazem diferença real."],
      ["Dietas restritivas sem orientação", "Cortar grupos alimentares inteiros tira do corpo a matéria-prima — proteína, ferro, zinco — que o folículo precisa pra produzir fio novo."],
      ["Química em sequência, sem descanso", "Alisamento, coloração e outras químicas empilhadas sem intervalo enfraquecem a fibra e sobrecarregam o couro cabeludo."],
      ["Ignorar o couro cabeludo", "O foco costuma ir todo pro comprimento do fio, mas o crescimento começa na raiz. Couro cabeludo negligenciado atrasa o ciclo de crescimento."],
    ],
  },
  c3: {
    paragraphs: [
      "O coração do guia é uma rotina simples pra repetir por 21 dias. Não é sobre fazer tudo de uma vez — é sobre repetir o básico bem feito, todos os dias, até virar hábito.",
    ],
    steps: [
      ["Passo 1 — Higienizar e massagear (2 a 3x por semana)", "Lave com um shampoo suave e aproveite os 60 segundos de aplicação pra massagear o couro cabeludo com a ponta dos dedos, em movimentos circulares, da nuca até a testa. A massagem estimula a circulação — o \"caminho de entrega\" de oxigênio e nutrientes até o folículo."],
      ["Passo 2 — Nutrir a raiz (todos os dias, à noite)", "Aplique óleo de alecrim diluído direto no couro cabeludo limpo e seco, massageando por 2 a 3 minutos. Pode deixar agir durante a noite. Alterne com as receitas da aba Receitas ao longo da semana."],
      ["Passo 3 — Proteger o que já cresceu", "Antes de qualquer fonte de calor, aplique protetor térmico. Prefira penteados soltos e troque o ponto de tração com frequência. À noite, troque a fronha de algodão por uma de cetim ou seda."],
    ],
  },
  c4: {
    paragraphs: [
      "É um dos ativos naturais mais estudados pra queda de cabelo. Estudos recentes colocam o óleo de alecrim como alternativa natural com resultados comparáveis a tratamentos tópicos convencionais, por três mecanismos: ação antioxidante, efeito anti-inflamatório no couro cabeludo e melhora da circulação local.",
    ],
    bullets: [
      "Sempre diluído em óleo carreador (coco, jojoba ou rícino) — nunca puro sobre a pele.",
      "Aplique com massagem, de preferência à noite, deixando agir por várias horas.",
      "Use de 2 a 3 vezes por semana; resultado consistente pede uso regular por meses, não dias.",
      "Contraindicado na gravidez e amamentação.",
      "Teste numa pequena área da pele 24h antes do primeiro uso, pra descartar irritação.",
    ],
  },
  c5: {
    intro: "Este guia foi pensado pros casos mais comuns de queda leve a moderada. Mas alguns sinais pedem avaliação médica antes de (ou junto com) qualquer protocolo caseiro:",
    bullets: [
      "Queda repentina e muito intensa, em tufos.",
      "Falhas localizadas, em formato de moeda ou placa.",
      "Coceira, vermelhidão, descamação, feridas ou dor no couro cabeludo.",
      "Queda que não melhora após 3 a 6 meses de cuidados consistentes.",
      "Histórico familiar forte de calvície, ou sintomas como fadiga extrema e alterações de peso.",
    ],
    outro: "Nenhum desses sinais é motivo de pânico — mas é motivo de agenda. Um exame simples de sangue costuma revelar se há deficiência de ferro, zinco, vitamina D ou alteração de tireoide por trás da queda.",
  },
};

// tabela de nutrientes (Bônus 2) — usada na aba Alimentação
const NUTRIENTS = [
  { key: "Proteína", why: "O fio é feito de queratina, uma proteína. Pouca proteína na dieta = matéria-prima insuficiente.", sources: "Ovos, feijão, lentilha, frango, peixe, iogurte, queijo" },
  { key: "Ferro", why: "Deficiência de ferro é uma das causas nutricionais mais associadas à queda difusa.", sources: "Carnes vermelhas magras, feijão, lentilha, espinafre, gema de ovo" },
  { key: "Zinco", why: "Participa da renovação celular do folículo e da produção de queratina.", sources: "Sementes de abóbora, castanhas, carnes, grão-de-bico" },
  { key: "Vitamina D", why: "Envolvida no ciclo de vida do folículo; níveis baixos aparecem associados a mais queda.", sources: "Exposição solar responsável, ovos, peixes gordurosos" },
  { key: "Ômega-3", why: "Ajuda a manter a hidratação do couro cabeludo e tem ação anti-inflamatória.", sources: "Peixes gordurosos, chia, linhaça, nozes" },
  { key: "Vitamina C", why: "Ajuda na absorção do ferro e na produção de colágeno.", sources: "Laranja, acerola, morango, kiwi, pimentão" },
];

const SAMPLE_DAY = [
  ["Café da manhã", "Ovos mexidos + aveia com frutas vermelhas"],
  ["Lanche", "Um punhado de castanhas ou amêndoas"],
  ["Almoço", "Frango ou peixe + feijão/lentilha + salada + arroz"],
  ["Lanche da tarde", "Iogurte natural com chia ou linhaça"],
  ["Jantar", "Sopa de lentilha com legumes, ou omelete com espinafre"],
];

const PROFILES = {
  estresse: {
    name: "Eflúvio por Estresse & Hormônios",
    desc: "Suas respostas apontam para um gatilho recente — estresse, uma fase hormonal ou um evento físico forte. Esse tipo de queda costuma ser temporário e responde bem a rotina consistente + tempo.",
    focus: [
      { icon: "moon", title: "Priorize a calma no ritual", text: "A massagem do Passo 1 antes de dormir ajuda o corpo a sair do modo de alerta." },
      { icon: "clock", title: "Dê tempo ao ciclo", text: "Esse tipo de queda leva de 6 a 12 meses para se recuperar por completo." },
      { icon: "pencil", title: "Registre o gatilho", text: "Anotar o que mudou nos últimos meses ajuda a não repetir o padrão." },
    ],
    chapters: ["c1", "c3", "c5"],
    recipes: ["tonico-alecrim", "mascara-babosa"],
    foodFocus: "Seu corpo gasta muita energia em períodos de estresse — reforce ômega-3 e vitamina D para apoiar o couro cabeludo por dentro.",
    foodTags: ["Ômega-3", "Vitamina D", "Proteína"],
  },
  nutricional: {
    name: "Eflúvio Nutricional",
    desc: "Seu perfil aponta para uma possível lacuna nutricional — dieta restritiva, pouca proteína ou baixa reposição de ferro e zinco. O folículo costuma ser um dos primeiros lugares a sentir essa falta.",
    focus: [
      { icon: "plate", title: "O prato entra na rotina", text: "Seguir o guia alimentar aqui não é opcional — é onde a mudança real acontece." },
      { icon: "egg", title: "Proteína em toda refeição", text: "Garanta uma fonte de proteína em pelo menos 3 refeições do dia." },
      { icon: "droplet", title: "Vale um exame", text: "Um exame de sangue simples confirma se ferro, zinco ou vitamina D estão baixos." },
    ],
    chapters: ["c1", "c3", "c2"],
    recipes: ["spray-arroz", "mascara-abacate"],
    foodFocus: "Foque em repor proteína, ferro e zinco — a base para o folículo produzir fio novo.",
    foodTags: ["Proteína", "Ferro", "Zinco"],
  },
  habito: {
    name: "Desgaste por Hábito",
    desc: "A maior parte da sua queda parece ligada a hábitos do dia a dia — calor, tração ou química em excesso — mais do que a uma causa interna. A boa notícia: isso está no seu controle.",
    focus: [
      { icon: "flame", title: "Corte o calor sem proteção", text: "É o hábito com mais impacto imediato — nunca sem protetor térmico." },
      { icon: "wind", title: "Solte o penteado", text: "Prenda com menos força e varie o ponto de tração." },
      { icon: "shield", title: "Proteja à noite", text: "Fronha de cetim/seda reduz o atrito que quebra o fio enquanto você dorme." },
    ],
    chapters: ["c2", "c3", "c4"],
    recipes: ["oleo-ricino", "enxague-vinagre"],
    foodFocus: "A alimentação não é o ponto central aqui, mas proteína e vitamina C ajudam o fio a se recuperar do dano mecânico mais rápido.",
    foodTags: ["Proteína", "Vitamina C"],
  },
  genetico: {
    name: {
      feminino: "Padrão Genético de Afinamento Capilar",
      masculino: "Padrão de Calvície Masculina (Genético)",
    },
    desc: {
      feminino: "O padrão descrito (queda concentrada em entradas/coroa, tempo prolongado, ou histórico familiar) pode ter componente hereditário — a alopecia androgenética também existe na versão feminina, normalmente como afinamento difuso. Este guia ajuda a fortalecer e cuidar — mas aqui o acompanhamento profissional faz toda a diferença no resultado.",
      masculino: "O padrão descrito (entradas, coroa ou topo, tempo prolongado, ou histórico familiar) é a assinatura clássica da calvície de padrão masculino (alopecia androgenética) — a causa mais comum de queda em homens. Este guia ajuda a fortalecer e cuidar — mas aqui o acompanhamento profissional faz toda a diferença no resultado.",
    },
    focus: [
      { icon: "calendar", title: "Marque uma avaliação", text: "Um dermatologista confirma o padrão e indica o que mais somar ao seu cuidado." },
      { icon: "leaf", title: "Cuide do que está no seu controle", text: "A rotina do Protocolo Raiz Nova ainda ajuda a manter o couro cabeludo saudável." },
      { icon: "camera", title: "Acompanhe com fotos", text: "Fotos mensais, mesma luz e ângulo, ajudam a enxergar mudanças reais." },
    ],
    chapters: ["c5", "c1", "c3"],
    recipes: ["tonico-alecrim", "oleo-ricino"],
    foodFocus: "Mantenha a base nutricional em dia — não resolve sozinho, mas cria o melhor cenário possível para qualquer tratamento.",
    foodTags: ["Proteína", "Ferro", "Zinco"],
    // perguntas reais, de graça, pra quem tem esse perfil — a aba Guia mostra isso
    // pra quem tem esse perfil; o Bônus 4 (pago) expande esse roteiro.
    sampleQuestions: [
      "Pelo padrão que eu descrevi, isso parece mais eflúvio temporário ou alopecia androgenética?",
      "Existe algum exame (sangue, tricoscopia) que ajudaria a confirmar a causa?",
      "Quais opções de tratamento fazem sentido pro meu caso, e em quanto tempo dá pra esperar algum resultado?",
    ],
  },
};

const REDFLAG_MESSAGES = {
  placas: "Queda concentrada em placas específicas pode ter causas variadas — o ideal é um dermatologista avaliar antes de seguir qualquer rotina.",
  coceira: "Coceira, vermelhidão ou descamação no couro cabeludo podem indicar uma condição que pede avaliação profissional, mesmo seguindo os cuidados gerais.",
  chronic: "Mais de 6 meses de queda persistente, sem melhora, é motivo suficiente para buscar uma avaliação profissional junto com a rotina.",
};

/* =============================================================================
   ██  CONFIGURAÇÃO DE UPSELL — EDITE AQUI  ██
   Troque textos, preços e "checkoutUrl" pelos links reais assim que tiver a
   plataforma de checkout escolhida (Kiwify/Hotmart/Youshop/etc.). Os links
   abrem em nova aba; nada aqui depende de backend.
   ============================================================================= */

const UPSELLS = {
  // ---------------------------------------------------------------------
  // OFERTA A — compra única, ticket mais alto.
  // Aparece em 2 lugares: card na tela de Resultado (texto muda por perfil)
  // e como "Bônus 4" travado no dashboard (texto único, sempre visível).
  // ---------------------------------------------------------------------
  advanced: {
    checkoutUrl: "https://SEU-CHECKOUT-AQUI.com/protocolo-avancado", // <- troque pelo link real
    price: "R$67",
    priceFrom: "R$147", // ancoragem de preço (opcional, deixe "" pra esconder)
    badge: "Protocolo Avançado",

    // texto que aparece na tela de Resultado — varia por perfil (chave = key do perfil)
    resultByProfile: {
      estresse: {
        title: "Acelere com um plano específico pra esse tipo de queda",
        text: "O Protocolo Avançado inclui um plano de manejo de estresse focado em queda capilar — técnicas de respiração, cronograma de sono e uma versão estendida da rotina para os casos ligados a estresse e hormônios.",
      },
      nutricional: {
        title: "Leve a parte nutricional pronta, sem montar nada sozinha",
        text: "O Protocolo Avançado inclui um cardápio semanal completo com lista de compras pronta, pensado especificamente pra quem precisa repor nutrientes rápido.",
      },
      habito: {
        title: "Acelere a recuperação do dano por hábito",
        text: "O Protocolo Avançado traz um guia de transição de rotina (redução gradual de calor/química) e um cronograma de descanso capilar para recuperar a fibra mais rápido.",
      },
      genetico: {
        title: "Leve um roteiro completo pra sua consulta, não só 3 perguntas soltas",
        text: "O Protocolo Avançado expande as perguntas da aba Guia num checklist imprimível organizado por categoria (diagnóstico, tratamento, acompanhamento), com espaço pra anotar as respostas do profissional e comparar exames ao longo do tempo.",
      },
    },

    // texto do card "Bônus 4" travado no dashboard (não muda por perfil)
    bonusCard: {
      title: "Bônus 4 — Protocolo Avançado",
      text: "Cardápio semanal completo com lista de compras, cronograma de recuperação por fase e o checklist de perguntas pra consulta — tudo pronto, sem precisar montar sozinho(a).",
    },
  },

  // ---------------------------------------------------------------------
  // OFERTA B — recorrência. Aparece só quando a pessoa completa os 21 dias
  // do checklist (maior prova de comprometimento = melhor momento de oferta).
  // ---------------------------------------------------------------------
  club: {
    checkoutUrl: "https://SEU-CHECKOUT-AQUI.com/clube-raiz-nova", // <- troque pelo link real
    price: "R$19,90/mês",
    title: "Você completou os 21 dias 🎉",
    text: "Continue evoluindo com o Clube Raiz Nova: novos desafios todo mês, conteúdo extra e acompanhamento contínuo pra não perder o resultado que você construiu.",
    cta: "Conhecer o Clube",
  },
};

/* ---------------------------------------------------------------------------
   2) ESTADO
   --------------------------------------------------------------------------- */

function freshState() {
  return {
    screen: "welcome",
    quizIndex: 0,
    answers: {},
    profile: null,
    checklist: Array(21).fill(false),
    todayChecklist: [false, false, false],
    dashTab: "hoje",
  };
}

// acordeão de capítulos — só controla o que está aberto na tela, não precisa
// persistir entre sessões
let openChapter = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    return { ...freshState(), ...parsed };
  } catch (e) {
    return freshState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

/* ---------------------------------------------------------------------------
   3) SCORING
   --------------------------------------------------------------------------- */

// alguns campos de perfil variam por gênero (ex.: calvície masculina x feminina);
// quando o campo é uma string só, serve pra todo mundo sem alteração.
function resolveText(value, gender) {
  if (typeof value === "string") return value;
  return value[gender] || value.feminino || Object.values(value)[0];
}

function computeProfile(answers) {
  const scores = { estresse: 0, nutricional: 0, habito: 0, genetico: 0 };
  const redFlags = new Set();
  let chronic = false;

  QUESTIONS.forEach((q) => {
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
  // se placas foi marcado, força perfil genetico-informativo mesmo com score baixo
  if (redFlags.has("placas") && scores.genetico >= scores[top] - 1) top = "genetico";

  const base = PROFILES[top];
  const redFlagText = Array.from(redFlags).map((k) => REDFLAG_MESSAGES[k]).join(" ");
  const gender = answers.genero === "masculino" ? "masculino" : "feminino";

  const priority = answers.prioridade;
  let recipes = [...base.recipes];
  // pequenos ajustes pela prioridade declarada, mantendo o core do perfil
  if (priority === "forca" && !recipes.includes("oleo-ricino")) recipes[1] = "oleo-ricino";
  if (priority === "crescimento" && !recipes.includes("tonico-alecrim")) recipes[0] = "tonico-alecrim";

  return {
    key: top,
    gender,
    name: resolveText(base.name, gender),
    desc: resolveText(base.desc, gender),
    focus: base.focus,
    chapters: base.chapters,
    recipes,
    foodFocus: base.foodFocus,
    foodTags: base.foodTags,
    redFlag: redFlags.size > 0,
    redFlagText: redFlagText || null,
  };
}

/* ---------------------------------------------------------------------------
   4) RENDER — telas
   --------------------------------------------------------------------------- */

const app = document.getElementById("app");

function clone(tplId) {
  return document.getElementById(tplId).content.cloneNode(true);
}

function render() {
  if (state.screen === "welcome") renderWelcome();
  else if (state.screen === "quiz") renderQuiz();
  else if (state.screen === "result") renderResult();
  else if (state.screen === "dashboard") renderDashboard();
}

function renderWelcome() {
  app.innerHTML = "";
  app.appendChild(clone("tpl-welcome"));
  saveState();
}

function renderQuiz() {
  app.innerHTML = "";
  const frag = clone("tpl-quiz");
  app.appendChild(frag);

  const q = QUESTIONS[state.quizIndex];
  const total = QUESTIONS.length;
  const pct = Math.round(((state.quizIndex) / total) * 100);
  document.getElementById("progressFill").style.width = pct + "%";
  document.getElementById("progressLabel").textContent = `Pergunta ${state.quizIndex + 1} de ${total}`;

  const qBox = document.getElementById("quizQuestion");
  const currentAns = state.answers[q.id] ?? (q.type === "multi" ? [] : null);
  const gender = state.answers.genero;
  const visibleOptions = q.options.filter((opt) => !opt.hideFor || opt.hideFor !== gender);

  const optionsHtml = visibleOptions.map((opt) => {
    const selected = q.type === "multi" ? currentAns.includes(opt.id) : currentAns === opt.id;
    return `<button type="button" class="option ${q.type === "single" ? "option--radio" : ""} ${selected ? "is-selected" : ""}" data-opt="${opt.id}">
      <span class="option__mark">${selected ? ICONS.check : ""}</span>
      <span class="option__text">${opt.label}</span>
    </button>`;
  }).join("");

  qBox.innerHTML = `
    <h2>${q.title}</h2>
    ${q.hint ? `<p class="q-hint">${q.hint}</p>` : ""}
    <div class="option-list">${optionsHtml}</div>
  `;

  qBox.querySelectorAll(".option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const optId = btn.dataset.opt;
      const opt = q.options.find((o) => o.id === optId);
      if (q.type === "single") {
        state.answers[q.id] = optId;
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

  const btnBack = document.getElementById("btnBack");
  const btnNext = document.getElementById("btnNext");
  btnBack.textContent = state.quizIndex === 0 ? "← Início" : "← Voltar";

  const answered = q.type === "multi" ? (state.answers[q.id] || []).length > 0 : !!state.answers[q.id];
  btnNext.disabled = !answered;
  btnNext.textContent = state.quizIndex === total - 1 ? "Ver meu resultado →" : "Continuar →";

  saveState();
}

function renderResult() {
  app.innerHTML = "";
  const frag = clone("tpl-result");
  app.appendChild(frag);
  const p = state.profile;

  document.getElementById("resultTitle").textContent = p.name;
  document.getElementById("resultDesc").textContent = p.desc;

  const redBox = document.getElementById("redFlagBox");
  if (p.redFlag && p.redFlagText) {
    redBox.hidden = false;
    document.getElementById("redFlagText").textContent = p.redFlagText;
  }

  const grid = document.getElementById("focusGrid");
  grid.innerHTML = p.focus.map((f, i) => `
    <div class="focus-card ${accentClass(i)}">
      <div class="focus-card__icon">${ICONS[f.icon]}</div>
      <h3>${f.title}</h3>
      <p>${f.text}</p>
    </div>
  `).join("");

  // upsell — oferta A, texto adaptado ao perfil
  const offer = UPSELLS.advanced.resultByProfile[p.key];
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

function currentDayIndex() {
  const idx = state.checklist.findIndex((d) => !d);
  return idx === -1 ? 20 : idx;
}

const DASH_TABS = [
  { id: "hoje", label: "Hoje" },
  { id: "guia", label: "Guia" },
  { id: "receitas", label: "Receitas" },
  { id: "alimentacao", label: "Alimentação" },
];

// passo a passo real da rotina (Capítulo 3), com o passo 2 personalizado pela
// receita recomendada pro perfil da pessoa
function routineSteps(p) {
  const recipeName = RECIPES[p.recipes[0]].name.toLowerCase();
  const base = CHAPTER_CONTENT.c3.steps;
  return [
    { label: base[0][0], detail: base[0][1] },
    { label: `Passo 2 — Nutrir a raiz com ${recipeName}`, detail: `Aplique à noite, no couro cabeludo limpo e seco, massageando por 2 a 3 minutos. O modo de preparo completo está na aba Receitas.` },
    { label: base[2][0], detail: base[2][1] },
  ];
}

function panelHoje(p, dayIdx) {
  const steps = routineSteps(p);
  const stepsHtml = steps.map((s, i) => `
    <li class="${state.todayChecklist[i] ? "done" : ""}" data-i="${i}">
      <span class="step-mark">${state.todayChecklist[i] ? ICONS.check : ""}</span>
      <div class="step-body">
        <span class="step-text">${s.label}</span>
        <p class="step-detail">${s.detail}</p>
      </div>
    </li>
  `).join("");

  const bc = UPSELLS.advanced.bonusCard;

  const trackerHtml = state.checklist.map((done, i) => `
    <div class="day-cell ${done ? "done" : ""} ${i === dayIdx ? "today" : ""}" data-i="${i}" title="Dia ${i + 1}">
      ${done ? ICONS.check : i + 1}
    </div>
  `).join("");

  return `
    <article class="card card--routine">
      <h2 class="card__title">Rotina de hoje</h2>
      <ul class="checklist" id="todayChecklist">${stepsHtml}</ul>
    </article>

    <article class="card card--locked" id="bonus4Card">
      <div class="card__title-row">
        <h2 class="card__title">${bc.title}</h2>
        <span class="lock-icon">${ICONS.lock}</span>
      </div>
      <p class="card__text card__text--muted">${bc.text}</p>
      <a class="btn btn--upsell btn--sm" href="${UPSELLS.advanced.checkoutUrl}" target="_blank" rel="noopener">
        Desbloquear agora — ${UPSELLS.advanced.price}
      </a>
    </article>

    <article class="card card--tracker">
      <div class="card__title-row">
        <h2 class="card__title">Checklist dos 21 dias</h2>
        <span class="card__hint">toque para marcar</span>
      </div>
      <div class="tracker-grid" id="trackerGrid">${trackerHtml}</div>
    </article>
  `;
}

function chapterBodyHtml(content) {
  let html = "";
  if (content.paragraphs) html += content.paragraphs.map((t) => `<p class="chapter-p">${t}</p>`).join("");
  if (content.intro) html += `<p class="chapter-p">${content.intro}</p>`;
  if (content.habits) {
    html += `<ol class="chapter-habits">${content.habits.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join("")}</ol>`;
  }
  if (content.steps) {
    html += `<div class="chapter-steps">${content.steps.map(([t, d]) => `<div class="chapter-step"><strong>${t}</strong><p>${d}</p></div>`).join("")}</div>`;
  }
  if (content.bullets) {
    html += `<ul class="chapter-bullets">${content.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
  }
  if (content.outro) html += `<p class="chapter-p">${content.outro}</p>`;
  return html;
}

function panelGuia(p) {
  const order = [...new Set([...p.chapters, "c1", "c2", "c3", "c4", "c5"])];
  const chaptersHtml = order.map((cid, i) => {
    const recommended = p.chapters.includes(cid);
    const isOpen = openChapter === cid;
    return `
      <article class="chapter-card ${accentClass(i)} ${isOpen ? "is-open" : ""}">
        <button type="button" class="chapter-card__head" data-chapter="${cid}">
          <span class="chapter-card__headtext">
            ${recommended ? '<span class="chapter-card__badge">recomendado pra você</span>' : ""}
            <h3>${CHAPTERS[cid]}</h3>
          </span>
          <span class="chapter-card__chevron">${ICONS.chevron}</span>
        </button>
        <div class="chapter-card__body">${chapterBodyHtml(CHAPTER_CONTENT[cid])}</div>
      </article>
    `;
  }).join("");

  let questionsHtml = "";
  if (p.key === "genetico" && PROFILES.genetico.sampleQuestions) {
    questionsHtml = `
      <article class="card card--questions">
        <h2 class="card__title">Perguntas pra levar na consulta</h2>
        <p class="card__text">Um roteiro curto, de graça, pra você não chegar de mãos vazias:</p>
        <ol class="question-list">
          ${PROFILES.genetico.sampleQuestions.map((q) => `<li>${q}</li>`).join("")}
        </ol>
      </article>
    `;
  }

  return `
    <p class="panel-intro">O guia completo (PDF) tem tudo em detalhe — aqui vai o essencial de cada capítulo, direto no app. Toque pra abrir.</p>
    ${questionsHtml}
    <div class="chapter-list-v2">${chaptersHtml}</div>
  `;
}

function panelReceitas(p) {
  const cardsHtml = p.recipes.map((rid, i) => {
    const r = RECIPES[rid];
    return `
      <article class="recipe-card ${accentClass(i)}">
        <h3>${r.name}</h3>
        <p class="recipe-card__teaser">${r.text}</p>
        <p class="recipe-card__label">Ingredientes</p>
        <ul class="recipe-card__list">${r.ingredientes.map((i) => `<li>${i}</li>`).join("")}</ul>
        <p class="recipe-card__label">Modo de fazer</p>
        <p class="recipe-card__modo">${r.modo}</p>
        <span class="tag tag--freq">${r.frequencia}</span>
      </article>
    `;
  }).join("");
  return `
    <p class="panel-intro">As receitas recomendadas pro seu perfil — variação pro Passo 2 da rotina.</p>
    <div class="recipe-grid">${cardsHtml}</div>
  `;
}

function panelAlimentacao(p) {
  const nutrientsHtml = NUTRIENTS.map((n) => {
    const highlighted = p.foodTags.includes(n.key);
    return `
      <div class="nutrient-row ${highlighted ? "is-highlighted" : ""}">
        <div class="nutrient-row__head">
          <strong>${n.key}</strong>
          ${highlighted ? '<span class="tag tag--focus">foco pra você</span>' : ""}
        </div>
        <p class="nutrient-row__why">${n.why}</p>
        <p class="nutrient-row__sources"><strong>Fontes:</strong> ${n.sources}</p>
      </div>
    `;
  }).join("");

  const dayHtml = SAMPLE_DAY.map(([meal, sug]) => `
    <div class="day-row"><strong>${meal}</strong><span>${sug}</span></div>
  `).join("");

  return `
    <article class="card card--food">
      <h2 class="card__title">Foco alimentar pra você</h2>
      <p id="foodFocusText" class="card__text">${p.foodFocus}</p>
      <div id="foodTags" class="tag-row">${p.foodTags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
    </article>

    <article class="card card--nutrients">
      <h2 class="card__title">Nutrientes-chave pra saúde do fio</h2>
      <div class="nutrient-list">${nutrientsHtml}</div>
    </article>

    <article class="card card--sample-day">
      <h2 class="card__title">Um dia de alimentação fortalecedora (exemplo)</h2>
      <div class="day-list">${dayHtml}</div>
    </article>
  `;
}

function renderDashTabs() {
  const nav = document.getElementById("dashTabs");
  nav.innerHTML = DASH_TABS.map((t) => `
    <button type="button" class="dash-tab ${state.dashTab === t.id ? "is-active" : ""}" data-tab="${t.id}">${t.label}</button>
  `).join("");
  nav.querySelectorAll(".dash-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dashTab = btn.dataset.tab;
      renderDashboard();
    });
  });
}

function wireDashPanel() {
  const todayList = document.getElementById("todayChecklist");
  if (todayList) {
    todayList.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        const i = Number(li.dataset.i);
        state.todayChecklist[i] = !state.todayChecklist[i];
        if (state.todayChecklist.every(Boolean)) {
          const idx = currentDayIndex();
          state.checklist[idx] = true;
          state.todayChecklist = [false, false, false];
        }
        renderDashboard();
      });
    });
  }

  const grid = document.getElementById("trackerGrid");
  if (grid) {
    grid.querySelectorAll(".day-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        const i = Number(cell.dataset.i);
        state.checklist[i] = !state.checklist[i];
        renderDashboard();
      });
    });
  }

  document.querySelectorAll(".chapter-card__head").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cid = btn.dataset.chapter;
      openChapter = openChapter === cid ? null : cid;
      renderDashboard();
    });
  });
}

function renderDashboard() {
  app.innerHTML = "";
  const frag = clone("tpl-dashboard");
  app.appendChild(frag);
  const p = state.profile;
  const dayIdx = currentDayIndex();
  const streak = state.checklist.filter(Boolean).length;

  document.getElementById("dashDay").textContent = Math.min(dayIdx + 1, 21);
  document.getElementById("dashProfileName").textContent = p.name;
  document.getElementById("streakNum").textContent = streak;
  document.getElementById("dashProgressFill").style.width = `${(streak / 21) * 100}%`;

  // banner do dia 21 — oferta B (recorrência), só aparece com os 21 dias completos
  const banner = document.getElementById("day21Banner");
  if (streak >= 21) {
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
      </div>
    `;
  } else {
    banner.innerHTML = "";
  }

  renderDashTabs();

  const panel = document.getElementById("dashPanel");
  if (state.dashTab === "guia") panel.innerHTML = panelGuia(p);
  else if (state.dashTab === "receitas") panel.innerHTML = panelReceitas(p);
  else if (state.dashTab === "alimentacao") panel.innerHTML = panelAlimentacao(p);
  else panel.innerHTML = panelHoje(p, dayIdx);

  wireDashPanel();

  saveState();
}

/* ---------------------------------------------------------------------------
   5) AÇÕES GLOBAIS
   --------------------------------------------------------------------------- */

document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "start-quiz") {
    state.screen = "quiz";
    state.quizIndex = 0;
    render();
  }
  if (action === "quiz-back") {
    if (state.quizIndex === 0) { state.screen = "welcome"; }
    else { state.quizIndex -= 1; }
    render();
  }
  if (action === "quiz-next") {
    if (state.quizIndex < QUESTIONS.length - 1) {
      state.quizIndex += 1;
      render();
    } else {
      state.profile = computeProfile(state.answers);
      state.screen = "result";
      render();
    }
  }
  if (action === "go-dashboard") {
    state.screen = "dashboard";
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
