'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';

import Button from '@/components/buttons/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error || new Error('Unknown error')}
            reset={this.handleReset}
          />
        );
      }

      return (
        <div className='min-h-[400px] flex items-center justify-center'>
          <div className='text-center max-w-md mx-auto p-6'>
            <div className='bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
              <AlertTriangle className='w-8 h-8 text-red-600' />
            </div>

            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Something went wrong
            </h2>

            <p className='text-gray-600 mb-6'>
              {this.state.error?.message ||
                'An unexpected error occurred. Please try again.'}
            </p>

            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button
                onClick={this.handleReset}
                variant='primary'
                leftIcon={RefreshCw}
              >
                Try Again
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant='outline'
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error boundary for easier use
export function ErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className='min-h-[400px] flex items-center justify-center'>
      <div className='text-center max-w-md mx-auto p-6'>
        <div className='bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
          <AlertTriangle className='w-8 h-8 text-red-600' />
        </div>

        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Something went wrong
        </h2>

        <p className='text-gray-600 mb-6'>
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Button onClick={reset} variant='primary' leftIcon={RefreshCw}>
            Try Again
          </Button>

          <Button onClick={() => window.location.reload()} variant='outline'>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}
