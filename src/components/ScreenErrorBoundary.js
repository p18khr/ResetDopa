// src/components/ScreenErrorBoundary.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Error Boundary component for wrapping individual screens
 * Catches JavaScript errors in child components and displays a fallback UI
 */
export default class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    if (__DEV__) {
      console.error('Screen Error Boundary caught an error:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // Example: Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoBack = () => {
    if (this.props.navigation) {
      this.props.navigation.goBack();
    }
  };

  render() {
    if (this.state.hasError) {
      const { screenName = 'this screen' } = this.props;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />

            <Text style={styles.title}>Something went wrong</Text>

            <Text style={styles.message}>
              We encountered an error while loading {screenName}.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleReset}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {this.props.navigation && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={this.handleGoBack}
                >
                  <Text style={styles.secondaryButtonText}>Go Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetails: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
