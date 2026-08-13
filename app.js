/* =============================================================================
   Protocolo Raiz Nova — app.js
   App estático, sem backend. Estado persistido em localStorage para que a
   pessoa possa fechar e voltar sem perder o diagnóstico e o progresso.
   ============================================================================= */

const STORAGE_KEY = "raizNova.v1";

/* ---------------------------------------------------------------------------
   1) CONTEÚDO — perguntas, receitas, capítulos, perfis
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

const RECIPES = {
  "tonico-alecrim": { name: "Tônico de alecrim fortalecedor", text: "Óleo de coco + alecrim, massageado no couro cabeludo — estimula a circulação da raiz." },
  "mascara-abacate": { name: "Máscara nutritiva de abacate", text: "Repõe maciez em fios ressecados pelo calor e pela química." },
  "enxague-vinagre": { name: "Enxágue de vinagre de maçã", text: "Fecha a cutícula e equilibra o pH do couro cabeludo." },
  "mascara-babosa": { name: "Máscara de babosa (aloe vera)", text: "Ação calmante; ajuda a desobstruir resíduos ao redor do folículo." },
  "oleo-ricino": { name: "Óleo de rícino para as pontas", text: "Sela a fibra capilar e reduz a quebra nas pontas." },
  "spray-arroz": { name: "Spray de água de arroz", text: "Ritual tradicional para dar mais corpo e resistência ao fio." },
};

const CHAPTERS = {
  c1: "Capítulo 1 — Por que o seu cabelo está caindo",
  c2: "Capítulo 2 — Os 7 hábitos que pioram a queda",
  c3: "Capítulo 3 — O Protocolo Raiz Nova (rotina de 3 passos)",
  c4: "Capítulo 4 — Óleo de alecrim: o que a ciência mostra",
  c5: "Capítulo 5 — Quando procurar ajuda profissional",
};

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
    foodFocus: "Seu corpo gasta muita energia em períodos de estresse — reforce ômega-3 e vitamina D para apoiar o couro cabeludo por dentro.",
    foodTags: ["Ômega-3", "Vitamina D", "Proteína"],
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
    foodFocus: "Foque em repor proteína, ferro e zinco — a base para o folículo produzir fio novo.",
    foodTags: ["Proteína", "Ferro", "Zinco"],
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
    foodFocus: "A alimentação não é o ponto central aqui, mas proteína e vitamina C ajudam o fio a se recuperar do dano mecânico mais rápido.",
    foodTags: ["Proteína", "Vitamina C"],
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
    foodFocus: "Mantenha a base nutricional em dia — não resolve sozinho, mas cria o melhor cenário possível para qualquer tratamento.",
    foodTags: ["Proteína", "Ferro", "Zinco"],
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
   --------------------------------------------------------------------------- */

function freshState() {
  return {
    screen: "welcome",
    quizIndex: 0,
    answers: {},
    profile: null,
    checklist: Array(21).fill(false),
    todayChecklist: [false, false, false],
  };
}

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

  const optionsHtml = q.options.map((opt) => {
    const selected = q.type === "multi" ? currentAns.includes(opt.id) : currentAns === opt.id;
    return `<button type="button" class="option ${q.type === "single" ? "option--radio" : ""} ${selected ? "is-selected" : ""}" data-opt="${opt.id}">
      <span class="option__mark">${selected ? "✓" : ""}</span>
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

  // rotina de hoje
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
        const idx = currentDayIndex();
        state.checklist[idx] = true;
        state.todayChecklist = [false, false, false];
      }
      renderDashboard();
    });
  });

  // receitas recomendadas
  document.getElementById("recipeList").innerHTML = p.recipes.map((rid) => {
    const r = RECIPES[rid];
    return `<div class="recipe"><h4>${r.name}</h4><p>${r.text}</p></div>`;
  }).join("");

  // alimentação
  document.getElementById("foodFocusText").textContent = p.foodFocus;
  document.getElementById("foodTags").innerHTML = p.foodTags.map((t) => `<span class="tag">${t}</span>`).join("");

  // capítulos
  document.getElementById("chapterList").innerHTML = p.chapters.map((cid) => `<li><strong>${CHAPTERS[cid].split(" — ")[0]}</strong> — ${CHAPTERS[cid].split(" — ")[1]}</li>`).join("");

  // bônus 4 — travado, oferta A (upsell de ticket mais alto)
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

  // tracker 21 dias
  const grid = document.getElementById("trackerGrid");
  grid.innerHTML = state.checklist.map((done, i) => `
    <div class="day-cell ${done ? "done" : ""} ${i === dayIdx ? "today" : ""}" data-i="${i}" title="Dia ${i + 1}">
      ${done ? "✓" : i + 1}
    </div>
  `).join("");
  grid.querySelectorAll(".day-cell").forEach((cell) => {
    cell.addEventListener("click", () => {
      const i = Number(cell.dataset.i);
      state.checklist[i] = !state.checklist[i];
      renderDashboard();
    });
  });

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
