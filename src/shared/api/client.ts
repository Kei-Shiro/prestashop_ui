import axios, { AxiosInstance } from 'axios';

export type AuthMode = 'basic' | 'bearer' | 'none';

export interface ApiClientConfig {
    baseURL?: string;
    timeout?: number;
    authMode?: AuthMode;
    authToken?: string;
    apiKey?: string;
}

function createClient(defaultBaseURL: string, config: ApiClientConfig = {}): AxiosInstance {
    const {
        baseURL = defaultBaseURL,
        timeout = 10000,
        authMode = 'basic',
        authToken,
        apiKey = import.meta.env.VITE_PS_API_KEY
    } = config;

    const headers: Record<string, string> = { 'Content-Type': 'application/xml' };
    let auth: { username: string; password: string } | undefined;

    if (authMode === 'basic') {
        auth = { username: apiKey, password: '' };
    } else if (authMode === 'bearer' && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const client = axios.create({ baseURL, timeout, headers, auth });
    client.interceptors.response.use(
        (r) => r,
        (err) => {
            console.error('Erreur API', err.response?.status, err.response?.data);
            return Promise.reject(err);
        }
    );
    return client;
}

const defaultClient = createClient('/prestashop/api');
const defaultState = createClient('/prestashop/module');

export { defaultClient, defaultState };
export default defaultClient;
