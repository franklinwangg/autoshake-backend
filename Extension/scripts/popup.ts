import { SetupAuth, ResetCreateAccountView } from './popupAuth';
import { SetupMainPopup, ResetMainPopup } from './popupMain';
import { SetupResumeView, ResetResumeView } from './popupResume';
import { GetResume, ExtractResumeText, ParseResume } from './api';
import type { StorageResult } from './types';

declare const DEBUG_GRAPHQL_VIEW: boolean;

export type PopupView = 'auth' | 'resume' | 'main';

let authView: HTMLElement | null = null;
let resumeView: HTMLElement | null = null;
let mainView: HTMLElement | null = null;
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

	SetupMainPopup(ShowAuthView, ShowResumeViewFromMain);

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
	if (!authView || !resumeView || !mainView) return;

	authView.classList.toggle('active', view === 'auth');
	authView.classList.toggle('hidden', view !== 'auth');

	resumeView.classList.toggle('active', view === 'resume');
	resumeView.classList.toggle('hidden', view !== 'resume');

	mainView.classList.toggle('active', view === 'main');
	mainView.classList.toggle('hidden', view !== 'main');
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

function ShowMainView(): void {
	SwitchView('main');
	ResetMainPopup();
}

function GetAuthTokenFromStorage(): Promise<string | undefined> {
	return new Promise((resolve) => {
		chrome.storage.local.get(['authToken'], (result: StorageResult) => {
			resolve(result.authToken);
		});
	});
}

function LogResumeJson(): void {
	chrome.storage.local.get(['resumeJson'], (result: StorageResult) => {
		console.log('Resume JSON:', result.resumeJson);
	});
}