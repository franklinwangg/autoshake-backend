let progressText: HTMLElement | null = null;

export function SetupGeneratingView(): void {
	progressText = document.getElementById('generatingProgress');
}

export function ResetGeneratingView(): void {
	UpdateGeneratingProgress(0, 0);
}

export function UpdateGeneratingProgress(completed: number, total: number): void {
	if (!progressText) return;

	if (total === 0) {
		progressText.textContent = 'Preparing...';
		return;
	}

	progressText.textContent = `Generating ${completed} of ${total} resumes...`;
}
