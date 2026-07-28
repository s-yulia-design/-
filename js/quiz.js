(function () {
  "use strict";

  const PROFILE_IDS = ["analyst", "creator", "helper", "leader", "master", "system"];

  const state = {
    step: "intro",
    answers: [],
    selectedOption: null,
  };

  let root = null;
  let panel = null;

  function createEmptyScores() {
    return PROFILE_IDS.reduce(function (acc, id) {
      acc[id] = 0;
      return acc;
    }, {});
  }

  function calculateScores() {
    const scores = createEmptyScores();

    state.answers.forEach(function (answerIndex, questionIndex) {
      const question = QUIZ_DATA.questions[questionIndex];
      const option = question.options[answerIndex];
      if (!option || !option.scores) return;

      Object.keys(option.scores).forEach(function (profileId) {
        scores[profileId] = (scores[profileId] || 0) + option.scores[profileId];
      });
    });

    return scores;
  }

  function getTopProfiles(scores) {
    const sorted = PROFILE_IDS.map(function (id) {
      return { id: id, score: scores[id] || 0 };
    }).sort(function (a, b) {
      return b.score - a.score;
    });

    const maxScore = sorted[0].score;
    if (maxScore === 0) {
      return { ids: [sorted[0].id], mixed: false };
    }

    const tied = sorted.filter(function (item) {
      return item.score === maxScore;
    });

    if (tied.length > 2) {
      return { ids: [], mixed: true };
    }

    return { ids: tied.map(function (item) {
      return item.id;
    }), mixed: false };
  }

  function getProfileTitle(result) {
    if (result.mixed) {
      return "Смешанный профиль интересов";
    }
    return result.ids
      .slice(0, 2)
      .map(function (id) {
        return QUIZ_DATA.profiles[id].title;
      })
      .join(" + ");
  }

  function getResultProfile(result) {
    if (result.mixed) {
      return {
        tagline:
          "У вас равномерно выражены разные типы интересов. Это повод исследовать несколько направлений и проверить их на консультации.",
        spheres: ["Несколько сфер для сравнения", "Образование и развитие", "Работа с людьми", "Аналитика и проекты"],
        strengths: [
          "Гибкость и широта интересов",
          "Способность видеть задачу с разных сторон",
          "Потребность в осознанном выборе без спешки",
        ],
        checklist: [
          "Какие 2–3 направления стоит проверить в первую очередь",
          "Какие навыки уже есть и что нужно развить",
          "Какой формат работы вам комфортнее на практике",
        ],
        ctaText:
          "На консультации сузим круг направлений и составим план проверки гипотез — без ярлыков и давления.",
      };
    }
    return QUIZ_DATA.profiles[result.ids[0]];
  }

  function buildResultCopyText(title) {
    return (
      "Квиз «Карта профессий» — предварительный ориентир.\n" +
      "Профиль: " +
      title +
      "\n\n" +
      QUIZ_DATA.disclaimer
    );
  }

  function trackQuiz(eventName) {
    if (window.siteAnalytics) {
      window.siteAnalytics.track(eventName);
    }
  }

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderIntro() {
    clearElement(panel);

    const card = createEl("div", "quiz__card card");
    const title = createEl("h3", "quiz__title", "Карта профессий за 5 минут");
    const lead = createEl(
      "p",
      "quiz__lead",
      "Короткий квиз поможет увидеть ваш профессиональный профиль, подходящие сферы и зоны для проверки — без давления и готовых ярлыков."
    );
    const meta = createEl("p", "quiz__meta", "~5 минут · 10 вопросов");
    const btn = createEl("button", "btn btn--primary", "Начать");
    btn.type = "button";
    btn.addEventListener("click", function () {
      state.step = 0;
      state.answers = [];
      state.selectedOption = null;
      trackQuiz("quiz_start");
      render();
    });

    card.append(title, lead, meta, btn);
    panel.appendChild(card);
    btn.focus();
  }

  function renderQuestion() {
    const questionIndex = state.step;
    const question = QUIZ_DATA.questions[questionIndex];
    const total = QUIZ_DATA.questions.length;
    const savedAnswer = state.answers[questionIndex];

    clearElement(panel);

    const card = createEl("div", "quiz__card card");
    const progressWrap = createEl("div", "quiz__progress-wrap");
    const progressLabel = createEl(
      "p",
      "quiz__progress-label",
      "Вопрос " + (questionIndex + 1) + " из " + total
    );
    const progressBar = createEl("div", "quiz__progress");
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", String(total));
    progressBar.setAttribute("aria-valuenow", String(questionIndex + 1));
    progressBar.setAttribute(
      "aria-label",
      "Прогресс: вопрос " + (questionIndex + 1) + " из " + total
    );

    const progressFill = createEl("div", "quiz__progress-fill");
    progressFill.style.width = ((questionIndex + 1) / total) * 100 + "%";
    progressBar.appendChild(progressFill);
    progressWrap.append(progressLabel, progressBar);

    const questionEl = createEl("h3", "quiz__question", question.text);
    const optionsWrap = createEl("div", "quiz__options");
    optionsWrap.setAttribute("role", "listbox");
    optionsWrap.setAttribute("aria-label", question.text);

    if (savedAnswer !== undefined) {
      state.selectedOption = savedAnswer;
    }

    const actions = createEl("div", "quiz__actions");
    const backBtn = createEl("button", "btn btn--ghost quiz__btn-back", "Назад");
    backBtn.type = "button";
    backBtn.disabled = questionIndex === 0;
    backBtn.addEventListener("click", function () {
      if (questionIndex > 0) {
        state.step = questionIndex - 1;
        state.selectedOption = state.answers[state.step] ?? null;
        render();
      }
    });

    const nextLabel = questionIndex === total - 1 ? "Получить результат" : "Далее";
    const nextBtn = createEl("button", "btn btn--primary", nextLabel);
    nextBtn.type = "button";
    nextBtn.disabled = state.selectedOption === null;
    nextBtn.addEventListener("click", function () {
      if (state.selectedOption === null) return;
      state.answers[questionIndex] = state.selectedOption;

      if (questionIndex === total - 1) {
        state.step = "result";
      } else {
        state.step = questionIndex + 1;
        state.selectedOption = state.answers[state.step] ?? null;
      }
      render();
    });

    question.options.forEach(function (option, index) {
      const optionBtn = createEl("button", "quiz__option", option.text);
      optionBtn.type = "button";
      optionBtn.setAttribute("role", "option");
      optionBtn.setAttribute("aria-selected", state.selectedOption === index ? "true" : "false");

      if (state.selectedOption === index) {
        optionBtn.classList.add("quiz__option--selected");
      }

      optionBtn.addEventListener("click", function () {
        state.selectedOption = index;
        optionsWrap.querySelectorAll(".quiz__option").forEach(function (btn, i) {
          btn.classList.toggle("quiz__option--selected", i === index);
          btn.setAttribute("aria-selected", i === index ? "true" : "false");
        });
        nextBtn.disabled = false;
      });

      optionsWrap.appendChild(optionBtn);
    });

    actions.append(backBtn, nextBtn);
    card.append(progressWrap, questionEl, optionsWrap, actions);
    panel.appendChild(card);

    questionEl.setAttribute("tabindex", "-1");
    questionEl.focus();
  }

  function renderList(titleText, items) {
    const block = createEl("div", "quiz__result-block");
    const heading = createEl("h4", "quiz__result-heading", titleText);
    const list = createEl("ul", "quiz__result-list");

    items.forEach(function (item) {
      list.appendChild(createEl("li", null, item));
    });

    block.append(heading, list);
    return block;
  }

  function renderResult() {
    const scores = calculateScores();
    const topResult = getTopProfiles(scores);
    const profile = getResultProfile(topResult);
    const combinedTitle = getProfileTitle(topResult);

    trackQuiz("quiz_complete");

    clearElement(panel);

    const card = createEl("div", "quiz__card card quiz__card--result");
    card.setAttribute("aria-live", "polite");

    const badge = createEl("span", "quiz__result-badge", "Предполагаемый профиль интересов");
    const title = createEl("h3", "quiz__result-title", combinedTitle);
    const tagline = createEl("p", "quiz__result-tagline", profile.tagline);

    const spheresBlock = createEl("div", "quiz__result-block");
    const spheresHeading = createEl("h4", "quiz__result-heading", "Направления для дальнейшей проверки");
    const spheresWrap = createEl("div", "quiz__spheres");

    profile.spheres.forEach(function (sphere) {
      spheresWrap.appendChild(createEl("span", "quiz__sphere", sphere));
    });

    spheresBlock.append(spheresHeading, spheresWrap);

    const strengthsBlock = renderList("Возможные сильные стороны", profile.strengths);
    const checklistBlock = renderList("Что важно проверить", profile.checklist);

    const ctaText = createEl("p", "quiz__cta-text", profile.ctaText);
    const disclaimer = createEl("p", "quiz__disclaimer", QUIZ_DATA.disclaimer);

    const actions = createEl("div", "quiz__actions quiz__actions--result");
    const consultBtn = createEl("a", "btn btn--primary", "Обсудить результат");
    consultBtn.href = "#booking";
    consultBtn.addEventListener("click", function () {
      trackQuiz("quiz_consultation_click");
      prefillBookingForm(combinedTitle);
    });

    const copyBtn = createEl("button", "btn btn--ghost", "Скопировать результат");
    copyBtn.type = "button";
    copyBtn.addEventListener("click", function () {
      var text = buildResultCopyText(combinedTitle);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
    });

    const retryBtn = createEl("button", "btn btn--ghost", "Пройти заново");
    retryBtn.type = "button";
    retryBtn.addEventListener("click", function () {
      trackQuiz("quiz_restart");
      state.step = "intro";
      state.answers = [];
      state.selectedOption = null;
      render();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    actions.append(consultBtn, copyBtn, retryBtn);
    card.append(
      badge,
      title,
      tagline,
      spheresBlock,
      strengthsBlock,
      checklistBlock,
      ctaText,
      disclaimer,
      actions
    );
    panel.appendChild(card);
    title.setAttribute("tabindex", "-1");
    title.focus();
  }

  function prefillBookingForm(profileTitle) {
    const serviceSelect = document.querySelector('.booking__form select[name="service"]');
    const messageField = document.querySelector('.booking__form textarea[name="message"]');

    if (serviceSelect) {
      const options = Array.from(serviceSelect.options);
      const target = options.find(function (opt) {
        return opt.textContent === "Разбор сильных сторон";
      });
      if (target) {
        serviceSelect.value = target.value;
      }
    }

    if (messageField) {
      const note =
        "Прошёл(ла) квиз «Карта профессий». Предварительный профиль: " + profileTitle + ".";
      const existing = messageField.value.trim();
      messageField.value = existing ? existing + "\n\n" + note : note;
    }
  }

  function render() {
    if (state.step === "intro") {
      renderIntro();
    } else if (state.step === "result") {
      renderResult();
    } else {
      renderQuestion();
    }
  }

  function handleKeydown(event) {
    if (!panel || state.step === "intro" || state.step === "result") return;

    const options = panel.querySelectorAll(".quiz__option");
    if (!options.length) return;

    if (event.key === "Enter" && state.selectedOption !== null) {
      const nextBtn = panel.querySelector(".quiz__actions .btn--primary");
      if (nextBtn && !nextBtn.disabled) {
        event.preventDefault();
        nextBtn.click();
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const current = state.selectedOption === null ? -1 : state.selectedOption;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      let next = current + delta;

      if (next < 0) next = options.length - 1;
      if (next >= options.length) next = 0;

      state.selectedOption = next;
      render();
      const freshOptions = panel.querySelectorAll(".quiz__option");
      if (freshOptions[next]) {
        freshOptions[next].focus();
      }
    }
  }

  function init() {
    root = document.getElementById("quiz");
    panel = document.getElementById("quiz-panel");

    if (!root || !panel || typeof QUIZ_DATA === "undefined") return;

    document.addEventListener("keydown", handleKeydown);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
