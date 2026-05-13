import api from '../api/client'
import { parseXml, xmlToJson } from '../utils/xml-parser'
import type { AxiosRequestConfig } from 'axios'

const apiService = {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.get(url, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
    },

    async post<T>(url: string, data?: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.post(url, data, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
    },

    async put<T>(url: string, data?: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.put(url, data, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
    },

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.delete(url, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
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
            return xmlToJson(parseXml(r.data)) as T
        } catch {
            return r.data as T
        }
    },
}

export default apiService