export const API_BASE_URL = "https://autoshake-production.up.railway.app";

export const API_ENDPOINTS = {
	SIGNUP:  "/auth/signup",
	LOGIN:   "/auth/login",
	LOGOUT:  "/auth/logout",

	GET_PROFILE:    "/user/profile",
	UPDATE_PROFILE: "/user/profile",

	UPLOAD_RESUME:       "/resume/upload",
	GET_RESUME:          "/resume",
	EXTRACT_RESUME_TEXT: "/resume/extract-text",
	PARSE_RESUME:        "/resume/parse-resume",
	DELETE_RESUME:       "/resume",

	SUBMIT_JOBS: "/jobs",
	GET_JOBS:    "/jobs",
	GET_JOB:    (jobId: string) => `/jobs/${jobId}`,
	DELETE_JOB: (jobId: string) => `/jobs/${jobId}`,

	GENERATE_RESUME:      (jobId: string) => `/jobs/${jobId}/generate`,
	GET_GENERATED_RESUME: (jobId: string) => `/jobs/${jobId}/resume`,
	BATCH_GENERATE:       "/generate/batch",

	EXTRACT_SKILLS:           "/extract-skills",
	GENERATE_RESUME_PIPELINE: "/generate-resume",
	GET_TEMPLATES:            "/templates",
	HEALTH:                   "/health",
} as const;