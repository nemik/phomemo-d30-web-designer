// Loaded as a classic script in <head> so the theme is applied before first paint (no flash).
(() => {
	const STORAGE_KEY = "theme";
	const media = window.matchMedia("(prefers-color-scheme: dark)");

	const getPreference = () => {
		try {
			return localStorage.getItem(STORAGE_KEY) || "auto";
		} catch {
			return "auto";
		}
	};

	const apply = () => {
		const preference = getPreference();
		const theme = preference === "auto" ? (media.matches ? "dark" : "light") : preference;
		document.documentElement.setAttribute("data-bs-theme", theme);
		const picker = document.querySelector("emoji-picker");
		if (picker) picker.className = theme;
	};

	apply();
	media.addEventListener("change", apply);

	document.addEventListener("DOMContentLoaded", () => {
		apply();
		const input = document.querySelector(`input[name=theme][value=${getPreference()}]`);
		if (input) input.checked = true;
		document.querySelectorAll("input[name=theme]").forEach((el) =>
			el.addEventListener("change", () => {
				try {
					localStorage.setItem(STORAGE_KEY, el.value);
				} catch {
					// Storage unavailable: the choice still applies until reload
				}
				apply();
			})
		);
	});
})();
