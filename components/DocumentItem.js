import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faFilePdf, faFileWord, faFileExcel, faFilePowerpoint, faFileImage,
  faFileAlt, faFileArchive, faFileVideo, faFileAudio, faEye, faLink, faShareAlt
} from '@fortawesome/free-solid-svg-icons';
import ImageViewing from 'react-native-image-viewing';
import CustomAlert from './CustomAlert';
import { openDocument } from './utils';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const DocumentItem = ({ documentName }) => {
  const navigation = useNavigation();
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [images, setImages] = useState([]);
  const [fileType, setFileType] = useState(null);
  const [initialIndex, setInitialIndex] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showCustomAlert = (title, message) => {
    setAlertConfig({ title, message });
    setShowAlert(true);
  };

  const getFileType = (fileName) => {
    if (!fileName) return { icon: faFileAlt, color: '#6c757d' };

    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return { icon: faFilePdf, color: '#f40000' };
      case 'doc': case 'docx': return { icon: faFileWord, color: '#1e90ff' };
      case 'xls': case 'xlsx': return { icon: faFileExcel, color: '#28a745' };
      case 'ppt': case 'pptx': return { icon: faFilePowerpoint, color: '#ff6347' };
      case 'jpg': case 'jpeg': case 'png': return { icon: faFileImage, color: '#ffb100' };
      case 'zip': case 'rar': return { icon: faFileArchive, color: '#f39c12' };
      case 'mp4': case 'mkv': return { icon: faFileVideo, color: '#f1c40f' };
      case 'mp3': case 'wav': return { icon: faFileAudio, color: '#8e44ad' };
      default: return { icon: faFileAlt, color: '#6c757d' };
    }
  };

  // Chequea las dimensiones de las imágenes locales en iOS
  // para confirmar que la ruta file://... se esté leyendo bien.
  const verifyImagesDimensions = async (imageUris) => {
    for (const img of imageUris) {
      try {
        await new Promise((resolve, reject) => {
          Image.getSize(
            img.uri,
            (width, height) => {
              resolve({ width, height });
            },
            (error) => {
              reject(error);
            }
          );
        });
      } catch (err) {
        // -- OPCIONAL: Copiar el archivo a la caché, y actualizar la URI.
        // const cachePath = `${RNFS.CachesDirectoryPath}/${Date.now()}_temp.jpg`;
        // try {
        //   await RNFS.copyFile(img.uri.replace('file://', ''), cachePath);
        //   img.uri = `file://${cachePath}`;
        //   console.log('[verifyImagesDimensions] -> Copia a cachePath exitosa:', cachePath);
        // } catch (copyError) {
        //   console.error('Error al copiar a cachePath:', copyError);
        // }
      }
    }
  };

  const loadDocumentData = async () => {
    const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
    try {
      const filesDataExists = await RNFS.exists(filesJsonPath);
      if (!filesDataExists) {
        showCustomAlert('Error', 'No se pudo cargar el archivo de datos.');
        return;
      }

      const filesData = await RNFS.readFile(filesJsonPath);
      const parsedFilesData = JSON.parse(filesData);
      const document = parsedFilesData.archivos.find(doc => doc.nombre === documentName);

      if (document) {
        setDocumentData(document);

        const currentDate = new Date();
        const expiryDate = new Date(document.expiryDate);
        setIsExpired(expiryDate < currentDate);

        const imageUris = document.imagenes.map(file => ({
          uri: `file://${RNFS.DocumentDirectoryPath}/DocSafe/${file}`,
        }));
        setImages(imageUris);

        setFileType(getFileType(document.imagenes[0]));

        // Verifica que iOS pueda leer las dimensiones (para permitir pinch zoom).
        verifyImagesDimensions(imageUris);

      }
    } catch (error) {
      console.error('Error cargando datos del documento:', error);
      showCustomAlert('Error', 'No se pudo cargar los datos del documento.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDocumentData();
    }, [documentName])
  );

  const handleOpenDocument = async (index) => {
    if (fileType?.icon === faFileImage && images.length > 0) {
      setInitialIndex(index);
      setIsImageViewerVisible(true);
    } else {
      try {
        await openDocument(images[index]?.uri, fileType?.mimeType);
      } catch (error) {
        showCustomAlert('Error', 'No se pudo abrir el documento.');
      }
    }
  };

  const handleViewDetails = () => {
    if (documentData) {
      console.log('Datos del documento antes de navegar:', documentData);
      navigation.navigate('DocumentDetail', { document: documentData });
    } else {
      showCustomAlert('Error', 'No se pudieron cargar los detalles del documento.');
    }
  };

  const handleOpenURL = async () => {
    if (documentData && documentData.url) {
      let url = documentData.url.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      try {
        await Linking.openURL(url);
      } catch (error) {
        showCustomAlert('Error', 'No se pudo abrir la URL.');
      }
    } else {
      showCustomAlert('Error', 'No se proporcionó una URL válida.');
    }
  };

  const handleShare = async () => {
    try {
      const fileUris = images.map(img => img.uri);

      if (fileUris.length === 0) {
        showCustomAlert('Error', 'No hay archivos para compartir.');
        return;
      }

      const shareOptions = {
        title: 'Compartir Documento',
        urls: fileUris,
        message: `Documento: ${documentName}`,
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error al compartir el documento:', error);
      showCustomAlert('Error', 'No se pudo compartir el documento.');
    }
  };

  return (
    <View style={[styles.itemContainer, isExpired && styles.expiredContainer]}>
      <TouchableOpacity style={styles.previewContainer} onPress={() => handleOpenDocument(0)}>
        {fileType?.icon === faFileImage && images[0]?.uri ? (
          <Image
            source={{ uri: images[0]?.uri }}
            style={styles.imagePreview}
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
          {isExpired ? (
            <Text style={styles.expiredText}>Documento expirado</Text>
          ) : (
            <Text style={styles.documentDescription} numberOfLines={1}>
              {documentData?.descripcion}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewDetails}>
          <FontAwesomeIcon icon={faEye} size={20} color="#185abd" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={documentData?.url ? handleOpenURL : () => showCustomAlert('Error', 'Este documento no tiene una URL asociada.')}
          disabled={!documentData?.url}
        >
          <FontAwesomeIcon
            icon={faLink}
            size={20}
            color={documentData?.url ? "#185abd" : "#a9a9a9"}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <FontAwesomeIcon icon={faShareAlt} size={20} color="#185abd" />
        </TouchableOpacity>
      </View>

      {/* Visor de imágenes con props relevantes para zoom */}
      <ImageViewing
        images={images}
        imageIndex={initialIndex}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
        doubleTapToZoomEnabled={true}
        swipeToCloseEnabled={false} // Desactiva swipe-to-close para evitar conflicto de gestos en iOS
      />

      {showAlert && (
        <CustomAlert
          visible={showAlert}
          onClose={() => setShowAlert(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          onAccept={() => setShowAlert(false)}
        />
      )}
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
  expiredContainer: {
    backgroundColor: '#ffcccc',
  },
  expiredText: {
    fontSize: 14,
    color: '#cc0000',
  },
});

export default DocumentItem;
