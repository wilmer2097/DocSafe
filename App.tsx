import React, { useEffect, useState } from 'react';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import AppNavigator from './components/AppNavigator';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const App = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  const requestPermission = async (permission, title, message) => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 30) {
        const status = await check(permission);
        if (status === RESULTS.DENIED || status === RESULTS.LIMITED) {
          const granted = await request(permission);
          if (granted !== RESULTS.GRANTED) {
            Alert.alert(
              'Permiso denegado',
              'La aplicación no puede continuar sin los permisos requeridos. Por favor, habilítalos manualmente en la configuración.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
              ]
            );
            return false;
          }
        }
      } else {
        const status = await PermissionsAndroid.check(permission);
        if (!status) {
          const granted = await PermissionsAndroid.request(permission, {
            title,
            message,
            buttonNeutral: 'Preguntar más tarde',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          });
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permiso denegado',
              'La aplicación no puede continuar sin los permisos requeridos. Por favor, habilítalos manualmente en la configuración.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
              ]
            );
            return false;
          }
        }
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const permissions = [];

      if (Platform.Version >= 30) { // Android 11+
        permissions.push(
          { type: PERMISSIONS.ANDROID.READ_MEDIA_IMAGES, title: 'Permiso de lectura de imágenes', message: 'Esta aplicación necesita acceso a tus imágenes para leer archivos.' },
          { type: PERMISSIONS.ANDROID.READ_MEDIA_VIDEO, title: 'Permiso de lectura de videos', message: 'Esta aplicación necesita acceso a tus videos para leer archivos.' },
          { type: PERMISSIONS.ANDROID.READ_MEDIA_AUDIO, title: 'Permiso de lectura de audio', message: 'Esta aplicación necesita acceso a tus archivos de audio.' },
          { type: PERMISSIONS.ANDROID.CAMERA, title: 'Permiso de cámara', message: 'Esta aplicación necesita acceso a tu cámara para tomar fotos.' }
        );
      } else { // Android 10 o inferior
        permissions.push(
          { type: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, title: 'Permiso de lectura de almacenamiento', message: 'Esta aplicación necesita acceso a tu almacenamiento para leer archivos.' },
          { type: PermissionsAndroid.PERMISSIONS.CAMERA, title: 'Permiso de cámara', message: 'Esta aplicación necesita acceso a tu cámara para tomar fotos.' }
        );
      }

      for (const permission of permissions) {
        const granted = await requestPermission(permission.type, permission.title, permission.message);
        if (!granted) return false;
      }
    } else if (Platform.OS === 'ios') {
      const permissions = [PERMISSIONS.IOS.PHOTO_LIBRARY, PERMISSIONS.IOS.CAMERA];
      for (const permission of permissions) {
        const status = await check(permission);
        if (status === RESULTS.DENIED) {
          const result = await request(permission);
          if (result !== RESULTS.GRANTED) {
            Alert.alert(
              'Permiso denegado',
              'La aplicación no puede continuar sin los permisos requeridos. Por favor, habilítalos manualmente en la configuración.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir Configuración', onPress: () => Linking.openURL('app-settings:') },
              ]
            );
            return false;
          }
        }
      }
    }

    return true;
  };

  useEffect(() => {
    const checkProfileAndPermissions = async () => {
      const permissionsGranted = await checkPermissions();
      if (permissionsGranted) {
        const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
        const profileExists = await RNFS.exists(profilePath);
        setInitialRoute(profileExists ? 'Login' : 'Profile');
      }
    };

    checkProfileAndPermissions();
  }, []);

  if (!initialRoute) {
    // Puedes mostrar un splash screen o un loader mientras se determina la ruta inicial
    return null;
  }

  return <AppNavigator initialRoute={initialRoute} />;
};

export default App;
