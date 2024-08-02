import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FolderItem from './FolderItem';

const HomeScreen = ({ navigation }) => {
  const [folderName, setFolderName] = useState('');
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const storedFolders = await AsyncStorage.getItem('folders');
        if (storedFolders) {
          setFolders(JSON.parse(storedFolders));
        }
      } catch (error) {
        console.error("Error loading folders: ", error);
      }
    };

    loadFolders();
  }, []);

  useEffect(() => {
    const saveFolders = async () => {
      try {
        await AsyncStorage.setItem('folders', JSON.stringify(folders));
      } catch (error) {
        console.error("Error saving folders: ", error);
      }
    };

    saveFolders();
  }, [folders]);

  const addFolder = () => {
    if (folderName.trim()) {
      setFolders([...folders, { name: folderName }]);
      setFolderName('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Home Screen</Text>
      <TextInput
        style={styles.input}
        value={folderName}
        onChangeText={setFolderName}
        placeholder="Folder Name"
      />
      <Button title="Add Folder" onPress={addFolder} />
      <FlatList
        data={folders}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Folder', { folderName: item.name })}>
            <FolderItem folderName={item.name} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default HomeScreen;
