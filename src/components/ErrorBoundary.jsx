import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // You can log the error to an external service here
    console.error('Unhandled error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <p>We encountered an unexpected error. Please reload the page.</p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#d9534f' }}>{String(this.state.error)}</pre>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
