import type { User } from './user';

export interface AuthResponse {
    message: string;
    token?: string;
    user?: User;
    resetToken?: string;
    requireOtp?: boolean;
    requireVerification?: boolean;
    email?: string;
    error?: string;
}
