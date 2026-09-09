"use client";

import React, { createContext, useContext } from "react";

export const LoadingContext = createContext<{ handleLinkClick: (href?: string) => void } | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) return { handleLinkClick: () => {} };
  return context;
};
