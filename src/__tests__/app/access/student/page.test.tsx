import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import StudentAccessPage from '@/app/access/student/page';
import { useCourses, useSchools } from '@/lib/api';

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    useCourses: jest.fn(),
    useSchools: jest.fn(),
}));

jest.mock('next/link', () => {
    return function MockLink({ href, children, ...props }: any) {
        return <a href={href} {...props}>{children}</a>;
    };
});

const mockReplace = jest.fn();

describe('StudentAccessPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useRouter as jest.Mock).mockReturnValue({
            replace: mockReplace,
            push: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        });

        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'authenticated',
            update: jest.fn(),
        });

        (useCourses as jest.Mock).mockReturnValue({
            courses: [],
            isLoading: false,
            error: null,
        });

        (useSchools as jest.Mock).mockReturnValue({
            schools: [],
            isLoading: false,
            error: null,
        });
    });

    it('should redirect unauthenticated users to student login', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<StudentAccessPage />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/login/student');
        });
    });

    it('should redirect to learner course school when learner course exists', async () => {
        (useCourses as jest.Mock).mockReturnValue({
            courses: [
                {
                    id: '1',
                    title: 'Course A',
                    role: 'learner',
                    org_id: 10,
                    org: {
                        id: 10,
                        name: 'Test School',
                        slug: 'test-school',
                    },
                },
            ],
            isLoading: false,
            error: null,
        });

        render(<StudentAccessPage />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/school/test-school');
        });
    });

    it('should redirect to first school when no learner course exists but school membership is present', async () => {
        (useCourses as jest.Mock).mockReturnValue({
            courses: [
                {
                    id: '1',
                    title: 'Admin Course',
                    role: 'admin',
                    org_id: 20,
                    org: {
                        id: 20,
                        name: 'Admin School',
                        slug: 'admin-school',
                    },
                },
            ],
            isLoading: false,
            error: null,
        });

        (useSchools as jest.Mock).mockReturnValue({
            schools: [
                {
                    id: '30',
                    name: 'Learner School',
                    slug: 'learner-school',
                    role: 'member',
                },
            ],
            isLoading: false,
            error: null,
        });

        render(<StudentAccessPage />);

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/school/learner-school');
        });
    });

    it('should show no-enrollment guidance when no learner course or school membership is present', async () => {
        render(<StudentAccessPage />);

        expect(await screen.findByText('No enrolled learner cohorts found yet')).toBeInTheDocument();
        expect(
            screen.getByText(/Ask your admin for a cohort invite link or wait for your cohort assignment/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Go to Home/i })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: /Switch to Admin/i })).toHaveAttribute('href', '/access/admin');
    });
});
