const toggle = document.getElementById("stateToggle");
const stateText = document.getElementById("toggleLabel");
function updateToggleLabel(isOn) {
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
export {};
//# sourceMappingURL=popup.js.map