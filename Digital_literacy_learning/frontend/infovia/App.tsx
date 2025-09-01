// App.tsx (at the project root infovia/)
import React from "react";
import { AuthProvider } from "./app/contexts/AuthContext";
import RootNavigator from "./app/navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
