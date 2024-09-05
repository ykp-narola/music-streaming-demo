export const base = {
	URL: import.meta.env.VITE_API_END_POINT, // API endpoint
	NODE_ENV: import.meta.env.VITE_API_NODE_ENV === "development"
};