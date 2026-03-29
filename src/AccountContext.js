import React, { createContext, useContext, useState } from "react";

// Shared context that stores which AWS account/ARN is currently being scanned
const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [activeArn, setActiveArn] = useState(null); // null = use .env credentials directly

  return (
    <AccountContext.Provider value={{ activeArn, setActiveArn }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
