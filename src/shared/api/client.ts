// src/api/client.ts
import axios, { AxiosInstance } from 'axios';

export type AuthMode = 'basic' | 'bearer' | 'none';

export interface ApiClientConfig {
    baseURL?: string;
    timeout?: number;
    authMode?: AuthMode;
    authToken?: string;
    apiKey?: string;
}

function createApiClient(config: ApiClientConfig = {}): AxiosInstance {
    const {
        baseURL = '/prestashop/api',
        timeout = 10000,
        authMode = 'basic',
        authToken,
        apiKey = import.meta.env.VITE_PS_API_KEY
    } = config;

    const headers: Record<string, string> = {
        'Content-Type': 'application/xml'
    };

    // Configure authentication based on mode
    let auth: { username: string; password: string } | undefined;
    
    switch (authMode) {
        case 'basic':
            auth = { username: apiKey, password: '' };
            break;
        case 'bearer':
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            break;
        case 'none':
        default:
            // No auth
            break;
    }

    const client = axios.create({
        baseURL,
        timeout,
        headers,
        auth
    });

    client.interceptors.response.use(
        (r) => r,
        (err) => {
            console.error('Erreur API', err.response?.status, err.response?.data);
            return Promise.reject(err);
        }
    );

    return client;
}

function createApiStockMvt(config: ApiClientConfig = {}): AxiosInstance {
    const {
        baseURL = '/prestashop/module',
        timeout = 10000,
        authMode = 'basic',
        authToken,
        apiKey = import.meta.env.VITE_PS_API_KEY
    } = config;

    const headers: Record<string, string> = {
        'Content-Type': 'application/xml'
    };

    // Configure authentication based on mode
    let auth: { username: string; password: string } | undefined;

    switch (authMode) {
        case 'basic':
            auth = { username: apiKey, password: '' };
            break;
        case 'bearer':
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            break;
        case 'none':
        default:
            // No auth
            break;
    }

    const client = axios.create({
        baseURL,
        timeout,
        headers,
        auth
    });

    client.interceptors.response.use(
        (r) => r,
        (err) => {
            console.error('Erreur API', err.response?.status, err.response?.data);
            return Promise.reject(err);
        }
    );

    return client;
}

// Default client with basic auth (legacy behavior)
const defaultClient = createApiClient({ authMode: 'basic' });
const defaultStock = createApiStockMvt({authMode: 'basic' });

export { createApiClient, defaultClient, defaultStock };
export default defaultClient;