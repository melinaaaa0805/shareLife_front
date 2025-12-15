import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
      <AppNavigator />
      </GroupProvider>
    </AuthProvider>
  );
}