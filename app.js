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
    saving: "Spaarinleg"
  };
  const TYPE_CLASSES = {
    expense: "expense",
    income: "income",
    saving: "saving"
  };
  const ICONS = {
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>',
    remove: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"></path></svg>',
    wallet: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 7h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7.8A2.8 2.8 0 0 1 5.8 5H18"></path><path d="M16 12h5v5h-5a2.5 2.5 0 0 1 0-5Z"></path></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"></path></svg>',
    income: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v14M6.5 12.5 12 18l5.5-5.5"></path></svg>',
    outgoing: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20V6M6.5 11.5 12 6l5.5 5.5"></path></svg>'
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
  const APP_VERSION = "v12";
  const PREFILL_REVISION = "financial-overview-v4-adjusted";
  const PREFILL_ADDITIONS_REVISION = "financial-overview-v4-dates-expenses";
  const PREFILL_ADDITION_SOURCE_KEYS = new Set([
    "workbook:wnf-donation",
    "workbook:rabobank-services"
  ]);
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
        id: "workbook-wnf-donation",
        sourceKey: "workbook:wnf-donation",
        name: "WNF-donatie",
        type: "expense",
        amount: 3,
        account: "rabobank",
        cadence: "monthly",
        dayOfMonth: 28,
        date: "2026-01-28",
        jarId: ""
      },
      {
        id: "workbook-rabobank-services",
        sourceKey: "workbook:rabobank-services",
        name: "Rabobank-betaalpakket",
        type: "expense",
        amount: 6.5,
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
        extraIncomeEnabled: false,
        extraIncomeName: "Extra inkomen",
        extraIncomeAmount: 0,
        extraIncomeDate: dateInputValue(new Date()),
        extraIncomeAccount: "bunq",
        dateReviewNotice: true
      }
    };
  }

  function applyWorkbookPrefill(data) {
    const wasIntentionallyBlank =
      data.prefillRevision === PREFILL_REVISION &&
      data.items.length === 0 &&
      data.savingsJars.length === 0;
    const existingSourceKeys = new Set(
      data.items.map((item) => item.sourceKey).filter(Boolean)
    );
    const itemSignature = (item) =>
      [
        String(item.name || "").trim().toLocaleLowerCase("nl-NL"),
        item.type,
        numberValue(item.amount, 0).toFixed(2),
        item.account
      ].join("|");
    const existingItemSignatures = new Set(data.items.map(itemSignature));

    const addMissingItems = (items) => {
      let addedCount = 0;
      items.forEach((item) => {
        const signature = itemSignature(item);
        if (
          !existingSourceKeys.has(item.sourceKey) &&
          !existingItemSignatures.has(signature)
        ) {
          data.items.push({ ...item });
          existingSourceKeys.add(item.sourceKey);
          existingItemSignatures.add(signature);
          addedCount += 1;
        }
      });
      return addedCount;
    };

    if (data.prefillRevision !== PREFILL_REVISION) {
      addMissingItems(WORKBOOK_PREFILL.items);

      const existingJarKeys = new Set(
        data.savingsJars.map((jar) => jar.sourceKey).filter(Boolean)
      );
      WORKBOOK_PREFILL.savingsJars.forEach((jar) => {
        if (!existingJarKeys.has(jar.sourceKey)) {
          data.savingsJars.push({ ...jar });
        }
      });

      data.prefillRevision = PREFILL_REVISION;
      data.settings.dateReviewNotice = true;
    }

    if (data.prefillAdditionsRevision !== PREFILL_ADDITIONS_REVISION) {
      if (!wasIntentionallyBlank) {
        const addedCount = addMissingItems(
          WORKBOOK_PREFILL.items.filter((item) =>
            PREFILL_ADDITION_SOURCE_KEYS.has(item.sourceKey)
          )
        );
        if (addedCount > 0) {
          data.settings.dateReviewNotice = true;
        }
      }
      data.prefillAdditionsRevision = PREFILL_ADDITIONS_REVISION;
    }

    data.version = 2;
    return data;
  }

  function getDefaultData() {
    return applyWorkbookPrefill(getBaseData());
  }

  function getBlankData() {
    const data = getBaseData();
    data.prefillRevision = PREFILL_REVISION;
    data.prefillAdditionsRevision = PREFILL_ADDITIONS_REVISION;
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

    const rawSettings =
      rawData.settings && typeof rawData.settings === "object" ? rawData.settings : {};
    const extraIncomeDateValue = rawSettings.extraIncomeDate || rawSettings.rbcTransferDate;
    const extraIncomeName = String(
      rawSettings.extraIncomeName ||
        defaults.settings.extraIncomeName
    ).trim();

    return applyWorkbookPrefill({
      version: 2,
      prefillRevision: rawData.prefillRevision ? String(rawData.prefillRevision) : "",
      prefillAdditionsRevision: rawData.prefillAdditionsRevision
        ? String(rawData.prefillAdditionsRevision)
        : "",
      hasSetBalances: Boolean(rawData.hasSetBalances),
      balances: {
        rabobank: numberValue(rawData.balances && rawData.balances.rabobank, 0),
        bunq: numberValue(rawData.balances && rawData.balances.bunq, 0)
      },
      items,
      savingsJars,
      paidOccurrences,
      settings: {
        extraIncomeEnabled: Boolean(
          rawSettings.extraIncomeEnabled !== undefined
            ? rawSettings.extraIncomeEnabled
            : rawSettings.rbcTransferEnabled
        ),
        extraIncomeName: extraIncomeName || defaults.settings.extraIncomeName,
        extraIncomeAmount: Math.max(
          0,
          numberValue(
            rawSettings.extraIncomeAmount !== undefined
              ? rawSettings.extraIncomeAmount
              : rawSettings.rbcTransferAmount,
            defaults.settings.extraIncomeAmount
          )
        ),
        extraIncomeDate: parseDateInput(extraIncomeDateValue)
          ? extraIncomeDateValue
          : defaults.settings.extraIncomeDate,
        extraIncomeAccount: ["rabobank", "bunq"].includes(rawSettings.extraIncomeAccount)
          ? rawSettings.extraIncomeAccount
          : defaults.settings.extraIncomeAccount,
        dateReviewNotice:
          typeof rawSettings.dateReviewNotice === "boolean"
            ? rawSettings.dateReviewNotice
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

    const extraIncomeDate = parseDateInput(state.data.settings.extraIncomeDate);
    if (
      state.data.settings.extraIncomeEnabled &&
      state.data.settings.extraIncomeAmount > 0 &&
      isWithinCycle(extraIncomeDate, cycle)
    ) {
      entries.push({
        id: "extra-income",
        name: state.data.settings.extraIncomeName,
        type: "income",
        amount: state.data.settings.extraIncomeAmount,
        account: state.data.settings.extraIncomeAccount,
        cadence: "once",
        date: state.data.settings.extraIncomeDate,
        occurrence: extraIncomeDate,
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
    const cycleIncomeTotal = entries
      .filter((entry) => entry.type === "income")
      .reduce((total, entry) => total + entry.amount, 0);
    const cycleExpenseTotal = entries
      .filter((entry) => entry.type === "expense")
      .reduce((total, entry) => total + entry.amount, 0);
    const cycleSavingsContribution = entries
      .filter((entry) => entry.type === "saving")
      .reduce((total, entry) => total + entry.amount, 0);
    const cycleOutflowTotal = cycleExpenseTotal + cycleSavingsContribution;
    const cycleSpendable = cycleIncomeTotal - cycleOutflowTotal;
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
    const savingsBalance = state.data.savingsJars.reduce(
      (total, jar) => total + numberValue(jar.balance, 0),
      0
    );

    return {
      cycle,
      entries,
      unpaidEntries,
      cycleIncomeTotal,
      cycleExpenseTotal,
      cycleSavingsContribution,
      cycleOutflowTotal,
      cycleSpendable,
      balances,
      forecastByAccount,
      outgoingByAccount,
      incomeByAccount,
      outstandingOutgoings,
      expectedIncome,
      safeToSpend,
      savingsBalance,
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
            ? "extra inkomen · " + ACCOUNT_LABELS[entry.account]
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
    const forecastParts = [];
    if (income) {
      forecastParts.push("+" + formatMoney(income) + " nog te ontvangen");
    }
    if (outgoing) {
      forecastParts.push("−" + formatMoney(outgoing) + " nog uitgaand");
    }
    const forecastText = forecastParts.length
      ? forecastParts.join(" · ")
      : "geen openstaande posten";

    return (
      '<article class="account-card">' +
      '<div class="account-card-top"><h3>' +
      ACCOUNT_LABELS[account] +
      '</h3><button class="text-button" type="button" data-action="open-balance-modal">Wijzig</button></div>' +
      '<p class="account-label">' +
      "Huidig saldo" +
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

  function renderPaydayMonthSummary(calculation) {
    return (
      '<section class="payday-summary" aria-labelledby="payday-summary-title">' +
      '<div class="payday-summary-heading"><div><p class="eyebrow">Overzicht per betaalmaand</p><h2 id="payday-summary-title">Van salaris tot salaris</h2><p class="section-copy">Volledige planning voor ' +
      escapeHtml(formatCycle(calculation.cycle)) +
      ". Reeds verwerkte posten blijven in deze maandtotalen staan.</p></div><span class=\"cycle-pill\">" +
      escapeHtml(formatCycle(calculation.cycle)) +
      "</span></div>" +
      '<div class="payday-summary-grid">' +
      '<article class="payday-total-card"><p>Totale inkomsten</p><strong>' +
      formatMoney(calculation.cycleIncomeTotal) +
      '</strong><small>alle inkomsten in deze betaalmaand</small></article>' +
      '<article class="payday-total-card"><p>Totale uitgaven</p><strong>' +
      formatMoney(calculation.cycleExpenseTotal) +
      '</strong><small>vaste lasten en overige uitgaven</small></article>' +
      '<article class="payday-total-card"><p>Spaarinleg deze betaalmaand</p><strong>' +
      formatMoney(calculation.cycleSavingsContribution) +
      '</strong><small>totaal in spaarpotjes: ' +
      formatMoney(calculation.savingsBalance) +
      "</small></article>" +
      '<article class="payday-total-card is-highlight"><p>Vrij te besteden</p><strong class="' +
      valueClass(calculation.cycleSpendable) +
      '">' +
      formatMoney(calculation.cycleSpendable) +
      '</strong><small>na uitgaven en spaarinleg: ' +
      formatMoney(calculation.cycleOutflowTotal) +
      "</small></article>" +
      "</div></section>"
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
      '<header class="page-header"><div><p class="eyebrow">Betaalmaand</p><h1>' +
      greeting +
      ".</h1>" +
      '<p class="subtle">Van ' +
      escapeHtml(formatCycle(calculation.cycle)) +
      ". Je volgende salarisdag is " +
      escapeHtml(formatFullDate(calculation.cycle.end)) +
      ".</p></div>" +
      '<div class="header-actions"><button class="button button-secondary" type="button" data-action="open-balance-modal">Saldi bijwerken</button><button class="button button-primary" type="button" data-action="open-item-modal">+ Post toevoegen</button></div></header>' +
      quickStart +
      renderPaydayMonthSummary(calculation) +
      '<div class="hero-grid"><article class="hero-card"><p class="hero-label">Actueel beschikbaar tot je volgende salaris</p><p class="hero-amount ' +
      safeClass +
      '">' +
      formatMoney(calculation.safeToSpend) +
      '</p><div class="hero-footer"><strong>' +
      calculation.cycle.daysLeft +
      " " +
      (calculation.cycle.daysLeft === 1 ? "dag" : "dagen") +
      ' te gaan</strong><span class="hero-dot"></span><span>op basis van je saldi en openstaande posten</span></div></article>' +
      '<article class="cycle-card"><div><p>Deze betaalmaand</p><strong>' +
      escapeHtml(formatCycle(calculation.cycle)) +
      '</strong><p class="cycle-days">' +
      calculation.cycle.daysLeft +
      "<span>dagen over</span></p></div><div><div class=\"progress-track\"><div class=\"progress-value\" style=\"width: " +
      calculation.cycle.elapsedPercent +
      '%\"></div></div><small>' +
      calculation.cycle.elapsedPercent +
      "% van je betaalmaand is voorbij</small></div></article></div>" +
      '<div class="budget-grid"><article class="budget-card"><p>Actueel per dag</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(calculation.perDay) +
      "</strong><small>tot je volgende salaris</small></article>" +
      '<article class="budget-card"><p>Actueel per 2 dagen</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(calculation.perTwoDays) +
      "</strong><small>twee keer je dagbudget</small></article>" +
      '<article class="budget-card"><p>Actueel per week</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(calculation.perWeek) +
      "</strong><small>zeven keer je dagbudget</small></article></div>" +
      '<div class="content-grid"><section class="panel"><header class="panel-header"><div><h2>Nog te betalen of over te boeken</h2><p class="section-copy">' +
      formatMoney(calculation.outstandingOutgoings) +
      " staat nog gepland.</p></div><button class=\"text-button\" type=\"button\" data-action=\"goto-planning\">Alles bekijken</button></header><div class=\"panel-body\">" +
      renderOverviewRows(outgoingEntries, "Nog geen uitgaven of spaaroverboekingen in deze betaalmaand.") +
      "</div></section>" +
      '<div class="stack"><section class="panel"><header class="panel-header"><div><h2>Nog te ontvangen inkomsten</h2><p class="section-copy">' +
      formatMoney(calculation.expectedIncome) +
      " staat nog open.</p></div></header><div class=\"panel-body\">" +
      renderOverviewRows(incomeEntries, "Nog geen verwachte inkomsten ingepland.") +
      "</div></section>" +
      '<section class="panel"><header class="panel-header"><div><h2>Rekeningen</h2><p class="section-copy">Actueel saldo en verwachte eindstand.</p></div></header><div class="panel-body"><div class="account-grid">' +
      renderAccountCard("rabobank", calculation) +
      renderAccountCard("bunq", calculation) +
      "</div></div></section>" +
      '<section class="panel extra-income-card"><div class="extra-income-heading"><div><h2>Extra inkomen</h2><p>Tel een eenmalige meevaller of andere extra inkomst mee in deze betaalmaand.</p></div><button class="text-button" type="button" data-action="goto-settings">Bewerken</button></div><div class="switch-row"><div class="switch-copy"><strong>' +
      escapeHtml(state.data.settings.extraIncomeName) +
      ': ' +
      formatMoney(state.data.settings.extraIncomeAmount) +
      '</strong><small>Verwacht op ' +
      escapeHtml(
        parseDateInput(state.data.settings.extraIncomeDate)
          ? formatShortDate(parseDateInput(state.data.settings.extraIncomeDate))
          : "nog kiezen"
      ) +
      ' · naar ' +
      escapeHtml(ACCOUNT_LABELS[state.data.settings.extraIncomeAccount]) +
      '</small></div><button class="switch ' +
      (state.data.settings.extraIncomeEnabled ? "is-on" : "") +
      '" type="button" role="switch" aria-checked="' +
      (state.data.settings.extraIncomeEnabled ? "true" : "false") +
      '" aria-label="Extra inkomen meetellen" data-action="toggle-extra-income"><span></span></button></div></section></div></div>' +
      "</section>"
    );
  }

  function renderPlanningRow(entry, cycle) {
    const isIncome = entry.type === "income";
    const isSaving = entry.type === "saving";
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
        (isIncome
          ? entry.paid
            ? "Ontvangen"
            : "Ontvangen?"
          : isSaving
            ? entry.paid
              ? "Overgeboekt"
              : "Overgeboekt?"
            : entry.paid
              ? "Betaald"
              : "Betaald?") +
        "</button>";
    const controls = entry.virtual
      ? paidButton
      : paidButton +
        '<button class="icon-button" title="Bewerk post" aria-label="Bewerk ' +
        escapeHtml(entry.name) +
        '" type="button" data-action="edit-item" data-id="' +
        itemId +
        '">' + ICONS.edit + '</button><button class="icon-button" title="Verwijder post" aria-label="Verwijder ' +
        escapeHtml(entry.name) +
        '" type="button" data-action="delete-item" data-id="' +
        itemId +
        '">' + ICONS.remove + '</button>';

    return (
      '<article class="planning-row planning-row-' +
      (isIncome ? "income" : "outgoing") +
      " " +
      (entry.paid ? "is-paid" : "") +
      '">' +
      '<div class="planning-date"><label for="date-' +
      itemId +
      '">' +
      (isIncome ? "Ontvangstdatum" : isSaving ? "Overboekingsdatum" : "Betaaldatum") +
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
      ACCOUNT_LABELS[entry.account] +
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

  function planningEntryCount(count) {
    return count + " " + (count === 1 ? "post" : "posten");
  }

  function renderPlanningGroup(options) {
    const rows = options.entries.length
      ? '<div class="planning-list">' +
        options.entries
          .map((entry) => renderPlanningRow(entry, options.cycle))
          .join("") +
        "</div>"
      : '<div class="planning-group-empty"><p>' +
        escapeHtml(options.emptyCopy) +
        '</p><button class="button button-secondary button-small" type="button" data-action="open-item-modal">Post toevoegen</button></div>';
    const total = options.entries.reduce(
      (sum, entry) => sum + numberValue(entry.amount, 0),
      0
    );

    return (
      '<section class="planning-group planning-group-' +
      options.tone +
      '"><header class="planning-group-header"><div class="planning-group-title"><span class="planning-group-icon" aria-hidden="true">' +
      ICONS[options.icon] +
      '</span><div><p class="planning-group-kicker">' +
      escapeHtml(options.kicker) +
      "</p><h2>" +
      escapeHtml(options.title) +
      '</h2><p class="section-copy">' +
      escapeHtml(options.copy) +
      '</p></div></div><div class="planning-group-total"><span>' +
      planningEntryCount(options.entries.length) +
      "</span><strong>" +
      formatMoney(total) +
      "</strong></div></header>" +
      rows +
      "</section>"
    );
  }

  function renderPlanning(calculation) {
    const incomeEntries = calculation.entries.filter((entry) => entry.type === "income");
    const outgoingEntries = calculation.entries.filter((entry) => entry.type !== "income");
    const incomeGroup = renderPlanningGroup({
      title: "Inkomsten",
      kicker: "Binnenkomend",
      copy: "Salaris, teruggaven en extra inkomen in deze betaalmaand.",
      emptyCopy: "Er staan nog geen inkomsten in deze betaalmaand.",
      tone: "income",
      icon: "income",
      entries: incomeEntries,
      cycle: calculation.cycle
    });
    const outgoingGroup = renderPlanningGroup({
      title: "Uitgaven & sparen",
      kicker: "Uitgaand",
      copy: "Vaste lasten, losse uitgaven en geplande spaaroverboekingen.",
      emptyCopy: "Er staan nog geen uitgaven of spaaroverboekingen in deze betaalmaand.",
      tone: "outgoing",
      icon: "outgoing",
      entries: outgoingEntries,
      cycle: calculation.cycle
    });

    return (
      '<section><header class="page-header"><div><p class="eyebrow">Betaal-, overboekings- en ontvangstdatums</p><h1>Planning</h1><p class="subtle">Alle posten tussen ' +
      escapeHtml(formatCycle(calculation.cycle)) +
      '. Inkomsten en uitgaven staan apart; binnen ieder deel blijft alles op datum gesorteerd.</p></div><div class="header-actions"><span class="cycle-pill">' +
      escapeHtml(formatCycle(calculation.cycle)) +
      '</span><button class="button button-primary" type="button" data-action="open-item-modal">+ Nieuwe post</button></div></header><div class="planning-groups">' +
      incomeGroup +
      outgoingGroup +
      '</div><aside class="planning-tip"><div><strong>Voorkom dubbel tellen</strong><p>Werk eerst je echte rekeningsaldo bij zodra iets is afgeschreven, overgeboekt of ontvangen. Markeer de post daarna als verwerkt.</p></div></aside></section>'
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
      '<article class="jar-card"><div class="jar-icon" aria-hidden="true">' + ICONS.wallet + '</div><h2>' +
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
      '">' + ICONS.edit + '</button><button class="icon-button" aria-label="Verwijder ' +
      escapeHtml(jar.name) +
      '" type="button" data-action="delete-jar" data-id="' +
      escapeHtml(jar.id) +
      '">' + ICONS.remove + '</button></div></div></article>'
    );
  }

  function renderJars(calculation) {
    const jarContent = state.data.savingsJars.length
      ? '<div class="jars-grid">' + state.data.savingsJars.map(renderJarCard).join("") + "</div>"
      : '<section class="panel"><div class="empty-state"><div><p>Maak een potje voor ieder spaardoel dat je apart wilt zien. Het geld in je potjes telt niet mee als vrij besteedbaar.</p><button class="button button-primary" type="button" data-action="open-jar-modal">Eerste spaarpotje</button></div></div></section>';

    return (
      '<section><header class="page-header"><div><p class="eyebrow">Bunq spaardoelen</p><h1>Spaarpotjes</h1><p class="subtle">Je potjes blijven bewust apart van je besteedbare geld. Totaal in spaarpotjes: ' +
      formatMoney(calculation.savingsBalance) +
      ".</p></div><div class=\"header-actions\"><button class=\"button button-primary\" type=\"button\" data-action=\"open-jar-modal\">+ Spaarpotje</button></div></header>" +
      jarContent +
      '<div class="section-heading"><div><h2>Geplande spaaroverboekingen</h2><p class="section-copy">Deze worden in je planning afgetrokken van je besteedbare geld.</p></div><button class="text-button" type="button" data-action="goto-planning">Planning openen</button></div>' +
      '<section class="panel"><div class="panel-body">' +
      renderOverviewRows(
        calculation.unpaidEntries.filter((entry) => entry.type === "saving"),
        "Er staan geen geplande spaaroverboekingen in deze betaalmaand."
      ) +
      "</div></section></section>"
    );
  }

  function renderSettings(calculation) {
    const extraIncomeDate = parseDateInput(state.data.settings.extraIncomeDate);
    const prefillNotice = state.data.settings.dateReviewNotice
      ? '<section class="quick-start"><div><strong>Werkbladgegevens zijn bijgewerkt</strong><p>Je inkomsten, uitgaven en spaarinleg zijn bijgewerkt vanuit het financiële werkblad. Controleer bedragen en datums in Planning; wijzigingen in abonnementen worden niet automatisch bijgewerkt.</p></div><button class="button button-secondary button-small" type="button" data-action="dismiss-prefill-notice">Begrepen</button></section>'
      : "";
    return (
      '<section><header class="page-header"><div><p class="eyebrow">Privé & offline</p><h1>Instellingen</h1><p class="subtle">Je gegevens worden alleen lokaal in deze browser opgeslagen. Er is geen bankkoppeling en geen account nodig.</p></div></header>' +
      prefillNotice +
      '<div class="settings-grid"><section class="panel settings-panel"><h2>Actuele saldi</h2><p class="section-copy">Vul in wat er nu werkelijk op je rekeningen staat.</p><form id="settings-balance-form"><div class="field-grid"><div class="form-field"><label for="setting-rabobank">Rabobank</label><input id="setting-rabobank" name="rabobank" type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.balances.rabobank) +
      '"></div><div class="form-field"><label for="setting-bunq">Bunq besteedbaar</label><input id="setting-bunq" name="bunq" type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.balances.bunq) +
      '"></div></div><div class="form-actions"><button class="button button-primary" type="submit">Saldi opslaan</button></div></form></section>' +
      '<section class="panel settings-panel"><h2>Extra inkomen</h2><p class="section-copy">Stel een eenmalige extra inkomst in. Wanneer je die inschakelt, verschijnt ze bij de inkomsten en in alle overzichtstotalen.</p><form id="extra-income-form"><div class="field-grid"><div class="form-field full"><label for="extra-income-name">Naam</label><input id="extra-income-name" name="extraIncomeName" required maxlength="80" placeholder="Bijvoorbeeld: teruggave of bonus" value="' +
      escapeHtml(state.data.settings.extraIncomeName) +
      '"></div><div class="form-field"><label for="extra-income-amount">Bedrag</label><input id="extra-income-amount" name="extraIncomeAmount" required type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.settings.extraIncomeAmount) +
      '"></div><div class="form-field"><label for="extra-income-date">Verwachte datum</label><input id="extra-income-date" name="extraIncomeDate" required type="date" value="' +
      escapeHtml(extraIncomeDate ? dateInputValue(extraIncomeDate) : dateInputValue(new Date())) +
      '"></div><div class="form-field"><label for="extra-income-account">Naar rekening</label><select id="extra-income-account" name="extraIncomeAccount"><option value="rabobank"' +
      (state.data.settings.extraIncomeAccount === "rabobank" ? " selected" : "") +
      '>Rabobank</option><option value="bunq"' +
      (state.data.settings.extraIncomeAccount === "bunq" ? " selected" : "") +
      '>Bunq</option></select></div><div class="form-field"><label for="extra-income-enabled">Meetellen</label><select id="extra-income-enabled" name="extraIncomeEnabled"><option value="false"' +
      (!state.data.settings.extraIncomeEnabled ? " selected" : "") +
      '>Nee, nog niet</option><option value="true"' +
      (state.data.settings.extraIncomeEnabled ? " selected" : "") +
      '>Ja, in deze betaalmaand</option></select></div></div><div class="form-actions"><button class="button button-primary" type="submit">Extra inkomen opslaan</button></div></form></section>' +
      '<section class="panel settings-panel full"><h2>Zo berekent de app je budget</h2><ul class="info-list"><li><span>1</span><div>De betaalmaand start op de 25e. Als de 25e op zaterdag of zondag valt, start hij op de vrijdag ervoor.</div></li><li><span>2</span><div>Het maandoverzicht telt alle inkomsten, uitgaven en spaarinleg in die volledige betaalmaand mee, ook als ze al zijn verwerkt.</div></li><li><span>3</span><div>Het actuele bedrag gebruikt je Rabobank- en Bunq-saldi, trekt alleen openstaande uitgaven en spaaroverboekingen af en telt nog te ontvangen inkomsten erbij op.</div></li><li><span>4</span><div>Je spaarpotjes blijven apart. Hun ingevulde saldi tellen niet mee als vrij besteedbaar geld.</div></li></ul></section>' +
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
      const isActive = button.dataset.view === state.activeView;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function modalShell(title, copy, body) {
    return (
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">' +
      escapeHtml(title) +
      "</h2>" +
      (copy ? '<p class="section-copy">' + escapeHtml(copy) + "</p>" : "") +
      '</div><button class="modal-close" type="button" data-action="close-modal" aria-label="Sluiten">' + ICONS.close + '</button></header><div class="modal-body">' +
      body +
      "</div></div>"
    );
  }

  function showBalancesModal() {
    const body =
      '<form id="balance-form"><div class="field-grid"><div class="form-field"><label for="modal-rabobank">Rabobank</label><input id="modal-rabobank" name="rabobank" type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.balances.rabobank) +
      '"><span class="helper-copy">Voor je vaste lasten.</span></div><div class="form-field"><label for="modal-bunq">Bunq besteedbaar</label><input id="modal-bunq" name="bunq" type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.balances.bunq) +
      '"><span class="helper-copy">Zonder je losse spaarpotjes.</span></div></div><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Annuleren</button><button class="button button-primary" type="submit">Saldi opslaan</button></div></form>';
    modalRoot.innerHTML = modalShell(
      "Actuele saldi",
      "Vul in wat er op dit moment daadwerkelijk op je rekeningen staat.",
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
      ">Salarisdag</option></select></div><div class=\"form-field\"><label for=\"item-date\">Betaal-, overboekings- of ontvangstdatum</label><input id=\"item-date\" name=\"date\" required type=\"date\" value=\"" +
      escapeHtml(selectedDate) +
      '"></div><div class="form-field"><label for="item-jar">Spaarpotje</label><select id="item-jar" name="jarId">' +
      jarsOptions +
      '</select></div></div><p class="helper-copy" style="margin-top: 16px;">Voor maandelijkse posten onthoudt de app de dag van de maand. Het gekoppelde potje is alleen ter herkenning; werk het werkelijke saldo van het potje zelf bij.</p><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Annuleren</button><button class="button button-primary" type="submit">' +
      (existing ? "Wijzigingen opslaan" : "Post toevoegen") +
      "</button></div></form>";

    modalRoot.innerHTML = modalShell(
      existing ? "Post bewerken" : "Nieuwe post",
      "Plan alles wat je deze betaalmaand verwacht.",
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
      '"></div><div class="form-field"><label for="jar-balance">Nu in het potje</label><input id="jar-balance" name="balance" required type="text" inputmode="decimal" value="' +
      escapeHtml(existing ? existing.balance : "") +
      '"></div><div class="form-field"><label for="jar-target">Doelbedrag (optioneel)</label><input id="jar-target" name="target" type="text" inputmode="decimal" value="' +
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
    if (action === "toggle-extra-income") {
      const extraIncomeDate = parseDateInput(state.data.settings.extraIncomeDate);
      const cycle = getBudgetCycle();
      if (
        !state.data.settings.extraIncomeEnabled &&
        (!state.data.settings.extraIncomeName ||
          state.data.settings.extraIncomeAmount <= 0 ||
          !isWithinCycle(extraIncomeDate, cycle))
      ) {
        setActiveView("settings");
        showToast("Stel eerst een bedrag en datum binnen deze betaalmaand in.");
        return;
      }
      state.data.settings.extraIncomeEnabled = !state.data.settings.extraIncomeEnabled;
      commit(
        state.data.settings.extraIncomeEnabled
          ? "Het extra inkomen staat nu in je overzicht."
          : "Het extra inkomen wordt niet meer meegerekend."
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

    if (!["balance-form", "settings-balance-form", "item-form", "jar-form", "extra-income-form"].includes(form.id)) {
      return;
    }

    event.preventDefault();
    const formData = new FormData(form);

    if (form.id === "balance-form" || form.id === "settings-balance-form") {
      state.data.balances.rabobank = numberValue(formData.get("rabobank"), 0);
      state.data.balances.bunq = numberValue(formData.get("bunq"), 0);
      state.data.hasSetBalances = true;
      closeModal();
      commit("Je actuele saldi zijn bijgewerkt.");
      return;
    }

    if (form.id === "extra-income-form") {
      const extraIncomeName = String(formData.get("extraIncomeName") || "").trim();
      const extraIncomeAmount = Math.max(
        0,
        numberValue(formData.get("extraIncomeAmount"), 0)
      );
      const extraIncomeDate = parseDateInput(formData.get("extraIncomeDate"));
      const extraIncomeAccount = String(formData.get("extraIncomeAccount") || "");
      const extraIncomeEnabled = formData.get("extraIncomeEnabled") === "true";
      if (
        !extraIncomeName ||
        extraIncomeAmount <= 0 ||
        !extraIncomeDate ||
        !["rabobank", "bunq"].includes(extraIncomeAccount)
      ) {
        showToast("Vul een naam, positief bedrag, rekening en geldige datum in.");
        return;
      }
      if (extraIncomeEnabled && !isWithinCycle(extraIncomeDate, getBudgetCycle())) {
        showToast("Kies een datum binnen deze betaalmaand om het inkomen mee te tellen.");
        return;
      }
      state.data.settings.extraIncomeEnabled = extraIncomeEnabled;
      state.data.settings.extraIncomeName = extraIncomeName;
      state.data.settings.extraIncomeAmount = extraIncomeAmount;
      state.data.settings.extraIncomeDate = dateInputValue(extraIncomeDate);
      state.data.settings.extraIncomeAccount = extraIncomeAccount;
      commit(
        extraIncomeEnabled
          ? "Het extra inkomen is opgeslagen en staat in je overzicht."
          : "Het extra inkomen is opgeslagen."
      );
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
          ? "De maandelijkse datum is aangepast."
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
