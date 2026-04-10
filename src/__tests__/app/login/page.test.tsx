import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from '@/app/login/page';

// Mock dependencies
jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('next/image', () => {
    return function MockImage({ src, alt, priority, ...props }: any) {
        return <img src={src} alt={alt} {...props} />;
    };
});
jest.mock('next/link', () => {
    return function MockLink({ href, children, ...props }: any) {
        return <a href={href} {...props}>{children}</a>;
    };
});

const mockPush = jest.fn();

describe('Login Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock hooks
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
            prefetch: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        });

        // Mock URLSearchParams
        const mockSearchParams = {
            get: jest.fn((key: string) => {
                if (key === 'callbackUrl') return null;
                return null;
            }),
        };
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    it('should show loading spinner when session is loading', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'loading',
            update: jest.fn(),
        });

        render(<LoginPage />);

        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render role-first chooser content when unauthenticated', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<LoginPage />);

        expect(screen.getByText(/One platform\./i)).toBeInTheDocument();
        expect(screen.getByText(/Two focused workspaces\./i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Admin \/ Mentor/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Student/i })).toBeInTheDocument();
        expect(screen.getByAltText('SensAI Logo')).toBeInTheDocument();
    });

    it('should render role links without callback query by default', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<LoginPage />);

        const adminLink = screen.getByRole('link', { name: /Admin \/ Mentor/i });
        const studentLink = screen.getByRole('link', { name: /Student/i });

        expect(adminLink).toHaveAttribute('href', '/login/admin');
        expect(studentLink).toHaveAttribute('href', '/login/student');
    });

    it('should preserve callbackUrl in role links when provided', () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn((key: string) => (key === 'callbackUrl' ? '/dashboard' : null)),
        });

        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<LoginPage />);

        const adminLink = screen.getByRole('link', { name: /Admin \/ Mentor/i });
        const studentLink = screen.getByRole('link', { name: /Student/i });

        expect(adminLink).toHaveAttribute('href', '/login/admin?callbackUrl=%2Fdashboard');
        expect(studentLink).toHaveAttribute('href', '/login/student?callbackUrl=%2Fdashboard');
    });

    it('should render terms and privacy policy links', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<LoginPage />);

        const termsLink = screen.getByRole('link', { name: /Terms & Conditions/i });
        const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });

        expect(termsLink).toBeInTheDocument();
        expect(privacyLink).toBeInTheDocument();
    });

    it('should redirect authenticated users to root when callbackUrl is absent', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        });

        render(<LoginPage />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('should redirect authenticated users to callbackUrl when provided', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
            get: jest.fn((key: string) => (key === 'callbackUrl' ? '/custom-redirect' : null)),
        });

        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        });

        render(<LoginPage />);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
        });
    });
}); 