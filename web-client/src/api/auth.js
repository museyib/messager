import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
})

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    failedQueue.push({ resolve, originalRequest});
                }).then(({ originalRequest }) => {
                    return axiosInstance(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await refreshToken();
                isRefreshing = false;
                failedQueue.forEach((req) => req.resolve(axiosInstance(req.originalRequest)));
                failedQueue = [];

                const newToken = localStorage.getItem('token');
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

                return axiosInstance(originalRequest);
            }
            catch (error) {
                console.error("Token refresh failed with error: ", error);
                window.location.href = "/login";
                isRefreshing = false;
                failedQueue = [];

                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
)

export const refreshToken = async () => {
    const storedUsername = localStorage.getItem("username");
    const storedPassword = localStorage.getItem("password");
    await axiosInstance.post('/auth/token', {
        username: storedUsername,
        password: storedPassword
    }).then((response) => {
        const tokenData = response.data.data;
        localStorage.setItem('token', tokenData.token);
    }).catch((error) => {
        console.error(error);
        logout();
    });
};

export const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('token');
    localStorage.removeItem('logStatus');
    setTimeout(() => window.location.href = "/login", 1000);
}

export default axiosInstance;