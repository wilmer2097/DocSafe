import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Modal, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import DocumentItem from './DocumentItem';
import AddDocumentForm from './AddDocumentForm';
import { styles } from '../styles/styles';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFileCirclePlus, faEye, faMousePointer } from '@fortawesome/free-solid-svg-icons';
import CustomAlert from './CustomAlert';

const HomeScreen = () => {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Admin',
    profileImage: require('../src/presentation/assets/foto.jpg'),
    loginCode: '0000',
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const folderPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
  const navigation = useNavigation();

  const loadProfile = async () => {
    try {
      const profileExists = await RNFS.exists(profilePath);
      if (profileExists) {
        const profileData = await RNFS.readFile(profilePath);
        const { perfilUsuario } = JSON.parse(profileData);
        setProfile(prevProfile => ({
          ...prevProfile,
          name: perfilUsuario.name || 'Admin',
          profileImage: perfilUsuario.profileImage ? { uri: perfilUsuario.profileImage } : require('../src/presentation/assets/foto.jpg'),
          loginCode: perfilUsuario.tokenInicio || '0000',
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showCustomAlert('Error', 'No se pudo cargar el perfil.');
    }
  };

  const loadDocuments = async () => {
    try {
      const filesDataExists = await RNFS.exists(filesJsonPath);
      if (filesDataExists) {
        const filesData = await RNFS.readFile(filesJsonPath);
        const parsedFilesData = JSON.parse(filesData);

        const filteredDocuments = parsedFilesData.archivos
          .filter(doc => doc.share === false)
          .sort((a, b) => a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase()));

        const loadedDocuments = filteredDocuments.map(doc => {
          const documentPath = `${folderPath}/${doc.nombre}`;
          return {
            name: doc.nombre,
            uri: documentPath,
            ...doc,
          };
        });

        setDocuments(loadedDocuments);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      showCustomAlert('Error', 'No se pudieron cargar los documentos.');
    }
  };

  const showCustomAlert = (title, message) => {
    setAlertConfig({ title, message });
    setShowAlert(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadDocuments();
    }, [])
  );

  const addDocument = () => {
    setShowForm(true);
  };

  const handleDocumentAdded = () => {
    loadDocuments();
    setShowForm(false);
  };

  const deleteDocument = async (filePath) => {
    try {
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        showCustomAlert('Error', 'El archivo no existe.');
        return;
      }

      await RNFS.unlink(filePath);
      const jsonFilePath = filePath.replace(/\.[^/.]+$/, '.json');
      if (await RNFS.exists(jsonFilePath)) {
        await RNFS.unlink(jsonFilePath);
      }
      loadDocuments();
      showCustomAlert('Éxito', 'Documento eliminado con éxito.');
    } catch (error) {
      console.error("Error deleting document:", error);
      showCustomAlert('Error', 'No se pudo eliminar el documento.');
    }
  };

  const renameDocument = async (filePath, newFileName) => {
    try {
      const newFilePath = `${folderPath}/${newFileName}`;
      await RNFS.moveFile(filePath, newFilePath);
      const jsonFilePath = filePath.replace(/\.[^/.]+$/, '.json');
      const newJsonFilePath = newFilePath.replace(/\.[^/.]+$/, '.json');
      if (await RNFS.exists(jsonFilePath)) {
        await RNFS.moveFile(jsonFilePath, newJsonFilePath);
      }
      loadDocuments();
      showCustomAlert('Éxito', 'Documento renombrado con éxito.');
    } catch (error) {
      console.error("Error renaming document:", error);
      showCustomAlert('Error', 'No se pudo renombrar el documento.');
    }
  };

  const shareDocument = () => {
    showCustomAlert('Información', 'Funcionalidad de compartir no implementada.');
  };

  const handleProfileSave = (updatedProfile) => {
    setProfile(updatedProfile);
    loadProfile();
  };

  const navigateToDocumentDetail = (document) => {
    navigation.navigate('DocumentDetail', {
      document,
      onGoBack: () => loadDocuments()
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={addDocument}>
          <FontAwesomeIcon icon={faFileCirclePlus} size={20} color="#fff" />
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.archivedButton} onPress={() => navigation.navigate('ArchivedDocuments')}>
          <FontAwesomeIcon icon={faEye} size={20} color="#fff" />  
          <Text style={styles.archivedButtonText}>Archivados</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <DocumentItem 
              documentName={item.name} 
              uri={item.uri} 
              onPress={() => navigateToDocumentDetail(item)}
              onDelete={() => deleteDocument(item.uri)} 
              onRename={(newName) => renameDocument(item.uri, newName)}
              onShare={() => shareDocument(item.uri)}
            />
          </View>
        )}
      />
      <Modal visible={showForm} animationType="slide">
        <AddDocumentForm
          onClose={() => setShowForm(false)}
          onDocumentAdded={handleDocumentAdded}
        />
      </Modal>
      {showAlert && (
        <CustomAlert
          visible={showAlert}
          onClose={() => setShowAlert(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          onAccept={() => setShowAlert(false)}
        />
      )}
      {/* Componente fijo en la parte inferior */}
      <TouchableOpacity
        style={styles.bottomBanner}
        onPress={() => Linking.openURL('https://solucionestecperu.com/idea.html')}
      >
      <View style={styles.bottomBannerContent}>
      <Text style={styles.bottomBannerText}>Tienes una idea, tienes un software</Text>
      <FontAwesomeIcon icon={faMousePointer} size={20} color="#fff" style={styles.bottomBannerIcon} />
    </View>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
