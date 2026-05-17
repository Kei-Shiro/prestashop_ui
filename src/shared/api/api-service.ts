import { defaultClient as api, defaultStock } from '../api/client'
import { Serializer } from '../utils/serializer'
import type { AxiosRequestConfig } from 'axios'

const apiService = {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.get(url, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
    },

    async post<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await api.post(url, payload, { ...config, responseType: 'text' });
        // Log le body brut pour débugger
        console.log(`[POST ${url}] status:`, r.status, '| body:', r.data?.substring(0, 500));
        return Serializer.fromXml<T>(r.data)
    },

    async postStockMvt<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await defaultStock.post(url, payload, { ...config, responseType: 'text' });
        // Log le body brut pour débugger
        console.log(`[POST ${url}] status:`, r.status, '| body:', r.data?.substring(0, 500));
        return Serializer.fromXml<T>(r.data)
    },

    async put<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await api.put(url, payload, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
    },

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.delete(url, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
    },

    /**
     * Envoie un FormData (multipart/form-data) — utilisé pour l'upload d'images.
     * Ne parse pas la réponse XML automatiquement.
     */
    async postFormData<T = any>(url: string, formData: FormData): Promise<T> {
        const r = await api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            responseType: 'text',
        })
        // Tenter de parser la réponse XML si possible
        try {
            return Serializer.fromXml<T>(r.data)
        } catch {
            return r.data as T
        }
    },
}

export default apiService