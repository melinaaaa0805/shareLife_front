import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { WeekProvider } from './context/WeekContext';

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <WeekProvider>
          <AppNavigator />
        </WeekProvider>
      </GroupProvider>
    </AuthProvider>
  );
}