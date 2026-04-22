const toggle: HTMLInputElement | null = document.getElementById("stateToggle") as HTMLInputElement | null;
const stateText: HTMLElement | null = document.getElementById("toggleLabel");

function updateToggleLabel(isOn: boolean) {
	if (stateText) {
		stateText.textContent = `State: ${isOn ? "On" : "Off"}`;
	}
	else {
		throw new Error("No state text found in html!");
	}
}

if (toggle) {
	updateToggleLabel(toggle.checked);
	toggle.addEventListener("change", () => {
		updateToggleLabel(toggle.checked);
	});
}

else {
	throw new Error("No toggle found in html!");
}