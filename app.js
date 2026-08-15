/* =============================================================================
   Protocolo Raiz Nova — app.js
   App estático, sem backend. Estado persistido em localStorage para que a
   pessoa possa fechar e voltar sem perder o diagnóstico e o progresso.

   AVISO DE CONTEÚDO: todo o material aqui é EDUCATIVO. Não faz diagnóstico,
   não é consulta médica e não substitui avaliação profissional. Os textos de
   base científica vêm das revisões listadas em SOURCES (fim do arquivo).
   ============================================================================= */

const STORAGE_KEY = "raizNova.v1";

/* ---------------------------------------------------------------------------
   1) CONTEÚDO — perguntas, perfis, alimentação, receitas, biblioteca
   --------------------------------------------------------------------------- */

const QUESTIONS = [
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
      { id: "parto", label: "Parto ou pós-parto", tags: { estresse: 2 } },
      { id: "dieta", label: "Dieta restritiva ou perda de peso rápida", tags: { nutricional: 2 } },
      { id: "estresse_forte", label: "Período de estresse ou luto intenso", tags: { estresse: 2 } },
      { id: "hormonio", label: "Início, troca ou suspensão de anticoncepcional/hormônio", tags: { estresse: 2 } },
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
      { id: "tracao", label: "Rabo ou coque apertado com frequência", tags: { habito: 2 } },
      { id: "quimica", label: "Alisamento, coloração ou química em sequência", tags: { habito: 2 } },
      { id: "lavagem", label: "Lavagem bem irregular (de mais ou de menos)", tags: { habito: 1 } },
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
    focus: [
      { icon: "🌙", title: "Priorize a calma no ritual", text: "A massagem do Passo 1 antes de dormir ajuda o corpo a sair do modo de alerta." },
      { icon: "🕰️", title: "Dê tempo ao ciclo", text: "Esse tipo de queda leva de 6 a 12 meses para se recuperar por completo." },
      { icon: "📝", title: "Registre o gatilho", text: "Anotar o que mudou nos últimos meses ajuda a não repetir o padrão." },
    ],
    chapters: ["c1", "c3", "c5"],
    recipes: ["tonico-alecrim", "mascara-babosa"],
  },
  nutricional: {
    name: "Eflúvio Nutricional",
    desc: "Seu perfil aponta para uma possível lacuna nutricional — dieta restritiva, pouca proteína ou baixa reposição de ferro e zinco. O folículo costuma ser um dos primeiros lugares a sentir essa falta.",
    focus: [
      { icon: "🍽️", title: "O prato entra na rotina", text: "Seguir o guia alimentar aqui não é opcional — é onde a mudança real acontece." },
      { icon: "🥩", title: "Proteína em toda refeição", text: "Garanta uma fonte de proteína em pelo menos 3 refeições do dia." },
      { icon: "🩸", title: "Vale um exame", text: "Um exame de sangue simples confirma se ferro, zinco ou vitamina D estão baixos." },
    ],
    chapters: ["c1", "c3", "c2"],
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
    chapters: ["c2", "c3", "c4"],
    recipes: ["oleo-ricino", "enxague-vinagre"],
  },
  genetico: {
    name: "Padrão com Possível Componente Genético",
    desc: "O padrão descrito (queda concentrada em entradas/coroa, tempo prolongado, ou histórico familiar) pode ter componente hereditário. Este guia ajuda a fortalecer e cuidar — mas aqui o acompanhamento profissional faz toda a diferença no resultado.",
    focus: [
      { icon: "🩺", title: "Marque uma avaliação", text: "Um dermatologista confirma o padrão e indica o que mais somar ao seu cuidado." },
      { icon: "🌿", title: "Cuide do que está no seu controle", text: "A rotina do Protocolo Raiz Nova ainda ajuda a manter o couro cabeludo saudável." },
      { icon: "📸", title: "Acompanhe com fotos", text: "Fotos mensais, mesma luz e ângulo, ajudam a enxergar mudanças reais." },
    ],
    chapters: ["c5", "c1", "c3"],
    recipes: ["tonico-alecrim", "oleo-ricino"],
  },
};

const REDFLAG_MESSAGES = {
  placas: "Queda concentrada em placas específicas pode ter causas variadas — o ideal é um dermatologista avaliar antes de seguir qualquer rotina.",
  coceira: "Coceira, vermelhidão ou descamação no couro cabeludo podem indicar uma condição que pede avaliação profissional, mesmo seguindo os cuidados gerais.",
  chronic: "Mais de 6 meses de queda persistente, sem melhora, é motivo suficiente para buscar uma avaliação profissional junto com a rotina.",
};

/* ---------------------------------------------------------------------------
   ALIMENTAÇÃO — plano por perfil
   Cada perfil tem: chamada, contexto, prato de referência, o que comer mais,
   o que moderar, e combinações que mudam a absorção.
   --------------------------------------------------------------------------- */

const FOOD_PLAN = {
  estresse: {
    kicker: "alimentação · perfil estresse e hormônios",
    headline: "Comer para sair do modo de alerta",
    lede: "Em fases de estresse o corpo trabalha com o custo aumentado e o cortisol alto — e o cortisol interfere na matriz que sustenta o folículo. Aqui a alimentação não é o gatilho da sua queda, mas é o que sustenta a recuperação enquanto o ciclo se reorganiza. Regularidade importa mais que perfeição: pular refeição e passar horas em jejum mantém o corpo exatamente no estado que você quer sair.",
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
      { food: "Folhas verde-escuras (couve, espinafre, rúcula)", how: "no almoço e no jantar", why: "Trazem magnésio, folato e ferro não-heme — os três aparecem entre os micronutrientes ligados ao ciclo do folículo." },
      { food: "Castanhas, nozes, chia e linhaça", how: "1 punhado por dia", why: "Gordura insaturada e polifenóis, o núcleo do padrão alimentar mediterrâneo, associado na literatura a menor risco de alopecia." },
      { food: "Chá verde", how: "1 a 2 xícaras por dia", why: "Rico em EGCG, polifenol que em estudos mostrou inibição da 5-alfa-redutase. Bônus: substitui bem o terceiro café da tarde." },
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
      { food: "Carne vermelha magra, fígado, frango, peixe", how: "proteína em 3 refeições/dia", why: "Ferro heme — a forma que o corpo absorve melhor. O ferro é cofator da enzima que limita a velocidade da síntese de DNA, essencial em células que se dividem rápido, como as da matriz do folículo." },
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
      { food: "Frutas cítricas e vegetais coloridos", how: "todos os dias", why: "Vitamina C participa da síntese de colágeno, que sustenta a estrutura ao redor do folículo." },
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
      { food: "Chá verde", how: "1 a 2 xícaras por dia", why: "O EGCG, principal polifenol do chá, foi descrito como capaz de reduzir risco associado à alopecia androgenética por inibição da 5-alfa-redutase." },
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
      { a: "Fotos mensais, mesma luz", b: "Registro no app", gain: "Padrão genético evolui devagar. Sem registro, você não consegue distinguir progressão real de impressão de um dia ruim." },
    ],
  },
};

/* ------------------- nutrientes (comum a todos os perfis) ------------------ */

const NUTRIENTS = [
  {
    id: "ferro",
    name: "Ferro",
    level: "forte",
    role: "Cofator da ribonucleotídeo redutase, a enzima que limita a velocidade da síntese de DNA — crítica em células de divisão rápida, como as da matriz do folículo.",
    food: "Carne vermelha magra, fígado, feijão, lentilha, folhas verde-escuras.",
    evidence: "A deficiência de ferro é a carência nutricional mais comum do mundo e causa eflúvio telógeno. A ferritina sérica é o marcador usado como referência de estoque corporal nos estudos de queda. É frequente em mulheres com queda capilar.",
  },
  {
    id: "vitc",
    name: "Vitamina C",
    level: "apoio",
    role: "Não age diretamente no fio: melhora a absorção intestinal e a mobilização do ferro.",
    food: "Laranja, limão, acerola, goiaba, pimentão, brócolis.",
    evidence: "A literatura recomenda vitamina C especificamente para quem tem queda associada à deficiência de ferro. Não há evidência de relação direta entre nível de vitamina C e queda em quem não tem essa deficiência.",
  },
  {
    id: "zinco",
    name: "Zinco",
    level: "moderada",
    role: "Atua em enzimas e fatores de transcrição envolvidos na regulação gênica e na morfogênese do folículo.",
    food: "Semente de abóbora, castanha de caju, carne, frutos do mar.",
    evidence: "A deficiência está descrita como causa de eflúvio telógeno e de fio fino, branco e quebradiço. Um estudo com 312 pessoas com queda encontrou zinco baixo em pacientes com alopecia areata e eflúvio telógeno — mas os dados no conjunto ainda são heterogêneos, e rastreio de rotina não é recomendado.",
  },
  {
    id: "vitd",
    name: "Vitamina D",
    level: "moderada",
    role: "Hormônio esteroide que, pelo receptor VDR, regula desenvolvimento e diferenciação dos queratinócitos.",
    food: "Peixes gordos, ovo, alimentos fortificados — e exposição solar.",
    evidence: "A imunorreatividade do VDR é maior na fase de crescimento do fio, e modelos animais sem o receptor desenvolvem alopecia. A relação com eflúvio telógeno e padrão androgenético ainda é discutida, mas há consenso majoritário de que pessoas com alopecia e insuficiência de vitamina D devem repor — com indicação médica.",
  },
  {
    id: "proteina",
    name: "Proteína",
    level: "forte",
    role: "Matéria-prima do fio. A maior parte dos cerca de 100 mil folículos do couro cabeludo está em fase de crescimento e precisa de aporte constante.",
    food: "Ovos, carnes, peixes, laticínios, leguminosas.",
    evidence: "Dieta desequilibrada, perda de peso súbita e restrição calórica estão entre os desencadeadores descritos de queda. O aporte proteico adequado é premissa de qualquer plano.",
  },
  {
    id: "omega",
    name: "Ácidos graxos essenciais",
    level: "moderada",
    role: "Compõem membranas celulares e modulam processos inflamatórios ao redor do folículo.",
    food: "Peixes gordos, azeite extravirgem, chia, linhaça, nozes.",
    evidence: "Deficiência de ácido linoleico e alfa-linolênico está associada a queda e despigmentação de cabelos e sobrancelhas. Ácidos graxos do azeite mostraram efeito inibitório sobre a 5-alfa-redutase.",
  },
  {
    id: "biotina",
    name: "Biotina (B7)",
    level: "fraca",
    role: "Vitamina do complexo B envolvida em carboxilases, sinalização celular e regulação gênica.",
    food: "Ovo, oleaginosas, fígado — a deficiência é rara em quem se alimenta de forma equilibrada.",
    evidence: "Apesar da popularidade, não há evidência em ensaios clínicos randomizados de que suplementar biotina previna ou trate queda em quem não tem deficiência. Atenção: biotina exógena interfere em vários exames laboratoriais, gerando resultados falsamente positivos ou negativos.",
  },
  {
    id: "b12",
    name: "B12 e folato",
    level: "fraca",
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
    id: "ciclo",
    kicker: "fundamento",
    title: "O fio tem um ciclo — e quase toda queda é uma questão de tempo",
    read: "3 min",
    body: [
      "O couro cabeludo humano abriga em média de 100 mil a 150 mil folículos, e cada um funciona no seu próprio ritmo, independente dos vizinhos. É por isso que ninguém fica careca de um dia para o outro: os fios não caem em bloco.",
      "Cada folículo percorre três fases. A anágena é a de crescimento e dura de dois a sete anos — nela está cerca de 90% do seu cabelo agora. A catágena é a de transição e dura por volta de duas semanas, com apenas 1% dos folículos. A telógena é a de repouso, dura de dois a três meses e concentra cerca de 10% dos fios: são eles que se soltam.",
      "Perder de 20 a 150 fios telógenos por dia é normal — é o ciclo funcionando. O que chama atenção não é o fio no ralo, é o aumento sustentado desse número por semanas.",
      "Entender isso muda a expectativa. Quando um gatilho empurra muitos folículos para a fase de repouso ao mesmo tempo, você só vê a queda quando esses fios se soltam, dois a três meses depois. E só vê a recuperação quando os novos crescem o suficiente para aparecer — o que leva mais alguns meses. A rotina que você começa hoje trabalha para um cabelo que ainda vai nascer.",
    ],
  },
  {
    id: "gatilho",
    kicker: "eflúvio telógeno",
    title: "Por que a queda aparece dois a três meses depois do susto",
    read: "3 min",
    body: [
      "O eflúvio telógeno é a perda que acontece quando muitos folículos passam bruscamente da fase de crescimento para a de repouso. Os desencadeadores descritos são bem conhecidos: estresse físico ou psicológico intenso, parto, restrição dietética, perda de peso rápida, febre alta, cirurgia, doenças da tireoide e alguns medicamentos.",
      "O detalhe que confunde quase todo mundo é o intervalo. A queda costuma aparecer de dois a três meses depois do evento. Quando você finalmente percebe o cabelo caindo, a fase difícil muitas vezes já passou — e é por isso que tanta gente jura que não aconteceu nada. Aconteceu; foi antes.",
      "A conduta descrita na literatura é direta: identificar e remover o fator desencadeante, repor as deficiências que existirem (ferro, vitamina D, zinco, vitaminas do complexo B) e aguardar. A evolução costuma ser boa, com reposição quase total dos fios perdidos em alguns meses, e há casos de resolução espontânea.",
      "Duas consequências práticas. Primeira: procurar o gatilho no que aconteceu há três meses, não ontem. Segunda: paciência não é resignação aqui — é a conduta correta.",
    ],
  },
  {
    id: "estresse",
    kicker: "estresse",
    title: "O que o cortisol faz com a raiz",
    read: "2 min",
    body: [
      "Estresse é uma das causas mais frequentes de distúrbio do crescimento capilar, e o mecanismo é razoavelmente descrito: o cortisol elevado degrada hialuronano e proteoglicanos, substâncias que integram a matriz extracelular ao redor do folículo. Além do cortisol, outros mediadores do estresse — substância P, ACTH, prolactina — foram descritos como inibidores do crescimento do fio.",
      "O estresse crônico também agrava quadros cuja origem principal é hormonal, imunológica ou tóxica. Em estudos com animais, foi associado a parada do crescimento e inflamação ao redor do folículo.",
      "Há ainda um laço que vale nomear: a queda de cabelo gera estresse, e esse estresse mantém a queda. Quem está no meio disso não está imaginando coisas — o ciclo é real e descrito. Cuidar do sono e reduzir a carga não é conselho genérico de bem-estar aqui; é parte do manejo.",
    ],
  },
  {
    id: "comida",
    kicker: "nutrição",
    title: "O que a ciência sustenta sobre alimentação e queda",
    read: "4 min",
    body: [
      "Comece pela parte incômoda: a literatura sobre nutrição e queda capilar ainda é limitada e, em vários pontos, contraditória. Qualquer material que prometa certeza absoluta sobre o assunto está vendendo alguma coisa.",
      "Dito isso, há pontos com base razoável. A deficiência de ferro é a carência nutricional mais comum do mundo e causa eflúvio telógeno, sendo frequente em mulheres com queda; a ferritina é o marcador de referência. A vitamina C melhora a absorção do ferro e por isso é recomendada junto, para quem tem essa deficiência. A deficiência de zinco está descrita como causa de eflúvio telógeno e de fio fino e quebradiço. A vitamina D regula a diferenciação dos queratinócitos pelo receptor VDR, e há consenso majoritário de repor quando há insuficiência associada à alopecia.",
      "Sobre padrão alimentar, o achado mais citado é o da dieta mediterrânea — muito vegetal, fruta, leguminosa, oleaginosa, grão, peixe e gordura insaturada, com pouca carne e pouco laticínio. Estudos apontam menor risco de alopecia em quem a segue, atribuído principalmente aos polifenóis, com ação antioxidante e anti-inflamatória.",
      "Alguns ingredientes específicos aparecem por mecanismo: o EGCG do chá verde e os ácidos graxos do azeite mostraram inibição da 5-alfa-redutase; a procianidina da maçã estimulou proliferação de células epiteliais do fio; extratos de alecrim inibiram a ligação ao receptor de DHT em teste laboratorial, com crescimento observado em camundongos.",
      "Guarde a proporção certa: são resultados de laboratório, de modelos animais e de estudos de associação. Ajudam a escolher o que colocar no prato — não substituem tratamento, e não devem virar promessa.",
    ],
  },
  {
    id: "medico",
    kicker: "limite do autocuidado",
    title: "Quando parar de tentar sozinha e procurar um dermatologista",
    read: "3 min",
    body: [
      "Este material é educativo e tem um limite claro. Existem sinais em que o cuidado em casa deixa de ser a resposta certa — e insistir só custa tempo, que neste assunto é justamente o recurso mais caro.",
      "Procure avaliação se a queda for em placas ou áreas bem delimitadas; se houver coceira, vermelhidão, descamação, dor ou ferida no couro cabeludo; se a queda passar de seis meses sem melhora; se for súbita e intensa; se o afinamento se concentrar nas entradas e no topo e estiver progredindo; ou se vier acompanhada de cansaço, alterações de peso, unhas frágeis e mudanças de humor, que podem apontar tireoide ou anemia.",
      "O que costuma ser investigado: exame clínico do couro cabeludo, tricoscopia e exames de sangue conforme a suspeita — ferritina, vitamina D, zinco, função tireoidiana, B12. A biópsia fica reservada a casos de dúvida diagnóstica.",
      "Vale saber que existem condutas consagradas e estudadas para os principais quadros, e que elas são escolhidas caso a caso, com prescrição. Não faz sentido descrevê-las aqui como se fossem opção de prateleira — o ponto é que existem, e que chegar cedo amplia o que é possível fazer.",
      "Nada disso invalida a sua rotina. Cuidado em casa e acompanhamento profissional trabalham juntos: um sustenta o dia a dia, o outro identifica a causa e define o tratamento.",
    ],
  },
];

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
  // e como "Bônus 4" travado na aba Hoje (texto único, sempre visível).
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
        title: "Tenha um roteiro pra levar ao seu dermatologista",
        text: "O Protocolo Avançado inclui um roteiro de perguntas para consulta profissional e um acompanhamento mais de perto, pensado para quem tem componente genético envolvido.",
      },
    },

    // texto do card "Bônus 4" travado no dashboard (não muda por perfil)
    bonusCard: {
      title: "Bônus 4 — Protocolo Avançado",
      text: "Rotinas avançadas, cardápio completo e acompanhamento mais de perto para acelerar seus resultados.",
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
   Guardamos as RESPOSTAS, não o perfil calculado: assim, quando os textos do
   plano forem melhorados, quem já fez o quiz passa a ver a versão nova.
   --------------------------------------------------------------------------- */

const TABS = [
  { id: "hoje", label: "Hoje", tpl: "tpl-tab-hoje" },
  { id: "comida", label: "Alimentação", tpl: "tpl-tab-comida" },
  { id: "receitas", label: "Receitas", tpl: "tpl-tab-receitas" },
  { id: "entender", label: "Entender", tpl: "tpl-tab-entender" },
];

const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

function freshState() {
  return {
    screen: "welcome",
    quizIndex: 0,
    answers: {},
    tab: "hoje",
    checklist: Array(21).fill(false),
    todayChecklist: [false, false, false],
    notes: {},   // { "<índice do dia>": { mood: 3, text: "..." } }
    openNutrient: null,
    openArticle: null,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    const merged = { ...freshState(), ...parsed };
    delete merged.profile; // versões antigas guardavam o perfil calculado
    return merged;
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
  const redFlagList = Array.from(redFlags).map((k) => REDFLAG_MESSAGES[k]);

  const priority = answers.prioridade;
  let recipes = [...base.recipes];
  // pequenos ajustes pela prioridade declarada, mantendo o core do perfil
  if (priority === "forca" && !recipes.includes("oleo-ricino")) recipes[1] = "oleo-ricino";
  if (priority === "crescimento" && !recipes.includes("tonico-alecrim")) recipes[0] = "tonico-alecrim";

  return {
    key: top,
    name: base.name,
    desc: base.desc,
    focus: base.focus,
    chapters: base.chapters,
    recipes,
    food: FOOD_PLAN[top],
    redFlag: redFlags.size > 0,
    redFlagList,
  };
}

function currentProfile() {
  return computeProfile(state.answers);
}

/* ---------------------------------------------------------------------------
   4) RENDER — telas
   --------------------------------------------------------------------------- */

const app = document.getElementById("app");

function clone(tplId) {
  return document.getElementById(tplId).content.cloneNode(true);
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function render() {
  if (state.screen === "welcome") renderWelcome();
  else if (state.screen === "quiz") renderQuiz();
  else if (state.screen === "result") renderResult();
  else if (state.screen === "dashboard") renderApp();
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
  const p = currentProfile();

  document.getElementById("resultTitle").textContent = p.name;
  document.getElementById("resultDesc").textContent = p.desc;

  const redBox = document.getElementById("redFlagBox");
  if (p.redFlag && p.redFlagList.length) {
    redBox.hidden = false;
    document.getElementById("redFlagText").innerHTML =
      `<ul class="alert__list">${p.redFlagList.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }

  const grid = document.getElementById("focusGrid");
  grid.innerHTML = p.focus.map((f) => `
    <div class="focus-card">
      <div class="focus-card__icon">${f.icon}</div>
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

/* ------------------------------- shell do app ------------------------------ */

function renderApp() {
  app.innerHTML = "";
  app.appendChild(clone("tpl-app"));
  const p = currentProfile();
  const dayIdx = currentDayIndex();
  const streak = state.checklist.filter(Boolean).length;

  document.getElementById("dashDay").textContent = Math.min(dayIdx + 1, 21);
  document.getElementById("dashProfileName").textContent = p.name;
  document.getElementById("streakNum").textContent = streak;
  document.getElementById("dashProgressFill").style.width = `${(streak / 21) * 100}%`;

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

  if (tab.id === "hoje") renderTabHoje(p, dayIdx, streak);
  if (tab.id === "comida") renderTabComida(p);
  if (tab.id === "receitas") renderTabReceitas(p);
  if (tab.id === "entender") renderTabEntender(p);

  saveState();
}

/* --------------------------------- aba HOJE -------------------------------- */

function renderTabHoje(p, dayIdx, streak) {
  const recipeName = RECIPES[p.recipes[0]].name.toLowerCase();
  const steps = [
    "Passo 1 — Higienizar e massagear o couro cabeludo (2–3 min)",
    `Passo 2 — Nutrir a raiz com ${recipeName}`,
    "Passo 3 — Proteger: protetor térmico e fronha de cetim/seda à noite",
  ];

  const todayList = document.getElementById("todayChecklist");
  todayList.innerHTML = steps.map((s, i) => `
    <li class="${state.todayChecklist[i] ? "done" : ""}" data-i="${i}">
      <span class="step-mark">${state.todayChecklist[i] ? "✓" : ""}</span>
      <span class="step-text">${s}</span>
    </li>
  `).join("");
  todayList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const i = Number(li.dataset.i);
      state.todayChecklist[i] = !state.todayChecklist[i];
      if (state.todayChecklist.every(Boolean)) {
        state.checklist[currentDayIndex()] = true;
        state.todayChecklist = [false, false, false];
      }
      renderApp();
    });
  });

  const done = state.todayChecklist.filter(Boolean).length;
  document.getElementById("todayFoot").textContent =
    done === 0 ? "Marque os três passos para fechar o dia."
      : `${done} de 3 passos marcados — falta ${3 - done} para fechar o dia.`;

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

  // banner do dia 21 — oferta B
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

  // tracker 21 dias
  const grid = document.getElementById("trackerGrid");
  grid.innerHTML = state.checklist.map((d, i) => `
    <div class="day-cell ${d ? "done" : ""} ${i === dayIdx && !d ? "today" : ""}" data-i="${i}" title="Dia ${i + 1}">
      ${d ? "✓" : i + 1}
    </div>
  `).join("");
  grid.querySelectorAll(".day-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const i = Number(cell.dataset.i);
      state.checklist[i] = !state.checklist[i];
      renderApp();
    });
  });
}

/* ------------------------------ aba ALIMENTAÇÃO ---------------------------- */

function renderTabComida(p) {
  const f = p.food;

  document.getElementById("foodKicker").textContent = f.kicker;
  document.getElementById("foodHeadline").textContent = f.headline;
  document.getElementById("foodLede").textContent = f.lede;

  // prato: anel proporcional montado com conic-gradient
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

  document.getElementById("foodYes").innerHTML = f.yes.map((i) => `
    <div class="food-item food-item--yes">
      <h4>${esc(i.food)}</h4>
      <span class="food-item__how">${esc(i.how)}</span>
      <p>${esc(i.why)}</p>
    </div>
  `).join("");

  document.getElementById("foodNo").innerHTML = f.no.map((i) => `
    <div class="food-item food-item--no">
      <h4>${esc(i.food)}</h4>
      <span class="food-item__how">${esc(i.how)}</span>
      <p>${esc(i.why)}</p>
    </div>
  `).join("");

  document.getElementById("foodCombos").innerHTML = f.combos.map((c) => `
    <div class="combo">
      <div class="combo__pair">
        <span class="combo__a">${esc(c.a)}</span>
        <span class="combo__plus">+</span>
        <span class="combo__b">${esc(c.b)}</span>
      </div>
      <p>${esc(c.gain)}</p>
    </div>
  `).join("");

  // nutrientes — acordeão
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

function renderTabReceitas(p) {
  const ordered = [...p.recipes, ...Object.keys(RECIPES).filter((k) => !p.recipes.includes(k))];

  document.getElementById("recipeFull").innerHTML = ordered.map((rid, idx) => {
    const r = RECIPES[rid];
    const mine = idx < p.recipes.length;
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
        </div>
        <p class="recipe-card__caution">⚠︎ ${esc(r.caution)}</p>
      </article>`;
  }).join("");
}

/* -------------------------------- aba ENTENDER ----------------------------- */

function renderTabEntender(p) {
  const list = document.getElementById("libraryList");

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

  const articles = LIBRARY.map((a) => {
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
      <ul>
        ${SOURCES.map((s) => `<li>${esc(s)}</li>`).join("")}
      </ul>
      <p>
        Os textos foram escritos para leitura leiga a partir dessas revisões. Simplificação
        implica perda de nuance: nenhuma delas foi produzida para orientar um caso individual,
        e este material também não.
      </p>
    </div>`;

  list.innerHTML = perfilCard + articles + sources;

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
      state.screen = "result";
      render();
    }
  }
  if (action === "go-dashboard") {
    state.screen = "dashboard";
    state.tab = "hoje";
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
