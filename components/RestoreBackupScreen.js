import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import { zip, unzip } from 'react-native-zip-archive';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFileExport, faFileImport, faShareAlt, faUndo, faMousePointer } from '@fortawesome/free-solid-svg-icons';
import CustomAlert from './CustomAlert'; // Tu componente de alerta personalizada

const RestoreBackupScreen = () => {
  // Mantendremos dos estados distintos:
  // 1) backupCreated (último backup creado)
  // 2) backupLoaded (último backup cargado)
  const [backupCreated, setBackupCreated] = useState(null);
  const [backupLoaded, setBackupLoaded] = useState(null);

  const [loading, setLoading] = useState(false);

  // Estados para la alerta personalizada
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  // Función para mostrar la alerta personalizada
  const showCustomAlert = (title, message) => {
    setAlertData({ title, message });
    setAlertVisible(true);
  };

  // Rutas base
  const backupFolder = `${RNFS.DocumentDirectoryPath}/DocSafeBackups`;
  const docsPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const archivosDataPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;

  // ---------------------------------------------------
  // 1. CREAR BACKUP
  // ---------------------------------------------------
  const createBackup = async () => {
    setLoading(true);
    try {
      // Asegurar carpeta DocSafeBackups
      const folderExists = await RNFS.exists(backupFolder);
      if (!folderExists) {
        await RNFS.mkdir(backupFolder);
      }

      // Generar un nombre único para el archivo ZIP
      const timestamp = new Date().toISOString().replace(/[^\d]/g, '');
      const backupFilePath = `${backupFolder}/backup_created_${timestamp}.zip`;

      // Si existiera un backup con el mismo nombre (casi imposible con timestamp),
      // podrías eliminarlo, pero normalmente no hará falta.
      // const fileExists = await RNFS.exists(backupFilePath);
      // if (fileExists) {
      //   await RNFS.unlink(backupFilePath);
      // }

      // Zipear archivos
      const filesToZip = [docsPath, profilePath, archivosDataPath];
      const resultPath = await zip(filesToZip, backupFilePath);

      const backupDate = new Date().toLocaleDateString();
      // Guardamos en el estado de backup creado
      setBackupCreated({
        path: resultPath,
        name: `Backup - ${backupDate}.zip`,
      });

      // Mostramos alerta de éxito
      showCustomAlert('Éxito', 'Backup creado correctamente.');
    } catch (error) {
      console.error('Error al crear el backup:', error);
      showCustomAlert('Error', 'Hubo un problema al crear el backup.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // 2. CARGAR BACKUP (desde DocumentPicker)
  // ---------------------------------------------------
  const loadBackup = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.zip] });
      if (result && result[0]) {
        // URI devuelta por DocumentPicker
        const pickedZipUri = result[0].uri;

        // Verificar carpeta DocSafeBackups
        const folderExists = await RNFS.exists(backupFolder);
        if (!folderExists) {
          await RNFS.mkdir(backupFolder);
        }

        // Generar un nombre único para el archivo ZIP cargado
        const timestamp = new Date().toISOString().replace(/[^\d]/g, '');
        const localZipPath = `${backupFolder}/backup_loaded_${timestamp}.zip`;

        // Copiar el archivo seleccionado a la carpeta interna
        const sourcePath = pickedZipUri.replace('file://', '');
        await RNFS.copyFile(sourcePath, localZipPath);

        // ------------- Ejemplo de restauración inmediata -------------
        // Descomprimir y mover .json a /assets, solo para demostrar.
        // Podrías quitarlo si quieres restaurar solo cuando uses "faUndo".
        const tempZipPath = `${RNFS.TemporaryDirectoryPath}/backup_temp.zip`;
        await RNFS.copyFile(localZipPath, tempZipPath);

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
            const jsonSource = `${unzipPath}/${file.name}`;
            const jsonDestination = `${assetsPath}/${file.name}`;

            const jsonExists = await RNFS.exists(jsonDestination);
            if (jsonExists) {
              await RNFS.unlink(jsonDestination);
            }

            await RNFS.moveFile(jsonSource, jsonDestination);
            console.log(`Archivo JSON movido a assets: ${file.name}`);
          } else {
            console.log(`Archivo multimedia mantenido en DocSafe: ${file.name}`);
          }
        }
        // -------------------------------------------------------------

        // Guardamos en el estado de backup cargado
        setBackupLoaded({
          path: localZipPath,
          name: `Backup Cargado - ${new Date().toLocaleDateString()}.zip`,
        });

        showCustomAlert('Éxito', 'Backup restaurado correctamente.');
      }
    } catch (error) {
      console.error('Error al restaurar el backup:', error);
      showCustomAlert('Error', 'No se pudo restaurar el backup.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // 3. RESTAURAR BACKUP (ya sea creado o cargado)
  // ---------------------------------------------------
  const restoreBackup = async (backup) => {
    if (!backup?.path) {
      showCustomAlert('Error', 'No hay ningún backup para restaurar.');
      return;
    }
    setLoading(true);

    try {
      const backupZipPath = backup.path;
      const tempZipPath = `${RNFS.TemporaryDirectoryPath}/backup_temp.zip`;

      // Copiamos el .zip a una ruta temporal
      await RNFS.copyFile(backupZipPath, tempZipPath);

      const unzipPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;
      console.log('Extrayendo el archivo ZIP en:', unzipPath);

      await unzip(tempZipPath, unzipPath);
      await RNFS.unlink(tempZipPath);

      // Mover JSON a /assets (si existen)
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

          const fileExists = await RNFS.exists(destinationPath);
          if (fileExists) {
            await RNFS.unlink(destinationPath);
          }

          await RNFS.moveFile(sourcePath, destinationPath);
          console.log(`Archivo JSON movido a assets: ${file.name}`);
        } else {
          console.log(`Archivo multimedia mantenido en DocSafe: ${file.name}`);
        }
      }

      showCustomAlert('Éxito', 'Backup restaurado correctamente.');
    } catch (error) {
      console.error('Error al restaurar el backup:', error);
      showCustomAlert('Error', 'No se pudo restaurar el backup.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // 4. COMPARTIR BACKUP (generalmente el creado)
  // ---------------------------------------------------
  const shareBackup = async (backup) => {
    if (!backup?.path) {
      showCustomAlert('Error', 'No hay ningún backup para compartir.');
      return;
    }
    try {
      const shareOptions = {
        title: 'Compartir Backup',
        url: `file://${backup.path}`, // Importante anteponer file://
        type: 'application/zip',
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error al compartir el backup:', error);
      showCustomAlert('Error', 'No se pudo compartir el backup.');
    }
  };

  // ---------------------------------------------------
  // Renderizado genérico de un backup con sus botones
  // ---------------------------------------------------
  const renderBackupItem = (backup, label) => (
    <View style={styles.backupItem}>
      <Text
        style={styles.backupName}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}: {backup?.name || ''}
      </Text>

      <View style={styles.buttonGroup}>
        {/* Botón para compartir */}
        <TouchableOpacity
          style={[styles.iconButton, styles.shareButton]}
          onPress={() => shareBackup(backup)}
        >
          <FontAwesomeIcon icon={faShareAlt} size={20} color="#ffffff" />
        </TouchableOpacity>
        {/* Botón para restaurar */}
        <TouchableOpacity
          style={[styles.iconButton, styles.restoreButton]}
          onPress={() => restoreBackup(backup)}
        >
          <FontAwesomeIcon icon={faUndo} size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#185abd" />}

      <View style={styles.buttonContainer}>
        {/* 1) Botón Crear Backup */}
        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={createBackup}
        >
          <FontAwesomeIcon icon={faFileExport} size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Crear Backup</Text>
        </TouchableOpacity>

        {/* Si ya se creó un backup, mostrarlo debajo */}
        {backupCreated && renderBackupItem(backupCreated, 'Backup Creado')}

        {/* 2) Botón Cargar Backup */}
        <TouchableOpacity
          style={[styles.actionButton, styles.importButton]}
          onPress={loadBackup}
        >
          <FontAwesomeIcon icon={faFileImport} size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Cargar Backup</Text>
        </TouchableOpacity>

        {/* Si ya se cargó un backup, mostrarlo debajo */}
        {backupLoaded && renderBackupItem(backupLoaded, 'Backup Cargado')}
      </View>

      {/* Componente de alerta personalizada */}
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
        onAccept={() => setAlertVisible(false)}
      />

      {/* Banner inferior */}
      <TouchableOpacity
        style={styles.bottomBanner}
        onPress={() => Linking.openURL('https://solucionestecperu.com/idea.html')}
      >
        <View style={styles.bottomBannerContent}>
          <Text style={styles.bottomBannerText}>
            Tienes una idea, tienes un software{' '}
          </Text>
          <FontAwesomeIcon
            icon={faMousePointer}
            size={20}
            color="#fff"
            style={styles.bottomBannerIcon}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------
// Estilos
// ---------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
  bottomBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBannerIcon: {
    marginLeft: 10,
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
    fontSize: 15,
    color: '#185abd',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    overflow: 'hidden',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
});

export default RestoreBackupScreen;
