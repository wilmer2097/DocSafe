import React, { useState, useCallback } from 'react';
import { View, FlatList, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import DocumentItem from './DocumentItem';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '../styles/styles';

const ArchivedDocuments = () => {
  const [archivedDocuments, setArchivedDocuments] = useState([]);

  const loadArchivedDocuments = async () => {
    const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
    try {
      const filesDataExists = await RNFS.exists(filesJsonPath);
      if (filesDataExists) {
        const filesData = await RNFS.readFile(filesJsonPath);
        const parsedFilesData = JSON.parse(filesData);

        // Filtrar documentos con share: true y ordenarlos alfabéticamente
        const archivedDocs = parsedFilesData.archivos
          .filter(doc => doc.share === true)
          .sort((a, b) => a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase())) // Ordenar alfabéticamente por nombre
          .map(doc => {
            const documentPath = `${RNFS.DocumentDirectoryPath}/DocSafe/${doc.nombre}`;
            return {
              name: doc.nombre,
              uri: documentPath,
              ...doc,
            };
          });

        setArchivedDocuments(archivedDocs);
      }
    } catch (error) {
      console.error('Error loading archived documents:', error);
      Alert.alert('Error', 'No se pudieron cargar los documentos archivados.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadArchivedDocuments();
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={archivedDocuments}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <DocumentItem 
              documentName={item.name} 
              uri={item.uri} 
            />
          </View>
        )}
      />
    </View>
  );
};

export default ArchivedDocuments;
