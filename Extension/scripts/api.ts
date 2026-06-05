import { API_BASE_URL, API_ENDPOINTS } from './apiConstants';

export interface AuthResponse {
	access_token: string;
}

export interface ApiError {
	status: number;
	message: string;
}

function BuildApiError(response: Response, body: string): ApiError {
	const parseMessage = (value: unknown): string | undefined => {
		if (typeof value === 'string') return value;
		if (Array.isArray(value)) {
			return value
				.map(parseMessage)
				.filter(Boolean)
				.join('; ');
		}
		if (typeof value === 'object' && value !== null) {
			const errorObject = value as Record<string, unknown>;
			if (typeof errorObject.msg === 'string') return errorObject.msg;
			if (typeof errorObject.detail === 'string') return errorObject.detail;
			if (typeof errorObject.message === 'string') return errorObject.message;
			return Object.values(errorObject)
				.map(parseMessage)
				.filter(Boolean)
				.join('; ');
		}
		return undefined;
	};

	let message: string;
	try {
		const parsed = JSON.parse(body);
		message = parseMessage(parsed) ?? (body || `Request failed with status ${response.status}`);
	} catch {
		message = body || `Request failed with status ${response.status}`;
	}
	return { status: response.status, message };
}

export async function Login(email: string, password: string): Promise<AuthResponse> {
	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}

	return response.json();
}

export async function Signup(email: string, password: string): Promise<AuthResponse> {
	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SIGNUP}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}

	return response.json();
}

export async function Logout(authToken: string): Promise<void> {
	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGOUT}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${authToken}`,
		},
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}
}