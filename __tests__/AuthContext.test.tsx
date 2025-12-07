import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { supabase } from '../lib/supabaseClient';

// Mock Supabase client
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

const TestComponent = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (currentUser) return <div>Welcome, {currentUser.name}</div>;
  return <div>Please log in</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (supabase.auth.getSession as jest.Mock).mockClear();
    (supabase.from('personnel').select().eq().single as jest.Mock).mockClear();
  });

  it('should show loading state initially', () => {
    (supabase.auth.getSession as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show "Please log in" when there is no session', async () => {
    await act(async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    await waitFor(() => {
      expect(screen.getByText('Please log in')).toBeInTheDocument();
    });
  });

  it('should display the user name when a session is available', async () => {
    const mockSession = { user: { id: '123' } };
    const mockProfile = { id: '123', name: 'Test User', roles: { name: 'Doctor' } };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
    const fromMock = supabase.from as jest.Mock;
    const selectMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockReturnThis();
    const singleMock = jest.fn().mockResolvedValue({ data: mockProfile, error: null });

    fromMock.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
    });

    await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    });
  });
});
