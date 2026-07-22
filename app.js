(() => {
  "use strict";

  const STORAGE_KEY = "mijn-geld-data-v1";
  const DEFAULT_ACCOUNT_LABELS = {
    rabobank: "Rekening 1",
    bunq: "Rekening 2"
  };
  const LEGACY_ACCOUNT_LABELS = {
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
  const dateTimeFormatter = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");
  const toast = document.getElementById("toast");
  const updatePrompt = document.getElementById("update-prompt");
  const appShell = document.querySelector(".app-shell");
  const APP_VERSION = "v14";
  let activePaydayDay = 25;
  const initialData = loadData();
  activePaydayDay = initialData.settings.paydayDay;

  const state = {
    data: initialData,
    activeView: "dashboard",
    deferredInstallPrompt: null,
    waitingServiceWorker: null,
    serviceWorkerRegistration: null,
    isCheckingForUpdates: false,
    isUpdating: false,
    modalReturnFocus: null,
    updatePromptSnoozedUntil: 0,
    lastRenderedDate: ""
  };
  if (migrateLegacyPaidOccurrences(state.data, state.data.settings.paydayDay)) {
    saveData();
  }

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
        balancesUpdatedAt: "",
        paydayDay: 25,
        accountNames: { ...DEFAULT_ACCOUNT_LABELS }
      }
    };
  }

  function getDefaultData() {
    return getBaseData();
  }

  function getBlankData() {
    return getBaseData();
  }

  function numberValue(value, fallback) {
    const normalized = String(value === undefined || value === null ? "" : value)
      .trim()
      .replace(",", ".");
    if (!normalized) {
      return fallback;
    }
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
  }

  function requiredNumberValue(value) {
    const normalized = String(value === undefined || value === null ? "" : value)
      .trim()
      .replace(/\s/g, "")
      .replace("€", "");
    if (!normalized) {
      return null;
    }
    const decimal =
      normalized.includes(",") && normalized.includes(".")
        ? normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
          ? normalized.replace(/\./g, "").replace(",", ".")
          : normalized.replace(/,/g, "")
        : normalized.replace(",", ".");
    const parsed = Number(decimal);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function isValidBackupPayload(value) {
    return Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value.balances &&
        typeof value.balances === "object" &&
        Array.isArray(value.items) &&
        Array.isArray(value.savingsJars) &&
        value.settings &&
        typeof value.settings === "object"
    );
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
    const legacyAccountNames =
      Boolean(rawData.hasSetBalances) ||
      items.length > 0 ||
      savingsJars.length > 0;
    const extraIncomeDateValue = rawSettings.extraIncomeDate || rawSettings.rbcTransferDate;
    const extraIncomeName = String(
      rawSettings.extraIncomeName ||
        defaults.settings.extraIncomeName
    ).trim();

    return {
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
        balancesUpdatedAt:
          typeof rawSettings.balancesUpdatedAt === "string" &&
          !Number.isNaN(Date.parse(rawSettings.balancesUpdatedAt))
            ? rawSettings.balancesUpdatedAt
            : "",
        paydayDay: Math.min(
          31,
          Math.max(1, Math.round(numberValue(rawSettings.paydayDay, 25)))
        ),
        accountNames: {
          rabobank:
            String(rawSettings.accountNames && rawSettings.accountNames.rabobank || "").trim() ||
            (legacyAccountNames
              ? LEGACY_ACCOUNT_LABELS.rabobank
              : DEFAULT_ACCOUNT_LABELS.rabobank),
          bunq:
            String(rawSettings.accountNames && rawSettings.accountNames.bunq || "").trim() ||
            (legacyAccountNames
              ? LEGACY_ACCOUNT_LABELS.bunq
              : DEFAULT_ACCOUNT_LABELS.bunq)
        }
      }
    };
  }

  function loadData() {
    try {
      const data = normalizeData(JSON.parse(window.localStorage.getItem(STORAGE_KEY)));
      const extraIncomeDate = parseDateInput(data.settings.extraIncomeDate);
      if (
        data.settings.extraIncomeEnabled &&
        !isWithinCycle(extraIncomeDate, getBudgetCycle(undefined, data.settings.paydayDay))
      ) {
        data.settings.extraIncomeEnabled = false;
      }
      return data;
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

  function paydayForMonth(year, month, paydayDay) {
    const selectedDay = clampDay(year, month, paydayDay || activePaydayDay);
    const payday = createDate(year, month, selectedDay);
    const weekday = payday.getDay();

    if (weekday === 6) {
      payday.setDate(payday.getDate() - 1);
      return payday;
    }
    if (weekday === 0) {
      payday.setDate(payday.getDate() - 2);
      return payday;
    }
    return payday;
  }

  function getBudgetCycle(referenceDate, paydayDay) {
    const selectedPaydayDay = paydayDay || activePaydayDay;
    const reference = referenceDate
      ? createDate(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate()
        )
      : createDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const paydayCandidates = [];
    for (let monthOffset = -2; monthOffset <= 2; monthOffset += 1) {
      paydayCandidates.push(
        paydayForMonth(
          reference.getFullYear(),
          reference.getMonth() + monthOffset,
          selectedPaydayDay
        )
      );
    }
    paydayCandidates.sort((first, second) => first - second);
    const start = paydayCandidates.filter((candidate) => candidate <= reference).pop();
    const end = paydayCandidates.find((candidate) => candidate > reference);

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

  function occurrencesForItem(item, cycle) {
    if (item.cadence === "once") {
      const date = parseDateInput(item.date);
      return isWithinCycle(date, cycle) ? [date] : [];
    }

    if (item.cadence === "payday") {
      return [cycle.start];
    }

    const occurrences = [];
    let year = cycle.start.getFullYear();
    let month = cycle.start.getMonth();
    for (let index = 0; index < 4; index += 1) {
      const occurrence = createDate(year, month, clampDay(year, month, item.dayOfMonth));
      if (occurrence >= cycle.end) {
        break;
      }
      if (isWithinCycle(occurrence, cycle)) {
        occurrences.push(occurrence);
      }
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return occurrences;
  }

  function occurrenceForItem(item, cycle) {
    return occurrencesForItem(item, cycle)[0] || null;
  }

  function paidKey(cycle, itemId, occurrence) {
    return dateInputValue(occurrence || cycle.start) + ":" + itemId;
  }

  function occurrenceIsPaid(cycle, itemId, occurrence, allowLegacyKey) {
    const occurrenceKey = paidKey(cycle, itemId, occurrence);
    const legacyKey = paidKey(cycle, itemId);
    return Boolean(
      state.data.paidOccurrences[occurrenceKey] ||
        (allowLegacyKey && state.data.paidOccurrences[legacyKey])
    );
  }

  function migrateLegacyPaidOccurrences(data, paydayDay) {
    let changed = false;
    const items = new Map(data.items.map((item) => [item.id, item]));
    Object.keys(data.paidOccurrences).forEach((key) => {
      if (!data.paidOccurrences[key]) {
        return;
      }
      const match = /^(\d{4}-\d{2}-\d{2}):(.*)$/.exec(key);
      if (!match) {
        return;
      }
      const markerDate = parseDateInput(match[1]);
      const itemId = match[2];
      if (!markerDate) {
        return;
      }
      const legacyCycle = getBudgetCycle(markerDate, paydayDay);
      if (dateInputValue(legacyCycle.start) !== match[1]) {
        return;
      }
      let occurrence = null;
      if (itemId === "extra-income") {
        const date = parseDateInput(data.settings.extraIncomeDate);
        occurrence = isWithinCycle(date, legacyCycle) ? date : null;
      } else {
        const item = items.get(itemId);
        occurrence = item ? occurrenceForItem(item, legacyCycle) : null;
      }
      if (!occurrence) {
        return;
      }
      const occurrenceKey = paidKey(legacyCycle, itemId, occurrence);
      if (!data.paidOccurrences[occurrenceKey]) {
        data.paidOccurrences[occurrenceKey] = true;
        changed = true;
      }
    });
    return changed;
  }

  function clearPaidOccurrences(itemId) {
    Object.keys(state.data.paidOccurrences).forEach((key) => {
      if (key.endsWith(":" + itemId)) {
        delete state.data.paidOccurrences[key];
      }
    });
  }

  function getCycleEntries(cycle) {
    const entries = state.data.items
      .flatMap((item) => {
        const occurrences = occurrencesForItem(item, cycle);
        return occurrences.map((occurrence, index) => ({
          ...item,
          occurrence,
          paid: occurrenceIsPaid(cycle, item.id, occurrence, index === 0),
          virtual: false
        }));
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
        paid: occurrenceIsPaid(cycle, "extra-income", extraIncomeDate, true),
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
      perTwoDays: (safeToSpend / cycle.daysLeft) * Math.min(2, cycle.daysLeft),
      perWeek: (safeToSpend / cycle.daysLeft) * Math.min(7, cycle.daysLeft)
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

  function accountLabel(account) {
    return (
      state.data.settings.accountNames[account] ||
      DEFAULT_ACCOUNT_LABELS[account] ||
      "Rekening"
    );
  }

  function balanceFreshness() {
    const value = state.data.settings.balancesUpdatedAt;
    if (!value) {
      return {
        copy: "Saldi nog niet bijgewerkt",
        datetime: "",
        isStale: true
      };
    }

    const updatedAt = new Date(value);
    const age = Date.now() - updatedAt.getTime();
    return {
      copy: "Saldi bijgewerkt " + dateTimeFormatter.format(updatedAt),
      datetime: updatedAt.toISOString(),
      isStale: age > 7 * 24 * 60 * 60 * 1000
    };
  }

  function dateStatus(date) {
    const today = createDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const difference = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    if (difference < 0) {
      return { copy: "Te laat", tone: "overdue" };
    }
    if (difference === 0) {
      return { copy: "Vandaag", tone: "today" };
    }
    if (difference <= 7) {
      return { copy: "Binnen 7 dagen", tone: "soon" };
    }
    return null;
  }

  function hasNoSetup() {
    return !state.data.hasSetBalances;
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

    const visibleEntries = entries.slice(0, 4);
    const hiddenCount = Math.max(0, entries.length - visibleEntries.length);

    return (
      '<div class="overview-list">' +
      visibleEntries
        .map((entry) => {
          const isIncome = entry.type === "income";
          const status = dateStatus(entry.occurrence);
          const meta = entry.virtual
            ? "extra inkomen · " + accountLabel(entry.account)
            : accountLabel(entry.account) + " · " + TYPE_LABELS[entry.type];
          return (
            '<div class="overview-row">' +
            dateBlock(entry.occurrence) +
            '<div><div class="row-name">' +
            escapeHtml(entry.name) +
            '</div><div class="row-meta">' +
            escapeHtml(meta) +
            (status
              ? ' <span class="due-label due-label-' +
                status.tone +
                '">' +
                escapeHtml(status.copy) +
                "</span>"
              : "") +
            "</div></div>" +
            '<div class="money ' +
            (isIncome ? "positive" : "negative") +
            '">' +
            signedMoney(entry.amount, isIncome) +
            "</div></div>"
          );
        })
        .join("") +
      "</div>" +
      (hiddenCount
        ? '<p class="overview-more">4 van ' +
          entries.length +
          " zichtbaar · nog " +
          hiddenCount +
          (hiddenCount === 1 ? " post" : " posten") +
          " in Planning</p>"
        : "")
    );
  }

  function renderAccountCard(account, calculation) {
    const currentBalance = calculation.balances[account];
    const outgoing = calculation.outgoingByAccount[account];
    const income = calculation.incomeByAccount[account];
    const forecast = calculation.forecastByAccount[account];
    return (
      '<article class="account-card">' +
      '<div class="account-card-top"><h3>' +
      escapeHtml(accountLabel(account)) +
      '</h3><button class="text-button" type="button" data-action="open-balance-modal">Wijzig</button></div>' +
      '<div class="account-forecast"><div><span>Huidig</span><strong class="' +
      valueClass(currentBalance) +
      '">' +
      formatMoney(currentBalance) +
      '</strong></div><span aria-hidden="true">+</span><div><span>Te ontvangen</span><strong class="positive">' +
      formatMoney(income) +
      '</strong></div><span aria-hidden="true">−</span><div><span>Uitgaand</span><strong class="negative">' +
      formatMoney(outgoing) +
      '</strong></div></div><div class="account-detail"><span>Verwachte eindstand</span><strong class="' +
      valueClass(forecast) +
      '">' +
      formatMoney(forecast) +
      "</strong></div></article>"
    );
  }

  function renderPaydayMonthSummary(calculation) {
    return (
      '<section class="payday-summary" aria-labelledby="payday-summary-title">' +
      '<div class="payday-summary-heading"><div><p class="eyebrow">Plan voor de hele betaalmaand</p><h2 id="payday-summary-title">Van salaris tot salaris</h2><p class="section-copy">Alle geplande posten voor ' +
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
      '<article class="payday-total-card is-highlight"><p>Gepland vrij te besteden</p><strong class="' +
      valueClass(calculation.cycleSpendable) +
      '">' +
      formatMoney(calculation.cycleSpendable) +
      '</strong><small>na uitgaven en spaarinleg: ' +
      formatMoney(calculation.cycleOutflowTotal) +
      "</small></article>" +
      "</div></section>"
    );
  }

  function renderSetupGuide() {
    const hasBalances = state.data.hasSetBalances;
    const hasIncome = state.data.items.some((item) => item.type === "income");
    const hasOutgoings = state.data.items.some((item) => item.type !== "income");
    if (hasBalances && hasIncome && hasOutgoings) {
      return "";
    }

    const nextAction = !hasBalances
      ? '<button class="button button-primary" type="button" data-action="open-balance-modal">Saldi invullen</button>'
      : !hasIncome
        ? '<button class="button button-primary" type="button" data-action="open-item-modal" data-type="income">Inkomst toevoegen</button>'
        : '<button class="button button-primary" type="button" data-action="open-item-modal" data-type="expense">Uitgave toevoegen</button>';
    const step = (done, number, title, copy) =>
      '<li class="' +
      (done ? "is-done" : "") +
      '"><span aria-hidden="true">' +
      (done ? "✓" : number) +
      "</span><div><strong>" +
      '<span class="visually-hidden">' +
      (done ? "Voltooid: " : "Nog te doen: ") +
      "</span>" +
      title +
      "</strong><small>" +
      copy +
      "</small></div></li>";

    return (
      '<section class="setup-guide" aria-labelledby="setup-title"><div><p class="eyebrow">Eenmalig instellen</p><h2 id="setup-title">Maak je overzicht compleet</h2><ol>' +
      step(hasBalances, 1, "Actuele saldi", "Wat staat er nu op je rekeningen?") +
      step(hasIncome, 2, "Inkomsten", "Voeg salaris en andere inkomsten toe.") +
      step(hasOutgoings, 3, "Uitgaven & sparen", "Plan vaste lasten en spaarinleg.") +
      "</ol></div>" +
      nextAction +
      "</section>"
    );
  }

  function renderDashboardAlerts(calculation) {
    const alerts = [];
    const negativeAccounts = Object.keys(calculation.forecastByAccount).filter(
      (account) => calculation.forecastByAccount[account] < 0
    );
    const overdue = calculation.unpaidEntries.filter((entry) => {
      const status = dateStatus(entry.occurrence);
      return status && status.tone === "overdue";
    });
    const freshness = balanceFreshness();

    if (state.data.hasSetBalances && negativeAccounts.length) {
      alerts.push(
        '<div class="dashboard-alert is-danger"><strong>Rekening dreigt negatief te worden</strong><span>' +
          negativeAccounts.map((account) => escapeHtml(accountLabel(account))).join(" en ") +
          " komt volgens de openstaande posten onder nul.</span></div>"
      );
    }
    if (overdue.length) {
      alerts.push(
        '<div class="dashboard-alert is-warning"><strong>' +
          overdue.length +
          (overdue.length === 1 ? " openstaande post is te laat" : " openstaande posten zijn te laat") +
          '</strong><button class="text-button" type="button" data-action="goto-planning">Bekijk in Planning</button></div>'
      );
    }
    if (state.data.hasSetBalances && freshness.isStale) {
      alerts.push(
        '<div class="dashboard-alert"><strong>Controleer je saldi</strong><span>' +
          escapeHtml(freshness.copy) +
          '.</span><button class="text-button" type="button" data-action="open-balance-modal">Nu bijwerken</button></div>'
      );
    }

    return alerts.length
      ? '<section class="dashboard-alerts" aria-label="Aandachtspunten">' + alerts.join("") + "</section>"
      : "";
  }

  function renderExtraIncomeDashboard(calculation) {
    const extraIncomeDate = parseDateInput(state.data.settings.extraIncomeDate);
    const isConfigured = state.data.settings.extraIncomeAmount > 0 && extraIncomeDate;
    if (!isConfigured) {
      return (
        '<section class="panel dashboard-action-card"><span class="dashboard-card-icon is-income" aria-hidden="true">' +
        ICONS.income +
        '</span><div><h2>Extra inkomen</h2><p>Voeg een bonus, teruggave of andere eenmalige meevaller toe.</p></div><button class="button button-secondary button-small" type="button" data-action="goto-settings">Instellen</button></section>'
      );
    }

    const entry = calculation.entries.find((item) => item.id === "extra-income");
    const statusCopy = !state.data.settings.extraIncomeEnabled
      ? "Niet meegerekend"
      : entry && entry.paid
        ? "Ontvangen"
        : "Nog te ontvangen";
    return (
      '<section class="panel extra-income-card"><div class="extra-income-heading"><div><p class="eyebrow">Eenmalige meevaller</p><h2>Extra inkomen</h2><p>' +
      escapeHtml(state.data.settings.extraIncomeName) +
      " · " +
      formatMoney(state.data.settings.extraIncomeAmount) +
      '</p></div><button class="text-button" type="button" data-action="goto-settings">Bewerken</button></div><div class="switch-row"><div class="switch-copy"><strong>' +
      escapeHtml(statusCopy) +
      '</strong><small>Verwacht op ' +
      escapeHtml(formatShortDate(extraIncomeDate)) +
      " · naar " +
      escapeHtml(accountLabel(state.data.settings.extraIncomeAccount)) +
      '</small></div><button class="switch ' +
      (state.data.settings.extraIncomeEnabled ? "is-on" : "") +
      '" type="button" role="switch" aria-checked="' +
      (state.data.settings.extraIncomeEnabled ? "true" : "false") +
      '" aria-label="Extra inkomen meetellen" data-action="toggle-extra-income"><span></span></button></div></section>'
    );
  }

  function renderSavingsDashboard(calculation) {
    const jars = state.data.savingsJars;
    const targetedJars = jars.filter((jar) => numberValue(jar.target, 0) > 0);
    const target = targetedJars.reduce(
      (sum, jar) => sum + numberValue(jar.target, 0),
      0
    );
    const savedTowardsTargets = targetedJars.reduce(
      (sum, jar) =>
        sum + Math.min(numberValue(jar.balance, 0), numberValue(jar.target, 0)),
      0
    );
    const progress = target
      ? Math.min(100, Math.round((savedTowardsTargets / target) * 100))
      : 0;
    if (!jars.length) {
      return (
        '<section class="panel dashboard-action-card"><span class="dashboard-card-icon" aria-hidden="true">' +
        ICONS.wallet +
        '</span><div><h2>Spaarpotjes</h2><p>Houd spaardoelen apart van je besteedbare geld.</p></div><button class="button button-secondary button-small" type="button" data-view="jars">Potje maken</button></section>'
      );
    }

    return (
      '<section class="panel savings-summary-card"><div><p class="eyebrow">Apart gehouden</p><h2>Spaarpotjes</h2><p>' +
      jars.length +
      (jars.length === 1 ? " potje" : " potjes") +
      '</p></div><strong>' +
      formatMoney(calculation.savingsBalance) +
      '</strong><div class="jar-progress" role="progressbar" aria-label="Voortgang van alle spaardoelen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
      progress +
      '"><span style="width: ' +
      progress +
      '%"></span></div><button class="text-button" type="button" data-view="jars">Bekijk spaarpotjes</button></section>'
    );
  }

  function renderDashboard(calculation) {
    const outgoingEntries = calculation.unpaidEntries.filter((entry) => entry.type !== "income");
    const incomeEntries = calculation.unpaidEntries.filter((entry) => entry.type === "income");
    const usesActualBalances = !hasNoSetup();
    const available = usesActualBalances
      ? calculation.safeToSpend
      : calculation.cycleSpendable;
    const safeClass = valueClass(available);
    const perDay = available / calculation.cycle.daysLeft;
    const perTwoDays = perDay * Math.min(2, calculation.cycle.daysLeft);
    const perWeek = perDay * Math.min(7, calculation.cycle.daysLeft);
    const totalBalances = calculation.balances.rabobank + calculation.balances.bunq;
    const freshness = balanceFreshness();
    const equationLabel = usesActualBalances
      ? "Saldi " +
        formatMoney(totalBalances) +
        " plus nog te ontvangen " +
        formatMoney(calculation.expectedIncome) +
        " min nog uitgaand " +
        formatMoney(calculation.outstandingOutgoings) +
        " is beschikbaar " +
        formatMoney(available)
      : "Geplande inkomsten " +
        formatMoney(calculation.cycleIncomeTotal) +
        " min uitgaven en sparen " +
        formatMoney(calculation.cycleOutflowTotal) +
        " is gepland vrij te besteden " +
        formatMoney(available);
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
      renderSetupGuide() +
      '<div class="hero-grid"><article class="hero-card"><div class="hero-heading"><p class="hero-label">' +
      (usesActualBalances
        ? "Nu beschikbaar tot je volgende salaris"
        : "Gepland vrij te besteden deze betaalmaand") +
      '</p><span class="hero-status">' +
      (usesActualBalances ? "Actueel" : "Planning") +
      '</span></div><p class="hero-amount ' +
      safeClass +
      '">' +
      formatMoney(available) +
      '</p><div class="hero-equation" aria-label="' +
      escapeHtml(equationLabel) +
      '">' +
      (usesActualBalances
        ? '<span><small>Saldi</small><strong>' +
          formatMoney(totalBalances) +
          '</strong></span><b aria-hidden="true">+</b><span><small>Nog te ontvangen</small><strong>' +
          formatMoney(calculation.expectedIncome) +
          '</strong></span><b aria-hidden="true">−</b><span><small>Nog uitgaand</small><strong>' +
          formatMoney(calculation.outstandingOutgoings) +
          "</strong></span>"
        : '<span><small>Geplande inkomsten</small><strong>' +
          formatMoney(calculation.cycleIncomeTotal) +
          '</strong></span><b aria-hidden="true">−</b><span><small>Uitgaven & sparen</small><strong>' +
          formatMoney(calculation.cycleOutflowTotal) +
          "</strong></span>") +
      '</div><div class="hero-footer"><strong>' +
      calculation.cycle.daysLeft +
      " " +
      (calculation.cycle.daysLeft === 1 ? "dag" : "dagen") +
      ' te gaan</strong><span class="hero-dot"></span><span>' +
      (usesActualBalances
        ? "op basis van je saldi en openstaande posten"
        : "vul je saldi in voor het actuele bedrag") +
      '</span></div></article>' +
      '<article class="cycle-card"><div><p>Deze betaalmaand</p><strong>' +
      escapeHtml(formatCycle(calculation.cycle)) +
      '</strong><p class="cycle-days">' +
      calculation.cycle.daysLeft +
      "<span>dagen over</span></p></div><div><div class=\"progress-track\"><div class=\"progress-value\" style=\"width: " +
      calculation.cycle.elapsedPercent +
      '%\" role=\"progressbar\" aria-label=\"Voortgang betaalmaand\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"' +
      calculation.cycle.elapsedPercent +
      '\"></div></div><small>' +
      calculation.cycle.elapsedPercent +
      '% van je betaalmaand is voorbij</small><div class="balance-freshness ' +
      (freshness.isStale ? "is-stale" : "") +
      '"><span>' +
      (freshness.datetime
        ? '<time datetime="' + freshness.datetime + '">' + escapeHtml(freshness.copy) + "</time>"
        : escapeHtml(freshness.copy)) +
      '</span><button class="text-button" type="button" data-action="open-balance-modal">Bijwerken</button></div></div></article></div>' +
      renderDashboardAlerts(calculation) +
      '<div class="budget-grid"><article class="budget-card"><p>' +
      (usesActualBalances ? "Beschikbaar per dag" : "Gepland per dag") +
      '</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(perDay) +
      "</strong><small>tot je volgende salaris</small></article>" +
      '<article class="budget-card"><p>' +
      (calculation.cycle.daysLeft < 2 ? "Tot je salaris" : "Voor 2 dagen") +
      '</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(perTwoDays) +
      "</strong><small>nooit meer dan wat resteert</small></article>" +
      '<article class="budget-card"><p>' +
      (calculation.cycle.daysLeft < 7 ? "Tot je salaris" : "Voor 7 dagen") +
      '</p><strong class="' +
      safeClass +
      '">' +
      formatMoney(perWeek) +
      "</strong><small>nooit meer dan wat resteert</small></article></div>" +
      '<section class="dashboard-section"><div class="dashboard-section-heading"><div class="planning-group-title"><span class="planning-group-icon dashboard-overview-icon" aria-hidden="true">' +
      ICONS.outgoing +
      '</span><div><p class="planning-group-kicker">Nu te verwerken</p><h2>Wat komt er nog aan?</h2><p class="section-copy">Open inkomsten, uitgaven en spaaroverboekingen in deze betaalmaand.</p></div></div></div><div class="dashboard-panels"><section class="panel"><header class="panel-header"><div><h3>Nog uitgaand</h3><p class="section-copy">' +
      formatMoney(calculation.outstandingOutgoings) +
      " staat nog gepland.</p></div><button class=\"text-button\" type=\"button\" data-action=\"goto-planning\">Alles bekijken</button></header><div class=\"panel-body\">" +
      renderOverviewRows(outgoingEntries, "Nog geen uitgaven of spaaroverboekingen in deze betaalmaand.") +
      '</div></section><section class="panel"><header class="panel-header"><div><h3>Nog te ontvangen</h3><p class="section-copy">' +
      formatMoney(calculation.expectedIncome) +
      ' staat nog open.</p></div><button class="text-button" type="button" data-action="goto-planning">Alles bekijken</button></header><div class="panel-body">' +
      renderOverviewRows(incomeEntries, "Nog geen verwachte inkomsten ingepland.") +
      '</div></section></div></section><div class="dashboard-secondary-grid"><section class="panel account-overview"><header class="panel-header"><div><h2>Rekeningen</h2><p class="section-copy">Van huidig saldo naar verwachte eindstand.</p></div><button class="text-button" type="button" data-action="open-balance-modal">Saldi bijwerken</button></header><div class="panel-body"><div class="account-grid">' +
      renderAccountCard("rabobank", calculation) +
      renderAccountCard("bunq", calculation) +
      "</div></div></section><div class=\"stack\">" +
      renderExtraIncomeDashboard(calculation) +
      renderSavingsDashboard(calculation) +
      "</div></div>" +
      renderPaydayMonthSummary(calculation) +
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
    const rowId = itemId + "-" + dueDate;
    const statusText = isIncome
      ? entry.paid
        ? "Ontvangen"
        : "Ontvangen?"
      : isSaving
        ? entry.paid
          ? "Overgeboekt"
          : "Overgeboekt?"
        : entry.paid
          ? "Betaald"
          : "Betaald?";
    const paidButton =
      '<button class="status-button ' +
      (entry.paid ? "is-paid" : "") +
      '" type="button" aria-pressed="' +
      (entry.paid ? "true" : "false") +
      '" aria-label="' +
      escapeHtml(entry.name + ": " + statusText) +
      '" data-action="toggle-paid" data-id="' +
      itemId +
      '" data-occurrence="' +
      dueDate +
      '">' +
      statusText +
      "</button>";
    const controls = entry.virtual
      ? paidButton +
        '<button class="icon-button" title="Extra inkomen bewerken" aria-label="Bewerk extra inkomen" type="button" data-action="goto-settings">' +
        ICONS.edit +
        "</button>"
      : paidButton +
        '<button class="icon-button" title="Bewerk post" aria-label="Bewerk ' +
        escapeHtml(entry.name) +
        '" type="button" data-action="edit-item" data-id="' +
        itemId +
        '" data-occurrence="' +
        dueDate +
        '">' + ICONS.edit + '</button><button class="icon-button" title="Verwijder post" aria-label="Verwijder ' +
        escapeHtml(entry.name) +
        '" type="button" data-action="delete-item" data-id="' +
        itemId +
        '" data-occurrence="' +
        dueDate +
        '">' + ICONS.remove + '</button>';

    return (
      '<article class="planning-row planning-row-' +
      (isIncome ? "income" : "outgoing") +
      " " +
      (entry.paid ? "is-paid" : "") +
      '" aria-labelledby="planning-name-' +
      rowId +
      '"><div class="planning-date">' +
      (entry.virtual || entry.cadence === "payday"
        ? '<span class="planning-date-label" id="date-label-' +
          rowId +
          '">' +
          (isIncome ? "Ontvangstdatum" : isSaving ? "Overboekingsdatum" : "Betaaldatum") +
          '</span><time class="date-input" datetime="' +
          dueDate +
          '" aria-labelledby="date-label-' +
          rowId +
          '">' +
          escapeHtml(formatShortDate(entry.occurrence)) +
          "</time>"
        : '<label for="date-' +
          rowId +
          '">' +
          (isIncome ? "Ontvangstdatum" : isSaving ? "Overboekingsdatum" : "Betaaldatum") +
        '</label><input class="date-input" id="date-' +
          rowId +
          '" type="date" value="' +
          dueDate +
          '" data-action="change-date" data-id="' +
          itemId +
          '">') +
      "</div>" +
      '<div class="planning-main"><div class="planning-name" id="planning-name-' +
      rowId +
      '">' +
      escapeHtml(entry.name) +
      '</div><div class="planning-meta">' +
      typeTag(entry) +
      '<span class="tag">' +
      cadenceText +
      "</span></div></div>" +
      '<div class="planning-account">' +
      escapeHtml(accountLabel(entry.account)) +
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

  function renderOutsideCycleItems(cycle) {
    const oneTimeItems = state.data.items
      .filter((item) => item.cadence === "once" && !occurrenceForItem(item, cycle))
      .sort((first, second) => String(second.date).localeCompare(String(first.date)));
    if (!oneTimeItems.length) {
      return "";
    }

    return (
      '<details class="planning-archive"><summary><span><strong>Andere eenmalige posten</strong><small>Oudere en toekomstige posten buiten deze betaalmaand</small></span><span class="tag">' +
      planningEntryCount(oneTimeItems.length) +
      '</span></summary><div class="archive-list">' +
      oneTimeItems
        .map((item) => {
          const date = parseDateInput(item.date);
          return (
            '<article class="archive-row"><div><strong>' +
            escapeHtml(item.name) +
            '</strong><small>' +
            escapeHtml(formatShortDate(date)) +
            " · " +
            escapeHtml(TYPE_LABELS[item.type]) +
            " · " +
            escapeHtml(accountLabel(item.account)) +
            '</small></div><span class="money ' +
            (item.type === "income" ? "positive" : "negative") +
            '">' +
            signedMoney(item.amount, item.type === "income") +
            '</span><div class="planning-actions"><button class="icon-button" aria-label="Bewerk ' +
            escapeHtml(item.name) +
            '" type="button" data-action="edit-item" data-id="' +
            escapeHtml(item.id) +
            '">' +
            ICONS.edit +
            '</button><button class="icon-button" aria-label="Verwijder ' +
            escapeHtml(item.name) +
            '" type="button" data-action="delete-item" data-id="' +
            escapeHtml(item.id) +
            '">' +
            ICONS.remove +
            "</button></div></article>"
          );
        })
        .join("") +
      "</div></details>"
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
      "</div>" +
      renderOutsideCycleItems(calculation.cycle) +
      '<aside class="planning-tip"><div><strong>Voorkom dubbel tellen</strong><p>Werk eerst je echte rekeningsaldo bij zodra iets is afgeschreven, overgeboekt of ontvangen. Markeer de post daarna als verwerkt.</p></div></aside></section>'
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
    const remaining = Math.max(0, jar.target - jar.balance);

    return (
      '<article class="jar-card"><div class="jar-icon" aria-hidden="true">' + ICONS.wallet + '</div><h2>' +
      escapeHtml(jar.name) +
      '</h2><p class="jar-kicker">Gespaard</p><p class="jar-amount">' +
      formatMoney(jar.balance) +
      '</p><div class="jar-stats"><span>' +
      (jar.target ? "Nog " + formatMoney(remaining) : "Geen doelbedrag") +
      "</span><strong>" +
      (jar.target ? progress + "%" : "Vrij sparen") +
      '</strong></div><div class="jar-progress" role="progressbar" aria-label="Voortgang van ' +
      escapeHtml(jar.name) +
      '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
      progress +
      '"><span style="width: ' +
      progress +
      '%"></span></div><div class="jar-actions"><span class="tag">' +
      (jar.target ? "Doel " + formatMoney(jar.target) : "Zonder einddoel") +
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
      '<section><header class="page-header"><div><p class="eyebrow">Spaardoelen</p><h1>Spaarpotjes</h1><p class="subtle">Je potjes blijven bewust apart van je besteedbare geld. Totaal in spaarpotjes: ' +
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
    const freshness = balanceFreshness();
    return (
      '<section><header class="page-header"><div><p class="eyebrow">Privé & offline</p><h1>Instellingen</h1><p class="subtle">Je gegevens worden alleen lokaal in deze browser opgeslagen. Er is geen bankkoppeling en geen account nodig.</p></div></header>' +
      '<div class="settings-grid"><section class="panel settings-panel full settings-profile-panel"><div class="settings-panel-heading"><span class="dashboard-card-icon" aria-hidden="true">' +
      ICONS.wallet +
      '</span><div><p class="eyebrow">Persoonlijk instellen</p><h2>Rekeningen & salarisdag</h2><p class="section-copy">Geef je rekeningen herkenbare namen en vul de actuele saldi in.</p></div></div><form id="settings-balance-form"><div class="field-grid account-settings-grid"><div class="form-field"><label for="setting-rabobank-name">Naam rekening 1</label><input id="setting-rabobank-name" name="accountNameRabobank" maxlength="40" required value="' +
      escapeHtml(accountLabel("rabobank")) +
      '"></div><div class="form-field"><label for="setting-rabobank">Saldo rekening 1</label><input id="setting-rabobank" name="rabobank" type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.balances.rabobank) +
      '"></div><div class="form-field"><label for="setting-bunq-name">Naam rekening 2</label><input id="setting-bunq-name" name="accountNameBunq" maxlength="40" required value="' +
      escapeHtml(accountLabel("bunq")) +
      '"></div><div class="form-field"><label for="setting-bunq">Saldo rekening 2</label><input id="setting-bunq" name="bunq" type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.balances.bunq) +
      '"></div><div class="form-field"><label for="setting-payday-day">Vaste salarisdag</label><input id="setting-payday-day" name="paydayDay" type="number" min="1" max="31" value="' +
      state.data.settings.paydayDay +
      '"><span class="helper-copy">Weekend? Dan gebruikt de app de vrijdag ervoor.</span></div></div><div class="form-actions"><button class="button button-primary" id="settings-save-button" type="submit">Instellingen opslaan</button><span class="balance-form-status">' +
      escapeHtml(freshness.copy) +
      "</span></div></form></section>" +
      '<section class="panel settings-panel"><h2>Extra inkomen</h2><p class="section-copy">Stel een eenmalig extra inkomen in. In Planning kun je het daarna als ontvangen markeren.</p><form id="extra-income-form"><div class="field-grid"><div class="form-field full"><label for="extra-income-name">Naam</label><input id="extra-income-name" name="extraIncomeName" required maxlength="80" placeholder="Bijvoorbeeld: teruggave of bonus" value="' +
      escapeHtml(state.data.settings.extraIncomeName) +
      '"></div><div class="form-field"><label for="extra-income-amount">Bedrag</label><input id="extra-income-amount" name="extraIncomeAmount" required type="text" inputmode="decimal" value="' +
      escapeHtml(state.data.settings.extraIncomeAmount) +
      '"></div><div class="form-field"><label for="extra-income-date">Verwachte datum</label><input id="extra-income-date" name="extraIncomeDate" required type="date" value="' +
      escapeHtml(extraIncomeDate ? dateInputValue(extraIncomeDate) : dateInputValue(new Date())) +
      '"></div><div class="form-field"><label for="extra-income-account">Naar rekening</label><select id="extra-income-account" name="extraIncomeAccount"><option value="rabobank"' +
      (state.data.settings.extraIncomeAccount === "rabobank" ? " selected" : "") +
      ">" +
      escapeHtml(accountLabel("rabobank")) +
      '</option><option value="bunq"' +
      (state.data.settings.extraIncomeAccount === "bunq" ? " selected" : "") +
      ">" +
      escapeHtml(accountLabel("bunq")) +
      '</option></select></div><div class="form-field"><label for="extra-income-enabled">Meetellen</label><select id="extra-income-enabled" name="extraIncomeEnabled"><option value="false"' +
      (!state.data.settings.extraIncomeEnabled ? " selected" : "") +
      '>Nee, nog niet</option><option value="true"' +
      (state.data.settings.extraIncomeEnabled ? " selected" : "") +
      '>Ja, in deze betaalmaand</option></select></div></div><div class="form-actions"><button class="button button-primary" id="extra-income-save-button" type="submit">Extra inkomen opslaan</button></div></form></section>' +
      '<section class="panel settings-panel full"><h2>Zo berekent de app je budget</h2><ul class="info-list"><li><span>1</span><div>De betaalmaand start op dag ' +
      state.data.settings.paydayDay +
      ' en loopt tot de volgende salarisdag. In het weekend gebruikt de app de vrijdag ervoor.</div></li><li><span>2</span><div>Het maandoverzicht telt alle inkomsten, uitgaven en spaarinleg in die volledige betaalmaand mee, ook als ze al zijn verwerkt.</div></li><li><span>3</span><div>Het actuele bedrag gebruikt de saldi van ' +
      escapeHtml(accountLabel("rabobank")) +
      " en " +
      escapeHtml(accountLabel("bunq")) +
      ', trekt openstaande uitgaven en spaaroverboekingen af en telt nog te ontvangen inkomsten erbij op.</div></li><li><span>4</span><div>Je spaarpotjes blijven apart. Hun ingevulde saldi tellen niet mee als vrij besteedbaar geld.</div></li></ul></section><div class="settings-group-title"><p class="eyebrow">App & gegevens</p><h2>Beheer en updates</h2></div>' +
      '<section class="panel settings-panel"><h3>Reservekopie</h3><p class="section-copy">Bewaar een kopie voordat je van telefoon of browser wisselt.</p><div class="form-actions"><button class="button button-secondary" type="button" data-action="export-data">Exporteer gegevens</button><button class="button button-secondary" type="button" data-action="trigger-import">Importeer gegevens</button><input class="is-hidden" id="import-file" type="file" accept="application/json" data-action="import-data" tabindex="-1" aria-hidden="true"></div></section>' +
      '<section class="panel settings-panel"><h3>App-update</h3><p class="section-copy">Controleer handmatig of er een nieuwe versie van Mijn Geld klaarstaat. Je lokale gegevens blijven bewaard.</p><div class="form-actions"><button class="button button-secondary" type="button" data-action="check-for-updates"' +
      (state.isCheckingForUpdates ? " disabled" : "") +
      '>' +
      (state.isCheckingForUpdates ? "Controleren…" : "Controleer op updates") +
      '</button><span class="version-label">Versie ' +
      APP_VERSION +
      "</span></div></section>" +
      '<section class="panel settings-panel"><h3>Opnieuw beginnen</h3><p class="section-copy">Dit wist alleen de lokale gegevens in deze app. Je bankgegevens blijven onaangeraakt.</p><div class="form-actions"><button class="button button-danger" type="button" data-action="clear-data">Lokale gegevens wissen</button></div></section></div></section>'
    );
  }

  function render() {
    const currentCycle = getBudgetCycle();
    const extraIncomeDate = parseDateInput(state.data.settings.extraIncomeDate);
    if (
      state.data.settings.extraIncomeEnabled &&
      !isWithinCycle(extraIncomeDate, currentCycle)
    ) {
      state.data.settings.extraIncomeEnabled = false;
      saveData();
    }
    state.lastRenderedDate = dateInputValue(new Date());
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
    const pageTitle = app.querySelector("h1");
    if (pageTitle) {
      pageTitle.tabIndex = -1;
    }
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

  function captureFocusToken() {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) {
      return null;
    }
    return {
      id: active.id || "",
      action: active.dataset.action || "",
      itemId: active.dataset.id || "",
      occurrence: active.dataset.occurrence || "",
      view: active.dataset.view || ""
    };
  }

  function restoreFocusToken(token) {
    if (!token) {
      return;
    }
    let target = token.id ? document.getElementById(token.id) : null;
    if (!target && token.action) {
      target = Array.from(document.querySelectorAll("[data-action]")).find(
        (element) =>
          element.dataset.action === token.action &&
          (element.dataset.id || "") === token.itemId &&
          (element.dataset.occurrence || "") === token.occurrence
      );
    }
    if (!target && token.view) {
      target = Array.from(document.querySelectorAll("[data-view]")).find(
        (element) => element.dataset.view === token.view
      );
    }
    if (target instanceof HTMLElement) {
      target.focus();
    }
  }

  function modalShell(title, copy, body) {
    return (
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"' +
      (copy ? ' aria-describedby="modal-description"' : "") +
      '><header class="modal-header"><div><h2 id="modal-title">' +
      escapeHtml(title) +
      "</h2>" +
      (copy
        ? '<p class="section-copy" id="modal-description">' + escapeHtml(copy) + "</p>"
        : "") +
      '</div><button class="modal-close" type="button" data-action="close-modal" aria-label="Sluiten">' + ICONS.close + '</button></header><div class="modal-body">' +
      body +
      "</div></div>"
    );
  }

  function showBalancesModal() {
    const body =
      '<form id="balance-form"><div class="field-grid"><div class="form-field"><label for="modal-rabobank">' +
      escapeHtml(accountLabel("rabobank")) +
      '</label><input id="modal-rabobank" name="rabobank" type="text" inputmode="decimal" aria-describedby="modal-rabobank-help" value="' +
      escapeHtml(state.data.balances.rabobank) +
      '"><span class="helper-copy" id="modal-rabobank-help">Vul het saldo in dat je nu in je bank-app ziet.</span></div><div class="form-field"><label for="modal-bunq">' +
      escapeHtml(accountLabel("bunq")) +
      '</label><input id="modal-bunq" name="bunq" type="text" inputmode="decimal" aria-describedby="modal-bunq-help" value="' +
      escapeHtml(state.data.balances.bunq) +
      '"><span class="helper-copy" id="modal-bunq-help">Tel losse spaarpotjes niet mee als ze al apart staan.</span></div></div><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Annuleren</button><button class="button button-primary" type="submit">Saldi opslaan</button></div></form>';
    modalRoot.innerHTML = modalShell(
      "Actuele saldi",
      "Vul in wat er op dit moment daadwerkelijk op je rekeningen staat.",
      body
    );
    focusModal();
  }

  function showItemModal(itemId, preferredType) {
    const calculation = calculateBudget();
    const existing = itemId
      ? state.data.items.find((item) => item.id === itemId)
      : null;
    const today = createDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const defaultDate = dateInputValue(
      isWithinCycle(today, calculation.cycle) ? today : calculation.cycle.start
    );
    const selectedType = existing
      ? existing.type
      : ["income", "expense", "saving"].includes(preferredType)
        ? preferredType
        : "expense";
    const selectedDate = existing
      ? existing.cadence === "once"
        ? existing.date
        : existing.cadence === "payday"
          ? dateInputValue(calculation.cycle.start)
          : dateInputValue(
              occurrenceForItem(existing, calculation.cycle) || calculation.cycle.start
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
      (selectedType === "expense" ? " selected" : "") +
      ">Uitgave</option><option value=\"income\"" +
      (selectedType === "income" ? " selected" : "") +
      ">Inkomst</option><option value=\"saving\"" +
      (selectedType === "saving" ? " selected" : "") +
      ">Spaaroverboeking</option></select></div><div class=\"form-field\"><label for=\"item-amount\">Bedrag</label><input id=\"item-amount\" name=\"amount\" required type=\"text\" inputmode=\"decimal\" value=\"" +
      escapeHtml(existing ? existing.amount : "") +
      '"></div><div class="form-field"><label for="item-account">Rekening</label><select id="item-account" name="account"><option value="rabobank"' +
      (existing && existing.account === "rabobank" ? " selected" : "") +
      ">" +
      escapeHtml(accountLabel("rabobank")) +
      '</option><option value="bunq"' +
      (!existing || existing.account === "bunq" ? " selected" : "") +
      ">" +
      escapeHtml(accountLabel("bunq")) +
      '</option></select></div><div class="form-field"><label for="item-cadence">Herhaling</label><select id="item-cadence" name="cadence" aria-describedby="item-helper"><option value="monthly"' +
      (!existing || existing.cadence === "monthly" ? " selected" : "") +
      ">Elke maand</option><option value=\"once\"" +
      (existing && existing.cadence === "once" ? " selected" : "") +
      ">Eenmalig</option><option value=\"payday\"" +
      (existing && existing.cadence === "payday" ? " selected" : "") +
      '>Salarisdag</option></select></div><div class="form-field ' +
      (existing && existing.cadence === "payday" ? "is-hidden" : "") +
      '" id="item-date-field"><label for="item-date" id="item-date-label">' +
      (selectedType === "income"
        ? "Ontvangstdatum"
        : selectedType === "saving"
          ? "Overboekingsdatum"
          : "Betaaldatum") +
      '</label><input id="item-date" name="date" required type="date" aria-describedby="item-helper" value="' +
      escapeHtml(selectedDate) +
      '"></div><div class="form-field ' +
      (selectedType === "saving" ? "" : "is-hidden") +
      '" id="item-jar-field"><label for="item-jar">Spaarpotje</label><select id="item-jar" name="jarId" aria-describedby="item-helper">' +
      jarsOptions +
      '</select></div></div><p class="helper-copy" id="item-helper" style="margin-top: 16px;">Voor maandelijkse posten onthoudt de app de dag van de maand. Een salarisdag-post volgt automatisch je ingestelde salarisdag.</p><div class="modal-footer"><button class="button button-secondary" type="button" data-action="close-modal">Annuleren</button><button class="button button-primary" type="submit">' +
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
    state.modalReturnFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    appShell.inert = true;
    if (state.waitingServiceWorker) {
      updatePrompt.classList.add("is-hidden");
    }
    window.setTimeout(() => {
      const focusTarget = modalRoot.querySelector(
        'input:not([type="hidden"]):not(.is-hidden), select:not(.is-hidden), textarea, button:not([data-action="close-modal"])'
      );
      if (focusTarget) {
        focusTarget.focus();
      }
    }, 0);
  }

  function closeModal() {
    modalRoot.innerHTML = "";
    document.body.style.overflow = "";
    appShell.inert = false;
    if (state.modalReturnFocus && document.contains(state.modalReturnFocus)) {
      state.modalReturnFocus.focus();
    }
    state.modalReturnFocus = null;
    if (
      state.waitingServiceWorker &&
      Date.now() >= state.updatePromptSnoozedUntil
    ) {
      showUpdatePrompt(state.waitingServiceWorker);
    }
  }

  function trapModalFocus(event) {
    const modal = modalRoot.querySelector(".modal");
    if (!modal || event.key !== "Tab") {
      return;
    }
    const focusable = Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.classList.contains("is-hidden"));
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function showFormError(form, message, field) {
    const errorId = form.id + "-error";
    let error = form.querySelector(".form-error");
    if (!error) {
      error = document.createElement("div");
      error.className = "form-error";
      error.id = errorId;
      error.setAttribute("role", "alert");
      error.tabIndex = -1;
      form.prepend(error);
    }
    error.id = errorId;
    form.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
      element.removeAttribute("aria-invalid");
    });
    form.querySelectorAll("[aria-describedby]").forEach((element) => {
      const descriptionIds = element
        .getAttribute("aria-describedby")
        .split(/\s+/)
        .filter((id) => id && id !== errorId);
      if (descriptionIds.length) {
        element.setAttribute("aria-describedby", descriptionIds.join(" "));
      } else {
        element.removeAttribute("aria-describedby");
      }
    });
    error.textContent = message;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      const describedBy = (field.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter(Boolean);
      if (!describedBy.includes(errorId)) {
        describedBy.push(errorId);
      }
      field.setAttribute("aria-describedby", describedBy.join(" "));
    }
    error.focus();
  }

  function showUpdatePrompt(worker) {
    state.waitingServiceWorker = worker;
    if (modalRoot.querySelector(".modal") || Date.now() < state.updatePromptSnoozedUntil) {
      return;
    }
    updatePrompt.classList.remove("is-hidden");
  }

  function dismissUpdatePrompt() {
    state.updatePromptSnoozedUntil = Date.now() + 4 * 60 * 60 * 1000;
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
    const updateButton = document.querySelector('[data-action="check-for-updates"]');
    if (updateButton) {
      updateButton.disabled = true;
      updateButton.textContent = "Controleren…";
    }

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
        state.updatePromptSnoozedUntil = 0;
        showUpdatePrompt(registration.waiting);
      } else {
        showToast("Je gebruikt de nieuwste versie van Mijn Geld.");
      }
    } catch (error) {
      showToast("Updatecontrole mislukt. Controleer je internetverbinding en probeer opnieuw.");
    } finally {
      state.isCheckingForUpdates = false;
      const currentButton = document.querySelector('[data-action="check-for-updates"]');
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent = "Controleer op updates";
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
    const focusToken = captureFocusToken();
    activePaydayDay = state.data.settings.paydayDay;
    saveData();
    render();
    restoreFocusToken(focusToken);
    if (message) {
      showToast(message);
    }
  }

  function setActiveView(view) {
    state.activeView = view;
    render();
    const pageTitle = app.querySelector("h1");
    if (pageTitle) {
      pageTitle.focus();
    }
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
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
      showItemModal(undefined, actionElement.dataset.type);
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
      const isExtraIncome = itemId === "extra-income";
      if (!item && !isExtraIncome) {
        return;
      }
      const cycle = getBudgetCycle();
      const selectedOccurrence =
        parseDateInput(actionElement.dataset.occurrence) ||
        (isExtraIncome
          ? parseDateInput(state.data.settings.extraIncomeDate)
          : occurrenceForItem(item, cycle));
      if (!selectedOccurrence || !isWithinCycle(selectedOccurrence, cycle)) {
        return;
      }
      const occurrenceKey = paidKey(
        cycle,
        isExtraIncome ? "extra-income" : item.id,
        selectedOccurrence
      );
      const legacyKey = paidKey(cycle, isExtraIncome ? "extra-income" : item.id);
      const occurrences = isExtraIncome ? [selectedOccurrence] : occurrencesForItem(item, cycle);
      const isFirstOccurrence =
        isExtraIncome ||
        (occurrences[0] && dateInputValue(occurrences[0]) === dateInputValue(selectedOccurrence));
      const wasPaid = Boolean(
        state.data.paidOccurrences[occurrenceKey] ||
          (isFirstOccurrence && state.data.paidOccurrences[legacyKey])
      );
      if (wasPaid) {
        delete state.data.paidOccurrences[occurrenceKey];
        if (isFirstOccurrence) {
          delete state.data.paidOccurrences[legacyKey];
        }
      } else {
        state.data.paidOccurrences[occurrenceKey] = true;
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
      clearPaidOccurrences(itemId);
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
    if (action === "trigger-import") {
      const importInput = document.getElementById("import-file");
      if (importInput) {
        importInput.click();
      }
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
      const rabobankBalance = requiredNumberValue(formData.get("rabobank"));
      const bunqBalance = requiredNumberValue(formData.get("bunq"));
      if (rabobankBalance === null || bunqBalance === null) {
        showFormError(
          form,
          "Vul voor beide rekeningen een geldig bedrag in.",
          rabobankBalance === null ? form.elements.rabobank : form.elements.bunq
        );
        return;
      }
      if (form.id === "settings-balance-form") {
        const accountNameRabobank = String(formData.get("accountNameRabobank") || "").trim();
        const accountNameBunq = String(formData.get("accountNameBunq") || "").trim();
        const paydayDay = Math.round(numberValue(formData.get("paydayDay"), 0));
        if (!accountNameRabobank || !accountNameBunq || paydayDay < 1 || paydayDay > 31) {
          showFormError(
            form,
            "Vul twee rekeningnamen en een salarisdag tussen 1 en 31 in.",
            !accountNameRabobank
              ? form.elements.accountNameRabobank
              : !accountNameBunq
                ? form.elements.accountNameBunq
                : form.elements.paydayDay
          );
          return;
        }
        migrateLegacyPaidOccurrences(state.data, state.data.settings.paydayDay);
        const previousCycle = getBudgetCycle(undefined, state.data.settings.paydayDay);
        const nextCycle = getBudgetCycle(undefined, paydayDay);
        if (paydayDay !== state.data.settings.paydayDay) {
          getCycleEntries(previousCycle)
            .filter((entry) => entry.paid && isWithinCycle(entry.occurrence, nextCycle))
            .forEach((entry) => {
              state.data.paidOccurrences[
                paidKey(nextCycle, entry.id, entry.occurrence)
              ] = true;
            });
        }
        state.data.settings.accountNames.rabobank = accountNameRabobank;
        state.data.settings.accountNames.bunq = accountNameBunq;
        state.data.settings.paydayDay = paydayDay;
        const configuredExtraIncomeDate = parseDateInput(
          state.data.settings.extraIncomeDate
        );
        if (
          state.data.settings.extraIncomeEnabled &&
          !isWithinCycle(
            configuredExtraIncomeDate,
            nextCycle
          )
        ) {
          state.data.settings.extraIncomeEnabled = false;
        }
      }
      state.data.balances.rabobank = rabobankBalance;
      state.data.balances.bunq = bunqBalance;
      state.data.hasSetBalances = true;
      state.data.settings.balancesUpdatedAt = new Date().toISOString();
      if (form.id === "balance-form") {
        closeModal();
      }
      commit(
        form.id === "settings-balance-form"
          ? "Je rekeningen, salarisdag en saldi zijn opgeslagen."
          : "Je actuele saldi zijn bijgewerkt."
      );
      return;
    }

    if (form.id === "extra-income-form") {
      const extraIncomeName = String(formData.get("extraIncomeName") || "").trim();
      const parsedExtraIncomeAmount = requiredNumberValue(
        formData.get("extraIncomeAmount")
      );
      const extraIncomeAmount = parsedExtraIncomeAmount === null
        ? 0
        : parsedExtraIncomeAmount;
      const extraIncomeDate = parseDateInput(formData.get("extraIncomeDate"));
      const extraIncomeAccount = String(formData.get("extraIncomeAccount") || "");
      const extraIncomeEnabled = formData.get("extraIncomeEnabled") === "true";
      if (
        !extraIncomeName ||
        extraIncomeAmount <= 0 ||
        !extraIncomeDate ||
        !["rabobank", "bunq"].includes(extraIncomeAccount)
      ) {
        showFormError(
          form,
          "Vul een naam, positief bedrag, rekening en geldige datum in.",
          !extraIncomeName
            ? form.elements.extraIncomeName
            : parsedExtraIncomeAmount === null || extraIncomeAmount <= 0
              ? form.elements.extraIncomeAmount
              : !extraIncomeDate
                ? form.elements.extraIncomeDate
                : form.elements.extraIncomeAccount
        );
        return;
      }
      if (extraIncomeEnabled && !isWithinCycle(extraIncomeDate, getBudgetCycle())) {
        showFormError(
          form,
          "Kies een datum binnen deze betaalmaand om het inkomen mee te tellen.",
          form.elements.extraIncomeDate
        );
        return;
      }
      const extraIncomeOccurrenceChanged =
        state.data.settings.extraIncomeAmount !== extraIncomeAmount ||
        state.data.settings.extraIncomeDate !== dateInputValue(extraIncomeDate);
      state.data.settings.extraIncomeEnabled = extraIncomeEnabled;
      state.data.settings.extraIncomeName = extraIncomeName;
      state.data.settings.extraIncomeAmount = extraIncomeAmount;
      state.data.settings.extraIncomeDate = dateInputValue(extraIncomeDate);
      state.data.settings.extraIncomeAccount = extraIncomeAccount;
      if (extraIncomeOccurrenceChanged) {
        clearPaidOccurrences("extra-income");
      }
      commit(
        extraIncomeEnabled
          ? "Het extra inkomen is opgeslagen en staat in je overzicht."
          : "Het extra inkomen is opgeslagen."
      );
      return;
    }

    if (form.id === "item-form") {
      const name = String(formData.get("name") || "").trim();
      const parsedAmount = requiredNumberValue(formData.get("amount"));
      const amount = parsedAmount === null ? 0 : parsedAmount;
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
        showFormError(
          form,
          "Vul alle verplichte velden correct in.",
          !name
            ? form.elements.name
            : parsedAmount === null || amount <= 0
              ? form.elements.amount
              : !itemDate
                ? form.elements.date
                : !["expense", "income", "saving"].includes(type)
                  ? form.elements.type
                  : !["rabobank", "bunq"].includes(account)
                    ? form.elements.account
                    : form.elements.cadence
        );
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
      const parsedBalance = requiredNumberValue(formData.get("balance"));
      const targetValue = String(formData.get("target") || "").trim();
      const parsedTarget = targetValue ? requiredNumberValue(targetValue) : 0;
      const balance = parsedBalance === null ? 0 : parsedBalance;
      const target = parsedTarget === null ? 0 : parsedTarget;
      const jarId = form.dataset.id;
      const existingJar = jarId
        ? state.data.savingsJars.find((jar) => jar.id === jarId)
        : null;

      if (!name) {
        showFormError(form, "Geef je spaarpotje een naam.", form.elements.name);
        return;
      }
      if (parsedBalance === null || balance < 0) {
        showFormError(
          form,
          "Vul een geldig, niet-negatief saldo in.",
          form.elements.balance
        );
        return;
      }
      if (parsedTarget === null || target < 0) {
        showFormError(
          form,
          "Vul een geldig, niet-negatief doelbedrag in of laat het leeg.",
          form.elements.target
        );
        return;
      }

      const jar = {
        id: jarId || createId("potje"),
        sourceKey: existingJar ? existingJar.sourceKey : "",
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
    if (input.id === "item-type" || input.id === "item-cadence") {
      const form = input.closest("form");
      if (!form) {
        return;
      }
      const type = form.elements.type.value;
      const cadence = form.elements.cadence.value;
      const jarField = form.querySelector("#item-jar-field");
      const dateField = form.querySelector("#item-date-field");
      const dateLabel = form.querySelector("#item-date-label");
      if (jarField) {
        jarField.classList.toggle("is-hidden", type !== "saving");
      }
      if (dateField) {
        dateField.classList.toggle("is-hidden", cadence === "payday");
      }
      if (dateLabel) {
        dateLabel.textContent =
          type === "income"
            ? "Ontvangstdatum"
            : type === "saving"
              ? "Overboekingsdatum"
              : "Betaaldatum";
      }
      return;
    }

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
        const parsedBackup = JSON.parse(String(reader.result || ""));
        if (!isValidBackupPayload(parsedBackup)) {
          throw new Error("Ongeldige reservekopie");
        }
        if (
          !window.confirm(
            "Deze reservekopie vervangt je huidige lokale gegevens. Wil je doorgaan?"
          )
        ) {
          showToast("Importeren geannuleerd.");
          return;
        }
        const imported = normalizeData(parsedBackup);
        migrateLegacyPaidOccurrences(imported, imported.settings.paydayDay);
        const importedExtraIncomeDate = parseDateInput(imported.settings.extraIncomeDate);
        if (
          imported.settings.extraIncomeEnabled &&
          !isWithinCycle(
            importedExtraIncomeDate,
            getBudgetCycle(undefined, imported.settings.paydayDay)
          )
        ) {
          imported.settings.extraIncomeEnabled = false;
        }
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

  document.addEventListener("keydown", (event) => {
    if (!modalRoot.querySelector(".modal")) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    trapModalFocus(event);
  });

  document.addEventListener("submit", handleFormSubmit);
  document.addEventListener("change", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement
    ) {
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

  window.addEventListener("focus", () => {
    if (state.lastRenderedDate !== dateInputValue(new Date())) {
      render();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      state.lastRenderedDate !== dateInputValue(new Date())
    ) {
      render();
    }
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

          window.addEventListener("focus", async () => {
            try {
              await registration.update();
              if (
                registration.waiting &&
                Date.now() >= state.updatePromptSnoozedUntil
              ) {
                showUpdatePrompt(registration.waiting);
              }
            } catch (error) {
              // De app blijft offline bruikbaar als de updatecontrole niet lukt.
            }
          });
        })
        .catch(() => {
          showToast("Offline-modus wordt actief zodra de app via een webserver geopend is.");
        });
    });
  }

  render();
})();
