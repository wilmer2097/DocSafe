import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import { IntentLauncherAndroid } from 'expo-intent-launcher';

export const openDocument = async (uri, mimeType) => {
  try {
    if (!uri || typeof uri !== 'string') {
      console.error('URI inválida:', uri);
      return;
    }

    // Solicitar permisos en Android
    if (Platform.OS === 'android') {
      const permissions = [];

      if (Platform.Version >= 33) { // Android 13+ (API 33+)
        permissions.push(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
        );
      } else if (Platform.Version >= 30) { // Android 11+ (API 30+)
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const hasStoragePermission = Object.values(granted).every(
        (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!hasStoragePermission) {
        Alert.alert('Permiso denegado', 'No se concedieron los permisos necesarios.');
        return;
      }
    }

    // Si es una URL, intenta abrirla en el navegador
    if (uri.startsWith('http') || uri.startsWith('https')) {
      await Linking.openURL(uri);
    } else {
      // Si es un archivo local, intenta abrirlo usando FileViewer
      if (!mimeType) {
        mimeType = '*/*';
      }

      await FileViewer.open(uri, { showOpenWithDialog: true, mimeType });
    }
  } catch (err) {
    console.error('Error al abrir el documento: ', err);
    Alert.alert('Error', 'No se pudo abrir el documento. Intentando descargar...');

    // Intentar descargar el archivo si no se puede abrir
    if (uri.startsWith('http') || uri.startsWith('https')) {
      try {
        const fileName = uri.split('/').pop();
        const downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`;

        const downloadResult = await RNFS.downloadFile({
          fromUrl: uri,
          toFile: downloadDest,
        }).promise;

        if (downloadResult.statusCode === 200) {
          Alert.alert('Descarga completada', `El archivo se descargó correctamente: ${downloadDest}`);
          await FileViewer.open(downloadDest);
        } else {
          Alert.alert('Error de descarga', 'No se pudo descargar el archivo.');
        }
      } catch (downloadErr) {
        console.error('Error al descargar el documento: ', downloadErr);
        Alert.alert('Error', 'No se pudo descargar ni abrir el documento.');
      }
    }
  }
};
