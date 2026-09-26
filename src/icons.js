/**
 * Custom emoji loaded from the icons/ directory.
 *
 * Static hosting can't list a directory, so icons/index.json lists the files to load. Entries are
 * either a file name or { "file": "…", "scale": 1.2 } to draw that icon larger/smaller than the text.
 * Each icon's shortcode is its file name without the extension, e.g. chichu.png → :chichu:
 */
const ICON_DIR = "icons/";

const shortcodeFor = (file) =>
	file
		.replace(/\.[^.]+$/, "")
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "_");

const loadImage = async (url) => {
	const image = new Image();
	image.src = url;
	await image.decode();
	return image;
};

// Tones this far from the ink towards the paper still count as ink (end up darker than mid-grey)
const INK_CUTOFF = 0.75;

/**
 * Greyscales an image and stretches its levels so its darkest tones become black and its
 * paper/background white. Scanned or pencil drawings are often grey-on-grey, which would mostly
 * vanish when the label is converted to black & white.
 */
const autoLevel = (image) => {
	const canvas = document.createElement("canvas");
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	ctx.drawImage(image, 0, 0);
	const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const px = data.data;

	const lum = new Uint8ClampedArray(px.length / 4);
	const histogram = new Array(256).fill(0);
	let opaque = 0;
	for (let i = 0; i < lum.length; i++) {
		lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
		if (px[i * 4 + 3] > 127) {
			histogram[lum[i]]++;
			opaque++;
		}
	}

	// Percentiles, so a few stray pixels don't set the range. The paper tone is taken from the
	// 90th percentile since backgrounds are usually the largest light area.
	const percentile = (p) => {
		let count = 0;
		for (let v = 0; v < 256; v++) if ((count += histogram[v]) >= opaque * p) return v;
		return 255;
	};
	const black = percentile(0.01);
	const white = percentile(0.9);
	const range = Math.max(1, white - black);
	const gamma = Math.log(0.5) / Math.log(INK_CUTOFF);

	for (let i = 0; i < lum.length; i++) {
		const t = Math.min(1, Math.max(0, (lum[i] - black) / range));
		const v = white - black < 16 ? lum[i] : t ** gamma * 255;
		px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
	}
	ctx.putImageData(data, 0, 0);
	return canvas;
};

/** @returns {Promise<{ name: string, url: string, image: HTMLCanvasElement, aspect: number, scale: number }[]>} */
export const loadIcons = async () => {
	let files;
	try {
		const res = await fetch(`${ICON_DIR}index.json`);
		if (!res.ok) return [];
		files = await res.json();
	} catch {
		return [];
	}

	const icons = await Promise.all(
		files.map(async (entry) => {
			const { file, scale = 1 } = typeof entry === "string" ? { file: entry } : entry;
			const url = ICON_DIR + encodeURIComponent(file);
			try {
				const image = await loadImage(url);
				return {
					name: shortcodeFor(file),
					url,
					image: autoLevel(image),
					aspect: image.naturalWidth / image.naturalHeight,
					scale,
				};
			} catch {
				console.warn(`failed to load custom emoji ${url}`);
				return null;
			}
		})
	);
	return icons.filter(Boolean);
};
