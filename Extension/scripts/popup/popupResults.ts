import type { ResumeResult, StorageResult } from '../types';

interface ResultsCallbacks {
	showMainView: () => void;
}

let currentCardIndex: number = 0;
let callbacks: ResultsCallbacks | null = null;

export function SetupResultsView(resultsCallbacks: ResultsCallbacks): void {
	callbacks = resultsCallbacks;

	const prevBtn = document.getElementById('carouselPrev');
	const nextBtn = document.getElementById('carouselNext');
	const backButton = document.getElementById('resultsBackButton');

	prevBtn?.addEventListener('click', () => NavigateCard(-1));
	nextBtn?.addEventListener('click', () => NavigateCard(1));
	backButton?.addEventListener('click', HandleBackToMain);
}

export function ResetResultsView(): void {
	currentCardIndex = 0;
	chrome.storage.local.get(['resumeResults'], (result: StorageResult) => {
		RenderCard(result.resumeResults || []);
	});
}

function NavigateCard(direction: number): void {
	chrome.storage.local.get(['resumeResults'], (result: StorageResult) => {
		const results: ResumeResult[] = result.resumeResults || [];
		if (results.length === 0) return;

		currentCardIndex = Math.max(0, Math.min(results.length - 1, currentCardIndex + direction));
		RenderCard(results);
	});
}

function RenderCard(results: ResumeResult[]): void {
	const cardEl = document.getElementById('resumeCard');
	const dotsEl = document.getElementById('carouselDots');
	const counterEl = document.getElementById('carouselCounter');
	const prevBtn = document.getElementById('carouselPrev') as HTMLButtonElement | null;
	const nextBtn = document.getElementById('carouselNext') as HTMLButtonElement | null;

	if (!cardEl) return;

	if (results.length === 0) {
		cardEl.innerHTML = '<p class="no-data-text">No results to display.</p>';
		if (counterEl) counterEl.textContent = '';
		if (dotsEl) dotsEl.innerHTML = '';
		return;
	}

	const currentResult = results[currentCardIndex];
	if (!currentResult) return;

	if (counterEl) counterEl.textContent = `${currentCardIndex + 1} of ${results.length}`;

	cardEl.innerHTML = `
		<div class="card-company">${currentResult.company}</div>
		<div class="card-title">${currentResult.title}</div>
		${currentResult.success
			? '<span class="card-badge badge-success">Tailored Successfully</span>'
			: '<span class="card-badge badge-error">Could not tailor resume</span>'
		}
		${currentResult.href ? `<a class="card-job-link" href="${currentResult.href}" target="_blank">View Job Posting &rarr;</a>` : ''}
		${currentResult.success && currentResult.pdfBase64
			? '<button class="download-button" id="downloadBtn">Download PDF</button>'
			: ''
		}
	`;

	if (currentResult.success && currentResult.pdfBase64) {
		document.getElementById('downloadBtn')?.addEventListener('click', () => {
			DownloadPdf(currentResult);
		});
	}

	if (dotsEl) {
		dotsEl.innerHTML = results.map((_result, index) =>
			`<span class="dot ${index === currentCardIndex ? 'dot-active' : ''}"></span>`
		).join('');
	}

	if (prevBtn) prevBtn.disabled = currentCardIndex === 0;
	if (nextBtn) nextBtn.disabled = currentCardIndex === results.length - 1;
}

function DownloadPdf(result: ResumeResult): void {
	if (!result.pdfBase64) return;

	// Decode base64 back to binary string
	const binary = atob(result.pdfBase64);
	
	// Convert binary string to byte array
	const bytes = new Uint8Array(binary.length);
	for (let byteIndex = 0; byteIndex < binary.length; byteIndex++) {
		bytes[byteIndex] = binary.charCodeAt(byteIndex);
	}

	// Create a Blob URL from the byte array and trigger a download
	const blob = new Blob([bytes], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const downloadAnchor = document.createElement('a');
	downloadAnchor.href = url;
	downloadAnchor.download = `${result.company}_${result.title}_resume.pdf`.replace(/[^a-z0-9_\-]/gi, '_');
	downloadAnchor.click();
	URL.revokeObjectURL(url);
}

function HandleBackToMain(): void {
	chrome.storage.local.remove(['resumeResults'], () => {
		if (callbacks) callbacks.showMainView();
	});
}
