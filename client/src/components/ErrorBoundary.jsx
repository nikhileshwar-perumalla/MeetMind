import { Component } from 'react';

/** Catches render errors anywhere in the tree so a bug degrades to a message, not a blank page. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Something went wrong</h1>
          <p className="sub">An unexpected error occurred. Reloading usually fixes it.</p>
          <button className="btn block" onClick={() => window.location.assign('/')}>
            Reload MeetMind
          </button>
        </div>
      </div>
    );
  }
}
