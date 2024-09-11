import 'react-native-gesture-handler';
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Image, TouchableOpacity, FlatList, Alert
} from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/styles';

const tasks = [
  {
    id: 1,
    title: 'Tarea 1',
    description: 'Esta es la descripción de la tarea 1',
    date: new Date(),
    done: false,
  },
  {
    id: 2,
    title: 'Tarea 2',
    description: 'Esta es la descripción de la tarea 2',
    date: new Date(),
    done: true,
  },
  {
    id: 3,
    title: 'Tarea 3',
    description: 'Esta es la descripción de la tarea 3',
    date: new Date(),
    done: false,
  },
  {
    id: 4,
    title: 'Tarea 4',
    description: 'Esta es la descripción de la tarea 4',
    date: new Date(),
    done: true,
  }
];

export interface Task {
  id: number;
  title: string;
  description: string;
  done: boolean;
  date: Date;
}

export default function App() {
  const [folders, setFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState<string>('');

  useEffect(() => {
    loadFolders();
  }, []);

  const saveFolders = async (folders: string[]) => {
    try {
      await AsyncStorage.setItem('folders', JSON.stringify(folders));
    } catch (error) {
      console.error('Error saving folders', error);
    }
  };

  const loadFolders = async () => {
    try {
      const storedFolders = await AsyncStorage.getItem('folders');
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }
    } catch (error) {
      console.error('Error loading folders', error);
    }
  };

  const createFolder = () => {
    if (newFolderName.trim() === '') {
      Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío.');
      return;
    }

    const directoryPath = `${RNFS.DocumentDirectoryPath}/${newFolderName}`;

    RNFS.mkdir(directoryPath)
      .then(() => {
        const updatedFolders = [...folders, newFolderName];
        setFolders(updatedFolders);
        saveFolders(updatedFolders);
        setNewFolderName('');
        Alert.alert('Éxito', `Carpeta ${newFolderName} creada exitosamente.`);
      })
      .catch((error) => {
        Alert.alert('Error', `Error al crear la carpeta: ${error.message}`);
      });
  };

  function renderItem({ item }: { item: Task }) {
    return (
      <View style={styles.row}>
        <View style={styles.itemContainer}>
          <Text style={styles.subtitle}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.description}</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.title}>:</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('./src/presentation/assets/foto.jpg')} style={styles.profileImage} />
        <View>
          <Text style={styles.welcomeText}>Bienvenido a DocSafe</Text>
          <Text style={styles.title}>Wilmer H.</Text>
        </View>
      </View>
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Buscar Documento" 
          style={styles.textInput} 
          value={newFolderName}
          onChangeText={setNewFolderName}
        />
        <TouchableOpacity style={styles.addButton} onPress={createFolder}>
          <Text style={styles.addText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Mis Archivos</Text>
      <View style={styles.fileListContainer}>
        <FlatList
          data={folders}
          renderItem={({ item }) => (
            <View style={styles.folderItem}>
              <Text style={styles.folderName}>{item}</Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
      <Text style={styles.title}>Mis Tareas</Text>
      <View style={styles.fileListContainer}>
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
        />
      </View>
    </View>
  );
}


import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7d8592',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#d8e0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8e0f0',
  },
  addText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7d8592',
  },
  fileListContainer: {
    padding: 20,
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
    borderColor: '#d8e0f0',
    borderWidth: 2,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d8e0f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  folderItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  folderName: {
    fontSize: 16,
    color: '#333',
  }
});

export default styles;

