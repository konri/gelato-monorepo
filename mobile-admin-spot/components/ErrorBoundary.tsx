import { Typography } from "@/components/atoms/Typography";
import React, { Component, ReactNode } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center px-4 bg-white">
          <Typography variant="text-24-bold" className="text-red-500 mb-4">
            {this.props.t("Common.somethingWentWrong")}
          </Typography>
          <Typography
            variant="text-16-regular"
            className="text-gray-600 text-center mb-6"
          >
            {this.state.error?.message || this.props.t("Common.unknownError")}
          </Typography>
          <Pressable
            onPress={this.handleReset}
            className="bg-red-600 px-6 py-3 rounded-full"
          >
            <Typography variant="text-16-bold" className="text-white">
              {this.props.t("Common.tryAgain")}
            </Typography>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);
