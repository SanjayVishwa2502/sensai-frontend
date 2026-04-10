import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession, signIn } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import RoleLoginPage from '@/app/login/[role]/page';

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('next/image', () => {
    return function MockImage({ src, alt, ...props }: any) {
        return <img src={src} alt={alt} {...props} />;
    };
});

jest.mock('next/link', () => {
    return function MockLink({ href, children, ...props }: any) {
        return <a href={href} {...props}>{children}</a>;
    };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe('Role Login Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useParams as jest.Mock).mockReturnValue({ role: 'student' });
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
            replace: mockReplace,
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        });
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn(() => null),
        });
    });

    it('should use student fallback callback when callbackUrl is root', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn((key: string) => (key === 'callbackUrl' ? '/' : null)),
        });

        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<RoleLoginPage />);

        const button = await screen.findByRole('button', { name: /Continue with Google/i });
        fireEvent.click(button);

        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/access/student' });
    });

    it('should preserve meaningful callbackUrl for deep links', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn((key: string) =>
                key === 'callbackUrl' ? '/school/first-principles/join?cohortId=89' : null
            ),
        });

        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<RoleLoginPage />);

        const button = await screen.findByRole('button', { name: /Continue with Google/i });
        fireEvent.click(button);

        expect(signIn).toHaveBeenCalledWith('google', {
            callbackUrl: '/school/first-principles/join?cohortId=89',
        });
    });

    it('should redirect authenticated student to role fallback when callbackUrl is root', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn((key: string) => (key === 'callbackUrl' ? '/' : null)),
        });

        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: { id: '1', name: 'Test User', email: 'test@example.com' },
                expires: '2025-12-31T00:00:00.000Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        });

        render(<RoleLoginPage />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/access/student');
        });
    });

    it('should redirect invalid role routes back to role selection', async () => {
        (useParams as jest.Mock).mockReturnValue({ role: 'invalid-role' });

        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<RoleLoginPage />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/login');
        });
    });

    it('should require admin passcode before Google sign-in', async () => {
        (useParams as jest.Mock).mockReturnValue({ role: 'admin' });

        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<RoleLoginPage />);

        const button = await screen.findByRole('button', { name: /Continue with Google/i });
        fireEvent.click(button);

        expect(signIn).not.toHaveBeenCalled();
        expect(screen.getByText(/Invalid admin passcode/i)).toBeInTheDocument();
    });

    it('should sign in admin with valid passcode', async () => {
        (useParams as jest.Mock).mockReturnValue({ role: 'admin' });

        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<RoleLoginPage />);

        const input = await screen.findByLabelText(/Admin passcode/i);
        fireEvent.change(input, { target: { value: '100000' } });

        const button = screen.getByRole('button', { name: /Continue with Google/i });
        fireEvent.click(button);

        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/access/admin' });
    });
});
