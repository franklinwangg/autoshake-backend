import { SetupAuth, ResetCreateAccountView } from './popupAuth';
import { SetupMainPopup, ResetMainPopup } from './popupMain';
import type { StorageResult } from './types';

declare const DEBUG_GRAPHQL_VIEW: boolean;

export type PopupView = 'auth' | 'main';

let authView: HTMLElement | null = null;
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
		showMainView: ShowMainView,
		showLoginView: ShowLoginPanel,
	});

	SetupMainPopup(ShowAuthView);

	chrome.storage.local.get(['authToken'], (result: StorageResult) => {
		if (result.authToken) {
			ShowMainView();
		} else {
			ShowAuthView();
		}
	});
}

export function SwitchView(view: PopupView): void {
	if (!authView || !mainView) return;

	authView.classList.toggle('active', view === 'auth');
	authView.classList.toggle('hidden', view !== 'auth');

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

function ShowMainView(): void {
	SwitchView('main');
	ResetMainPopup();
}
