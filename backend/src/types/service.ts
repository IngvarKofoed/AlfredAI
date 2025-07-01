

export interface Service {
    initialize(): Promise<void>;
    close(): Promise<void>;
}