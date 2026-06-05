import type { GraphqlResponse } from './types';
import { FindJobIdInObject, IsObject } from './popupUtils';

const GRAPHQL_RESPONSE_MESSAGE = 'AUTOSHAKE_GRAPHQL_RESPONSE';

declare global {
	interface Window {
		__AUTOSHAKE_INITIALIZED__: boolean;
	}
}

InitializeAutoShake();

function InitializeAutoShake(): void {
	if (window.__AUTOSHAKE_INITIALIZED__) {
		console.log('[AutoShake] inject.js already running, skipping re-init');
		return;
	}

	window.__AUTOSHAKE_INITIALIZED__ = true;
	console.log('[AutoShake] inject.js initializing');

	SetupFetchInterceptor();
}

function SetupFetchInterceptor(): void {
	const originalFetch = window.fetch;

	window.fetch = async (...args: Parameters<typeof window.fetch>): Promise<Response> => {
		const response: Response = await originalFetch(...args);
		const clone: Response = response.clone();

		void HandleClonedResponse(clone, args);

		return response;
	};
}

async function HandleClonedResponse(clone: Response, args: Parameters<typeof window.fetch>): Promise<void> {
	try {
		const data: unknown = await clone.json();

		if (!IsGraphqlResponsePayload(data)) {
			return;
		}

		let jobId = FindJobIdInObject('data' in data ? data.data : data);
		let source = 'response';

		// When job ID isn't in GraphQL response, try to extract it from the client's request
		if (!jobId) {
			jobId = GetJobIdFromRequest(args);
			source = 'request';
		}

		if (!jobId) {
			console.log('[AutoShake] GraphQL response has no detectable job ID, skipping');
			return;
		}

		const graphQLResponse = BuildGraphqlResponse(data, args);
		PostGraphqlResponse(jobId, graphQLResponse);

		console.log('[AutoShake] Intercepted GraphQL response for job ID:', jobId, '(source:', source, ')');
	}
	catch {
		// Ignore failures when response body is not JSON
	}
}

function IsGraphqlResponsePayload(data: unknown): data is { data?: unknown; errors?: unknown } {
  	return IsObject(data) && ('data' in data || 'errors' in data);
}

function GetJobIdFromRequest(args: Parameters<typeof window.fetch>): string | null {
	try {
		const requestInit = args[1];
		const body = requestInit?.body;

		const jobIdFromBody = GetJobIdFromRequestBody(body);
		if (jobIdFromBody) {
		return jobIdFromBody;
		}

		const url = GetRequestUrl(args);
		if (!url) {
		return null;
		}

		const match = url.match(/jobId=(\d+)/) || url.match(/\/job-search\/(\d+)/);
		return match?.[1] ?? null;
	}
	catch (error: unknown) {
		console.warn('[AutoShake] Error extracting job ID from request', error);
		return null;
	}
}

function GetJobIdFromRequestBody(body: unknown): string | null {
	if (typeof body === 'string') {
		const parsedBody = ParseJSON(body);
		return parsedBody ? FindJobIdInObject(parsedBody) : null;
	}

	return IsObject(body) ? FindJobIdInObject(body) : null;
}

function ParseJSON(text: string): unknown {
	try {
		return JSON.parse(text);
	} 
	catch {
		return null;
	}
}

function GetRequestUrl(args: Parameters<typeof window.fetch>): string | undefined {
	const firstArg = args[0];

	if (typeof firstArg === 'string') {
		return firstArg;
	}

	if (typeof URL !== 'undefined' && firstArg instanceof URL) {
		return firstArg.toString();
	}

	if (typeof Request !== 'undefined' && firstArg instanceof Request) {
		return firstArg.url;
	}

	if (IsObject(firstArg) && 'url' in firstArg && typeof firstArg.url === 'string') {
		return firstArg.url;
	}

	return undefined;
}

function BuildGraphqlResponse(data: unknown, args: Parameters<typeof window.fetch>): GraphqlResponse {
	return {
		url: GetRequestUrl(args) ?? String(args[0]),
		data: JSON.stringify(data),
		timestamp: new Date().toISOString(),
	};
}

function PostGraphqlResponse(jobId: string, response: GraphqlResponse): void {
	window.postMessage(
		{
		type: GRAPHQL_RESPONSE_MESSAGE,
		jobId,
		response,
		},
		'*',
	);
}
