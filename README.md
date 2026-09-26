# Phomemo D30 Web Bluetooth

Proof of concept and demo of printing to a [Phomemo D30](https://www.amazon.com/dp/B08HV3MPFD) Bluetooth label maker via the browser using Web Bluetooth.

## Text designer

- 90+ fonts from Google Fonts, grouped (spooky, outline, pixel, blackletter, western, script…), with prev/next/random buttons
- Unicode "fancy text" styles (𝔣𝔯𝔞𝔨𝔱𝔲𝔯, 𝓼𝓬𝓻𝓲𝓹𝓽, ⓒⓘⓡⓒⓛⓔⓓ, upside-down, zalgo…)
- Searchable emoji picker; emoji print in black & white (Noto Emoji) or dithered colour
- Timestamp placeholders filled in at print time: `{date}`, `{day}`, `{time}`, `{datetime}`, … or a custom format like `{t:ddd D MMM HH:mm}`, with an optional fixed date and day offset (e.g. "use by" labels)
- Bold/italic, alignment, line spacing, invert, and threshold/dither conversion — the preview shows exactly what gets printed

## Custom emoji

Put images in `icons/` and list them in `icons/index.json` (static hosting can't list a directory):

```json
["another.png", { "file": "chichu.png", "scale": 1.2 }]
```

`scale` (optional) draws that icon larger or smaller relative to the text.

They show up in a "Custom" section of the Text tab's emoji picker and are written as `:filename:` (e.g. `:chichu:`) in the text. Images are auto-levelled so grey-on-grey drawings still print with solid lines. For best results use a PNG, roughly square, with lines at least 2px thick at print size.

## Cartoons

Line-art label templates with a stretchy middle for your text: long cat, wiener dog, snake, ribbon banner, dog bone and pencil. Text auto-sizes to fill the space, or the label can be stretched to fit the text (for continuous rolls). Pick any font, flip the direction, invert, and adjust the line weight. New templates go in `src/cartoons.js`.

## Demo

[A demo is available here.](https://odensc.github.io/phomemo-d30-web-bluetooth/) Please use a Web Bluetooth-compatible browser (e.g. Chromium-based).

## Credits

Inspiration for the data structure / image conversion was taken from some other great open-source projects. Thanks to:

- https://github.com/WebBluetoothCG/demos
- https://github.com/Knightro63/phomemo
