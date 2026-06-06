import { UploadResume, GetResume, ExtractResumeText, ParseResume } from './api';
import { GetAuthTokenFromStorage } from './popupUtils';
import type { StorageResult } from './types';

interface ResumeCallbacks {
	showMainView: () => void;
}

let dropZone: HTMLElement | null = null;
let fileInput: HTMLInputElement | null = null;
let uploadError: HTMLElement | null = null;
let uploadStatus: HTMLElement | null = null;
let backButton: HTMLElement | null = null;

let callbacks: ResumeCallbacks | null = null;
let hasExistingResume: boolean = false;

export function SetupResumeView(resumeCallbacks: ResumeCallbacks): void {
	callbacks = resumeCallbacks;

	dropZone = document.getElementById('resumeDropZone');
	fileInput = document.getElementById('resumeFileInput') as HTMLInputElement | null;
	uploadError = document.getElementById('resumeUploadError');
	uploadStatus = document.getElementById('resumeUploadStatus');
	backButton = document.getElementById('resumeBackButton');

	AttachResumeViewListeners();
}

function AttachResumeViewListeners(): void {
	if (!dropZone) return;

	dropZone.addEventListener('dragover', HandleDragOver);
	dropZone.addEventListener('dragleave', HandleDragLeave);
	dropZone.addEventListener('drop', HandleDrop);
	dropZone.addEventListener('click', () => fileInput?.click());

	if (fileInput) {
		fileInput.addEventListener('change', HandleFileInputChange);
	}

	if (backButton) {
		backButton.addEventListener('click', () => {
			if (callbacks) callbacks.showMainView();
		});
	}
}

export function ResetResumeView(isReturningFromMain: boolean): void {
	if (uploadError) uploadError.textContent = '';
	if (uploadStatus) uploadStatus.textContent = '';
	if (fileInput) fileInput.value = '';

	if (backButton) {
		backButton.classList.toggle('hidden', !isReturningFromMain);
	}
}

function HandleDragOver(event: DragEvent): void {
	event.preventDefault();
	event.stopPropagation();
	dropZone?.classList.add('drag-over');
}

function HandleDragLeave(event: DragEvent): void {
	event.preventDefault();
	event.stopPropagation();
	dropZone?.classList.remove('drag-over');
}

function HandleDrop(event: DragEvent): void {
	event.preventDefault();
	event.stopPropagation();
	dropZone?.classList.remove('drag-over');

	const files = event.dataTransfer?.files;
	if (!files || files.length === 0) return;

	const file = files[0];
	if (!IsValidPdf(file)) {
		ShowUploadError('Please upload a PDF file.');
		return;
	}

	ProcessResumeUpload(file);
}

function HandleFileInputChange(): void {
	const file = fileInput?.files?.[0];
	if (!file) return;

	if (!IsValidPdf(file)) {
		ShowUploadError('Please upload a PDF file.');
		return;
	}

	ProcessResumeUpload(file);
}

function IsValidPdf(file: File): boolean {
	return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

async function ProcessResumeUpload(file: File): Promise<void> {
	if (uploadError) uploadError.textContent = '';
	SetUploadStatus('Uploading resume...');

	const authToken = await GetAuthTokenFromStorage();
	if (!authToken) {
		ShowUploadError('Not authenticated. Please log in again.');
		return;
	}

	try {
		await UploadResume(authToken, file);
		SetUploadStatus('Resume uploaded. Extracting text...');

		const resumeList = await GetResume(authToken);
		const latestResume = resumeList.resumes[0];
		if (!latestResume) {
			ShowUploadError('Upload succeeded but no resume found on server.');
			return;
		}

		SetUploadStatus('Extracting text from resume...');
		const extracted = await ExtractResumeText(authToken, latestResume.url);

		SetUploadStatus('Parsing resume...');
		const parsed = await ParseResume(authToken, extracted.text);

		chrome.storage.local.set({ resumeJson: parsed }, () => {
			SetUploadStatus('Resume processed successfully!');
			if (callbacks) callbacks.showMainView();
		});
	} catch (error: unknown) {
		const apiError = error as { message?: string } | undefined;
		ShowUploadError(apiError?.message ?? 'Upload failed. Please try again.');
	}
}

function ShowUploadError(message: string): void {
	if (uploadStatus) uploadStatus.textContent = '';
	if (uploadError) uploadError.textContent = message;
}

function SetUploadStatus(message: string): void {
	if (uploadStatus) uploadStatus.textContent = message;
}
