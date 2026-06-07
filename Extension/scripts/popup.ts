import { SetupAuth, ResetCreateAccountView } from './popupAuth';
import { SetupMainPopup, ResetMainPopup } from './popupMain';
import { SetupResumeView, ResetResumeView } from './popupResume';
import { SetupGeneratingView, ResetGeneratingView } from './popupGenerating';
import { SetupResultsView, ResetResultsView } from './popupResults';
import { GetResume, ExtractResumeText, ParseResume } from './api';
import { GetAuthTokenFromStorage } from './popupUtils';
import type { StorageResult } from './types';

declare const DEBUG_GRAPHQL_VIEW: boolean;

export type PopupView = 'auth' | 'resume' | 'main' | 'generating' | 'results';

let authView: HTMLElement | null = null;
let resumeView: HTMLElement | null = null;
let mainView: HTMLElement | null = null;
let generatingView: HTMLElement | null = null;
let resultsView: HTMLElement | null = null;
let loginPanel: HTMLElement | null = null;
let signupPanel: HTMLElement | null = null;
let loginTab: HTMLElement | null = null;
let signupTab: HTMLElement | null = null;

if (typeof window !== 'undefined' && typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' && typeof (globalThis as Record<string, unknown>).vi === 'undefined') {
	SetupPopupRoot();
}

function SetupPopupRoot(): void {
	authView = document.getElementById('authView');
	resumeView = document.getElementById('resumeView');
	mainView = document.getElementById('mainView');
	generatingView = document.getElementById('generatingView');
	resultsView = document.getElementById('resultsView');
	loginPanel = document.getElementById('loginPanel');
	signupPanel = document.getElementById('signupPanel');
	loginTab = document.getElementById('loginTab');
	signupTab = document.getElementById('signupTab');

	if (!DEBUG_GRAPHQL_VIEW) {
		const graphqlHeader = document.querySelector(".graphql-section-header");
		const graphqlContainer = document.getElementById("graphqlResponses");
		if (graphqlHeader) graphqlHeader.classList.add("hidden");
		if (graphqlContainer) graphqlContainer.classList.add("hidden");
	}

	loginTab?.addEventListener('click', ShowLoginPanel);
	signupTab?.addEventListener('click', ShowSignupPanel);

	SetupAuth({
		routeAfterLogin: RouteAfterLogin,
		showLoginView: ShowLoginPanel,
	});

	SetupResumeView({
		showMainView: ShowMainView,
	});

	SetupMainPopup(ShowAuthView, ShowResumeViewFromMain, ShowGeneratingView);

	SetupGeneratingView();

	SetupResultsView({
		showMainView: ShowMainView,
	});

	chrome.storage.local.remove(['resumeResults']);

	chrome.storage.local.get(['authToken'], (result: StorageResult) => {
		if (result.authToken) {
			RouteAfterLogin();
		} else {
			ShowAuthView();
		}
	});
}

async function RouteAfterLogin(): Promise<void> {
	const authToken = await GetAuthTokenFromStorage();
	if (!authToken) {
		ShowAuthView();
		return;
	}

	try {
		const resumeList = await GetResume(authToken);
		if (resumeList.resumes.length > 0) {
			const hasResumeJson = await HasLocalResumeJson();
			if (!hasResumeJson) {
				await FetchAndStoreResumeJson(authToken, resumeList.resumes[0].url);
			}
			LogResumeJson();
			ShowMainView();
		} else {
			ShowResumeViewFromAuth();
		}
	} catch {
		ShowMainView();
	}
}

async function HasLocalResumeJson(): Promise<boolean> {
	return new Promise((resolve) => {
		chrome.storage.local.get(['resumeJson'], (result: StorageResult) => {
			resolve(!!result.resumeJson);
		});
	});
}

async function FetchAndStoreResumeJson(authToken: string, resumeUrl: string): Promise<void> {
	const extracted = await ExtractResumeText(authToken, resumeUrl);
	const parsed = await ParseResume(authToken, extracted.text);

	return new Promise((resolve) => {
		chrome.storage.local.set({ resumeJson: parsed }, () => {
			resolve();
		});
	});
}

export function SwitchView(view: PopupView): void {
	const allViews: (HTMLElement | null)[] = [authView, resumeView, mainView, generatingView, resultsView];

	for (const v of allViews) {
		if (!v) continue;
		const isTarget =
			   v === authView && view === 'auth'
			|| v === resumeView && view === 'resume'
			|| v === mainView && view === 'main'
			|| v === generatingView && view === 'generating'
			|| v === resultsView && view === 'results';
		v.classList.toggle('active', isTarget);
		v.classList.toggle('hidden', !isTarget);
	}
}

function ShowAuthView(): void {
	SwitchView('auth');
	ShowLoginPanel();
}

function ShowLoginPanel(): void {
	if (loginPanel) loginPanel.classList.remove('hidden');
	if (signupPanel) signupPanel.classList.add('hidden');
	if (loginTab) loginTab.classList.add('active-tab');
	if (signupTab) signupTab.classList.remove('active-tab');
}

function ShowSignupPanel(): void {
	if (signupPanel) signupPanel.classList.remove('hidden');
	if (loginPanel) loginPanel.classList.add('hidden');
	if (signupTab) signupTab.classList.add('active-tab');
	if (loginTab) loginTab.classList.remove('active-tab');
	ResetCreateAccountView();
}

function ShowResumeViewFromAuth(): void {
	SwitchView('resume');
	ResetResumeView(false);
}

function ShowResumeViewFromMain(): void {
	SwitchView('resume');
	ResetResumeView(true);
}

function ShowGeneratingView(): void {
	SwitchView('generating');
	ResetGeneratingView();
}

export function ShowResultsView(): void {
	SwitchView('results');
	ResetResultsView();
}

function ShowMainView(): void {
	SwitchView('main');
	ResetMainPopup();
}

function LogResumeJson(): void {
	chrome.storage.local.get(['resumeJson'], (result: StorageResult) => {
		console.log('Resume JSON:', result.resumeJson);
	});
}