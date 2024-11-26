import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

function getUrlExtension(url) {
  return url.split(/[#?]/).split(".").pop().trim();
}

export const openDocument = async (uri, mimeType) => {
  try {
    if (!uri || typeof uri !== 'string') {
      console.error('URI inválida:', uri);
      return;
    }

    // Verificar la existencia del archivo
    if (!await RNFS.exists(uri)) {
      Alert.alert('Error', 'El archivo no existe.');
      return;
    }

    // Determinar el MIME type si no se proporciona
    if (!mimeType) {
      if (uri.endsWith('.doc') || uri.endsWith('.docx')) {
        mimeType = 'application/msword';
      } else if (uri.endsWith('.xls') || uri.endsWith('.xlsx')) {
        mimeType = 'application/vnd.ms-excel';
      } else if (uri.endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else {
        // Obtener la extensión del archivo a partir de la URL
        const extension = getUrlExtension(uri);
        mimeType = `application/${extension}`;
      }
    }

    // Resto del código sigue igual
    if (Platform.OS === 'android') {
      const permissions = [];

      if (Platform.Version >= 33) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
        );
      } else if (Platform.Version >= 30) {
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

    if (uri.startsWith('http') || uri.startsWith('https')) {
      try {
        const fileName = uri.split('/').pop();
        const downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`;

        const options = {
          fromUrl: uri,
          toFile: downloadDest,
        };

        const downloadResult = await RNFS.downloadFile(options).promise;

        if (downloadResult.statusCode === 200) {
          Alert.alert('Descarga completada', `El archivo se descargó correctamente: ${downloadDest}`);
          await FileViewer.open(downloadDest, { showOpenWithDialog: true, mimeType });
        } else {
          Alert.alert('Error de descarga', 'No se pudo descargar el archivo.');
        }
      } catch (downloadErr) {
        console.error('Error al descargar el documento: ', downloadErr);
        Alert.alert('Error', 'No se pudo descargar ni abrir el documento.');
      }
    } else {
      try {
        await FileViewer.open(uri, { showOpenWithDialog: true, showAppsSuggestions: true, mimeType });
      } catch (err) {
        console.error('Error al abrir el documento: ', err);
        Alert.alert('Error', 'No se pudo abrir el documento.');
      }
    }
  } catch (err) {
    console.error('Error general: ', err);
    Alert.alert('Error', 'Ocurrió un error inesperado.');
  }
};