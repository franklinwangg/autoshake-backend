import { SetupAuth, ResetCreateAccountView } from './popupAuth';
import { SetupMainPopup, ResetMainPopup } from './popupMain';
import type { StorageResult } from './types';

declare const DEBUG_GRAPHQL_VIEW: boolean;

export type PopupView = 'login' | 'create' | 'main';

let loginView: HTMLElement | null = null;
let mainView: HTMLElement | null = null;
let createAccountView: HTMLElement | null = null;

// Entry Point
if (typeof window !== 'undefined' && typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined' && typeof (globalThis as Record<string, unknown>).vi === 'undefined') {
	SetupPopupRoot();
}

function SetupPopupRoot(): void {
	loginView = document.getElementById('loginView');
	mainView = document.getElementById('mainView');
	createAccountView = document.getElementById('createAccountView');

	// Hide GraphQL section if not in debug mode
	if (!DEBUG_GRAPHQL_VIEW) {
		const graphqlHeader = document.querySelector(".graphql-section-header");
		const graphqlContainer = document.getElementById("graphqlResponses");
		if (graphqlHeader) graphqlHeader.classList.add("hidden");
		if (graphqlContainer) graphqlContainer.classList.add("hidden");
	}

	SetupAuth({
		showMainView: ShowMainView,
		showLoginView: ShowLoginView,
		showCreateAccountView: ShowCreateAccountView,
	});

	SetupMainPopup();

	chrome.storage.local.get(['username'], (result: StorageResult) => {
		if (result.username) {
			ShowMainView();
		} else {
			ShowLoginView();
		}
	});
}

export function SwitchView(view: PopupView): void {
	if (!loginView || !mainView || !createAccountView) return;

	loginView.classList.toggle('active', view === 'login');
	loginView.classList.toggle('hidden', view !== 'login');

	mainView.classList.toggle('active', view === 'main');
	mainView.classList.toggle('hidden', view !== 'main');

	createAccountView.classList.toggle('active', view === 'create');
	createAccountView.classList.toggle('hidden', view !== 'create');
}

function ShowLoginView(): void {
	SwitchView('login');
}

function ShowCreateAccountView(): void {
	SwitchView('create');
	ResetCreateAccountView();
}

function ShowMainView(): void {
	SwitchView('main');
	ResetMainPopup();
}
