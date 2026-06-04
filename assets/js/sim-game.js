/* ============================================================
   HATTATSU — Lean-симулятор (пресет-демо, без бэкенда)
   Посетитель выбирает отрасль + узкое место (или диктует голосом),
   движок собирает сценарий из Lean-модулей, игра → результат → лид.
   Та же data-схема, что позже примет ИИ-генерация (Фаза 1).
   ============================================================ */
(function () {
  "use strict";

  // ---------- данные ----------
  var INDUSTRIES = {
    glass: { label: "Обработка стекла", line: "линию резки и закалки", unit: "партия стекла", defect: "сколы и брак кромки" },
    metal: { label: "Металлообработка", line: "участок ЧПУ и сварки", unit: "партия деталей", defect: "несоответствия по допускам" },
    food:  { label: "Пищевое производство", line: "линию фасовки", unit: "партия продукции", defect: "нарушения санитарии" },
    logi:  { label: "Логистика и склад", line: "зону комплектации", unit: "волна заказов", defect: "ошибки сборки" },
    mach:  { label: "Машиностроение", line: "сборочный конвейер", unit: "партия узлов", defect: "дефекты сборки" },
    other: { label: "Производство", line: "производственный участок", unit: "партия", defect: "брак" }
  };

  // f(F) — F = объект отрасли (line/unit/defect)
  var BOTTLENECKS = {
    setup: {
      label: "Переналадки и простои",
      events: [
        { text: function (F) { return "Переналадка на " + F.line + " занимает 90 минут — теряете выпуск каждую смену."; },
          choices: [
            { label: "Внедрить SMED (быстрая переналадка)", fx: { eff: 14, bud: -6, mor: 2 }, reply: "SMED: часть операций уводим во внешнее время — переналадка кратно короче." },
            { label: "Добавить ночную смену", fx: { eff: 4, bud: -12, mor: -4 }, reply: "Закрыли симптом деньгами, причина осталась." },
            { label: "Терпеть как есть", fx: { eff: -8, mor: -2 }, reply: "Потери на переналадках копятся каждый день." }
          ] },
        { text: function () { return "Поток мелких заказов с частой сменой номенклатуры."; },
          choices: [
            { label: "Сгруппировать похожие заказы", fx: { eff: 10, mor: 1 }, reply: "Группировка снижает число переналадок без потери клиентов." },
            { label: "Запретить мелкие заказы", fx: { eff: 2, bud: -4, mor: -3 }, reply: "Теряете выручку — не путь к росту." },
            { label: "Оставить хаос", fx: { eff: -6 }, reply: "Переналадки съедают мощность." }
          ] }
      ]
    },
    quality: {
      label: "Брак и качество",
      events: [
        { text: function (F) { return F.defect.charAt(0).toUpperCase() + F.defect.slice(1) + " обнаруживают только на финальном контроле."; },
          choices: [
            { label: "Встроить контроль в поток (poka-yoke)", fx: { eff: 13, bud: -5, mor: 2 }, reply: "Защита от ошибок ловит брак в источнике, а не в конце." },
            { label: "Усилить ОТК на выходе", fx: { eff: 3, bud: -6 }, reply: "Контроль в конце — дорого и поздно." },
            { label: "Списать в норму", fx: { eff: -9, mor: -3 }, reply: "Брак как норма убивает маржу." }
          ] },
        { text: function (F) { return "Причины (" + F.defect + ") никто системно не анализирует."; },
          choices: [
            { label: "Разбор коренных причин (5 почему)", fx: { eff: 11, mor: 2 }, reply: "Устранение корня важнее борьбы с симптомами." },
            { label: "Менять операторов", fx: { eff: -2, mor: -8 }, reply: "Проблема в процессе, а не в людях." },
            { label: "Ничего", fx: { eff: -6 }, reply: "Те же дефекты повторяются." }
          ] }
      ]
    },
    invent: {
      label: "Логистика и запасы",
      events: [
        { text: function () { return "Склад забит, но нужного под конкретный заказ нет."; },
          choices: [
            { label: "Вытягивание / канбан", fx: { eff: 12, bud: 4, mor: 1 }, reply: "Пополнение по факту расхода — меньше неликвида и дефицита." },
            { label: "Закупить ещё впрок", fx: { eff: -4, bud: -12 }, reply: "Замороженные деньги и старение запасов." },
            { label: "Ничего", fx: { eff: -5 }, reply: "Дефицит тормозит выпуск." }
          ] },
        { text: function (F) { return "Комплектация (" + F.unit + ") долгая из-за хаотичного хранения."; },
          choices: [
            { label: "Адресное хранение + маршруты", fx: { eff: 10, bud: -4, mor: 2 }, reply: "Короче путь — быстрее сборка, меньше ошибок." },
            { label: "Нанять ещё комплектовщиков", fx: { eff: 3, bud: -10 }, reply: "Масштабировали хаос вместо его устранения." },
            { label: "Оставить", fx: { eff: -6, mor: -2 }, reply: "Поиск съедает время каждой волны." }
          ] }
      ]
    },
    people: {
      label: "Мотивация и текучка",
      events: [
        { text: function () { return "Высокая текучка, новички долго выходят на норму."; },
          choices: [
            { label: "Наставничество + стандарт обучения", fx: { eff: 9, bud: -4, mor: 8 }, reply: "Быстрый ввод и стабильное качество с первых смен." },
            { label: "Поднять план новичкам", fx: { eff: 2, mor: -12 }, reply: "Давление без обучения ускоряет увольнения." },
            { label: "Ничего", fx: { eff: -5, mor: -5 }, reply: "Текучка обнуляет накопленный опыт." }
          ] },
        { text: function () { return "Идеи рабочих по улучшениям никто не слушает."; },
          choices: [
            { label: "Система кайдзен-предложений", fx: { eff: 8, mor: 10 }, reply: "Вовлечение запускает поток улучшений снизу." },
            { label: "Премии только мастерам", fx: { eff: 1, mor: -6 }, reply: "Линия чувствует несправедливость." },
            { label: "Игнорировать", fx: { eff: -4, mor: -6 }, reply: "Гасите главный ресурс улучшений — людей." }
          ] }
      ]
    },
    plan: {
      label: "Планирование и сроки",
      events: [
        { text: function () { return "Сроки горят, аврал и сверхурочные в конце месяца."; },
          choices: [
            { label: "Выровнять загрузку (хейдзунка)", fx: { eff: 11, mor: 5 }, reply: "Ровный ритм убирает авралы и брак спешки." },
            { label: "Постоянные сверхурочные", fx: { eff: 4, bud: -8, mor: -6 }, reply: "Краткосрочно тянет, выжигает команду." },
            { label: "Ничего", fx: { eff: -7 }, reply: "Аврал становится нормой." }
          ] },
        { text: function (F) { return "План не учитывает узкое место — " + F.line + "."; },
          choices: [
            { label: "Планировать по ограничению", fx: { eff: 12 }, reply: "Управляй ограничением — оно задаёт ритм всей системы." },
            { label: "Грузить всех по максимуму", fx: { eff: -3, mor: -3 }, reply: "Локальная загрузка ≠ выпуск; растёт незавершёнка." },
            { label: "Ничего", fx: { eff: -6 }, reply: "Узкое место диктует потери." }
          ] }
      ]
    }
  };

  var GENERIC = [
    { text: function (F) { return "На " + F.line + " инструмент и оснастка разбросаны — операторы теряют время на поиск."; },
      choices: [
        { label: "Внедрить 5S", fx: { eff: 12, bud: -6, mor: 4 }, reply: "Порядок = меньше движений и потерь на поиск." },
        { label: "Разовая уборка силами мастера", fx: { eff: 4, mor: -3 }, reply: "Без системы откатится через неделю." },
        { label: "Не трогать", fx: { eff: -8 }, reply: "Потери на поиск — каждую смену." }
      ] },
    { text: function (F) { return "(" + F.unit + ") лежит между операциями большими партиями — растёт незавершёнка."; },
      choices: [
        { label: "Уменьшить партии, выстроить поток", fx: { eff: 12, bud: -4, mor: 1 }, reply: "Меньше партия — короче цикл и запасы." },
        { label: "Разогнать один станок", fx: { eff: 3, bud: -8 }, reply: "Локальный разгон смещает узкое место, не лечит поток." },
        { label: "Оставить", fx: { eff: -6, mor: -2 }, reply: "Незавершёнка прячет проблемы." }
      ] },
    { text: function () { return "У каждой смены свой способ работы — результат скачет."; },
      choices: [
        { label: "Ввести стандарт операций", fx: { eff: 10, mor: 3 }, reply: "Стандарт — база стабильности и улучшений." },
        { label: "Полагаться на опыт", fx: { eff: -2 }, reply: "Без стандарта качество — лотерея." },
        { label: "Жёстко штрафовать", fx: { eff: 2, mor: -10 }, reply: "Страх не создаёт стабильность — стандарт создаёт." }
      ] },
    { text: function () { return "Простои и брак не видны в реальном времени."; },
      choices: [
        { label: "Доска показателей / дашборд", fx: { eff: 9, bud: -3, mor: 3 }, reply: "Видишь проблему — управляешь ею сразу." },
        { label: "Отчёт раз в месяц", fx: { eff: 1 }, reply: "Реагируете слишком поздно." },
        { label: "Ничего", fx: { eff: -5 }, reply: "Невидимые потери не устранить." }
      ] }
  ];

  var ENDINGS = [
    { min: 82, t: "🏆 Lean-чемпион", d: "Вы вытащили производство на новый уровень — потери под контролем, поток ровный." },
    { min: 72, t: "👍 Хороший старт", d: "Система заработала. Есть заметный потенциал для следующего рывка." },
    { min: 58, t: "⚙️ Есть куда расти", d: "Часть потерь устранили, но они ещё съедают эффективность." },
    { min: 0,  t: "⚠️ Производство в потерях", d: "Без системного подхода потери побеждают. Это и есть зона работы Hattatsu." }
  ];

  // ---------- состояние ----------
  var S = { ind: "other", bn: "setup", company: "", note: "", scenario: null, i: 0, m: null, hits: [] };

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v) { return Math.max(0, Math.min(100, v)); };

  // ---------- сборка сценария из модулей ----------
  function buildScenario() {
    var F = INDUSTRIES[S.ind] || INDUSTRIES.other;
    var bn = BOTTLENECKS[S.bn] || BOTTLENECKS.setup;
    var events = bn.events.slice(0, 2).concat(GENERIC.slice(0, 4)); // 6 раундов
    return {
      title: "Lean-симулятор: " + F.label,
      subtitle: "Фокус: " + bn.label,
      F: F, bnLabel: bn.label, events: events
    };
  }

  // ---------- экраны ----------
  function show(step) {
    ["builder", "loading", "game", "result"].forEach(function (s) {
      var el = $("sg-" + s); if (el) el.classList.toggle("is-active", s === step);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startBuild() {
    S.ind = $("sg-industry").value;
    S.bn = $("sg-bottleneck").value;
    S.company = ($("sg-company").value || "").trim();
    S.note = ($("sg-note") ? $("sg-note").value : "").trim();
    S.scenario = buildScenario();
    S.i = 0; S.m = { eff: 55, bud: 70, mor: 65 }; S.hits = [];
    show("loading");
    // имитация "сборки" — UX-пауза (в Фазе 1 здесь ответ ИИ)
    var steps = ["Анализируем отрасль…", "Подбираем узкие места…", "Собираем события…", "Готово"];
    var li = $("sg-loadtext"), k = 0;
    var iv = setInterval(function () {
      k++; if (li) li.textContent = steps[Math.min(k, steps.length - 1)];
      if (k >= steps.length) { clearInterval(iv); renderGame(); }
    }, 480);
  }

  function renderGame() {
    var sc = S.scenario;
    $("sg-gtitle").textContent = sc.title;
    $("sg-gsub").textContent = sc.subtitle;
    show("game");
    renderEvent();
  }

  function bar(id, label, val, color) {
    return '<div class="sg-meter"><div class="sg-meter-top"><span>' + label + '</span><b>' + Math.round(val) + '</b></div>' +
      '<div class="sg-barbg"><i style="width:' + clamp(val) + '%;background:' + color + '"></i></div></div>';
  }

  function renderMeters() {
    var m = S.m;
    $("sg-meters").innerHTML =
      bar("eff", "Эффективность", m.eff, "var(--accent)") +
      bar("bud", "Бюджет", m.bud, "#56c596") +
      bar("mor", "Мораль", m.mor, "#6b6df0");
  }

  function renderEvent() {
    renderMeters();
    var sc = S.scenario, ev = sc.events[S.i];
    $("sg-round").textContent = "Раунд " + (S.i + 1) + " / " + sc.events.length;
    $("sg-event").textContent = (typeof ev.text === "function") ? ev.text(sc.F) : ev.text;
    var box = $("sg-choices"); box.innerHTML = ""; $("sg-reply").textContent = "";
    ev.choices.forEach(function (c, idx) {
      var b = document.createElement("button");
      b.className = "sg-choice"; b.type = "button"; b.textContent = c.label;
      b.addEventListener("click", function () { choose(c, box); });
      box.appendChild(b);
    });
  }

  function choose(c, box) {
    Array.prototype.forEach.call(box.children, function (b) { b.disabled = true; });
    var m = S.m;
    m.eff = clamp(m.eff + (c.fx.eff || 0));
    m.bud = clamp(m.bud + (c.fx.bud || 0));
    m.mor = clamp(m.mor + (c.fx.mor || 0));
    if ((c.fx.eff || 0) >= 8) S.hits.push(S.scenario.bnLabel);
    renderMeters();
    $("sg-reply").textContent = "💡 " + c.reply;
    var next = $("sg-next");
    next.style.display = "inline-flex";
    next.textContent = (S.i + 1 < S.scenario.events.length) ? "Далее →" : "Результат →";
    next.onclick = function () {
      next.style.display = "none";
      S.i++;
      if (S.i < S.scenario.events.length) renderEvent(); else showResult();
    };
  }

  function showResult() {
    var m = S.m, eff = Math.round(m.eff);
    var end = ENDINGS.find(function (e) { return eff >= e.min; }) || ENDINGS[ENDINGS.length - 1];
    var caveat = "";
    if (m.mor < 38) caveat += " Но мораль команды просела — рост хрупкий.";
    if (m.bud < 38) caveat += " И бюджет на пределе.";
    var F = S.scenario.F;
    $("sg-score").textContent = eff;
    $("sg-verdict").textContent = end.t;
    $("sg-rtext").textContent = end.d + caveat;
    $("sg-rfocus").textContent = "Отрасль: " + F.label + " · узкое место: " + S.scenario.bnLabel;

    // лид-mailto с параметрами (квалифицированный лид)
    var body = "Заявка из Lean-симулятора\n" +
      "Компания: " + (S.company || "—") + "\n" +
      "Отрасль: " + F.label + "\n" +
      "Узкое место: " + S.scenario.bnLabel + "\n" +
      "Результат игры (эффективность): " + eff + "/100\n" +
      (S.note ? "Комментарий клиента: " + S.note + "\n" : "") +
      "\nХочу полный симулятор под свой процесс + план улучшений.";
    var mailto = "mailto:info@hattatsu.pro?subject=" +
      encodeURIComponent("Заявка из симулятора — " + (S.company || F.label)) +
      "&body=" + encodeURIComponent(body);
    $("sg-lead").setAttribute("href", mailto);
    show("result");
  }

  // ---------- голосовой ввод (Web Speech API) ----------
  function initVoice() {
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    var mic = $("sg-mic"), ta = $("sg-note");
    if (!Rec || !mic || !ta) { if (mic) mic.style.display = "none"; return; }
    var KW = { setup: ["переналад", "простой", "простои", "наладк"], quality: ["брак", "качеств", "дефект"], invent: ["склад", "запас", "логист", "комплект"], people: ["текуч", "мотивац", "персонал", "люд", "кадр"], plan: ["срок", "план", "авр", "график"] };
    mic.addEventListener("click", function () {
      var r = new Rec(); r.lang = "ru-RU"; r.interimResults = false;
      mic.classList.add("is-rec");
      r.onresult = function (e) {
        var t = e.results[0][0].transcript;
        ta.value = (ta.value + " " + t).trim();
        var low = ta.value.toLowerCase();
        Object.keys(KW).forEach(function (k) {
          if (KW[k].some(function (w) { return low.indexOf(w) >= 0; })) $("sg-bottleneck").value = k;
        });
      };
      r.onend = function () { mic.classList.remove("is-rec"); };
      r.onerror = function () { mic.classList.remove("is-rec"); };
      try { r.start(); } catch (e) {}
    });
  }

  // ---------- init ----------
  document.addEventListener("DOMContentLoaded", function () {
    var btn = $("sg-build"); if (btn) btn.addEventListener("click", startBuild);
    var again = $("sg-again"); if (again) again.addEventListener("click", function () { show("builder"); });
    initVoice();
    var y = $("year"); if (y) y.textContent = String(new Date().getFullYear());
  });
})();
