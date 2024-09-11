import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faFilePdf, faFileWord, faFileExcel, faFilePowerpoint, faFileImage, 
  faFileAlt, faFileArchive, faFileVideo, faFileAudio, faEye, faLink 
} from '@fortawesome/free-solid-svg-icons';
import ImageViewer from './ImageViewer';
import { openDocument } from './utils';
import RNFS from 'react-native-fs';

const DocumentItem = ({ documentName }) => {
  const navigation = useNavigation();
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [images, setImages] = useState([]);
  const [fileType, setFileType] = useState(null);
  const [initialIndex, setInitialIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadDocumentData();
    }, [documentName])
  );

  const loadDocumentData = async () => {
    const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;

    try {
      const filesDataExists = await RNFS.exists(filesJsonPath);
      if (filesDataExists) {
        const filesData = await RNFS.readFile(filesJsonPath);
        const parsedFilesData = JSON.parse(filesData);
        const document = parsedFilesData.archivos.find(doc => doc.nombre === documentName);

        if (document) {
          setDocumentData(document);

          if (document.imagenes && document.imagenes.length > 0) {
            const imageUris = document.imagenes.map(file => `file://${RNFS.DocumentDirectoryPath}/DocSafe/${file}`);
            setImages(imageUris.map(uri => ({ uri })));

            const mainFile = document.imagenes[0];
            setFileType(getFileType(mainFile));
          } else {
            setFileType(getFileType('unknown.ext')); // Manejo del caso cuando no hay imágenes
          }
        }
      }
    } catch (error) {
      console.error('Error loading document data:', error);
      Alert.alert('Error', 'No se pudo cargar los datos del documento.');
    }
  };

  const getFileType = (fileName) => {
    if (!fileName) return { icon: faFileAlt, color: '#6c757d' }; // Manejo para valores nulos

    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return { icon: faFilePdf, color: '#f40000' };
      case 'doc':
      case 'docx':
        return { icon: faFileWord, color: '#1e90ff' };
      case 'xls':
      case 'xlsx':
        return { icon: faFileExcel, color: '#28a745' };
      case 'ppt':
      case 'pptx':
        return { icon: faFilePowerpoint, color: '#ff6347' };
      case 'jpg':
      case 'jpeg':
      case 'png':
        return { icon: faFileImage, color: '#ffb100' };
      case 'zip':
      case 'rar':
        return { icon: faFileArchive, color: '#f39c12' };
      case 'mp4':
      case 'mkv':
        return { icon: faFileVideo, color: '#f1c40f' };
      case 'mp3':
      case 'wav':
        return { icon: faFileAudio, color: '#8e44ad' };
      default:
        return { icon: faFileAlt, color: '#6c757d' };
    }
  };

  const handleOpenDocument = async (index) => {
    if (documentData && documentData.url && (!documentData.imagenes || documentData.imagenes.length === 0)) {
      // Abrir la URL directamente si no hay imágenes
      handleOpenURL();
    } else if (fileType?.icon === faFileImage) {
      setInitialIndex(index);
      setIsImageViewerVisible(true);
    } else {
      try {
        await openDocument(images[index]?.uri, fileType?.mimeType);
      } catch (error) {
        Alert.alert('Error', 'No se pudo abrir el documento.');
      }
    }
  };

  const handleViewDetails = () => {
    if (documentData) {
      navigation.navigate('DocumentDetail', { document: documentData });
    } else {
      Alert.alert('Error', 'No se pudieron cargar los detalles del documento.');
    }
  };

  const handleOpenURL = async () => {
    if (documentData && documentData.url) {
      let url = documentData.url.trim();
  
      // Asegurarse de que la URL comience con 'http://' o 'https://'
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
  
      try {
        await Linking.openURL(url);
      } catch (error) {
        Alert.alert('Error', 'No se pudo abrir la URL.');
      }
    } else {
      Alert.alert('Error', 'No se proporcionó una URL válida.');
    }
  };

  const handleImageLoadError = () => {
    Alert.alert('Error', 'El archivo no existe o no se pudo cargar.');
  };

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.previewContainer} onPress={() => handleOpenDocument(0)}>
        {fileType?.icon === faFileImage ? (
          <Image
            source={{ uri: images[0]?.uri }}
            style={styles.imagePreview}
            onError={handleImageLoadError}
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: fileType?.color || '#6c757d' }]}>
            <FontAwesomeIcon 
              icon={fileType?.icon || faFileAlt} 
              size={24} 
              color="#ffffff"
            />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.documentName} numberOfLines={1}>{documentName}</Text>
          <Text style={styles.documentDescription} numberOfLines={1}>{documentData?.descripcion || 'Sin descripción'}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewDetails}>
          <FontAwesomeIcon icon={faEye} size={20} color="#185abd" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={documentData?.url ? handleOpenURL : () => Alert.alert('Error', 'Este documento no tiene una URL asociada.')}
          disabled={!documentData?.url}
        >
          <FontAwesomeIcon 
            icon={faLink} 
            size={20} 
            color={documentData?.url ? "#185abd" : "#a9a9a9"} 
          />
        </TouchableOpacity>
      </View>
      <ImageViewer
        visible={isImageViewerVisible}
        images={images}
        initialIndex={initialIndex}
        onClose={() => setIsImageViewerVisible(false)}
        documentName={documentName} // Pasar el nombre del documento a ImageViewer
      />
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imagePreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  documentDescription: {
    fontSize: 14,
    color: '#666666',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default DocumentItem;
