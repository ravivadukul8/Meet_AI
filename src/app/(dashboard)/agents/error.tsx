"use client";

import ErrorState from "@/components/error-state";

const ErrorPage = () => {
  return (
    <ErrorState
      title="Agents Load Fails"
      description="Please check your connection"
    />
  );
};

export default ErrorPage;
