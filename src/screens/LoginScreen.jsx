import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const { signInWithGoogle, loading, error } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Section with Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-text-primary mb-2">Split</h1>
        <p className="text-text-secondary text-center mb-8">
          Expense sharing made simple
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Track shared expenses</p>
              <p className="text-xs text-text-muted">Know who paid for what</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Collaborate with roommates</p>
              <p className="text-xs text-text-muted">Share room codes to join</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Settle up easily</p>
              <p className="text-xs text-text-muted">See who owes whom</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section with Login Button */}
      <div className="px-8 pb-12">
        {error && (
          <div className="bg-error-light text-error p-4 rounded-card mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || signingIn}
          className="w-full h-14 rounded-button bg-surface border border-divider flex items-center justify-center gap-3 hover:bg-background active:scale-[0.99] transition-all disabled:opacity-50 shadow-card"
        >
          {signingIn ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Google Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-text-primary">Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-xs text-text-muted text-center mt-4">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
