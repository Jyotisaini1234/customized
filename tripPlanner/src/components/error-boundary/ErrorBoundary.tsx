import React from 'react';
import {Oops} from '../oops/Oops.tsx'
import { Component, ErrorInfo, ReactNode } from 'react';


type ErrorState = { isError: boolean }

interface IProps {
  children: ReactNode,
}

class ErrorBoundary extends Component<IProps> {
  state: ErrorState = {
    isError: false,
  };

  static getDerivedStateFromError(): ErrorState {
    return { isError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Pay attention to the error. ${error}: ${errorInfo}`);
  }

  clearState = (): void => {
    this.setState({
      isError: false,
    });
  };

  render(): ReactNode {
    return this.state.isError ? <Oops  /> : this.props.children;
  }
}

export { ErrorBoundary };
