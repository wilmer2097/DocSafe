import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import RNFS from 'react-native-fs';
import { zip, unzip } from 'react-native-zip-archive';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFileExport, faFileImport, faShareAlt, faUndo, faMousePointer } from '@fortawesome/free-solid-svg-icons';
import CustomAlert from './CustomAlert'; // Importa tu componente de alerta personalizada

const RestoreBackupScreen = () => {
  const [backupFile, setBackupFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState(''); // Estado para almacenar la última acción

  // Estados para la alerta personalizada
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  // Función para mostrar la alerta personalizada
  const showCustomAlert = (title, message) => {
    setAlertData({ title, message });
    setAlertVisible(true);
  };

  const backupFolder = `${RNFS.DocumentDirectoryPath}/DocSafeBackups`;
  const backupFilePath = `${backupFolder}/backup_docsafe.zip`;
  const docsPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const archivosDataPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;

  const createBackup = async () => {
    setLoading(true);
    try {
      const folderExists = await RNFS.exists(backupFolder);
      if (!folderExists) {
        await RNFS.mkdir(backupFolder);
      }

      const filesToZip = [docsPath, profilePath, archivosDataPath];
      const resultPath = await zip(filesToZip, backupFilePath);

      const backupDate = new Date().toLocaleDateString();
      setBackupFile({ path: resultPath, name: `Backup - ${backupDate}.zip` });

      setLastAction('create'); // Actualizar la última acción
      showCustomAlert('Éxito', 'Backup creado correctamente.');
    } catch (error) {
      console.error('Error al crear el backup:', error);
      showCustomAlert('Error', 'Hubo un problema al crear el backup.');
    } finally {
      setLoading(false);
    }
  };

  const loadBackup = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.zip] });
      if (result && result[0]) {
        const backupZipPath = result[0].uri;
        const tempZipPath = `${RNFS.TemporaryDirectoryPath}/backup_temp.zip`;

        await RNFS.copyFile(backupZipPath, tempZipPath);
        const unzipPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;

        console.log('Extrayendo el archivo ZIP en:', unzipPath);
        await unzip(tempZipPath, unzipPath);
        await RNFS.unlink(tempZipPath);

        const extractedFiles = await RNFS.readDir(unzipPath);
        const assetsPath = `${RNFS.DocumentDirectoryPath}/assets`;

        const assetsExists = await RNFS.exists(assetsPath);
        if (!assetsExists) {
          await RNFS.mkdir(assetsPath);
        }

        for (const file of extractedFiles) {
          if (file.name.endsWith('.json')) {
            const sourcePath = `${unzipPath}/${file.name}`;
            const destinationPath = `${assetsPath}/${file.name}`;
            await RNFS.moveFile(sourcePath, destinationPath);
            console.log(`Archivo JSON movido a assets: ${file.name}`);
          } else {
            console.log(`Archivo multimedia mantenido en DocSafe: ${file.name}`);
          }
        }

        setLastAction('load'); // Actualizar la última acción
        setBackupFile({ path: backupZipPath, name: `Backup Cargado - ${new Date().toLocaleDateString()}.zip` });
        showCustomAlert('Éxito', 'Backup restaurado correctamente.');
      }
    } catch (error) {
      console.error('Error al restaurar el backup:', error);
      showCustomAlert('Error', 'No se pudo restaurar el backup.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareOptions = {
        title: 'Compartir Backup',
        url: `file://${backupFilePath}`,
        type: 'application/zip',
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error al compartir el backup:', error);
      showCustomAlert('Error', 'No se pudo compartir el backup.');
    }
  };

  const renderBackupItem = () => (
    <View style={styles.backupItem}>
      <Text style={styles.backupName}>{backupFile.name}</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.iconButton, styles.shareButton]} onPress={handleShare}>
          <FontAwesomeIcon icon={faShareAlt} size={20} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, styles.restoreButton]} onPress={loadBackup}>
          <FontAwesomeIcon icon={faUndo} size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#185abd" />}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.exportButton]} onPress={createBackup}>
          <FontAwesomeIcon icon={faFileExport} size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Crear Backup</Text>
        </TouchableOpacity>

        {lastAction === 'create' && backupFile && renderBackupItem()}

        <TouchableOpacity style={[styles.actionButton, styles.importButton]} onPress={loadBackup}>
          <FontAwesomeIcon icon={faFileImport} size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Cargar Backup</Text>
        </TouchableOpacity>

        {lastAction === 'load' && backupFile && renderBackupItem()}
      </View>

      {/* Componente de alerta personalizada */}
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
        onAccept={() => setAlertVisible(false)}
      />

      <TouchableOpacity
        style={styles.bottomBanner}
        onPress={() => Linking.openURL('https://solucionestecperu.com/idea.html')}
      >
        <View style={styles.bottomBannerContent}>
          <Text style={styles.bottomBannerText}>Tienes una idea, tienes un software </Text>
          <FontAwesomeIcon icon={faMousePointer} size={20} color="#fff" style={styles.bottomBannerIcon} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Tus estilos permanecen iguales
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#185abd',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBannerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#185abd',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start', 
    alignItems: 'center', 
    width: '100%', 
    gap: 30, 
    paddingHorizontal: 10, 
    marginBottom: 70, 
  },  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 8,
  },
  exportButton: {
    backgroundColor: '#185abd',
  },
  importButton: {
    backgroundColor: '#185abd',
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
    width: '100%',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  backupName: {
    fontSize: 16,
    color: '#185abd',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  shareButton: {
    backgroundColor: '#4cb950',
  },
  restoreButton: {
    backgroundColor: '#185abd',
  },
  bottomBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },  
  bottomBannerIcon: {
    marginLeft: 10,
  },
  
});

export default RestoreBackupScreen;
