import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends (Component as any) {
  state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F4EC] text-[#1C1917] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#ad021a]/10 text-[#ad021a] flex items-center justify-center mb-4 font-bold text-xl">
            !
          </div>
          <h1 className="text-xl sm:text-2xl font-black mb-2 font-display">
            FRS UTH Web Radio
          </h1>
          <p className="text-sm text-[#6B6560] max-w-md mb-6">
            Παρουσιάστηκε ένα προσωρινό σφάλμα κατά τη φόρτωση. Παρακαλούμε ανανεώστε τη σελίδα.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#ad021a] text-white font-bold rounded-full text-sm hover:bg-[#8f0115] transition-colors shadow-sm cursor-pointer"
          >
            Ανανέωση Σελίδας
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
