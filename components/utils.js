import { Platform, Alert, PermissionsAndroid } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

function getUrlExtension(url) {
  return url.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
}

function getMimeType(extension) {
  const mimeTypes = {
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    txt: 'text/plain',
    html: 'text/html',
    json: 'application/json',
    csv: 'text/csv',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    tar: 'application/x-tar',
    // Puedes agregar más tipos aquí según sea necesario
  };

  return mimeTypes[extension] || `application/octet-stream`; // Tipo genérico si no se reconoce la extensión
}

export const openDocument = async (uri) => {
  try {
    if (!uri || typeof uri !== 'string') {
      console.error('URI inválida:', uri);
      Alert.alert('Error', 'La URI proporcionada es inválida.');
      return;
    }

    // Verificar la existencia del archivo
    if (!await RNFS.exists(uri)) {
      Alert.alert('Error', 'El archivo no existe.');
      return;
    }

    // Determinar la extensión del archivo
    const extension = getUrlExtension(uri);
    const mimeType = getMimeType(extension);

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
        await FileViewer.open(uri, { showOpenWithDialog: true, mimeType });
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
