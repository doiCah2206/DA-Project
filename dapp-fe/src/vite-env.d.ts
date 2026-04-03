/// <reference types="vite/client" />

type EthereumRequestParams = {
    method: string;
    params?: unknown[];
};

type EthereumProvider = {
    request: <T = unknown>(args: EthereumRequestParams) => Promise<T>;
};

interface Window {
    ethereum?: EthereumProvider;
}