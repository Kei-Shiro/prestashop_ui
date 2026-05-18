import {defaultClient as api, defaultState} from '../api/client'
import { Serializer } from '../utils/serializer'
import type { AxiosRequestConfig } from 'axios'
import {defaultClient} from "../api/client";

const apiService = {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.get(url, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
    },

    async post<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await api.post(url, payload, { ...config, responseType: 'text' });
        return Serializer.fromXml<T>(r.data)
    },

    /**
     * Simplifie la récupération des listes PrestaShop.
     * Gère automatiquement le wrapping ?.prestashop?.plural?.singular et assure un tableau !
     */
    async fetchList<T = any>(url: string, pluralKey: string, singularKey: string, config?: AxiosRequestConfig): Promise<T[]> {
        const r = await this.get<any>(url, config);
        const data = r?.prestashop?.[pluralKey]?.[singularKey];
        if (!data) return [];
        return Array.isArray(data) ? data : [data];
    },


    async put<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await api.put(url, payload, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
    },

    // Utilise PATCH pour ne modifier qu'un seul champ (évite de renvoyer tout le XML et d'écraser des données)
    async patch<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await api.patch(url, payload, { ...config, responseType: 'text' });
        return Serializer.fromXml<T>(r.data);
    },

    async putstate<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await defaultState.put(url, payload, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
    },

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await api.delete(url, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
    },


    async postFormData<T = any>(url: string, formData: FormData): Promise<T> {
        const r = await api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            responseType: 'text',
        })
        try {
            return Serializer.fromXml<T>(r.data)
        } catch {
            return r.data as T
        }
    },
}

export default apiService