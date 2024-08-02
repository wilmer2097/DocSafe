import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { styles } from '../styles/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentItem from './DocumentItem';

const FolderScreen = ({ route, navigation }) => {
  const { folderName } = route.params;
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const storedDocuments = await AsyncStorage.getItem(folderName);
        if (storedDocuments) {
          setDocuments(JSON.parse(storedDocuments));
        }
      } catch (error) {
        console.error("Error loading documents: ", error);
      }
    };

    loadDocuments();
  }, [folderName]);

  useEffect(() => {
    const saveDocuments = async () => {
      try {
        await AsyncStorage.setItem(folderName, JSON.stringify(documents));
      } catch (error) {
        console.error("Error saving documents: ", error);
      }
    };

    saveDocuments();
  }, [documents, folderName]);

  const addDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      setDocuments([...documents, { name: result.name, uri: result.uri, type: 'document' }]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the document picker');
      } else {
        console.error(err);
      }
    }
  };

  const addImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.error('ImagePicker Error: ', response.error);
      } else {
        const source = { uri: response.assets[0].uri };
        setDocuments([...documents, { name: response.assets[0].fileName, uri: source.uri, type: 'image' }]);
      }
    });
  };

  const deleteDocument = (index) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this file?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { text: "OK", onPress: () => {
          const updatedDocuments = documents.filter((_, i) => i !== index);
          setDocuments(updatedDocuments);
        }}
      ]
    );
  };

  const deleteFolder = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this folder and all its contents?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { text: "OK", onPress: async () => {
          try {
            await AsyncStorage.removeItem(folderName);
            navigation.goBack();
          } catch (error) {
            console.error("Error deleting folder: ", error);
          }
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{folderName}</Text>
      <Button title="Add Document" onPress={addDocument} />
      <Button title="Add Image" onPress={addImage} />
      <FlatList
        data={documents}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.itemContainer}>
            <DocumentItem documentName={item.name} uri={item.uri} type={item.type} />
            <TouchableOpacity onPress={() => deleteDocument(index)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <Button title="Delete Folder" onPress={deleteFolder} />
      <Button title="Back to Home" onPress={() => navigation.goBack()} />
    </View>
  );
};

export default FolderScreen;
