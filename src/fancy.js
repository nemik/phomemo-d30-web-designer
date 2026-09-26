/**
 * "Fancy text" styles built from Unicode lookalike characters. These render with
 * whatever system font has the glyphs, so they stack with (or replace) the chosen font.
 */
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

/** Builds a mapper from the Mathematical Alphanumeric Symbols block, with exceptions for holes. */
const mathAlpha = (upperStart, lowerStart, digitStart, exceptions = {}) => (ch) => {
	if (exceptions[ch]) return exceptions[ch];
	let i = UPPER.indexOf(ch);
	if (i >= 0 && upperStart) return String.fromCodePoint(upperStart + i);
	i = LOWER.indexOf(ch);
	if (i >= 0 && lowerStart) return String.fromCodePoint(lowerStart + i);
	i = DIGITS.indexOf(ch);
	if (i >= 0 && digitStart) return String.fromCodePoint(digitStart + i);
	return ch;
};

/** Builds a mapper from explicit lookalike strings (indexed like UPPER/LOWER/DIGITS). */
const table = (upper, lower = upper.toLowerCase(), digits = DIGITS) => {
	const map = new Map();
	[...upper].forEach((c, i) => map.set(UPPER[i], c));
	[...lower].forEach((c, i) => map.set(LOWER[i], c));
	[...digits].forEach((c, i) => map.set(DIGITS[i], c));
	return (ch) => map.get(ch) ?? ch;
};

const combining = (mark) => (text) =>
	[...text].map((c) => (/\s/.test(c) ? c : c + mark)).join("");

// Small deterministic PRNG so zalgo doesn't jitter on every re-render.
const rng = (seed) => () => {
	seed = (seed * 1664525 + 1013904223) >>> 0;
	return seed / 2 ** 32;
};
const ZALGO_UP = [..."\u030d\u030e\u0304\u0305\u033f\u0311\u0306\u0310\u0352\u0357\u0351\u0307\u0308\u030a\u0342\u0343\u0344\u034a\u034b\u034c\u0303\u0302\u030c\u0350\u0300\u0301\u030b\u030f\u0312\u0313\u0314\u033d\u0309\u0363\u0364\u0365\u0366\u0367\u0368\u0369\u036a\u036b\u036c\u036d\u036e\u036f\u033e\u035b"];
const ZALGO_DOWN = [..."\u0316\u0317\u0318\u0319\u031c\u031d\u031e\u031f\u0320\u0324\u0325\u0326\u0329\u032a\u032b\u032c\u032d\u032e\u032f\u0330\u0331\u0332\u0333\u0339\u033a\u033b\u033c\u0345\u0347\u0348\u0349\u034d\u034e\u0353\u0354\u0355\u0356\u0359\u035a\u0323"];
const zalgo = (text) => {
	const rand = rng(42);
	const pick = (arr) => arr[Math.floor(rand() * arr.length)];
	return [...text]
		.map((c) => {
			if (/\s/.test(c)) return c;
			let out = c;
			for (let i = 0; i < 1 + rand() * 3; i++) out += pick(ZALGO_UP);
			for (let i = 0; i < 1 + rand() * 3; i++) out += pick(ZALGO_DOWN);
			return out;
		})
		.join("");
};

const FLIP = {
	a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ", k: "ʞ", l: "l",
	m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x",
	y: "ʎ", z: "z", A: "∀", B: "ᗺ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I", J: "ſ",
	K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Ό", R: "ᴚ", S: "S", T: "⊥", U: "∩", V: "Λ",
	W: "M", X: "X", Y: "⅄", Z: "Z", 1: "Ɩ", 2: "ᄅ", 3: "Ɛ", 4: "ㄣ", 5: "ϛ", 6: "9", 7: "ㄥ", 8: "8",
	9: "6", 0: "0", ".": "˙", ",": "'", "'": ",", '"': "„", "?": "¿", "!": "¡", "(": ")", ")": "(",
	"[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "&": "⅋", _: "‾",
};
const upsideDown = (text) =>
	text
		.split("\n")
		.map((line) => [...line].reverse().map((c) => FLIP[c] ?? c).join(""))
		.reverse()
		.join("\n");

const perChar = (fn) => (text) => [...text].map(fn).join("");

export const FANCY_STYLES = [
	{ id: "none", label: "None" },
	{ id: "fraktur", label: "𝔉𝔯𝔞𝔨𝔱𝔲𝔯", fn: perChar(mathAlpha(0x1d504, 0x1d51e, 0, { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ", Z: "ℨ" })) },
	{ id: "boldfraktur", label: "𝕭𝖔𝖑𝖉 𝕱𝖗𝖆𝖐𝖙𝖚𝖗", fn: perChar(mathAlpha(0x1d56c, 0x1d586, 0)) },
	{ id: "script", label: "𝒮𝒸𝓇𝒾𝓅𝓉", fn: perChar(mathAlpha(0x1d49c, 0x1d4b6, 0, { B: "ℬ", E: "ℰ", F: "ℱ", H: "ℋ", I: "ℐ", L: "ℒ", M: "ℳ", R: "ℛ", e: "ℯ", g: "ℊ", o: "ℴ" })) },
	{ id: "boldscript", label: "𝓑𝓸𝓵𝓭 𝓢𝓬𝓻𝓲𝓹𝓽", fn: perChar(mathAlpha(0x1d4d0, 0x1d4ea, 0)) },
	{ id: "double", label: "𝔻𝕠𝕦𝕓𝕝𝕖 𝕤𝕥𝕣𝕦𝕔𝕜", fn: perChar(mathAlpha(0x1d538, 0x1d552, 0x1d7d8, { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" })) },
	{ id: "bold", label: "𝐁𝐨𝐥𝐝 𝐬𝐞𝐫𝐢𝐟", fn: perChar(mathAlpha(0x1d400, 0x1d41a, 0x1d7ce)) },
	{ id: "bolditalic", label: "𝑩𝒐𝒍𝒅 𝒊𝒕𝒂𝒍𝒊𝒄", fn: perChar(mathAlpha(0x1d468, 0x1d482, 0)) },
	{ id: "sansbold", label: "𝗦𝗮𝗻𝘀 𝗯𝗼𝗹𝗱", fn: perChar(mathAlpha(0x1d5d4, 0x1d5ee, 0x1d7ec)) },
	{ id: "mono", label: "𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎", fn: perChar(mathAlpha(0x1d670, 0x1d68a, 0x1d7f6)) },
	{ id: "circled", label: "Ⓒⓘⓡⓒⓛⓔⓓ", fn: perChar(table("ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ", "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ", "⓪①②③④⑤⑥⑦⑧⑨")) },
	{ id: "negcircled", label: "🅝🅔🅖 🅒🅘🅡🅒🅛🅔", fn: perChar(table("🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩", "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩", "⓿❶❷❸❹❺❻❼❽❾")) },
	{ id: "squared", label: "🄱🄾🅇🄴🄳", fn: perChar(table("🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉", "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉")) },
	{ id: "smallcaps", label: "ꜱᴍᴀʟʟ ᴄᴀᴘꜱ", fn: perChar(table("ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ", "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ")) },
	{ id: "wide", label: "Ｗｉｄｅ", fn: perChar(table("ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ", "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ", "０１２３４５６７８９")) },
	{ id: "upsidedown", label: "uʍop ǝpısd∩", fn: upsideDown },
	{ id: "strike", label: "S̶t̶r̶i̶k̶e̶", fn: combining("\u0336") },
	{ id: "underline", label: "U̲n̲d̲e̲r̲l̲i̲n̲e̲", fn: combining("\u0332") },
	{ id: "slash", label: "S̸l̸a̸s̸h̸", fn: combining("\u0338") },
	{ id: "zalgo", label: "Z̷̢a̶͓l̵̮g̷͚o̸̹", fn: zalgo },
];

export const applyFancy = (text, id) => {
	const style = FANCY_STYLES.find((s) => s.id === id);
	return style?.fn ? style.fn(text) : text;
};
