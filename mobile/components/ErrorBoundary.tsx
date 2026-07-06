import React, { Component, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { logger } from "@/utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center px-4 bg-white">
          <Text className="text-body-2xl-bold text-red-600 mb-4">
            Coś poszło nie tak
          </Text>
          <Text className="text-body-base-regular text-gray-600 text-center mb-6">
            {this.state.error?.message || "Nieznany błąd"}
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="bg-red-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white text-body-base-bold-white">
              Spróbuj ponownie
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

