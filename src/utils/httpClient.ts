import axios, { AxiosInstance, AxiosError } from 'axios';

const createClient = (baseUrl: string): AxiosInstance => {
    const client = axios.create({
        baseURL: baseUrl,
        timeout: 5000,
    });

    client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const config = error.config as any;
            if (!config || !config.retry) {
                return Promise.reject(error);
            }

            config.retryAttempt = config.retryAttempt || 0;

            if (config.retryAttempt >= config.retry) {
                return Promise.reject(error);
            }

            config.retryAttempt += 1;
            const delay = Math.pow(2, config.retryAttempt) * 100;

            await new Promise((resolve) => setTimeout(resolve, delay));
            return client(config);
        }
    );

    return client;
};

export const dexClient = createClient('');
