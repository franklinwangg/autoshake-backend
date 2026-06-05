export interface JobEntry {
	jobId: string;
	href: string;
	text: string;
	clickTimestamp: string;
}

export interface GraphqlResponse {
	url: string;
	data: string;
	timestamp: string;
}

export interface JobRecord {
	jobId: string;
	graphqlResponses: GraphqlResponse[];
	clicked: boolean;
	href?: string;
	text?: string;
	clickTimestamp?: string;
}

export interface JobData {
	[jobId: string]: JobRecord;
}

export interface StorageResult {
	trackingEnabled?: boolean;
	jobData?: JobData;
	username?: string;
}

export interface StoreJobMessage {
	type: "storeJob";
	jobEntry: JobEntry;
}

export interface StoreJobResponse {
	success: boolean;
	error?: string;
}

export interface ParsedGraphQLData {
	[key: string]: unknown;
}

export interface AutoshakeGraphqlMessage {
	type: "AUTOSHAKE_GRAPHQL_RESPONSE";
	jobId: string;
	response: GraphqlResponse;
}
