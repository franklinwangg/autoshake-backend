import { Login, Signup } from './api';

interface AuthCallbacks {
	routeAfterLogin: () => void;
	showLoginView: () => void;
}

export function SetupAuth(callbacks: AuthCallbacks): void {
	const { routeAfterLogin, showLoginView } = callbacks;

	const loginButton = document.getElementById('loginButton');
	loginButton?.addEventListener('click', () => HandleLogin(routeAfterLogin));

	const createAccountButton = document.getElementById('createAccountButton');
	createAccountButton?.addEventListener('click', () => HandleCreateAccount(showLoginView));

	const passwordInput = document.getElementById('passwordInput') as HTMLInputElement | null;
	passwordInput?.addEventListener('keydown', (event: KeyboardEvent) => {
		if (event.key === 'Enter') HandleLogin(routeAfterLogin);
	});

	const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement | null;
	confirmPasswordInput?.addEventListener('keydown', (event: KeyboardEvent) => {
		if (event.key === 'Enter') HandleCreateAccount(showLoginView);
	});
}

async function HandleLogin(onSuccess: () => void): Promise<void> {
	const emailInput = document.getElementById('emailInput') as HTMLInputElement | null;
	const passwordInput = document.getElementById('passwordInput') as HTMLInputElement | null;
	const loginError = document.getElementById('loginError');

	const email = emailInput?.value.trim() ?? '';
	const password = passwordInput?.value ?? '';

	if (loginError) loginError.textContent = '';

	if (!email || !password) {
		if (loginError) loginError.textContent = 'Please enter an email and password.';
		return;
	}

	const loginButton = document.getElementById('loginButton') as HTMLButtonElement | null;
	if (loginButton) loginButton.disabled = true;

	try {
		const response = await Login(email, password);
		chrome.storage.local.set({ email, authToken: response.access_token }, () => {
			if (emailInput) emailInput.value = '';
			if (passwordInput) passwordInput.value = '';
			onSuccess();
		});
	} catch (error: any) {
		if (loginError) loginError.textContent = error.message || 'Login failed. Please try again.';
	} finally {
		if (loginButton) loginButton.disabled = false;
	}
}

async function HandleCreateAccount(onSuccess: () => void): Promise<void> {
	const createEmailInput = document.getElementById('createEmailInput') as HTMLInputElement | null;
	const createPasswordInput = document.getElementById('createPasswordInput') as HTMLInputElement | null;
	const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement | null;
	const createAccountError = document.getElementById('createAccountError');

	const email = createEmailInput?.value.trim() ?? '';
	const password = createPasswordInput?.value ?? '';
	const confirmPassword = confirmPasswordInput?.value ?? '';

	if (createAccountError) createAccountError.textContent = '';

	if (!email || !password || !confirmPassword) {
		if (createAccountError) createAccountError.textContent = 'Please fill in all fields.';
		return;
	}

	if (password !== confirmPassword) {
		if (createAccountError) createAccountError.textContent = 'Passwords do not match.';
		return;
	}

	const createAccountButton = document.getElementById('createAccountButton') as HTMLButtonElement | null;
	if (createAccountButton) createAccountButton.disabled = true;

	try {
		await Signup(email, password);
		ResetCreateAccountView();
		onSuccess();
	} catch (error: any) {
		if (createAccountError) createAccountError.textContent = error.message || 'Account creation failed. Please try again.';
	} finally {
		if (createAccountButton) createAccountButton.disabled = false;
	}
}

export function ResetCreateAccountView(): void {
	const createEmailInput = document.getElementById('createEmailInput') as HTMLInputElement | null;
	const createPasswordInput = document.getElementById('createPasswordInput') as HTMLInputElement | null;
	const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement | null;
	const createAccountError = document.getElementById('createAccountError');

	if (createEmailInput) createEmailInput.value = '';
	if (createPasswordInput) createPasswordInput.value = '';
	if (confirmPasswordInput) confirmPasswordInput.value = '';
	if (createAccountError) createAccountError.textContent = '';
}