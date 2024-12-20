import React, { useEffect, useState } from 'react';
import AppNavigator from './components/AppNavigator';

const App = () => {
  const [initialRoute, setInitialRoute] = useState('Welcome'); // Asigna directamente la ruta inicial deseada.

  useEffect(() => {
    // Realiza cualquier comprobación inicial aquí, si es necesario.
    // Por ejemplo, verificar si el perfil del usuario ya está configurado.
  }, []);

  if (!initialRoute) {
    // Puedes mostrar una pantalla de carga aquí mientras determinas la ruta inicial.
    return null;
  }

  return <AppNavigator initialRoute={initialRoute} />;
};

export default App;
