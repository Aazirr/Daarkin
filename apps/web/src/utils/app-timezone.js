export const APP_TIME_ZONE = "Asia/Manila";
export const APP_UTC_OFFSET_MINUTES = 8 * 60;

const APP_UTC_OFFSET_MS = APP_UTC_OFFSET_MINUTES * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDateInput(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getShiftedAppDate(value) {
  const date = parseDateInput(value);
  if (!date) {
    return null;
  }

  return new Date(date.getTime() + APP_UTC_OFFSET_MS);
}

function getDatePartsFromKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function getUtcMidnightFromDateKey(dateKey) {
  const parts = getDatePartsFromKey(dateKey);
  if (!parts) {
    return null;
  }

  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

export function getAppDateKey(value = new Date()) {
  const shifted = getShiftedAppDate(value);
  if (!shifted) {
    return "";
  }

  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function getAppHour(value = new Date()) {
  const shifted = getShiftedAppDate(value);
  if (!shifted) {
    return 0;
  }

  return shifted.getUTCHours();
}

export function formatDateInAppTimeZone(value) {
  const date = parseDateInput(value);
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeInAppTimeZone(value) {
  const date = parseDateInput(value);
  if (!date) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function getWeekdayLabelInAppTimeZone(dateKey) {
  const utcMidnight = getUtcMidnightFromDateKey(dateKey);
  if (utcMidnight === null) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
  }).format(new Date(utcMidnight + 12 * 60 * 60 * 1000));
}

export function addDaysToAppDateKey(dateKey, days) {
  const utcMidnight = getUtcMidnightFromDateKey(dateKey);
  if (utcMidnight === null) {
    return "";
  }

  return getAppDateKey(new Date(utcMidnight + days * 24 * 60 * 60 * 1000));
}

export function getAppDayDifference(startValue, endValue = new Date()) {
  const startKey = getAppDateKey(startValue);
  const endKey = getAppDateKey(endValue);

  if (!startKey || !endKey) {
    return Number.POSITIVE_INFINITY;
  }

  const startUtcMidnight = getUtcMidnightFromDateKey(startKey);
  const endUtcMidnight = getUtcMidnightFromDateKey(endKey);

  return Math.max(0, Math.round((endUtcMidnight - startUtcMidnight) / (24 * 60 * 60 * 1000)));
}

export function toDateTimeLocalValueInAppTimeZone(value) {
  const shifted = getShiftedAppDate(value);
  if (!shifted) {
    return "";
  }

  return [
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
  ].join("T");
}

export function appDateTimeLocalToIso(value) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const utcTime = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5])
  );

  return new Date(utcTime - APP_UTC_OFFSET_MS).toISOString();
}
