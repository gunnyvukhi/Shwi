import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

// ─── Helper Functions ───────────────────────────────────────────────────────

/** GET request */
export const get = <T>(url: string, params?: Record<string, unknown>) =>
    axiosInstance.get<T>(url, { params }).then((res) => res.data);

/** POST request */
export const post = <T>(url: string, data?: unknown) =>
    axiosInstance.post<T>(url, data).then((res) => res.data);

/** PUT request – dùng để update toàn bộ resource */
export const put = <T>(url: string, data?: unknown) =>
    axiosInstance.put<T>(url, data).then((res) => res.data);

/** PATCH request – dùng để update một phần resource */
export const patch = <T>(url: string, data?: unknown) =>
    axiosInstance.patch<T>(url, data).then((res) => res.data);

/** DELETE request */
export const del = <T>(url: string) =>
    axiosInstance.delete<T>(url).then((res) => res.data);

export default axiosInstance;
