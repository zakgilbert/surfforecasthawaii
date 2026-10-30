// utility.js
import StationInput from "./components/StationInput.js";
import Power from "./components/Power.js";
import Tide from "./components/Tide.js";
import Forecast from "./components/Forecast.js";
import MarineForecast from "./components/MarineForecast.js";
import AnimatedWaveModel from "./components/AnimatedWaveModel.js";
import Histogram from "./components/Histogram.js";
import HurricaneImage from "./components/Hurricane.js";
import HawaiiWeatherRadarLoop from "./components/HawaiiWeatherRadarLoop.js";
import WeatherForecast from "./components/WeatherForecast.js";
import { CONTENT_DATA } from "./contentData.js";
import { PRESET_DEFINITIONS } from "./presetDefinitions.js";

/* ---------------- Date helpers ---------------- */

const getFormattedDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

// Today to +1 day
export const getTideBeginAndEndDates = () => {
  const today = new Date();
  const beginDate = getFormattedDate(today);
  const endDate = getFormattedDate(
    new Date(today.setDate(today.getDate() + 1)),
  );
  return { beginDate, endDate };
};

// Friendly date for quick use
/*
export const formatDate = (datetime) => {
  const date = new Date(datetime);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


/* ---------------- Robust parsing ---------------- */

const TZ_ABBREV = {
  UTC: "+00:00",
  GMT: "+00:00",
  HST: "-10:00",
  HDT: "-09:00",
  PST: "-08:00",
  PDT: "-07:00",
  MST: "-07:00",
  MDT: "-06:00",
  CST: "-06:00",
  CDT: "-05:00",
  EST: "-05:00",
  EDT: "-04:00",
};

function normalizeTzAbbrev(s) {
  const m = s.match(/\s(?:\(|)([A-Z]{2,4})(?:\)|)\s*$/);
  if (m && TZ_ABBREV[m[1]]) return s.replace(m[0], "") + TZ_ABBREV[m[1]];
  return s;
}

export function parseDateSafe(val) {
  if (val == null) return null;
  if (val instanceof Date) return isNaN(val) ? null : val;

  if (typeof val === "number" || /^\d+$/.test(String(val).trim())) {
    const n = Number(val);
    return new Date(n < 1e12 ? n * 1000 : n);
  }

  let s = String(val).trim();

  // YYYY-MM-DD HH:mm[:ss] -> treat as local time
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, Y, M, D, hh, mm, ss = "0"] = m;
    const d = new Date(
      Number(Y),
      Number(M) - 1,
      Number(D),
      Number(hh),
      Number(mm),
      Number(ss),
    );
    if (!isNaN(d)) return d;
  }

  // YYYY-MM-DD h:mm[:ss] AM/PM -> treat as local time
  m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );
  if (m) {
    const [, Y, M, D, hh, mm, ss = "0", ap] = m;
    let h = parseInt(hh, 10);
    if (/PM/i.test(ap) && h < 12) h += 12;
    if (/AM/i.test(ap) && h === 12) h = 0;

    const d = new Date(
      Number(Y),
      Number(M) - 1,
      Number(D),
      h,
      Number(mm),
      Number(ss),
    );
    if (!isNaN(d)) return d;
  }

  s = normalizeTzAbbrev(s);

  let d = new Date(s);
  if (!isNaN(d)) return d;

  d = new Date(s.replace(" ", "T"));
  if (!isNaN(d)) return d;

  return null;
}

const HONO = "Pacific/Honolulu";

export const formatDate = (datetime, opts = {}) => {
  const d = parseDateSafe(datetime);
  if (!d) return String(datetime);

  const { timeZone = HONO } = opts;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(d);
};

export function formatTime(val, opts = {}) {
  const d = parseDateSafe(val);
  if (!d) return String(val);
  const { timeZone = HONO } = opts;
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(d);
}

export function formatDayTime(val, opts = {}) {
  const d = parseDateSafe(val);
  if (!d) return String(val);
  const { timeZone = HONO } = opts;

  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone,
  }).format(d);

  const time = formatTime(d, { timeZone });
  return `${weekday}, ${time}`;
}

export function formatNumericalDateTime(val, opts = {}) {
  const d = parseDateSafe(val);
  if (!d) return String(val);
  const { timeZone = HONO } = opts;
  const date = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(d);
  const time = formatTime(d, { timeZone });
  return `${date}, ${time}`;
}

export function formatDateTime(val, opts = {}) {
  const d = parseDateSafe(val);
  if (!d) return String(val);
  const { timeZone = HONO } = opts;

  const month = new Intl.DateTimeFormat(undefined, {
    month: "long",
    timeZone,
  }).format(d);
  const dayNum = Number(
    new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      timeZone,
    }).format(d),
  );
  const time = formatTime(d, { timeZone });

  return `${month} ${dayNum}, ${time}`;
}

export function formatDateOnly(val, opts = {}) {
  const d = parseDateSafe(val);
  if (!d) return String(val);
  const { timeZone = HONO } = opts;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone,
  }).format(d);
}

export const isMobile = () =>
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/* ---------------- Component router ---------------- */
const componentMap = {
  buoy: ({ station }) => <StationInput id={station} />,
  power: ({ station }) => <Power id={station} />,
  tide: ({ station }) => {
    const { beginDate } = getTideBeginAndEndDates();
    return <Tide id={station} beginDate={beginDate} timeZone="LST" />;
  },
  forecast: ({ station }) => <Forecast id={station} />,
  "marine-forecast": ({ station }) => <MarineForecast id={station} />,
  "wave-model-period": ({ station }) => (
    <AnimatedWaveModel id={station} mode="per" />
  ),
  "wave-model-height": ({ station }) => (
    <AnimatedWaveModel id={station} mode="height" />
  ),
  histogram: ({ station }) => <Histogram id={station} />,
  hurricane: ({ station }) => {
    const [id, width, height] = station.split("-");
    return <HurricaneImage id={id} width={width} height={height} />;
  },
  "hawaii-weather-radar-loop": ({ station }) => (
    <HawaiiWeatherRadarLoop id={station} />
  ),
  "weather-forecast": ({ station }) => <WeatherForecast id={station} />,
};

const handler = {
  get(target, prop) {
    return prop in target ? target[prop] : () => <></>;
  },
};

const gridRenderer = new Proxy(componentMap, handler);

export const handleGridCall = (item) => gridRenderer[item.tag](item);

export const groupedData = CONTENT_DATA.reduce((acc, item) => {
  (acc[item.tag] ||= []).push(item);
  return acc;
}, {});

