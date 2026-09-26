/**
 * Cartoon label templates: line art with a stretchy middle section that holds text.
 *
 * Templates are drawn horizontally (as the label reads), `w` × `h` pixels, and scale with the
 * label height `h`. Every template faces left; flipping is handled by the caller.
 *
 * Each template provides:
 *   insets(h)          – space the art needs around the text box, so the label can be stretched
 *                        to fit any text length: { left, right, top, bottom }
 *   draw(ctx, w, h, lw) – draws the art with line width `lw`
 */

const ellipse = (cx, cy, rx, ry, rotation = 0) => {
	const p = new Path2D();
	p.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
	return p;
};

const rrect = (x, y, w, h, r) => {
	const p = new Path2D();
	p.roundRect(x, y, w, h, r);
	return p;
};

const poly = (...points) => {
	const p = new Path2D();
	points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
	p.closePath();
	return p;
};

/** Draws the paths as one white shape with a single black outline around their union. */
const outline = (ctx, lw, ...paths) => {
	ctx.save();
	ctx.lineJoin = "round";
	ctx.strokeStyle = "#000";
	ctx.lineWidth = lw * 2;
	for (const p of paths) ctx.stroke(p);
	ctx.fillStyle = "#fff";
	for (const p of paths) ctx.fill(p);
	ctx.restore();
};

/** Draws an open path as an outlined tube, e.g. a tail. */
const tube = (ctx, lw, path, width) => {
	ctx.save();
	ctx.lineCap = "round";
	ctx.lineWidth = width + lw * 2;
	ctx.strokeStyle = "#000";
	ctx.stroke(path);
	ctx.lineWidth = width;
	ctx.strokeStyle = "#fff";
	ctx.stroke(path);
	ctx.restore();
};

const stroke = (ctx, lw, path) => {
	ctx.save();
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.lineWidth = lw;
	ctx.strokeStyle = "#000";
	ctx.stroke(path);
	ctx.restore();
};

const fill = (ctx, path) => {
	ctx.fillStyle = "#000";
	ctx.fill(path);
};

const longCat = {
	id: "longcat",
	label: "🐈 Long cat",
	insets: (h) => ({ left: 0.78 * h, right: 0.44 * h, top: 0.33 * h, bottom: 0.23 * h }),
	draw(ctx, w, u, lw) {
		const r = 0.28 * u;
		const hx = 0.14 * u + r;
		const hy = 0.52 * u;
		const top = 0.26 * u;
		const bottom = 0.84 * u;
		const end = w - 0.3 * u;

		const tail = new Path2D();
		tail.moveTo(end - 0.1 * u, top + 0.15 * u);
		tail.bezierCurveTo(end + 0.15 * u, top + 0.1 * u, w - 0.2 * u, 0.3 * u, w - 0.08 * u, 0.08 * u);
		tube(ctx, lw, tail, 0.09 * u);

		for (const x of [hx - 0.05 * u, hx + 0.12 * u, end - 0.45 * u, end - 0.28 * u])
			outline(ctx, lw, rrect(x, bottom - 0.15 * u, 0.11 * u, 0.28 * u, 0.05 * u));

		outline(ctx, lw, rrect(hx, top, end - hx, bottom - top, (bottom - top) / 2));

		// Ears, then the head covering their base
		for (const s of [-1, 1]) {
			outline(ctx, lw, poly([hx + s * 0.9 * r, hy - 0.35 * r], [hx + s * 0.8 * r, hy - 1.5 * r], [hx + s * 0.15 * r, hy - 0.95 * r]));
			stroke(ctx, lw * 0.7, poly([hx + s * 0.72 * r, hy - 0.6 * r], [hx + s * 0.72 * r, hy - 1.2 * r], [hx + s * 0.35 * r, hy - 0.9 * r]));
		}
		outline(ctx, lw, ellipse(hx, hy, r, r));

		// Face
		for (const s of [-1, 1]) fill(ctx, ellipse(hx + s * 0.38 * r, hy - 0.08 * r, 0.1 * r, 0.14 * r));
		fill(ctx, poly([hx - 0.1 * r, hy + 0.18 * r], [hx + 0.1 * r, hy + 0.18 * r], [hx, hy + 0.3 * r]));
		const mouth = new Path2D();
		mouth.moveTo(hx - 0.25 * r, hy + 0.38 * r);
		mouth.quadraticCurveTo(hx - 0.12 * r, hy + 0.5 * r, hx, hy + 0.3 * r);
		mouth.quadraticCurveTo(hx + 0.12 * r, hy + 0.5 * r, hx + 0.25 * r, hy + 0.38 * r);
		stroke(ctx, lw * 0.8, mouth);

		const whiskers = new Path2D();
		for (const i of [-1, 0, 1]) {
			whiskers.moveTo(hx - 0.45 * r, hy + 0.28 * r + i * 0.1 * r);
			whiskers.lineTo(hx - 1.35 * r, hy + 0.2 * r + i * 0.3 * r);
			whiskers.moveTo(hx + 0.45 * r, hy + 0.28 * r + i * 0.1 * r);
			whiskers.lineTo(hx + 1.3 * r, hy + 0.2 * r + i * 0.3 * r);
		}
		stroke(ctx, Math.max(1, lw * 0.6), whiskers);
	},
};

const wienerDog = {
	id: "wiener",
	label: "🐕 Wiener dog",
	insets: (h) => ({ left: 0.68 * h, right: 0.42 * h, top: 0.36 * h, bottom: 0.26 * h }),
	draw(ctx, w, u, lw) {
		const top = 0.3 * u;
		const bottom = 0.8 * u;
		const start = 0.4 * u;
		const end = w - 0.28 * u;

		const tail = new Path2D();
		tail.moveTo(end - 0.08 * u, top + 0.1 * u);
		tail.quadraticCurveTo(end + 0.1 * u, top, w - 0.06 * u, 0.1 * u);
		tube(ctx, lw, tail, 0.06 * u);

		for (const x of [start + 0.08 * u, start + 0.24 * u, end - 0.4 * u, end - 0.24 * u])
			outline(ctx, lw, rrect(x, bottom - 0.12 * u, 0.1 * u, 0.28 * u, [0, 0, 0.04 * u, 0.04 * u]));

		outline(ctx, lw, rrect(start, top, end - start, bottom - top, (bottom - top) / 2));

		outline(ctx, lw, ellipse(0.42 * u, 0.4 * u, 0.2 * u, 0.19 * u), ellipse(0.2 * u, 0.5 * u, 0.17 * u, 0.1 * u));
		fill(ctx, ellipse(0.05 * u, 0.47 * u, 0.045 * u, 0.04 * u));
		fill(ctx, ellipse(0.35 * u, 0.34 * u, 0.03 * u, 0.035 * u));
		const mouth = new Path2D();
		mouth.moveTo(0.1 * u, 0.57 * u);
		mouth.quadraticCurveTo(0.2 * u, 0.62 * u, 0.29 * u, 0.57 * u);
		stroke(ctx, lw * 0.8, mouth);

		outline(ctx, lw, ellipse(0.54 * u, 0.46 * u, 0.08 * u, 0.2 * u, -0.25));
	},
};

const snake = {
	id: "snake",
	label: "🐍 Snake",
	insets: (h) => ({ left: 0.66 * h, right: 0.6 * h, top: 0.35 * h, bottom: 0.31 * h }),
	draw(ctx, w, u, lw) {
		const top = 0.3 * u;
		const bottom = 0.74 * u;
		const hx = 0.37 * u;

		const tongue = new Path2D();
		tongue.moveTo(0.14 * u, 0.58 * u);
		tongue.lineTo(0.07 * u, 0.58 * u);
		tongue.lineTo(0.02 * u, 0.52 * u);
		tongue.moveTo(0.07 * u, 0.58 * u);
		tongue.lineTo(0.02 * u, 0.64 * u);
		stroke(ctx, lw, tongue);

		const body = new Path2D();
		body.moveTo(hx, top);
		body.lineTo(w - 0.55 * u, top);
		body.bezierCurveTo(w - 0.25 * u, top, w - 0.2 * u, 0.2 * u, w - 0.04 * u, 0.12 * u);
		body.bezierCurveTo(w - 0.12 * u, 0.45 * u, w - 0.3 * u, bottom, w - 0.55 * u, bottom);
		body.lineTo(hx, bottom);
		body.closePath();
		outline(ctx, lw, body);
		// Head in front of the body, wider than the neck
		outline(ctx, lw, ellipse(hx, 0.5 * u, 0.24 * u, 0.27 * u));

		outline(ctx, lw, ellipse(hx - 0.04 * u, 0.4 * u, 0.07 * u, 0.07 * u));
		fill(ctx, ellipse(hx - 0.04 * u, 0.4 * u, 0.025 * u, 0.05 * u));
		fill(ctx, ellipse(0.2 * u, 0.47 * u, 0.018 * u, 0.018 * u));
		const mouth = new Path2D();
		mouth.moveTo(0.16 * u, 0.6 * u);
		mouth.quadraticCurveTo(0.27 * u, 0.66 * u, 0.4 * u, 0.61 * u);
		stroke(ctx, lw * 0.8, mouth);

	},
};

const banner = {
	id: "banner",
	label: "🎀 Ribbon banner",
	insets: (h) => ({ left: 0.3 * h, right: 0.3 * h, top: 0.14 * h, bottom: 0.36 * h }),
	draw(ctx, w, u, lw) {
		const bandTop = 0.08 * u;
		const bandBottom = 0.7 * u;
		const tailTop = 0.28 * u;
		const tailBottom = 0.92 * u;
		for (const s of [1, -1]) {
			// Mirror x for the right-hand tail
			const x = (v) => (s === 1 ? v * u : w - v * u);
			outline(ctx, lw, poly([x(0.02), tailTop], [x(0.34), tailTop], [x(0.34), tailBottom], [x(0.02), tailBottom], [x(0.12), (tailTop + tailBottom) / 2]));
			fill(ctx, poly([x(0.2), bandBottom], [x(0.34), bandBottom], [x(0.34), tailBottom]));
			stroke(ctx, lw, poly([x(0.2), bandBottom], [x(0.34), bandBottom], [x(0.34), tailBottom]));
		}
		outline(ctx, lw, rrect(0.2 * u, bandTop, w - 0.4 * u, bandBottom - bandTop, 0.02 * u));
	},
};

const bone = {
	id: "bone",
	label: "🦴 Dog bone",
	insets: (h) => ({ left: 0.42 * h, right: 0.42 * h, top: 0.26 * h, bottom: 0.26 * h }),
	draw(ctx, w, u, lw) {
		const r = 0.2 * u;
		outline(
			ctx,
			lw,
			rrect(0.2 * u, 0.22 * u, w - 0.4 * u, 0.56 * u, 0),
			ellipse(0.2 * u, 0.29 * u, r, r),
			ellipse(0.2 * u, 0.71 * u, r, r),
			ellipse(w - 0.2 * u, 0.29 * u, r, r),
			ellipse(w - 0.2 * u, 0.71 * u, r, r)
		);
	},
};

const pencil = {
	id: "pencil",
	label: "✏️ Pencil",
	insets: (h) => ({ left: 0.48 * h, right: 0.62 * h, top: 0.26 * h, bottom: 0.26 * h }),
	draw(ctx, w, u, lw) {
		const top = 0.12 * u;
		const bottom = 0.88 * u;
		outline(ctx, lw, poly([0.03 * u, 0.5 * u], [0.4 * u, top], [0.4 * u, bottom]));
		fill(ctx, poly([0.03 * u, 0.5 * u], [0.14 * u, 0.385 * u], [0.14 * u, 0.615 * u]));
		outline(ctx, lw, rrect(w - 0.36 * u, top, 0.33 * u, bottom - top, [0, 0.14 * u, 0.14 * u, 0]));
		outline(ctx, lw, rrect(0.4 * u, top, w - 0.95 * u, bottom - top, 0));
		const stripes = new Path2D();
		stripes.moveTo(0.4 * u, 0.2 * u);
		stripes.lineTo(w - 0.55 * u, 0.2 * u);
		stripes.moveTo(0.4 * u, 0.8 * u);
		stripes.lineTo(w - 0.55 * u, 0.8 * u);
		stroke(ctx, lw * 0.6, stripes);
		outline(ctx, lw, rrect(w - 0.55 * u, top - 0.03 * u, 0.19 * u, bottom - top + 0.06 * u, 0));
		const ferrule = new Path2D();
		for (const x of [0.49, 0.42]) {
			ferrule.moveTo(w - x * u, top);
			ferrule.lineTo(w - x * u, bottom);
		}
		stroke(ctx, lw * 0.7, ferrule);
	},
};

export const CARTOONS = [longCat, wienerDog, snake, banner, bone, pencil];

/** Measures multi-line text as a block, using the real ink bounds for vertical size. */
export const measureTextBlock = (ctx, lines, font, lineSpacing) => {
	ctx.font = font.css;
	const metrics = lines.map((line) => ctx.measureText(line || " "));
	const first = metrics[0];
	const last = metrics[metrics.length - 1];
	const ascent = first.actualBoundingBoxAscent || font.size * 0.7;
	const descent = last.actualBoundingBoxDescent;
	return {
		width: Math.max(...metrics.map((m) => m.width)),
		height: ascent + descent + (lines.length - 1) * font.size * lineSpacing,
		ascent,
	};
};

/** Largest font size (px) at which the text fits in `maxWidth` × `maxHeight`. */
export const fitFontSize = (ctx, lines, fontAt, lineSpacing, maxWidth, maxHeight) => {
	let lo = 4;
	let hi = Math.max(lo, Math.ceil(maxHeight * 3));
	while (lo < hi) {
		const mid = Math.ceil((lo + hi) / 2);
		const block = measureTextBlock(ctx, lines, fontAt(mid), lineSpacing);
		if (block.width <= maxWidth && block.height <= maxHeight) lo = mid;
		else hi = mid - 1;
	}
	return lo;
};

/**
 * Draws a cartoon with its text centred in the stretchy middle section.
 * @param {CanvasRenderingContext2D} ctx context of a `w` × `h` canvas (horizontal)
 */
export const drawCartoon = (ctx, { template, w, h, lineWidth, flip, lines, font, lineSpacing }) => {
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, w, h);

	ctx.save();
	if (flip) {
		ctx.translate(w, 0);
		ctx.scale(-1, 1);
	}
	template.draw(ctx, w, h, lineWidth);
	ctx.restore();

	const insets = template.insets(h);
	const box = {
		x: flip ? insets.right : insets.left,
		y: insets.top,
		w: w - insets.left - insets.right,
		h: h - insets.top - insets.bottom,
	};
	const block = measureTextBlock(ctx, lines, font, lineSpacing);
	ctx.fillStyle = "#000";
	ctx.textAlign = "center";
	ctx.textBaseline = "alphabetic";
	let y = box.y + (box.h - block.height) / 2 + block.ascent;
	for (const line of lines) {
		ctx.fillText(line, box.x + box.w / 2, y);
		y += font.size * lineSpacing;
	}
};
