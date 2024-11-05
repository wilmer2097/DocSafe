import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import { unzip } from 'react-native-zip-archive';
import { useNavigation } from '@react-navigation/native';

const RestoreBackupScreen = () => {
  const navigation = useNavigation();

  const restoreBackup = async () => {
    try {
      // Permitir al usuario seleccionar el archivo ZIP de backup
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.zip] });
      if (result && result[0]) {
        const backupZipPath = result[0].uri; // URI del archivo ZIP seleccionado

        // Definir una ruta temporal en el almacenamiento interno de la aplicación
        const tempZipPath = `${RNFS.TemporaryDirectoryPath}/backup_temp.zip`;

        // Copiar el archivo desde `content://` a una ruta accesible
        await RNFS.copyFile(backupZipPath, tempZipPath);

        const unzipPath = `${RNFS.DocumentDirectoryPath}/assets`; // Ruta de destino para la restauración

        // Descomprimir el archivo ZIP en la ruta de destino
        await unzip(tempZipPath, unzipPath);

        // Borrar el archivo temporal después de la extracción
        await RNFS.unlink(tempZipPath);

        // Mostrar mensaje de éxito
        Alert.alert('Éxito', 'Backup restaurado correctamente.');

        // Navegar de vuelta a HomeScreen para recargar los documentos
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error("Error al restaurar el backup:", error);
      Alert.alert('Error', 'No se pudo restaurar el backup.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurar Backup</Text>
      <TouchableOpacity style={styles.button} onPress={restoreBackup}>
        <Text style={styles.buttonText}>Restaurar Backup</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#185abd', 
    marginBottom: 20 
  },
  button: { 
    backgroundColor: '#185abd', 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 8 
  },
  buttonText: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: '600' 
  },
});

export default RestoreBackupScreen;
