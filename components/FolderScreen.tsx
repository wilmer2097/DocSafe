import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import DocumentItem from './DocumentItem';
import { styles } from '../styles/styles';

const FolderScreen = () => {
  const [documents, setDocuments] = useState([]);
  const folderPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;

  useEffect(() => {
    const createFolderAndLoadDocuments = async () => {
      try {
        const folderExists = await RNFS.exists(folderPath);
        if (!folderExists) {
          await RNFS.mkdir(folderPath);
        }
        const files = await RNFS.readDir(folderPath);
        setDocuments(files);
      } catch (error) {
        console.error("Error loading documents: ", error);
      }
    };

    createFolderAndLoadDocuments();
  }, []);

  const addDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const fileUri = result[0]?.uri;
      const fileName = result[0]?.name;

      const destPath = `${folderPath}/${fileName}`;
      await RNFS.copyFile(fileUri, destPath);

      const updatedDocuments = await RNFS.readDir(folderPath);
      setDocuments(updatedDocuments);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the document picker');
      } else {
        console.error(err);
      }
    }
  };

  const deleteDocument = async (filePath) => {
    try {
      await RNFS.unlink(filePath);
      const updatedDocuments = await RNFS.readDir(folderPath);
      setDocuments(updatedDocuments);
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const renameDocument = async (filePath, newFileName) => {
    const newFilePath = `${folderPath}/${newFileName}`;
    try {
      await RNFS.moveFile(filePath, newFilePath);
      const updatedDocuments = await RNFS.readDir(folderPath);
      setDocuments(updatedDocuments);
    } catch (error) {
      console.error("Error renaming document: ", error);
    }
  };

  const shareDocument = async (filePath) => {
    // Lógica para compartir el archivo
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documentos</Text>
      <TouchableOpacity style={styles.addButton} onPress={addDocument}>
        <Text style={styles.buttonText}>Agregar Documento</Text>
      </TouchableOpacity>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <DocumentItem 
              documentName={item.name} 
              uri={item.path} 
              onDelete={() => deleteDocument(item.path)} 
              onRename={(newName) => renameDocument(item.path, newName)}
              onShare={() => shareDocument(item.path)}
            />
          </View>
        )}
      />
    </View>
  );
};

export default FolderScreen;
