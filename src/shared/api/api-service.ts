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


    async put<T>(url: string, data?: string | object, config?: AxiosRequestConfig): Promise<T> {
        const payload = typeof data === 'object' ? Serializer.toXml(data) : data;
        const r = await api.put(url, payload, { ...config, responseType: 'text' })
        return Serializer.fromXml<T>(r.data)
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