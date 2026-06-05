interface AuthCallbacks {
	showMainView: () => void;
	showLoginView: () => void;
	showCreateAccountView: () => void;
}

export function SetupAuth(callbacks: AuthCallbacks): void {
	const { showMainView, showLoginView, showCreateAccountView } = callbacks;

	const loginButton = document.getElementById('loginButton');
	loginButton?.addEventListener('click', HandleLogin);

	const logoutButton = document.getElementById('logoutButton');
	logoutButton?.addEventListener('click', HandleLogout);

	const createAccountLink = document.getElementById('createAccountLink');
	createAccountLink?.addEventListener('click', () => {
		showCreateAccountView();
	});

	const createAccountButton = document.getElementById('createAccountButton');
	createAccountButton?.addEventListener('click', HandleCreateAccount);

	const backToLoginLink = document.getElementById('backToLoginLink');
	backToLoginLink?.addEventListener('click', () => {
		ResetCreateAccountView();
		showLoginView();
	});

	const passwordInput = document.getElementById('passwordInput') as HTMLInputElement | null;
	passwordInput?.addEventListener('keydown', (event: KeyboardEvent) => {
		if (event.key === 'Enter') HandleLogin();
	});

	const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement | null;
	confirmPasswordInput?.addEventListener('keydown', (event: KeyboardEvent) => {
		if (event.key === 'Enter') HandleCreateAccount();
	});

	function HandleLogin(): void {
		const usernameInput = document.getElementById('usernameInput') as HTMLInputElement | null;
		const passwordInput = document.getElementById('passwordInput') as HTMLInputElement | null;
		const loginError = document.getElementById('loginError');

		const username = usernameInput?.value.trim() ?? '';
		const password = passwordInput?.value ?? '';

		if (loginError) loginError.textContent = '';

		if (!username || !password) {
			if (loginError) loginError.textContent = 'Please enter a username and password.';
			return;
		}

		chrome.storage.local.set({ username }, () => {
			if (usernameInput) usernameInput.value = '';
			if (passwordInput) passwordInput.value = '';
			showMainView();
		});
	}

	function HandleCreateAccount(): void {
		const createUsernameInput = document.getElementById('createUsernameInput') as HTMLInputElement | null;
		const createPasswordInput = document.getElementById('createPasswordInput') as HTMLInputElement | null;
		const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement | null;
		const createAccountError = document.getElementById('createAccountError');

		const username = createUsernameInput?.value.trim() ?? '';
		const password = createPasswordInput?.value ?? '';
		const confirmPassword = confirmPasswordInput?.value ?? '';

		if (createAccountError) createAccountError.textContent = '';

		if (!username || !password || !confirmPassword) {
			if (createAccountError) createAccountError.textContent = 'Please fill in all fields.';
			return;
		}

		if (password !== confirmPassword) {
			if (createAccountError) createAccountError.textContent = 'Passwords do not match.';
			return;
		}

		ResetCreateAccountView();
		showLoginView();
	}

	function HandleLogout(): void {
		chrome.storage.local.set({ username: '' }, () => {
			showLoginView();
		});
	}
}

export function ResetCreateAccountView(): void {
	const createUsernameInput = document.getElementById('createUsernameInput') as HTMLInputElement | null;
	const createPasswordInput = document.getElementById('createPasswordInput') as HTMLInputElement | null;
	const confirmPasswordInput = document.getElementById('confirmPasswordInput') as HTMLInputElement | null;
	const createAccountError = document.getElementById('createAccountError');

	if (createUsernameInput) createUsernameInput.value = '';
	if (createPasswordInput) createPasswordInput.value = '';
	if (confirmPasswordInput) confirmPasswordInput.value = '';
	if (createAccountError) createAccountError.textContent = '';
}