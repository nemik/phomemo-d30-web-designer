"use strict";

import { drawText } from "https://cdn.jsdelivr.net/npm/canvas-txt@4.1.1/+esm";
import "https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1/index.js";
import { printCanvas } from "./src/printer.js";
import {
	ALL_FONTS,
	FONT_GROUPS,
	MONO_EMOJI_FONT,
	cssFamily,
	injectFontStylesheet,
	loadFonts,
} from "./src/fonts.js";
import { expandTimestamps, hasTimestamps, PRESETS } from "./src/timestamp.js";
import { FANCY_STYLES, applyFancy } from "./src/fancy.js";
import { toMonochrome } from "./src/mono.js";
import { CARTOONS, drawCartoon, fitFontSize, measureTextBlock } from "./src/cartoons.js";

const $ = document.querySelector.bind(document);
const $all = document.querySelectorAll.bind(document);

const labelSize = { width: 40, height: 12 };

const updateLabelSize = (canvas) => {
	const inputWidth = $("#inputWidth").valueAsNumber;
	const inputHeight = $("#inputHeight").valueAsNumber;
	if (isNaN(inputWidth) || isNaN(inputHeight)) {
		handleError("label size invalid");
		return;
	}

	labelSize.width = inputWidth;
	labelSize.height = inputHeight;

	// Image sent to printer is printed top to bottom, so reverse width and height
	canvas.width = labelSize.height * 8;
	canvas.height = labelSize.width * 8;
	updatePreviewLayout(canvas);
};

/** Sizes the preview, optionally rotated so it reads the way the label will. */
const updatePreviewLayout = (canvas) => {
	const wrap = $("#previewWrap");
	const horizontal = $("#inputPreviewHorizontal").checked;
	// Shown width/height, before any rotation
	const [w, h] = horizontal ? [canvas.height, canvas.width] : [canvas.width, canvas.height];
	const scale = horizontal ? Math.max(0.25, Math.min(2, ($("form").clientWidth - 16) / w)) : 1;
	wrap.style.width = `${w * scale}px`;
	wrap.style.height = `${h * scale}px`;
	canvas.style.width = `${canvas.width * scale}px`;
	canvas.style.height = `${canvas.height * scale}px`;
	canvas.style.transform = horizontal ? `translateY(${h * scale}px) rotate(-90deg)` : "";
};

/** Shortest label (mm) the "stretch to fit" option will produce. */
const MIN_LABEL_LENGTH_MM = 20;

const updateCanvasCartoon = async (canvas) => {
	const id = ++renderId;
	const template = CARTOONS.find((t) => t.id === $("#inputCartoon").value) ?? CARTOONS[0];
	const text = expandTimestamps($("#inputCartoonText").value, new Date());
	const lines = text.split("\n");
	const font = $("#inputCartoonFont").value;
	const weight = $("#inputCartoonBold").checked ? "bold" : "";
	const style = $("#inputCartoonItalic").checked ? "italic" : "";
	const autoSize = $("#inputCartoonAutoSize").checked;
	const stretch = $("#inputCartoonStretch").checked;
	const lineSpacing = 1.1;

	await fontsReady;
	await loadFonts([font, MONO_EMOJI_FONT], text, { weight, style });
	if (id !== renderId) return;

	const ctx = canvas.getContext("2d");
	const fontAt = (size) => ({
		size,
		css: `${style} ${weight} ${size}px ${cssFamily(font)}, "${MONO_EMOJI_FONT}", sans-serif`,
	});

	// The canvas is rotated for the printer, so the label's length is the canvas height
	const h = canvas.width;
	const insets = template.insets(h);
	const boxHeight = h - insets.top - insets.bottom;
	const boxWidth = stretch ? Infinity : canvas.height - insets.left - insets.right;

	let size = $("#inputCartoonFontSize").valueAsNumber;
	if (autoSize || isNaN(size)) {
		size = fitFontSize(ctx, lines, fontAt, lineSpacing, boxWidth, boxHeight);
		$("#inputCartoonFontSize").value = size;
	}

	if (stretch) {
		const textWidth = measureTextBlock(ctx, lines, fontAt(size), lineSpacing).width;
		const lengthMm = Math.max(
			MIN_LABEL_LENGTH_MM,
			Math.ceil((textWidth + insets.left + insets.right) / 8)
		);
		if (lengthMm !== labelSize.width) {
			$("#inputWidth").value = lengthMm;
			updateLabelSize(canvas);
		}
	}

	const w = canvas.height;
	const art = document.createElement("canvas");
	art.width = w;
	art.height = h;
	drawCartoon(art.getContext("2d"), {
		template,
		w,
		h,
		lineWidth: $("#inputCartoonLineWidth").valueAsNumber,
		flip: $("#inputCartoonFlip").checked,
		lines,
		font: fontAt(size),
		lineSpacing,
	});

	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate(Math.PI / 2);
	ctx.drawImage(art, -w / 2, -h / 2);
	ctx.restore();

	toMonochrome(canvas, { invert: $("#inputCartoonInvert").checked });
};

const setupCartoons = (canvas) => {
	const render = () => updateCanvasCartoon(canvas);
	for (const t of CARTOONS) $("#inputCartoon").appendChild(new Option(t.label, t.id));
	setupFontPicker(
		$("#inputCartoonFont"),
		$("#cartoonFontPrev"),
		$("#cartoonFontNext"),
		$("#cartoonFontRandom"),
		render
	);
	$("#inputCartoonFont").value = "Bangers";
	$("#inputCartoonAutoSize").addEventListener("input", (e) => {
		$("#inputCartoonFontSize").disabled = e.target.checked;
	});
	$all("#nav-cartoon input, #nav-cartoon select, #nav-cartoon textarea").forEach((e) =>
		e.addEventListener("input", render)
	);
};

const fontsReady = injectFontStylesheet();
const COLOR_EMOJI_FONTS = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';

// Incremented on every render so slow (font-loading) text renders don't draw over newer ones
let renderId = 0;

/** The date that timestamp placeholders are filled in with. */
const getTimestampDate = () => {
	const base = $("#inputTimestampBase").value;
	const date = base ? new Date(base) : new Date();
	const offset = $("#inputTimestampOffset").valueAsNumber;
	if (!isNaN(offset)) date.setDate(date.getDate() + offset);
	return date;
};

const updateCanvasText = async (canvas) => {
	const id = ++renderId;
	const fontSize = $("#inputFontSize").valueAsNumber;
	if (isNaN(fontSize)) {
		handleError("font size invalid");
		return;
	}

	const text = applyFancy(
		expandTimestamps($("#inputText").value, getTimestampDate()),
		$("#inputFancy").value
	);
	const font = $("#inputFont").value;
	const monoEmoji = $("#inputEmojiMono").checked;
	const fontWeight = $("#inputBold").checked ? "bold" : "";
	const fontStyle = $("#inputItalic").checked ? "italic" : "";
	const lineHeight = $("#inputLineHeight").valueAsNumber || 1.1;

	await fontsReady;
	await loadFonts(monoEmoji ? [font, MONO_EMOJI_FONT] : [font], text, {
		weight: fontWeight,
		style: fontStyle,
	});
	if (id !== renderId) return;

	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate(Math.PI / 2);

	ctx.fillStyle = "#000";
	drawText(ctx, text, {
		x: -canvas.height / 2,
		y: -canvas.width / 2,
		width: canvas.height,
		height: canvas.width,
		font: [
			cssFamily(font),
			monoEmoji ? `"${MONO_EMOJI_FONT}"` : COLOR_EMOJI_FONTS,
			"sans-serif",
		].join(", "),
		fontSize,
		fontWeight,
		fontStyle,
		lineHeight: fontSize * lineHeight,
		align: $("input[name=inputAlign]:checked").value,
		vAlign: $("input[name=inputVAlign]:checked").value,
	});

	ctx.rotate(-Math.PI / 2);
	ctx.translate(-canvas.width / 2, -canvas.height / 2);

	toMonochrome(canvas, {
		mode: $("#inputMonoMode").value,
		threshold: $("#inputThreshold").valueAsNumber,
		invert: $("#inputInvert").checked,
	});
};

const insertAtCursor = (textarea, str) => {
	// Until the user has placed the cursor, append rather than prepend
	if (!textarea.dataset.touched) textarea.setSelectionRange(textarea.value.length, textarea.value.length);
	textarea.setRangeText(str, textarea.selectionStart, textarea.selectionEnd, "end");
	textarea.focus();
	textarea.dispatchEvent(new Event("input", { bubbles: true }));
};

/** Fills a font <select> and wires up its previous/next/random buttons. */
const setupFontPicker = (select, prev, next, random, render) => {
	for (const group of FONT_GROUPS) {
		const optgroup = document.createElement("optgroup");
		optgroup.label = group.label;
		for (const font of group.fonts) optgroup.appendChild(new Option(font, font));
		select.appendChild(optgroup);
	}
	const setFont = (font) => {
		select.value = font;
		render();
	};
	const stepFont = (delta) => {
		const i = ALL_FONTS.indexOf(select.value);
		setFont(ALL_FONTS[(i + delta + ALL_FONTS.length) % ALL_FONTS.length]);
	};
	prev.addEventListener("click", () => stepFont(-1));
	next.addEventListener("click", () => stepFont(1));
	random.addEventListener("click", () =>
		setFont(ALL_FONTS[Math.floor(Math.random() * ALL_FONTS.length)])
	);
};

const setupTextDesigner = (canvas) => {
	const render = () => updateCanvasText(canvas);
	const textarea = $("#inputText");
	textarea.addEventListener("focus", () => (textarea.dataset.touched = "1"), { once: true });

	setupFontPicker($("#inputFont"), $("#fontPrev"), $("#fontNext"), $("#fontRandom"), render);

	// Unicode "fancy text" styles
	for (const style of FANCY_STYLES) $("#inputFancy").appendChild(new Option(style.label, style.id));

	// Emoji picker
	$("#emojiPicker").addEventListener("emoji-click", (e) => insertAtCursor(textarea, e.detail.unicode));

	// Timestamp menu, with live examples refreshed each time it opens
	const menu = $("#timestampMenu");
	const addMenuItem = (html, onClick) => {
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.className = "dropdown-item d-flex justify-content-between gap-3";
		a.href = "#";
		a.innerHTML = html;
		a.addEventListener("click", (e) => {
			e.preventDefault();
			onClick();
		});
		li.appendChild(a);
		menu.appendChild(li);
		return a;
	};
	const examples = PRESETS.map((preset) => {
		const item = addMenuItem(
			`<span>${preset.label}</span><span class="text-body-secondary example"></span>`,
			() => insertAtCursor(textarea, `{${preset.name}}`)
		);
		return { preset, el: item.querySelector(".example") };
	});
	menu.insertAdjacentHTML("beforeend", '<li><hr class="dropdown-divider" /></li>');
	addMenuItem("<span>Custom format…</span>", () => {
		insertAtCursor(textarea, "{t:ddd D MMM HH:mm}");
		bootstrap.Collapse.getOrCreateInstance($("#timestampPanel")).show();
	});
	addMenuItem("<span>Date &amp; offset options…</span>", () =>
		bootstrap.Collapse.getOrCreateInstance($("#timestampPanel")).toggle()
	);
	$("#timestampMenuButton").addEventListener("show.bs.dropdown", () => {
		const date = getTimestampDate();
		for (const { preset, el } of examples)
			el.textContent = expandTimestamps(`{${preset.name}}`, date);
	});
	$("#timestampNow").addEventListener("click", () => {
		$("#inputTimestampBase").value = "";
		render();
	});

	// Keep "now" timestamps in the preview current
	setInterval(() => {
		const textTabActive = $("#nav-text-tab").classList.contains("active");
		if (textTabActive && !$("#inputTimestampBase").value && hasTimestamps(textarea.value)) render();
	}, 15000);

	$all(
		"#nav-text input, #nav-text select, #nav-text textarea"
	).forEach((e) => e.addEventListener("input", render));
	render();
};

const updateCanvasBarcode = (canvas) => {
	const barcodeData = $("#inputBarcode").value;
	const image = document.createElement("img");
	image.addEventListener("load", () => {
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(Math.PI / 2);

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(image, -image.width / 2, -image.height / 2);

		ctx.rotate(-Math.PI / 2);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);
	});

	JsBarcode(image, barcodeData, {
		format: "CODE128",
		width: 2,
		height: labelSize.height * 7,
		displayValue: false,
	});
};

const drawImageToCanvas = (ctx, url, doScale = true) => {
	const img = new Image();
	img.addEventListener("load", () => {
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(Math.PI / 2);

		ctx.imageSmoothingEnabled = false;
		// draw image in center of canvas, scaled to fit
		const scale = doScale ? Math.min(canvas.height / img.width, canvas.width / img.height) : 1;
		const drawWidth = img.width * scale;
		const drawHeight = img.height * scale;
		ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

		ctx.rotate(-Math.PI / 2);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);
	});
	img.addEventListener("error", () => {
		handleError("failed to load image");
	});

	img.src = url;
};

const updateCanvasImage = (canvas) => {
	const ctx = canvas.getContext("2d");
	const file = $("#inputImage").files[0];
	if (!file) {
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		return;
	}

	const reader = new FileReader();
	reader.addEventListener("load", (e) => {
		drawImageToCanvas(ctx, e.target.result);
	});
	reader.addEventListener("error", () => {
		handleError("failed to read image file");
	});

	reader.readAsDataURL(file);
};

const updateCanvasQR = async (canvas) => {
	const data = $("#inputQR").value;
	const ctx = canvas.getContext("2d");
	const qrImg = await QRCode.toDataURL(data, { width: canvas.width - 8, margin: 2 });
	drawImageToCanvas(ctx, qrImg, false);
};

const updateCanvasQRText = async (canvas) => {
	const data = $("#inputQRTextData").value;
	const text = $("#inputQRText").value;
	const fontSizeInput = $("#inputQRTextSize").valueAsNumber;
	const ctx = canvas.getContext("2d");
	const labelWidth = canvas.height;
	const labelHeight = canvas.width;
	const padding = 4;
	const gap = 6;
	const left = -labelWidth / 2 + padding;
	const top = -labelHeight / 2 + padding;
	const right = labelWidth / 2 - padding;
	const bottom = labelHeight / 2 - padding;
	const fallbackFontSize = Math.floor(labelHeight * 0.4);
	const fontSize = isNaN(fontSizeInput)
		? Math.max(10, Math.min(48, fallbackFontSize))
		: Math.max(1, fontSizeInput);

	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const maxQrSize = Math.max(16, Math.min(labelHeight - padding * 2, labelWidth - padding * 2));
	let qrSize = maxQrSize;
	if (text.trim()) {
		const minTextWidth = 32;
		const availableForQr = right - left - gap - minTextWidth;
		qrSize = Math.max(16, Math.min(maxQrSize, availableForQr));
	}
	const qrImg = await QRCode.toDataURL(data, { width: qrSize, margin: 1 });
	const image = new Image();
	image.addEventListener("load", () => {
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate(Math.PI / 2);

		ctx.imageSmoothingEnabled = false;
		if (!text.trim()) {
			const drawX = -labelWidth / 2 + (labelWidth - qrSize) / 2;
			const drawY = -labelHeight / 2 + (labelHeight - qrSize) / 2;
			ctx.drawImage(image, drawX, drawY, qrSize, qrSize);
		} else {
			const qrX = left;
			const qrY = top;
			ctx.drawImage(image, qrX, qrY, qrSize, qrSize);

			ctx.fillStyle = "#000";
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
			const textX = qrX + qrSize + gap;
			const textY = top;
			const textWidth = Math.max(0, right - textX);
			const textHeight = Math.max(0, bottom - top);
			if (textWidth > 0 && textHeight > 0) {
				drawText(ctx, text, {
					x: textX,
					y: textY,
					width: textWidth,
					height: textHeight,
					font: "sans-serif",
					fontSize,
				});
			}
		}

		ctx.rotate(-Math.PI / 2);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);
	});
	image.addEventListener("error", () => {
		handleError("failed to load QR code");
	});
	image.src = qrImg;
};

const handleError = (err) => {
	console.error(err);

	const toast = bootstrap.Toast.getOrCreateInstance($("#errorToast"));
	$("#errorText").textContent = err.toString();
	toast.show();
};

document.addEventListener("DOMContentLoaded", function () {
	const canvas = document.querySelector("#canvas");

	const renderers = {
		"nav-text-tab": updateCanvasText,
		"nav-cartoon-tab": updateCanvasCartoon,
		"nav-barcode-tab": updateCanvasBarcode,
		"nav-image-tab": updateCanvasImage,
		"nav-qr-tab": updateCanvasQR,
		"nav-qr-text-tab": updateCanvasQRText,
	};
	const renderActiveTab = () => {
		++renderId;
		return renderers[$("#nav-tab .nav-link.active").id](canvas);
	};

	document.addEventListener("shown.bs.tab", renderActiveTab);

	$all("#inputWidth, #inputHeight").forEach((e) =>
		e.addEventListener("input", () => {
			updateLabelSize(canvas);
			renderActiveTab();
		})
	);
	$("#inputPreviewHorizontal").addEventListener("input", () => updatePreviewLayout(canvas));
	window.addEventListener("resize", () => updatePreviewLayout(canvas));
	updateLabelSize(canvas);

	setupTextDesigner(canvas);
	setupCartoons(canvas);

	$("#inputBarcode").addEventListener("input", () => updateCanvasBarcode(canvas));
	$("#inputImage").addEventListener("change", () => updateCanvasImage(canvas));
	$("#inputQR").addEventListener("input", () => updateCanvasQR(canvas));
	$all("#inputQRTextData, #inputQRText, #inputQRTextSize").forEach((e) =>
		e.addEventListener("input", () => updateCanvasQRText(canvas))
	);

	$("form").addEventListener("submit", (e) => {
		e.preventDefault();
		navigator.bluetooth
			.requestDevice({
				acceptAllDevices: true,
				optionalServices: ["0000ff00-0000-1000-8000-00805f9b34fb"],
			})
			.then((device) => device.gatt.connect())
			.then((server) => server.getPrimaryService("0000ff00-0000-1000-8000-00805f9b34fb"))
			.then((service) => service.getCharacteristic("0000ff02-0000-1000-8000-00805f9b34fb"))
			.then(async (char) => {
				// Re-render so timestamps are current at print time. Only these renderers can be
				// awaited; the others draw in load callbacks after their promise resolves.
				const tab = $("#nav-tab .nav-link.active").id;
				if (tab === "nav-text-tab" || tab === "nav-cartoon-tab") await renderActiveTab();
				return printCanvas(char, canvas);
			})
			.catch(handleError);
	});
});
