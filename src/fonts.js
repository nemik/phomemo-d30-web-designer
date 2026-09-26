/**
 * Fonts available in the text designer, grouped for the font picker.
 * Everything except the "System" group is loaded from Google Fonts.
 */
export const FONT_GROUPS = [
	{
		label: "System",
		fonts: ["sans-serif", "serif", "monospace", "cursive", "fantasy"],
	},
	{
		label: "Spooky & gross",
		fonts: [
			"Creepster",
			"Nosifer",
			"Butcherman",
			"Eater",
			"Rubik Wet Paint",
			"Rubik Beastly",
			"Rubik Glitch",
			"Rubik Microbe",
			"Rubik Puddles",
			"Rubik Moonrocks",
			"Frijole",
			"Metal Mania",
			"Griffy",
		],
	},
	{
		label: "Outline & shadow",
		fonts: [
			"Monoton",
			"Bungee Shade",
			"Bungee Outline",
			"Bungee Hairline",
			"Londrina Sketch",
			"Londrina Shadow",
			"Codystar",
			"Megrim",
			"Vast Shadow",
			"Faster One",
			"Rampart One",
			"Tilt Prism",
			"Zen Tokyo Zoo",
			"Plaster",
		],
	},
	{
		label: "Pixel & retro tech",
		fonts: [
			"Press Start 2P",
			"VT323",
			"Silkscreen",
			"Pixelify Sans",
			"Tiny5",
			"Jersey 10",
			"Micro 5",
			"Sixtyfour",
			"Workbench",
			"Doto",
			"Handjet",
			"Major Mono Display",
			"Orbitron",
			"Audiowide",
			"Share Tech Mono",
			"Special Elite",
		],
	},
	{
		label: "Blackletter & old",
		fonts: [
			"UnifrakturMaguntia",
			"Grenze Gotisch",
			"Jacquard 24",
			"Pirata One",
			"IM Fell English",
			"Almendra Display",
			"Uncial Antiqua",
		],
	},
	{
		label: "Western & circus",
		fonts: ["Rye", "Sancreek", "Ewert", "Fascinate", "Emblema One", "Diplomata", "Ultra", "Smokum"],
	},
	{
		label: "Chunky & loud",
		fonts: [
			"Bangers",
			"Bungee",
			"Titan One",
			"Luckiest Guy",
			"Rubik Mono One",
			"Black Ops One",
			"Alfa Slab One",
			"Chango",
			"Bowlby One",
			"Shojumaru",
			"Barrio",
			"Anton",
			"Bebas Neue",
			"Staatliches",
		],
	},
	{
		label: "Script & handwriting",
		fonts: [
			"Pacifico",
			"Lobster",
			"Permanent Marker",
			"Rock Salt",
			"Caveat",
			"Gloria Hallelujah",
			"Homemade Apple",
			"Sacramento",
			"Great Vibes",
			"Fredericka the Great",
			"Cabin Sketch",
			"Indie Flower",
		],
	},
	{
		label: "Clean",
		fonts: ["Inter", "Roboto Condensed", "Oswald", "Space Grotesk", "IBM Plex Mono", "Barlow Condensed"],
	},
];

/** Monochrome emoji font – prints much better on a 1-bit thermal printer than colour emoji. */
export const MONO_EMOJI_FONT = "Noto Emoji";

const SYSTEM_FONTS = new Set(FONT_GROUPS[0].fonts);

export const ALL_FONTS = FONT_GROUPS.flatMap((g) => g.fonts);

/** Adds a single Google Fonts stylesheet covering every web font. Font files load lazily. */
export const injectFontStylesheet = () => {
	const families = [...ALL_FONTS.filter((f) => !SYSTEM_FONTS.has(f)), MONO_EMOJI_FONT];
	const query = families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}`);
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = `https://fonts.googleapis.com/css2?${query.join("&")}&display=block`;
	document.head.appendChild(link);
	return new Promise((resolve) => {
		link.addEventListener("load", resolve);
		link.addEventListener("error", resolve);
	});
};

/** CSS font-family value for a font name, quoting web fonts. */
export const cssFamily = (font) => (SYSTEM_FONTS.has(font) ? font : `"${font}"`);

/**
 * Ensures the glyphs needed for `text` are loaded for every family in `families`,
 * so the canvas doesn't render with a fallback font.
 */
export const loadFonts = async (families, text, { weight = "", style = "" } = {}) => {
	const sample = text || "A";
	await Promise.all(
		families
			.filter((f) => !SYSTEM_FONTS.has(f))
			.map((f) =>
				document.fonts.load(`${style} ${weight} 16px "${f}"`, sample).catch(() => undefined)
			)
	);
};
