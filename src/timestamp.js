const pad = (n, len = 2) => String(n).padStart(len, "0");

/** ISO-8601 week number. */
const isoWeek = (date) => {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const day = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const ordinal = (n) => {
	const s = ["th", "st", "nd", "rd"];
	const v = n % 100;
	return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const name = (date, opts) => date.toLocaleString(undefined, opts);

/**
 * Format tokens, longest first so e.g. "MMMM" wins over "MM".
 * Wrap literal text in [brackets] to stop it being treated as tokens.
 */
const TOKENS = {
	YYYY: (d) => String(d.getFullYear()),
	YY: (d) => pad(d.getFullYear() % 100),
	MMMM: (d) => name(d, { month: "long" }),
	MMM: (d) => name(d, { month: "short" }),
	MM: (d) => pad(d.getMonth() + 1),
	M: (d) => String(d.getMonth() + 1),
	dddd: (d) => name(d, { weekday: "long" }),
	ddd: (d) => name(d, { weekday: "short" }),
	DDDD: (d) => ordinal(d.getDate()),
	DD: (d) => pad(d.getDate()),
	D: (d) => String(d.getDate()),
	HH: (d) => pad(d.getHours()),
	H: (d) => String(d.getHours()),
	hh: (d) => pad(d.getHours() % 12 || 12),
	h: (d) => String(d.getHours() % 12 || 12),
	mm: (d) => pad(d.getMinutes()),
	ss: (d) => pad(d.getSeconds()),
	A: (d) => (d.getHours() < 12 ? "AM" : "PM"),
	a: (d) => (d.getHours() < 12 ? "am" : "pm"),
	WW: (d) => pad(isoWeek(d)),
	Q: (d) => String(Math.floor(d.getMonth() / 3) + 1),
	X: (d) => String(Math.floor(d.getTime() / 1000)),
};
const TOKEN_RE = new RegExp(
	`\\[([^\\]]*)\\]|${Object.keys(TOKENS)
		.sort((a, b) => b.length - a.length)
		.join("|")}`,
	"g"
);

export const formatDate = (date, format) =>
	format.replace(TOKEN_RE, (match, literal) => (literal !== undefined ? literal : TOKENS[match](date)));

/** Named presets, inserted into the text as {name}. */
export const PRESETS = [
	{ name: "date", format: "YYYY-MM-DD", label: "Date (ISO)" },
	{ name: "day", format: "dddd", label: "Day of week" },
	{ name: "dayshort", format: "ddd", label: "Day of week (short)" },
	{ name: "daydate", format: "ddd D MMM", label: "Day + date" },
	{ name: "longdate", format: "dddd, MMMM DDDD YYYY", label: "Long date" },
	{ name: "us", format: "MM/DD/YYYY", label: "US date" },
	{ name: "eu", format: "DD.MM.YYYY", label: "EU date" },
	{ name: "uk", format: "DD/MM/YY", label: "Short date" },
	{ name: "monthyear", format: "MMMM YYYY", label: "Month + year" },
	{ name: "time", format: "HH:mm", label: "Time (24h)" },
	{ name: "time12", format: "h:mm A", label: "Time (12h)" },
	{ name: "datetime", format: "YYYY-MM-DD HH:mm", label: "Date + time" },
	{ name: "stamp", format: "ddd D MMM, h:mm a", label: "Friendly timestamp" },
	{ name: "iso", format: "YYYY-MM-DD[T]HH:mm:ss", label: "ISO timestamp" },
	{ name: "week", format: "[Week] WW", label: "Week number" },
	{ name: "quarter", format: "[Q]Q YYYY", label: "Quarter" },
	{ name: "unix", format: "X", label: "Unix time" },
];
const PRESET_MAP = new Map(PRESETS.map((p) => [p.name, p.format]));

/**
 * Replaces timestamp placeholders in text:
 *   {date}, {time}, ... – named presets
 *   {t:FORMAT}          – custom format, e.g. {t:ddd HH:mm}
 * Unknown {braces} are left untouched.
 */
export const expandTimestamps = (text, date) =>
	text.replace(/\{(t:([^}]*)|[a-z0-9]+)\}/gi, (match, key, custom) => {
		if (custom !== undefined) return formatDate(date, custom);
		const format = PRESET_MAP.get(key.toLowerCase());
		return format ? formatDate(date, format) : match;
	});

export const hasTimestamps = (text) => expandTimestamps(text, new Date(0)) !== text;
