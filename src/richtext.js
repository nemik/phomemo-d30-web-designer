/**
 * Text layout for the canvas that supports custom emoji images inline with text.
 *
 * Icons are written as :shortcode: in the text. encodeIcons() swaps each one for a Private Use
 * Area character, so later text transforms (fancy Unicode styles, upside-down, …) leave it alone,
 * and drawRichText() draws those characters as images.
 */
const PUA_START = 0xe000;
export const encodeIcons = (text, icons) =>
	text.replace(/:([a-z0-9_-]+):/gi, (match, name) => {
		const i = icons.findIndex((icon) => icon.name === name.toLowerCase());
		return i < 0 ? match : String.fromCodePoint(PUA_START + i);
	});

const graphemes = (text) => [...new Intl.Segmenter().segment(text)].map((s) => s.segment);

/** Splits a line into words, runs of whitespace and icons. */
const tokenize = (line, icons) => {
	const tokens = [];
	// An icon swallows any combining marks that styles like zalgo or strikethrough added to it
	for (const [, icon, space, word] of line.matchAll(
		/([\uE000-\uF8FF])\p{M}*|(\s+)|([^\s\uE000-\uF8FF]+)/gu
	)) {
		if (icon) {
			const found = icons[icon.codePointAt(0) - PUA_START];
			if (found) tokens.push({ type: "icon", icon: found });
		} else if (space) tokens.push({ type: "space", text: space });
		else tokens.push({ type: "word", text: word });
	}
	return tokens;
};

/** Greedy word wrap. Words wider than the whole line are broken between characters. */
const layoutLines = (ctx, text, icons, maxWidth, iconSize) => {
	const measure = (token) =>
		token.type === "icon"
			? iconSize * token.icon.scale * token.icon.aspect
			: ctx.measureText(token.text).width;
	const lines = [];

	for (const paragraph of text.split("\n")) {
		let line = [];
		let width = 0;
		const add = (token) => {
			line.push(token);
			width += token.width;
		};
		const newLine = () => {
			while (line.length && line[line.length - 1].type === "space") width -= line.pop().width;
			lines.push({ tokens: line, width });
			line = [];
			width = 0;
		};

		for (const token of tokenize(paragraph, icons)) {
			token.width = measure(token);
			if (token.type === "space") {
				if (line.length) add(token);
				continue;
			}
			if (line.length && width + token.width > maxWidth) newLine();
			if (token.type === "word" && token.width > maxWidth) {
				let chunk = "";
				for (const g of graphemes(token.text)) {
					if (chunk && width + ctx.measureText(chunk + g).width > maxWidth) {
						add({ type: "word", text: chunk, width: ctx.measureText(chunk).width });
						newLine();
						chunk = "";
					}
					chunk += g;
				}
				token.text = chunk;
				token.width = ctx.measureText(chunk).width;
			}
			add(token);
		}
		newLine();
	}
	return lines;
};

/**
 * Draws wrapped, aligned text with inline icons into the box x/y/width/height.
 * Icons are drawn one font-size tall (times their own scale), centred on the text.
 */
export const drawRichText = (
	ctx,
	text,
	icons,
	{ x, y, width, height, font, fontSize, lineHeight, align = "center", vAlign = "middle" }
) => {
	ctx.font = font;
	ctx.textAlign = "left";
	ctx.textBaseline = "alphabetic";

	const iconSize = fontSize;
	const lines = layoutLines(ctx, text, icons, width, iconSize);
	const metrics = ctx.measureText("Hg");
	const ascent = metrics.fontBoundingBoxAscent;
	const descent = metrics.fontBoundingBoxDescent;

	const blockHeight = lines.length * lineHeight;
	let top =
		vAlign === "top" ? y : vAlign === "bottom" ? y + height - blockHeight : y + (height - blockHeight) / 2;

	for (const line of lines) {
		const baseline = top + (lineHeight - (ascent + descent)) / 2 + ascent;
		const iconCenter = baseline - (ascent - descent) / 2;
		let cx = align === "left" ? x : align === "right" ? x + width - line.width : x + (width - line.width) / 2;
		for (const token of line.tokens) {
			if (token.type === "icon") {
				const size = iconSize * token.icon.scale;
				ctx.drawImage(token.icon.image, cx, iconCenter - size / 2, token.width, size);
			} else ctx.fillText(token.text, cx, baseline);
			cx += token.width;
		}
		top += lineHeight;
	}
};
