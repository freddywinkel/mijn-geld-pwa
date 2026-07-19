(() => {
  "use strict";

  const STORAGE_KEY = "mijn-geld-data-v1";
  const ACCOUNT_LABELS = {
    rabobank: "Rabobank",
    bunq: "Bunq"
  };
  const TYPE_LABELS = {
    expense: "Uitgave",
    income: "Inkomst",
    saving: "Sparen"
  };
  const TYPE_CLASSES = {
    expense: "expense",
    income: "income",
    saving: "saving"
  };
  const moneyFormatter = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const shortDateFormatter = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short"
  });
  const fullDateFormatter = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const monthFormatter = new Intl.DateTimeFormat("nl-NL", {
    month: "short"
  });

  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");
  const toast = document.getElementById("toast");
  const updatePrompt = document.getElementById("update-prompt");
  const APP_VERSION = "v5";
  const PREFILL_REVISION = "financial-overview-v4-adjusted";
  const WORKBOOK_PREFILL = {
    items: [
      {
        id: "workbook-cerba-salary",
        sourceKey: "workbook:cerba-salary",
        name: "Cerba salaris",
        type: "income",
        amount: 3180.16,
        account: "rabobank",
        cadence: "payday",
        dayOfMonth: 25,
        date: "2026-01-25",
        jarId: ""
      },
      {
        id: "workbook-boezemkade-rent",
        sourceKey: "workbook:boezemkade-rent",
        name: "Boezemkade huurinkomst",
        type: "income",
        amount: 518.65,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-rent",
        sourceKey: "workbook:rent-2e-middelandstraat",
        name: "Huur 2e Middelandstraat",
        type: "expense",
        amount: 1033.5,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-interpolis-health",
        sourceKey: "workbook:interpolis-health",
        name: "Interpolis zorgverzekering",
        type: "expense",
        amount: 190.7,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-interpolis-home",
        sourceKey: "workbook:interpolis-home",
        name: "Interpolis woonverzekering",
        type: "expense",
        amount: 31.3,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-interpolis-deductible",
        sourceKey: "workbook:interpolis-deductible",
        name: "Interpolis eigen risico",
        type: "expense",
        amount: 38.5,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-mobile-insurance",
        sourceKey: "workbook:mobile-insurance",
        name: "Mobiele verzekering (Chubb)",
        type: "expense",
        amount: 15.95,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-odido",
        sourceKey: "workbook:odido",
        name: "Odido",
        type: "expense",
        amount: 68.76,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-netflix",
        sourceKey: "workbook:netflix",
        name: "Netflix",
        type: "expense",
        amount: 22.98,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-spotify",
        sourceKey: "workbook:spotify",
        name: "Spotify",
        type: "expense",
        amount: 10.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-videoland",
        sourceKey: "workbook:videoland",
        name: "Videoland",
        type: "expense",
        amount: 11.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-npo",
        sourceKey: "workbook:npo-start-plus",
        name: "NPO Start Plus",
        type: "expense",
        amount: 2.95,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-youtube",
        sourceKey: "workbook:youtube-premium",
        name: "YouTube Premium",
        type: "expense",
        amount: 11.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-itunes",
        sourceKey: "workbook:itunes",
        name: "iTunes",
        type: "expense",
        amount: 6.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-google-storage",
        sourceKey: "workbook:google-storage",
        name: "Google Storage",
        type: "expense",
        amount: 1.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-apple-arcade",
        sourceKey: "workbook:apple-arcade",
        name: "Apple Arcade (PayPal)",
        type: "expense",
        amount: 6.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-apple-tv",
        sourceKey: "workbook:apple-tv",
        name: "Apple TV+ (PayPal)",
        type: "expense",
        amount: 9.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-chatgpt",
        sourceKey: "workbook:chatgpt",
        name: "ChatGPT (PayPal)",
        type: "expense",
        amount: 22.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-crunchyroll",
        sourceKey: "workbook:crunchyroll",
        name: "Crunchyroll",
        type: "expense",
        amount: 6.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-manga-plus",
        sourceKey: "workbook:manga-plus",
        name: "Manga Plus",
        type: "expense",
        amount: 5.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-hbo-max",
        sourceKey: "workbook:hbo-max",
        name: "HBO Max",
        type: "expense",
        amount: 9.99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-replit",
        sourceKey: "workbook:replit",
        name: "Replit",
        type: "expense",
        amount: 46,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-kimi-allegro",
        sourceKey: "workbook:kimi-allegro",
        name: "KIMI AI / Allegro (PayPal)",
        type: "expense",
        amount: 99,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      },
      {
        id: "workbook-bunq-savings",
        sourceKey: "workbook:bunq-savings",
        name: "Bunq maandelijkse spaarinleg",
        type: "saving",
        amount: 1112.78,
        account: "bunq",
        cadence: "monthly",
        dayOfMonth: 1,
        date: "2026-01-01",
        jarId: ""
      }
    ],
    savingsJars: [
      {
        id: "workbook-iphone-jar",
        sourceKey: "workbook:iphone-jar",
        name: "iPhone 17 Pro Max",
        balance: 0,
        target: 1729
      }
    ]
  };

  const state = {
    data: loadData(),
    activeView: "dashboard",
    deferredInstallPrompt: null,
    waitingServiceWorker: null,
    serviceWorkerRegistration: null,
    isCheckingForUpdates: false,
    isUpdating: false
  };

  function createDate(year, month, day) {
    const date = new Date(year, month, day);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function dateInputValue(date) {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function parseDateInput(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const parts = value.split("-").map(Number);
    const date = createDate(parts[0], parts[1] - 1, parts[2]);
    if (
      date.getFullYear() !== parts[0] ||
      date.getMonth() !== parts[1] - 1 ||
      date.getDate() !== parts[2]
    ) {
      return null;
    }

    return date;
  }

  function getBaseData() {
    return {
      version: 2,
      hasSetBalances: false,
      balances: {
        rabobank: 0,
        bunq: 0
      },
      items: [],
      savingsJars: [],
      paidOccurrences: {},
      settings: {
        rbcTransferEnabled: false,
        rbcTransferAmount: 600,
        rbcTransferDate: dateInputValue(new Date()),
        dateReviewNotice: true
      }
    };
  }

  function applyWorkbookPrefill(data) {
    if (data.prefillRevision === PREFILL_REVISION) {
      return data;
    }

    const existingSourceKeys = new Set(
      data.items.map((item) => item.sourceKey).filter(Boolean)
    );
    WORKBOOK_PREFILL.items.forEach((item) => {
      if (!existingSourceKeys.has(item.sourceKey)) {
        data.items.push({ ...item });
      }
    });

    const existingJarKeys = new Set(
      data.savingsJars.map((jar) => jar.sourceKey).filter(Boolean)
    );
    WORKBOOK_PREFILL.savingsJars.forEach((jar) => {
      if (!existingJarKeys.has(jar.sourceKey)) {
        data.savingsJars.push({ ...jar });
      }
    });

    data.version = 2;
    data.prefillRevision = PREFILL_REVISION;
    data.settings.dateReviewNotice = true;
    return data;
  }

  function getDefaultData() {
    return applyWorkbookPrefill(getBaseData());
  }

  function getBlankData() {
    const data = getBaseData();
    data.prefillRevision = PREFILL_REVISION;
    data.settings.dateReviewNotice = false;
    return data;
  }

  function numberValue(value, fallback) {
    const normalized = String(value === undefined || value === null ? "" : value)
      .trim()
      .replace(",", ".");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeData(rawData) {
    const defaults = getDefaultData();
    if (!rawData || typeof rawData !== "object") {
      return defaults;
    }

    const items = Array.isArray(rawData.items)
      ? rawData.items
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            id: String(item.id || createId("post")),
            sourceKey: item.sourceKey ? String(item.sourceKey) : "",
            name: String(item.name || "Naamloze post"),
            type: ["expense", "income", "saving"].includes(item.type) ? item.type : "expense",
            amount: Math.max(0, numberValue(item.amount, 0)),
            account: ["rabobank", "bunq"].includes(item.account) ? item.account : "bunq",
            cadence: ["once", "payday"].includes(item.cadence) ? item.cadence : "monthly",
            dayOfMonth: Math.min(31, Math.max(1, Math.round(numberValue(item.dayOfMonth, 1)))),
            date: parseDateInput(item.date) ? item.date : dateInputValue(new Date()),
            jarId: item.jarId ? String(item.jarId) : ""
          }))
      : [];

    const savingsJars = Array.isArray(rawData.savingsJars)
      ? rawData.savingsJars
          .filter((jar) => jar && typeof jar === "object")
          .map((jar) => ({
            id: String(jar.id || createId("potje")),
            sourceKey: jar.sourceKey ? String(jar.sourceKey) : "",
            name: String(jar.name || "Spaarpotje"),
            balance: Math.max(0, numberValue(jar.balance, 0)),
            target: Math.max(0, numberValue(jar.target, 0))
          }))
      : [];

    const paidOccurrences =
      rawData.paidOccurrences && typeof rawData.paidOccurrences === "object"
        ? rawData.paidOccurrences
        : {};

    return applyWorkbookPrefill({
      version: 2,
      hasSetBalances: Boolean(rawData.hasSetBalances),
      balances: {
        rabobank: numberValue(rawData.balances && rawData.balances.rabobank, 0),
        bunq: numberValue(rawData.balances && rawData.balances.bunq, 0)
      },
      items,
      savingsJars,
      paidOccurrences,
      settings: {
        rbcTransferEnabled: Boolean(rawData.settings && rawData.settings.rbcTransferEnabled),
        rbcTransferAmount: Math.max(
          0,
          numberValue(rawData.settings && rawData.settings.rbcTransferAmount, 600)
        ),
        rbcTransferDate:
          parseDateInput(rawData.settings && rawData.settings.rbcTransferDate)
            ? rawData.settings.rbcTransferDate
            : defaults.settings.rbcTransferDate,
        dateReviewNotice:
          rawData.settings && typeof rawData.settings.dateReviewNotice === "boolean"
            ? rawData.settings.dateReviewNotice
            : false
      }
    });
  }

  function loadData() {
    try {
      return normalizeData(JSON.parse(window.localStorage.getItem(STORAGE_KEY)));
    } catch (error) {
      return getDefaultData();
    }
  }

  function saveData() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  }

  function createId(prefix) {
    return (
      prefix +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function paydayForMonth(year, month) {
    const twentyFifth = createDate(year, month, 25);
    const weekday = twentyFifth.getDay();

    if (weekday === 6) {
      return createDate(year, month, 24);
    }
    if (weekday === 0) {
      return createDate(year, month, 23);
    }
    return twentyFifth;
  }

  function getBudgetCycle(referenceDate) {
    const reference = referenceDate
      ? createDate(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate()
        )
      : createDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const thisMonthPayday = paydayForMonth(reference.getFullYear(), reference.getMonth());
    let start;
    let end;

    if (reference >= thisMonthPayday) {
      start = thisMonthPayday;
      end = paydayForMonth(reference.getFullYear(), reference.getMonth() + 1);
    } else {
      start = paydayForMonth(reference.getFullYear(), reference.getMonth() - 1);
      end = thisMonthPayday;
    }

    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const referenceUtc = Date.UTC(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate()
    );
    const totalDays = Math.max(1, Math.round((endUtc - startUtc) / dayMilliseconds));
    const daysLeft = Math.max(1, Math.round((endUtc - referenceUtc) / dayMilliseconds));

    return {
      start,
      end,
      totalDays,
      daysLeft,
      elapsedPercent: Math.min(
        100,
        Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100))
      )
    };
  }

  function isWithinCycle(date, cycle) {
    return date && date >= cycle.start && date < cycle.end;
  }

  function clampDay(year, month, day) {
    return Math.min(day, new Date(year, month + 1, 0).getDate());
  }

  function occurrenceForItem(item, cycle) {
    if (item.cadence === "once") {
      const date = parseDateInput(item.date);
      return isWithinCycle(date, cycle) ? date : null;
    }

    if (item.cadence === "payday") {
      return cycle.start;
    }

    const initialDay = clampDay(
      cycle.start.getFullYear(),
      cycle.start.getMonth(),
      item.dayOfMonth
    );
    let occurrence = createDate(
      cycle.start.getFullYear(),
      cycle.start.getMonth(),
      initialDay
    );

    if (occurrence < cycle.start) {
      const nextMonth = cycle.start.getMonth() + 1;
      occurrence = createDate(
        cycle.start.getFullYear(),
        nextMonth,
        clampDay(cycle.start.getFullYear(), nextMonth, item.dayOfMonth)
      );
    }

    return isWithinCycle(occurrence, cycle) ? occurrence : null;
  }

  function paidKey(cycle, itemId) {
    return dateInputValue(cycle.start) + ":" + itemId;
  }

  function getCycleEntries(cycle) {
    const entries = state.data.items
      .map((item) => {
        const occurrence = occurrenceForItem(item, cycle);
        if (!occurrence) {
          return null;
        }
        return {
          ...item,
          occurrence,
          paid: Boolean(state.data.paidOccurrences[paidKey(cycle, item.id)]),
          virtual: false
        };
      })
      .filter(Boolean);

    const rbcDate = parseDateInput(state.data.settings.rbcTransferDate);
    if (
      state.data.settings.rbcTransferEnabled &&
      state.data.settings.rbcTransferAmount > 0 &&
      isWithinCycle(rbcDate, cycle)
    ) {
      entries.push({
        id: "rbc-transfer",
        name: "Bonaire-overboeking",
        type: "income",
        amount: state.data.settings.rbcTransferAmount,
        account: "bunq",
        cadence: "once",
        date: state.data.settings.rbcTransferDate,
        occurrence: rbcDate,
        paid: false,
        virtual: true
      });
    }

    return entries.sort((first, second) => {
      const difference = first.occurrence - second.occurrence;
      return difference === 0 ? first.name.localeCompare(second.name, "nl") : difference;
    });
  }

  function calculateBudget() {
    const cycle = getBudgetCycle();
    const entries = getCycleEntries(cycle);
    const unpaidEntries = entries.filter((entry) => !entry.paid);
    const balances = {
      rabobank: numberValue(state.data.balances.rabobank, 0),
      bunq: numberValue(state.data.balances.bunq, 0)
    };
    const forecastByAccount = {
      rabobank: balances.rabobank,
      bunq: balances.bunq
    };
    const outgoingByAccount = {
      rabobank: 0,
      bunq: 0
    };
    const incomeByAccount = {
      rabobank: 0,
      bunq: 0
    };

    unpaidEntries.forEach((entry) => {
      if (entry.type === "income") {
        incomeByAccount[entry.account] += entry.amount;
        forecastByAccount[entry.account] += entry.amount;
      } else {
        outgoingByAccount[entry.account] += entry.amount;
        forecastByAccount[entry.account] -= entry.amount;
      }
    });

    const outstandingOutgoings = outgoingByAccount.rabobank + outgoingByAccount.bunq;
    const expectedIncome = incomeByAccount.rabobank + incomeByAccount.bunq;
    const safeToSpend = forecastByAccount.rabobank + forecastByAccount.bunq;
    const savingsTotal = state.data.savingsJars.reduce(
      (total, jar) => total + numberValue(jar.balance, 0),
      0
    );

    return {
      cycle,
      entries,
      unpaidEntries,
      balances,
      forecastByAccount,
      outgoingByAccount,
      incomeByAccount,
      outstandingOutgoings,
      expectedIncome,
      safeToSpend,
      savingsTotal,
      perDay: safeToSpend / cycle.daysLeft,
      perTwoDays: (safeToSpend / cycle.daysLeft) * 2,
      perWeek: (safeToSpend / cycle.daysLeft) * 7
    };
  }

  function formatMoney(amount) {
    return moneyFormatter.format(numberValue(amount, 0));
  }

  function signedMoney(amount, isIncome) {
    const prefix = isIncome ? "+" : "−";
    return prefix + formatMoney(Math.abs(amount));
  }

  function formatShortDate(date) {
    return shortDateFormatter.format(date).replace(".", "");
  }

  function formatFullDate(date) {
    return fullDateFormatter.format(date);
  }

  function formatCycle(cycle) {
    const finalDate = new Date(cycle.end.getTime());
    finalDate.setDate(finalDate.getDate() - 1);
    return formatShortDate(cycle.start) + " – " + formatShortDate(finalDate);
  }

  function escapeHtml(value) {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return String(value === undefined || value === null ? "" : value).replace(
      /[&<>"']/g,
      (character) => replacements[character]
    );
  }

  function getMonthLabel(date) {
    return monthFormatter.format(date).replace(".", "");
  }

  function valueClass(value) {
    return value < 0 ? "negative" : value > 0 ? "positive" : "neutral";
  }

  function hasNoSetup() {
    return !state.data.hasSetBalances && state.data.items.length === 0;
  }

  function typeTag(entry) {
    return (
      '<span class="tag ' +
      TYPE_CLASSES[entry.type] +
      '">' +
      TYPE_LABELS[entry.type] +
      "</span>"
    );
  }

  function dateBlock(date) {
    return (
      '<div class="date-block">' +
      date.getDate() +
      "<span>" +
      escapeHtml(getMonthLabel(date)) +
      "</span></div>"
    );
  }

  function renderOverviewRows(entries, emptyCopy) {
    if (!entries.length) {
      return (
        '<div class="empty-state"><div><p>' +
        escapeHtml(emptyCopy) +
        '</p><button class="button button-secondary button-small" type="button" data-action="open-item-modal">Post toevoegen</button></div></div>'
      );
    }

    return (
      '<div class="overview-list">' +
      entries
        .slice(0, 4)
        .map((entry) => {
          const isIncome = entry.type === "income";
          const meta = entry.virtual
            ? "optionele overboeking"
            : ACCOUNT_LABELS[entry.account] + " · " + TYPE_LABELS[entry.type];
          return (
            '<div class="overview-row">' +
            dateBlock(entry.occurrence) +
            '<div><div class="row-name">' +
            escapeHtml(entry.name) +
            '</div><div class="row-meta">' +
            escapeHtml(meta) +
            "</div></div>" +
            '<div class="money ' +
            (isIncome ? "positive" : "negative") +
            '">' +
            signedMoney(entry.amount, isIncome) +
            "</div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderAccountCard(account, calculation) {
    const currentBalance = calculation.balances[account];
    const outgoing = calculation.outgoingByAccount[account];
    const income = calculation.incomeByAccount[account];
    const forecast = calculation.forecastByAccount[account];
    const isRabo = account === "rabobank";
    const forecastText =
      (income ? "+" + formatMoney(income) + " inkomen · " : "") +
      (outgoing ? "−" + formatMoney(outgoing) + " nog af" : "geen openstaande posten");

    return (
      '<article class="account-card">' +
      '<div class="account-card-top"><h3>' +
      ACCOUNT_LABELS[account] +
      '</h3><button class="text-button" type="button" data-action="open-balance-modal">Wijzig</button></div>' +
      '<p class="account-label">' +
      (isRabo ? "Vaste lasten" : "Besteedbaar geld") +
      "</p>" +
      '<div class="account-balance">' +
      formatMoney(currentBalance) +
      "</div>" +
      '<div class="account-detail"><span>' +
      escapeHtml(forecastText) +
      "</span><strong>" +
      formatMoney(forecast) +
      "</strong></div></article>"
    );
  }

  function renderDashboard(calculation) {
    const outgoingEntries = calculation.unpaidEntries.filter((entry) => entry.type !== "income");
    const incomeEntries = calculation.unpaidEntries.filter((entry) => entry.type === "income");
    const safeClass = valueClass(calculation.safeToSpend);
    const quickStart = hasNoSetup()
      ? '<section class="quick-start"><div><strong>Begin met je actuele saldi</strong><p>Vul Rabobank en Bunq in. Daarna berekent de app wat er tot je volgende salarisdag overblijft.</p></div><button class="button button-primary" type="button" data-action="open-balance-modal">Saldi invullen</button></section>'
      : "";
    const titleHour = new Date().getHours();
    const greeting = titleHour < 12 ? "Goedemorgen" : titleHour < 18 ? "Goedemiddag" : "Goedenavond";

    return (
      '<section>' +
      '<header class="page-header"><div><p class="eyebrow">Betaalcyclus</p><h1>' +
      greeting +
      ".</h1>" +
      '<p class="subtle">Van ' +
      escapeHtml(formatCycle(calculation.cycle)) +
      ". Je volgende salarisdag is " +
      escapeHtml(formatFullDate(calculation.cycle.end)) +
      ".</p></div>" +
      '<div class="header-actions"><button class="button button-secondary" type="button" data-action="open-balance-modal">Saldi bijwerken</button><button class="button button-primary" type="button" data-action="open-item-modal">+ Post toevoegen</button></div></header>' +
      quickStart +
      '<div class="hero-grid"><article class="hero-card"><p class="hero-label">Vrij te besteden tot je salaris</p><p class="hero-amount ' +
      safeClass +
      '">' +
      formatMoney(calculation.safeToSpend) +
      '</p><div class="hero-footer"><strong>' +
      calculation.cycle.daysLeft +
      " " +
      (calculation.cycle.daysLeft === 1 ? "dag" : "dagen") +
      ' te gaan</strong><span class="hero-dot"></span><span>na alle openstaande posten</span></div></article>' +
      '<article class="cycle-card"><div><p>Deze cyclus</p><strong>' +
      escapeHtml(formatCycle(calculation.cycle)) +
      '</strong><p class="cycle-days">' +
      calculation.cycle.daysLeft +
      "<span>dagen over</span></p></div><div><div class=\"progress-track\"><div class=\"progress-value\" style=\"width: " +
      calculation.cycle.elapsedPercent +
      '%\"></div></div><small>' +
      calculation.cycle.elapsedPercent +
      "% van je betaalcyclus is voorbij</small></div></article></div>" +
      '<div class="budget-grid"><article class="budget-card"><p>Gemiddeld per dag</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(calculation.perDay) +
      "</strong><small>tot je volgende salaris</small></article>" +
      '<article class="budget-card"><p>Gemiddeld per 2 dagen</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(calculation.perTwoDays) +
      "</strong><small>twee keer je dagbudget</small></article>" +
      '<article class="budget-card"><p>Gemiddeld per week</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(calculation.perWeek) +
      "</strong><small>zeven keer je dagbudget</small></article></div>" +
      '<div class="content-grid"><section class="panel"><header class="panel-header"><div><h2>Nog af te schrijven</h2><p class="section-copy">' +
      formatMoney(calculation.outstandingOutgoings) +
      " staat nog gepland.</p></div><button class=\"text-button\" type=\"button\" data-action=\"goto-planning\">Alles bekijken</button></header><div class=\"panel-body\">" +
      renderOverviewRows(outgoingEntries, "Nog geen uitgaven of spaaroverboekingen in deze cyclus.") +
      "</div></section>" +
      '<div class="stack"><section class="panel"><header class="panel-header"><div><h2>Verwachte inkomsten</h2><p class="section-copy">' +
      formatMoney(calculation.expectedIncome) +
      " wordt meegerekend.</p></div></header><div class=\"panel-body\">" +
      renderOverviewRows(incomeEntries, "Nog geen verwachte inkomsten ingepland.") +
      "</div></section>" +
      '<section class="panel"><header class="panel-header"><div><h2>Rekeningen</h2><p class="section-copy">Actueel saldo en verwachte eindstand.</p></div></header><div class="panel-body"><div class="account-grid">' +
      renderAccountCard("rabobank", calculation) +
      renderAccountCard("bunq", calculation) +
      "</div></div></section>" +
      '<section class="panel rbc-card"><h2>Extra inkomen uit Bonaire</h2><p>De Bonaire RBC-rekening blijft verborgen. Neem alleen de overboeking mee wanneer je die naar Bunq wilt halen.</p><div class="switch-row"><div class="switch-copy"><strong>' +
      formatMoney(state.data.settings.rbcTransferAmount) +
      ' als inkomen meenemen</strong><small>Verwachte datum: ' +
      escapeHtml(
        parseDateInput(state.data.settings.rbcTransferDate)
          ? formatShortDate(parseDateInput(state.data.settings.rbcTransferDate))
          : "nog kiezen"
      ) +
      '</small></div><button class="switch ' +
      (state.data.settings.rbcTransferEnabled ? "is-on" : "") +
      '" type="button" role="switch" aria-checked="' +
      (state.data.settings.rbcTransferEnabled ? "true" : "false") +
      '" data-action="toggle-rbc"><span></span></button></div></section></div></div>' +
      "</section>"
    );
  }

  function renderPlanningRow(entry, cycle) {
    const isIncome = entry.type === "income";
    const cadenceText = entry.virtual
      ? "optioneel"
      : entry.cadence === "payday"
        ? "salarisdag"
        : entry.cadence === "monthly"
          ? "elke maand"
          : "eenmalig";
    const itemId = escapeHtml(entry.id);
    const dueDate = dateInputValue(entry.occurrence);
    const paidButton = entry.virtual
      ? '<button class="status-button" type="button" data-action="goto-settings">Instellingen</button>'
      : '<button class="status-button ' +
        (entry.paid ? "is-paid" : "") +
        '" type="button" data-action="toggle-paid" data-id="' +
        itemId +
        '">' +
        (entry.paid ? "Betaald" : isIncome ? "Ontvangen?" : "Betaald?") +
        "</button>";
    const controls = entry.virtual
      ? paidButton
      : paidButton +
        '<button class="icon-button" title="Bewerk post" aria-label="Bewerk ' +
        escapeHtml(entry.name) +
        '" type="button" data-action="edit-item" data-id="' +
        itemId +
        '">✎</button><button class="icon-button" title="Verwijder post" aria-label="Verwijder ' +
        escapeHtml(entry.name) +
        '" type="button" data-action="delete-item" data-id="' +
        itemId +
        '">×</button>';

    return (
      '<article class="planning-row ' +
      (entry.paid ? "is-paid" : "") +
      '">' +
      '<div class="planning-date"><label for="date-' +
      itemId +
      '">' +
      (entry.type === "income" ? "Ontvangstdatum" : "Aftrekdatum") +
      "</label>" +
      (entry.virtual || entry.cadence === "payday"
        ? '<div class="date-input" aria-label="Verwachte datum">' +
          escapeHtml(formatShortDate(entry.occurrence)) +
          "</div>"
        : '<input class="date-input" id="date-' +
          itemId +
          '" type="date" value="' +
          dueDate +
          '" data-action="change-date" data-id="' +
          itemId +
          '">') +
      "</div>" +
      '<div class="planning-main"><div class="planning-name">' +
      escapeHtml(entry.name) +
      '</div><div class="planning-meta">' +
      typeTag(entry) +
      '<span class="tag">' +
      cadenceText +
      "</span></div></div>" +
      '<div class="planning-account">' +
      (entry.virtual ? "Naar Bunq" : ACCOUNT_LABELS[entry.account]) +
      "</div>" +
      '<div class="planning-amount money ' +
      (isIncome ? "positive" : "negative") +
      '">' +
      signedMoney(entry.amount, isIncome) +
      '</div><div class="planning-actions">' +
      controls +
      "</div></article>"
    );
  }

  function renderPlanning(calculation) {
    const rows = calculation.entries.length
      ? '<div class="planning-list">' +
        calculation.entries.map((entry) => renderPlanningRow(entry, calculation.cycle)).join("") +
        "</div>"
      : '<div class="panel"><div class="empty-state"><div><p>Je planning is nog leeg. Voeg vaste lasten, inkomsten, losse uitgaven of geplande spaaroverboekingen toe.</p><button class="button button-primary" type="button" data-action="open-item-modal">Eerste post toevoegen</button></div></div></div>';

    return (
      '<section><header class="page-header"><div><p class="eyebrow">Aftrekdatums</p><h1>Planning</h1><p class="subtle">Alle posten tussen ' +
      escapeHtml(formatCycle(calculation.cycle)) +
      '. Verander de datum hier direct; maandelijkse posten houden daarna die dag van de maand aan.</p></div><div class="header-actions"><span class="cycle-pill">' +
      escapeHtml(formatCycle(calculation.cycle)) +
      '</span><button class="button button-primary" type="button" data-action="open-item-modal">+ Nieuwe post</button></div></header>' +
      rows +
      '<div class="panel" style="margin-top: 18px;"><div class="panel-body"><p class="helper-copy">Tip: werk eerst je echte rekening-saldo bij zodra iets is afgeschreven of ontvangen. Markeer de post daarna als betaald of ontvangen, zodat deze niet nogmaals wordt meegerekend.</p></div></div></section>'
    );
  }

  function jarProgress(jar) {
    if (!jar.target) {
      return 0;
    }
    return Math.min(100, Math.round((jar.balance / jar.target) * 100));
  }

  function renderJarCard(jar) {
    const progress = jarProgress(jar);
    const targetText = jar.target
      ? formatMoney(jar.balance) + " van " + formatMoney(jar.target)
      : "Geen doelbedrag ingesteld";

    return (
      '<article class="jar-card"><div class="jar-icon" aria-hidden="true">◌</div><h2>' +
      escapeHtml(jar.name) +
      '</h2><p class="section-copy">' +
      escapeHtml(targetText) +
      '</p><p class="jar-amount">' +
      formatMoney(jar.balance) +
      '</p><div class="jar-progress" aria-label="' +
      progress +
      '% van doel"><span style="width: ' +
      progress +
      '%"></span></div><div class="jar-actions"><span class="tag">' +
      (jar.target ? progress + "% van doel" : "vrij sparen") +
      '</span><div><button class="icon-button" aria-label="Bewerk ' +
      escapeHtml(jar.name) +
      '" type="button" data-action="edit-jar" data-id="' +
      escapeHtml(jar.id) +
      '">✎</button><button class="icon-button" aria-label="Verwijder ' +
      escapeHtml(jar.name) +
      '" type="button" data-action="delete-jar" data-id="' +
      escapeHtml(jar.id) +
      '">×</button></div></div></article>'
    );
  }

  function renderJars(calculation) {
    const jarContent = state.data.savingsJars.length
      ? '<div class="jars-grid">' + state.data.savingsJars.map(renderJarCard).join("") + "</div>"
      : '<section class="panel"><div class="empty-state"><div><p>Maak een potje voor ieder spaardoel dat je apart wilt zien. Het geld in je potjes telt niet mee als vrij besteedbaar.</p><button class="button button-primary" type="button" data-action="open-jar-modal">Eerste spaarpotje</button></div></div></section>';

    return (
      '<section><header class="page-header"><div><p class="eyebrow">Bunq spaardoelen</p><h1>Spaarpotjes</h1><p class="subtle">Je potjes blijven bewust apart van je besteedbare geld. Totaal gespaard: ' +
      formatMoney(calculation.savingsTotal) +
      ".</p></div><div class=\"header-actions\"><button class=\"button button-primary\" type=\"button\" data-action=\"open-jar-modal\">+ Spaarpotje</button></div></header>" +
      jarContent +
      '<div class="section-heading"><div><h2>Geplande spaaroverboekingen</h2><p class="section-copy">Deze worden in je planning afgetrokken van je besteedbare geld.</p></div><button class="text-button" type="button" data-action="goto-planning">Planning openen</button></div>' +
      '<section class="panel"><div class="panel-body">' +
      renderOverviewRows(
        calculation.unpaidEntries.filter((entry) => entry.type === "saving"),
        "Er staan geen geplande spaaroverboekingen in deze betaalcyclus."
      ) +
      "</div></section></section>"
    );
  }

  function renderSettings(calculation) {
    const rbcDate = parseDateInput(state.data.settings.rbcTransferDate);
    const prefillNotice = state.data.settings.dateReviewNotice
      ? '<section class="quick-start"><div><strong>Werkbladgegevens zijn toegevoegd</strong><p>Je vaste lasten, inkomsten en spaarinleg komen uit Financial_Overview_v4_adjusted. De exacte aftrekdatums stonden niet in het werkblad en staan daarom voorlopig op de 1e; pas ze aan in Planning.</p></div><button class="button button-secondary button-small" type="button" data-action="dismiss-prefill-notice">Begrepen</button></section>'
      : "";
    return (
      '<section><header class="page-header"><div><p class="eyebrow">Privé & offline</p><h1>Instellingen</h1><p class="subtle">Je gegevens worden alleen lokaal in deze browser opgeslagen. Er is geen bankkoppeling en geen account nodig.</p></div><div class="header-actions"><button class="button button-secondary" type="button" data-action="install-app">Installeer app</button></div></header>' +
      prefillNotice +
      '<div class="settings-grid"><section class="panel settings-panel"><h2>Actuele saldo&apos;s</h2><p class="section-copy">Vul in wat er nu werkelijk op je rekeningen staat.</p><form id="settings-balance-form"><div class="field-grid"><div class="form-field"><label for="setting-rabobank">Rabobank</label><input id="setting-rabobank" name="rabobank" type="number" inputmode="decimal" step="0.01" value="' +
      escapeHtml(state.data.balances.rabobank) +
      '"></div><div class="form-field"><label for="setting-bunq">Bunq besteedbaar</label><input id="setting-bunq" name="bunq" type="number" inputmode="decimal" step="0.01" value="' +
      escapeHtml(state.data.balances.bunq) +
      '"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Saldo&apos;s opslaan</button></div></form></section>' +
      '<section class="panel settings-panel"><h2>Bonaire als inkomen</h2><p class="section-copy">Geen zichtbare rekening. Schakel de overboeking alleen in wanneer die naar Bunq komt.</p><form id="rbc-form"><div class="field-grid"><div class="form-field full"><label for="rbc-enabled">Overboeking meenemen</label><select id="rbc-enabled" name="rbcEnabled"><option value="false"' +
      (!state.data.settings.rbcTransferEnabled ? " selected" : "") +
      '>Nee, niet meenemen</option><option value="true"' +
      (state.data.settings.rbcTransferEnabled ? " selected" : "") +
      ">Ja, als verwacht inkomen</option></select></div><div class=\"form-field\"><label for=\"rbc-amount\">Bedrag</label><input id=\"rbc-amount\" name=\"rbcAmount\" type=\"text\" inputmode=\"decimal\" value=\"" +
      escapeHtml(state.data.settings.rbcTransferAmount) +
      '"></div><div class="form-field"><label for="rbc-date">Verwachte datum</label><input id="rbc-date" name="rbcDate" type="date" value="' +
      escapeHtml(rbcDate ? dateInputValue(rbcDate) : dateInputValue(new Date())) +
      '"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Opslaan</button></div></form></section>' +
      '<section class="panel settings-panel full"><h2>Zo wordt je budget berekend</h2><ul class="info-list"><li><span>1</span><div>De cyclus start op de 25e. Als de 25e op zaterdag of zondag valt, start hij op de vrijdag ervoor.</div></li><li><span>2</span><div>Van je actuele Rabobank- en Bunq-saldo worden alle nog niet-betaalde uitgaven en geplande spaaroverboekingen afgetrokken.</div></li><li><span>3</span><div>Niet-ontvangen inkomsten worden erbij opgeteld. Je spaarpotjes blijven apart en tellen niet mee als vrij besteedbaar geld.</div></li><li><span>4</span><div>Wanneer een bedrag echt is verwerkt, werk je saldo bij en markeer je de post als betaald of ontvangen om dubbel tellen te voorkomen.</div></li></ul></section>' +
      '<section class="panel settings-panel"><h2>Reservekopie</h2><p class="section-copy">Bewaar een kopie voordat je van telefoon of browser wisselt.</p><div class="form-actions"><button class="button button-secondary" type="button" data-action="export-data">Exporteer gegevens</button><label class="button button-secondary" for="import-file">Importeer gegevens</label><input class="is-hidden" id="import-file" type="file" accept="application/json" data-action="import-data"></div></section>' +
      '<section class="panel settings-panel"><h2>App-update</h2><p class="section-copy">Controleer handmatig of er een nieuwe versie van Mijn Geld klaarstaat. Je lokale gegevens blijven bewaard.</p><div class="form-actions"><button class="button button-secondary" type="button" data-action="check-for-updates"' +
      (state.isCheckingForUpdates ? " disabled" : "") +
      '>' +
      (state.isCheckingForUpdates ? "Controleren…" : "Controleer op updates") +
      '</button><span class="version-label">Versie ' +
      APP_VERSION +
      "</span></div></section>" +
      '<section class="panel settings-panel"><h2>Opnieuw beginnen</h2><p class="section-copy">Dit wist alleen de lokale gegevens in deze app. Je bankgegevens blijven onaangeraakt.</p><div class="form-actions"><button class="button button-danger" type="button" data-action="clear-data">Lokale gegevens wissen</button></div></section></div></section>'
    );
  }

  function render() {
    const calculation = calculateBudget();
    let content;

    if (state.activeView === "planning") {
      content = renderPlanning(calculation);
    } else if (state.activeView === "jars") {
      content = renderJars(calculation);
    } else if (state.activeView === "settings") {
      content = renderSettings(calculation);
    } else {
      content = renderDashboard(calculation);
    }

    app.innerHTML = content;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === state.activeView);
    });
  }

  function modalShell(title, copy, body) {
    return (
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">' +
      escapeHtml(title) +
      "</h2>" +
      (copy ? '<p class="section-copy">' + escapeHtml(copy) + "</p>" : "") +
      '</div><button class="modal-close" type="button" data-action="close-modal" aria-label="Sluiten">×</button></header><div class="modal-body">' +
      body +
      "</div></div>"
    );
  }

  function showBalancesModal() {
    const body =
      '<form id="balance-form"><div class="field-grid"><div class="form-field"><label for="modal-rabobank">Rabobank</label><input id="modal-rabobank" name="rabobank" type="number" inputmode="decimal" step="0.01" value="' +
      escapeHtml(state.data.balances.rabobank) +
      '"><span class="helper-copy">Voor je vaste lasten.</span></div><div class="form-field"><label for="modal-bunq">Bunq besteedbaar</label><input id="modal-bunq" name="bunq" type="number" inputmode="decimal" step="0.01" value="' +
      escapeHtml(state.data.balances.bunq) +
      '"><span class="helper-copy">Zonder je losse spaarpotjes.</span></div></div><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Annuleren</button><button class="button button-primary" type="submit">Saldo&apos;s opslaan</button></div></form>';
    modalRoot.innerHTML = modalShell(
      "Actuele saldo's",
      "Vul in wat er op dit moment daadwerkelijk op je rekening staat.",
      body
    );
    focusModal();
  }

  function showItemModal(itemId) {
    const calculation = calculateBudget();
    const existing = itemId
      ? state.data.items.find((item) => item.id === itemId)
      : null;
    const defaultDate = dateInputValue(calculation.cycle.start);
    const selectedDate = existing
      ? existing.cadence === "once"
        ? existing.date
        : existing.cadence === "payday"
          ? defaultDate
        : dateInputValue(
            createDate(
              calculation.cycle.start.getFullYear(),
              calculation.cycle.start.getMonth(),
              clampDay(
                calculation.cycle.start.getFullYear(),
                calculation.cycle.start.getMonth(),
                existing.dayOfMonth
              )
            )
          )
      : defaultDate;
    const jarsOptions =
      '<option value="">Geen gekoppeld potje</option>' +
      state.data.savingsJars
        .map((jar) => {
          return (
            '<option value="' +
            escapeHtml(jar.id) +
            '"' +
            (existing && existing.jarId === jar.id ? " selected" : "") +
            ">" +
            escapeHtml(jar.name) +
            "</option>"
          );
        })
        .join("");
    const body =
      '<form id="item-form" data-id="' +
      (existing ? escapeHtml(existing.id) : "") +
      '"><div class="field-grid"><div class="form-field full"><label for="item-name">Naam</label><input id="item-name" name="name" required maxlength="80" placeholder="Bijvoorbeeld: huur, salaris, boodschappen" value="' +
      escapeHtml(existing ? existing.name : "") +
      '"></div><div class="form-field"><label for="item-type">Soort post</label><select id="item-type" name="type"><option value="expense"' +
      (existing && existing.type === "expense" ? " selected" : "") +
      ">Uitgave</option><option value=\"income\"" +
      (existing && existing.type === "income" ? " selected" : "") +
      ">Inkomst</option><option value=\"saving\"" +
      (existing && existing.type === "saving" ? " selected" : "") +
      ">Spaaroverboeking</option></select></div><div class=\"form-field\"><label for=\"item-amount\">Bedrag</label><input id=\"item-amount\" name=\"amount\" required type=\"text\" inputmode=\"decimal\" value=\"" +
      escapeHtml(existing ? existing.amount : "") +
      '"></div><div class="form-field"><label for="item-account">Rekening</label><select id="item-account" name="account"><option value="rabobank"' +
      (existing && existing.account === "rabobank" ? " selected" : "") +
      ">Rabobank (vaste lasten)</option><option value=\"bunq\"" +
      (!existing || existing.account === "bunq" ? " selected" : "") +
      ">Bunq (besteedbaar)</option></select></div><div class=\"form-field\"><label for=\"item-cadence\">Herhaling</label><select id=\"item-cadence\" name=\"cadence\"><option value=\"monthly\"" +
      (!existing || existing.cadence === "monthly" ? " selected" : "") +
      ">Elke maand</option><option value=\"once\"" +
      (existing && existing.cadence === "once" ? " selected" : "") +
      ">Eenmalig</option><option value=\"payday\"" +
      (existing && existing.cadence === "payday" ? " selected" : "") +
      ">Salarisdag</option></select></div><div class=\"form-field\"><label for=\"item-date\">Aftrek- of ontvangstdatum</label><input id=\"item-date\" name=\"date\" required type=\"date\" value=\"" +
      escapeHtml(selectedDate) +
      '"></div><div class="form-field"><label for="item-jar">Spaarpotje</label><select id="item-jar" name="jarId">' +
      jarsOptions +
      '</select></div></div><p class="helper-copy" style="margin-top: 16px;">Voor maandelijkse posten onthoudt de app de dag van de maand. Het gekoppelde potje is alleen ter herkenning; werk de werkelijke potjessaldo zelf bij.</p><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Annuleren</button><button class="button button-primary" type="submit">' +
      (existing ? "Wijzigingen opslaan" : "Post toevoegen") +
      "</button></div></form>";

    modalRoot.innerHTML = modalShell(
      existing ? "Post bewerken" : "Nieuwe post",
      "Plan alles wat je deze betaalcyclus verwacht.",
      body
    );
    focusModal();
  }

  function showJarModal(jarId) {
    const existing = jarId
      ? state.data.savingsJars.find((jar) => jar.id === jarId)
      : null;
    const body =
      '<form id="jar-form" data-id="' +
      (existing ? escapeHtml(existing.id) : "") +
      '"><div class="field-grid"><div class="form-field full"><label for="jar-name">Naam van potje</label><input id="jar-name" name="name" required maxlength="60" placeholder="Bijvoorbeeld: vakantie, buffer, cursus" value="' +
      escapeHtml(existing ? existing.name : "") +
      '"></div><div class="form-field"><label for="jar-balance">Nu in het potje</label><input id="jar-balance" name="balance" required type="number" min="0" inputmode="decimal" step="0.01" value="' +
      escapeHtml(existing ? existing.balance : "") +
      '"></div><div class="form-field"><label for="jar-target">Doelbedrag (optioneel)</label><input id="jar-target" name="target" type="number" min="0" inputmode="decimal" step="0.01" value="' +
      escapeHtml(existing ? existing.target : "") +
      '"></div></div><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Annuleren</button><button class="button button-primary" type="submit">' +
      (existing ? "Potje opslaan" : "Potje toevoegen") +
      "</button></div></form>";

    modalRoot.innerHTML = modalShell(
      existing ? "Spaarpotje bewerken" : "Nieuw spaarpotje",
      "Potjes tellen niet mee als vrij besteedbaar geld.",
      body
    );
    focusModal();
  }

  function focusModal() {
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      const focusTarget = modalRoot.querySelector("input, select, button");
      if (focusTarget) {
        focusTarget.focus();
      }
    }, 0);
  }

  function closeModal() {
    modalRoot.innerHTML = "";
    document.body.style.overflow = "";
  }

  function showUpdatePrompt(worker) {
    state.waitingServiceWorker = worker;
    updatePrompt.classList.remove("is-hidden");
  }

  function dismissUpdatePrompt() {
    state.waitingServiceWorker = null;
    updatePrompt.classList.add("is-hidden");
  }

  function applyServiceWorkerUpdate() {
    if (!state.waitingServiceWorker) {
      return;
    }

    state.isUpdating = true;
    state.waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
  }

  async function checkForAppUpdate() {
    if (state.isCheckingForUpdates) {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      showToast("Updatecontrole wordt niet ondersteund in deze browser.");
      return;
    }

    state.isCheckingForUpdates = true;
    render();

    try {
      const registration =
        state.serviceWorkerRegistration ||
        (await navigator.serviceWorker.getRegistration("./"));

      if (!registration) {
        showToast("Open Mijn Geld via de geïnstalleerde app of website om updates te controleren.");
        return;
      }

      state.serviceWorkerRegistration = registration;
      await registration.update();

      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdatePrompt(registration.waiting);
      } else {
        showToast("Je gebruikt de nieuwste versie van Mijn Geld.");
      }
    } catch (error) {
      showToast("Updatecontrole mislukt. Controleer je internetverbinding en probeer opnieuw.");
    } finally {
      state.isCheckingForUpdates = false;
      if (state.activeView === "settings") {
        render();
      }
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  function commit(message) {
    saveData();
    render();
    if (message) {
      showToast(message);
    }
  }

  function setActiveView(view) {
    state.activeView = view;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getItem(itemId) {
    return state.data.items.find((item) => item.id === itemId);
  }

  function handleAction(actionElement) {
    const action = actionElement.dataset.action;
    const itemId = actionElement.dataset.id;

    if (action === "open-balance-modal") {
      showBalancesModal();
      return;
    }
    if (action === "open-item-modal") {
      showItemModal();
      return;
    }
    if (action === "edit-item") {
      showItemModal(itemId);
      return;
    }
    if (action === "open-jar-modal") {
      showJarModal();
      return;
    }
    if (action === "edit-jar") {
      showJarModal(itemId);
      return;
    }
    if (action === "close-modal") {
      closeModal();
      return;
    }
    if (action === "goto-planning") {
      setActiveView("planning");
      return;
    }
    if (action === "goto-settings") {
      setActiveView("settings");
      return;
    }
    if (action === "dismiss-prefill-notice") {
      state.data.settings.dateReviewNotice = false;
      commit();
      return;
    }
    if (action === "toggle-rbc") {
      state.data.settings.rbcTransferEnabled = !state.data.settings.rbcTransferEnabled;
      commit(
        state.data.settings.rbcTransferEnabled
          ? "De Bonaire-overboeking wordt nu als verwacht inkomen meegerekend."
          : "De Bonaire-overboeking wordt niet meer meegerekend."
      );
      return;
    }
    if (action === "toggle-paid") {
      const item = getItem(itemId);
      if (!item) {
        return;
      }
      const cycle = getBudgetCycle();
      const key = paidKey(cycle, item.id);
      const wasPaid = Boolean(state.data.paidOccurrences[key]);
      if (wasPaid) {
        delete state.data.paidOccurrences[key];
      } else {
        state.data.paidOccurrences[key] = true;
      }
      commit(
        wasPaid
          ? "De post staat weer open."
          : "Gemarkeerd. Werk ook je echte rekening-saldo bij om dubbel tellen te voorkomen."
      );
      return;
    }
    if (action === "delete-item") {
      const item = getItem(itemId);
      if (!item || !window.confirm("Deze post verwijderen?")) {
        return;
      }
      state.data.items = state.data.items.filter((entry) => entry.id !== itemId);
      Object.keys(state.data.paidOccurrences).forEach((key) => {
        if (key.endsWith(":" + itemId)) {
          delete state.data.paidOccurrences[key];
        }
      });
      commit("Post verwijderd.");
      return;
    }
    if (action === "delete-jar") {
      const jar = state.data.savingsJars.find((entry) => entry.id === itemId);
      if (!jar || !window.confirm("Dit spaarpotje verwijderen?")) {
        return;
      }
      state.data.savingsJars = state.data.savingsJars.filter((entry) => entry.id !== itemId);
      state.data.items = state.data.items.map((item) => {
        if (item.jarId === itemId) {
          return { ...item, jarId: "" };
        }
        return item;
      });
      commit("Spaarpotje verwijderd.");
      return;
    }
    if (action === "export-data") {
      exportData();
      return;
    }
    if (action === "check-for-updates") {
      checkForAppUpdate();
      return;
    }
    if (action === "clear-data") {
      if (
        window.confirm(
          "Alle lokale gegevens van Mijn Geld wissen? Dit kan alleen worden hersteld met een exportbestand."
        )
      ) {
        state.data = getBlankData();
        commit("De lokale gegevens zijn gewist.");
      }
      return;
    }
    if (action === "install-app") {
      installApp();
    }
  }

  function handleFormSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (!["balance-form", "settings-balance-form", "item-form", "jar-form", "rbc-form"].includes(form.id)) {
      return;
    }

    event.preventDefault();
    const formData = new FormData(form);

    if (form.id === "balance-form" || form.id === "settings-balance-form") {
      state.data.balances.rabobank = numberValue(formData.get("rabobank"), 0);
      state.data.balances.bunq = numberValue(formData.get("bunq"), 0);
      state.data.hasSetBalances = true;
      closeModal();
      commit("Je actuele saldo's zijn bijgewerkt.");
      return;
    }

    if (form.id === "rbc-form") {
      const rbcDate = parseDateInput(formData.get("rbcDate"));
      if (!rbcDate) {
        showToast("Kies een geldige datum voor de overboeking.");
        return;
      }
      state.data.settings.rbcTransferEnabled = formData.get("rbcEnabled") === "true";
      state.data.settings.rbcTransferAmount = Math.max(0, numberValue(formData.get("rbcAmount"), 0));
      state.data.settings.rbcTransferDate = dateInputValue(rbcDate);
      commit("De Bonaire-instelling is opgeslagen.");
      return;
    }

    if (form.id === "item-form") {
      const name = String(formData.get("name") || "").trim();
      const amount = numberValue(formData.get("amount"), 0);
      const itemDate = parseDateInput(formData.get("date"));
      const type = String(formData.get("type") || "");
      const account = String(formData.get("account") || "");
      const cadence = String(formData.get("cadence") || "");
      const itemId = form.dataset.id;
      const existingItem = itemId ? getItem(itemId) : null;

      if (
        !name ||
        amount <= 0 ||
        !itemDate ||
        !["expense", "income", "saving"].includes(type) ||
        !["rabobank", "bunq"].includes(account) ||
        !["monthly", "once", "payday"].includes(cadence)
      ) {
        showToast("Vul alle verplichte velden correct in.");
        return;
      }

      const item = {
        id: itemId || createId("post"),
        sourceKey: existingItem ? existingItem.sourceKey : "",
        name,
        type,
        amount,
        account,
        cadence,
        dayOfMonth: itemDate.getDate(),
        date: dateInputValue(itemDate),
        jarId: String(formData.get("jarId") || "")
      };

      if (itemId) {
        state.data.items = state.data.items.map((existing) =>
          existing.id === itemId ? item : existing
        );
      } else {
        state.data.items.push(item);
      }
      closeModal();
      commit(itemId ? "Post bijgewerkt." : "Post toegevoegd.");
      return;
    }

    if (form.id === "jar-form") {
      const name = String(formData.get("name") || "").trim();
      const balance = Math.max(0, numberValue(formData.get("balance"), 0));
      const target = Math.max(0, numberValue(formData.get("target"), 0));
      const jarId = form.dataset.id;

      if (!name) {
        showToast("Geef je spaarpotje een naam.");
        return;
      }

      const jar = {
        id: jarId || createId("potje"),
        sourceKey: existing ? existing.sourceKey : "",
        name,
        balance,
        target
      };

      if (jarId) {
        state.data.savingsJars = state.data.savingsJars.map((existing) =>
          existing.id === jarId ? jar : existing
        );
      } else {
        state.data.savingsJars.push(jar);
      }
      closeModal();
      commit(jarId ? "Spaarpotje bijgewerkt." : "Spaarpotje toegevoegd.");
    }
  }

  function handleInputChange(input) {
    if (input.dataset.action === "change-date") {
      const item = getItem(input.dataset.id);
      const selectedDate = parseDateInput(input.value);
      if (!item || !selectedDate) {
        return;
      }

      item.date = dateInputValue(selectedDate);
      item.dayOfMonth = selectedDate.getDate();
      commit(
        item.cadence === "monthly"
          ? "De maandelijkse aftrekdag is aangepast."
          : "De datum van deze post is aangepast."
      );
      return;
    }

    if (input.dataset.action === "import-data" && input.files && input.files[0]) {
      importData(input.files[0]);
    }
  }

  function exportData() {
    const content = JSON.stringify(state.data, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mijn-geld-reservekopie-" + dateInputValue(new Date()) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Reservekopie gedownload.");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = normalizeData(JSON.parse(String(reader.result || "")));
        state.data = imported;
        commit("Reservekopie geïmporteerd.");
      } catch (error) {
        showToast("Dit bestand is geen geldige reservekopie.");
      }
    };
    reader.onerror = () => {
      showToast("Het bestand kon niet worden gelezen.");
    };
    reader.readAsText(file);
  }

  async function installApp() {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      await state.deferredInstallPrompt.userChoice;
      state.deferredInstallPrompt = null;
      return;
    }
    showToast(
      "Gebruik op iPhone Safari: Deel → Zet op beginscherm. Op andere apparaten gebruik je het browsermenu."
    );
  }

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      setActiveView(viewButton.dataset.view);
      return;
    }

    const actionElement = event.target.closest("[data-action]");
    if (actionElement) {
      handleAction(actionElement);
      return;
    }

    if (event.target === modalRoot) {
      closeModal();
    }
  });

  document.addEventListener("submit", handleFormSubmit);
  document.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
      handleInputChange(event.target);
    }
  });

  document.getElementById("update-now").addEventListener("click", applyServiceWorkerUpdate);
  document.getElementById("update-later").addEventListener("click", dismissUpdatePrompt);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    state.deferredInstallPrompt = null;
    showToast("Mijn Geld is geïnstalleerd.");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (state.isUpdating) {
        window.location.reload();
      }
    });

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((registration) => {
          state.serviceWorkerRegistration = registration;
          if (registration.waiting && navigator.serviceWorker.controller) {
            showUpdatePrompt(registration.waiting);
          }

          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (!installingWorker) {
              return;
            }

            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                showUpdatePrompt(installingWorker);
              }
            });
          });

          registration.update().catch(() => {});

          window.addEventListener("focus", () => {
            registration.update().catch(() => {});
          });
        })
        .catch(() => {
          showToast("Offline-modus wordt actief zodra de app via een webserver geopend is.");
        });
    });
  }

  render();
})();
