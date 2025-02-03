import React, { useEffect, useState } from 'react';
import AppNavigator from './components/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';

const App = () => {
  const [initialRoute, setInitialRoute] = useState('Welcome');
  LogBox.ignoreLogs([
    'Sending `onAnimatedValueUpdate` with no listeners registered.',
  ]);
  useEffect(() => {
    // Aquí puedes hacer comprobaciones iniciales si lo requieres
  }, []);

  if (!initialRoute) {
    // Muestra pantalla de carga o spinner si es necesario
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator initialRoute={initialRoute} />
    </GestureHandlerRootView>
  );
};

export default App;