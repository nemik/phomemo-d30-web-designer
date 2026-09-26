/**
 * Converts a canvas in place to pure black & white so the preview matches exactly
 * what the 1-bit thermal printer will output.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ mode?: "threshold" | "dither", threshold?: number, invert?: boolean }} options
 */
export const toMonochrome = (canvas, { mode = "threshold", threshold = 128, invert = false } = {}) => {
	const ctx = canvas.getContext("2d");
	const { width, height } = canvas;
	const image = ctx.getImageData(0, 0, width, height);
	const px = image.data;

	// Luminance, compositing any transparency onto white
	const lum = new Float32Array(width * height);
	for (let i = 0; i < lum.length; i++) {
		const a = px[i * 4 + 3] / 255;
		const l = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
		lum[i] = l * a + 255 * (1 - a);
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			const old = lum[i];
			const value = old < threshold ? 0 : 255;
			if (mode === "dither") {
				// Floyd–Steinberg error diffusion
				const err = old - value;
				if (x + 1 < width) lum[i + 1] += (err * 7) / 16;
				if (y + 1 < height) {
					if (x > 0) lum[i + width - 1] += (err * 3) / 16;
					lum[i + width] += (err * 5) / 16;
					if (x + 1 < width) lum[i + width + 1] += err / 16;
				}
			}
			const out = invert ? 255 - value : value;
			px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = out;
			px[i * 4 + 3] = 255;
		}
	}

	ctx.putImageData(image, 0, 0);
};
