import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import RNFS from 'react-native-fs';
import { zip } from 'react-native-zip-archive';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFileArchive, faShareAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import Share from 'react-native-share';

const CreateBackupScreen = () => {
  const [backupFiles, setBackupFiles] = useState([]);

  const backupFolder = `${RNFS.DocumentDirectoryPath}/DocSafeBackups`;
  const docsPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const archivosDataPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`; // Ajusta la ruta según sea necesario

  const saveBackup = async () => {
    try {
      // Crear la carpeta de backups si no existe
      const folderExists = await RNFS.exists(backupFolder);
      if (!folderExists) {
        await RNFS.mkdir(backupFolder);
      }

      const zipPath = `${backupFolder}/backup_docsafe_${Date.now()}.zip`;
      const filesToZip = [docsPath, profilePath, archivosDataPath]; // Incluye archivos.json

      // Crear el archivo ZIP con los archivos y el JSON de los datos de archivos
      const resultPath = await zip(filesToZip, zipPath);
      Alert.alert('Éxito', `Backup guardado en: ${resultPath}`);
      loadBackupFiles();
    } catch (error) {
      console.error('Error al crear el backup:', error);
      Alert.alert('Error', 'Hubo un problema al crear el backup.');
    }
  };

  const loadBackupFiles = async () => {
    try {
      const files = await RNFS.readDir(backupFolder);
      setBackupFiles(files.filter(file => file.name.endsWith('.zip')));
    } catch (error) {
      console.error('Error al cargar los archivos de backup:', error);
    }
  };

  const handleShare = async (filePath) => {
    try {
      const shareOptions = {
        title: 'Compartir Backup',
        url: `file://${filePath}`,
        type: 'application/zip',
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error al compartir el backup:', error);
      Alert.alert('Error', 'No se pudo compartir el backup.');
    }
  };

  useEffect(() => {
    loadBackupFiles();
  }, []);

  const renderBackupItem = ({ item }) => (
    <View style={styles.backupItem}>
      <View style={styles.iconContainer}>
        <FontAwesomeIcon icon={faFileArchive} size={30} color="#ffb100" />
      </View>
      <Text style={styles.backupName}>{item.name}</Text>
      <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.path)}>
        <FontAwesomeIcon icon={faShareAlt} size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Respaldo</Text>
      <TouchableOpacity style={styles.createButton} onPress={saveBackup}>
        <FontAwesomeIcon icon={faPlus} size={20} color="#ffffff" />
        <Text style={styles.buttonText}>Crear Backup</Text>
      </TouchableOpacity>
      <FlatList
        data={backupFiles}
        renderItem={renderBackupItem}
        keyExtractor={(item) => item.path}
        contentContainerStyle={styles.backupList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#185abd',
    marginBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#185abd',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backupList: {
    marginTop: 10,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  iconContainer: {
    marginRight: 10,
  },
  backupName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  shareButton: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateBackupScreen;
