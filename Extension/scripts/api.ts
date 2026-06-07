import { API_BASE_URL, API_ENDPOINTS } from './apiConstants';

export interface AuthResponse {
	access_token: string;
}

export interface ResumeListResponse {
	resumes: ResumeRecord[];
}

export interface ResumeRecord {
	user_id: string;
	filename: string;
	storage_path: string;
	url: string;
	created_at: string;
}

export interface ExtractTextResponse {
	text: string;
}

export interface UploadResumeResponse {
	message: string;
	path: string;
	url: string;
}

export interface ApiError {
	status: number;
	message: string;
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

export async function GetResume(authToken: string): Promise<ResumeListResponse> {
	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_RESUME}`, {
		headers: { "Authorization": `Bearer ${authToken}` },
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}

	return response.json();
}

export async function ExtractResumeText(authToken: string, url: string): Promise<ExtractTextResponse> {
	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EXTRACT_RESUME_TEXT}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${authToken}`,
		},
		body: JSON.stringify({ url }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}

	return response.json();
}

export async function ParseResume(authToken: string, text: string): Promise<Record<string, unknown>> {
	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PARSE_RESUME}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${authToken}`,
		},
		body: JSON.stringify({ text }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}

	return response.json();
}

export async function GenerateResume(authToken: string, resume: Record<string, unknown>, jobDescription: string): Promise<Blob> {
	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GENERATE_RESUME_PIPELINE}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${authToken}`,
		},
		body: JSON.stringify({ job_description: jobDescription, resume }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}

	return response.blob();
}

export async function UploadResume(authToken: string, file: File): Promise<UploadResumeResponse> {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_RESUME}`, {
		method: "POST",
		headers: { "Authorization": `Bearer ${authToken}` },
		body: formData,
	});

	if (!response.ok) {
		const body = await response.text();
		throw BuildApiError(response, body);
	}

	return response.json();
}

function BuildApiError(response: Response, body: string): ApiError {
	const parseMessage = (value: unknown): string | undefined => {
		if (typeof value === 'string'){
			return value;
		}
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