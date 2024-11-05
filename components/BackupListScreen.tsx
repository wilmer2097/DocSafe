import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFileArchive, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const BackupListScreen = () => {
  const [backups, setBackups] = useState([]);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    const backupFolderPath = `${RNFS.DocumentDirectoryPath}/DocSafeBackups`;
    try {
      const files = await RNFS.readDir(backupFolderPath);
      const zipFiles = files.filter(file => file.name.endsWith('.zip'));
      setBackups(zipFiles);
    } catch (error) {
      console.error('Error loading backups:', error);
      Alert.alert('Error', 'No se pudieron cargar los respaldos.');
    }
  };

  const handleShareBackup = async (filePath) => {
    try {
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/zip',
        title: 'Compartir respaldo',
        message: 'Aquí tienes un respaldo de la aplicación DocSafe.',
      });
    } catch (error) {
      console.error('Error sharing backup:', error);
      Alert.alert('Error', 'No se pudo compartir el respaldo.');
    }
  };

  const renderBackupItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.iconContainer}>
        <FontAwesomeIcon icon={faFileArchive} size={24} color="#f39c12" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fileDate}>{new Date(item.mtime).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity style={styles.shareButton} onPress={() => handleShareBackup(item.path)}>
        <FontAwesomeIcon icon={faShareAlt} size={20} color="#185abd" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Respaldo</Text>
      <FlatList
        data={backups}
        keyExtractor={(item) => item.path}
        renderItem={renderBackupItem}
        contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2.22,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fileDate: {
    fontSize: 14,
    color: '#666',
  },
  shareButton: {
    padding: 8,
  },
});

export default BackupListScreen;
