import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTimes,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faImage,
  faFileAlt,
  faFileArchive,
  faFileVideo,
  faFileAudio,
  faEye,
  faLink,
  faShareAlt,
} from '@fortawesome/free-solid-svg-icons';
import ImageViewer from 'react-native-image-zoom-viewer';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
// import Orientation from 'react-native-orientation-locker'; // **Importación añadida**
// Importa openDocument desde utils
import { openDocument } from './utils'; // Asegúrate de ajustar la ruta según tu estructura de archivos

const DocumentItem = ({ documentName }) => {
  const navigation = useNavigation();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [images, setImages] = useState([]); // Todos los archivos
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [documentData, setDocumentData] = useState(null);
  const [fileType, setFileType] = useState(null);
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
        return { icon: faImage, color: '#ffb100' };
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
      const document = parsedFilesData.archivos.find((doc) => doc.nombre === documentName);

      if (document) {
        setDocumentData(document);

        const currentDate = new Date();
        const expiryDate = new Date(document.expiryDate);
        setIsExpired(expiryDate < currentDate);

        const allFileUris = document.imagenes.map((file) => ({
          url: `file://${RNFS.DocumentDirectoryPath}/DocSafe/${file}`,
        }));
        setImages(allFileUris);
        setFileType(getFileType(document.imagenes[0]));
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

  // **Hook useEffect añadido para manejar la orientación**
  useEffect(() => {
    if (viewerVisible) {
      // Si se abrió el visor, desbloquear todas las orientaciones
      // Orientation.unlockAllOrientations();
    } else {
      // Si se cerró el visor, bloquear en modo vertical
      // Orientation.lockToPortrait();
    }
  }, [viewerVisible]);

  const handleOpenDocument = async (index) => {
    const currentFile = images[index]?.url;
    if (!currentFile) {
      showCustomAlert('Error', 'El archivo no está disponible.');
      return;
    }

    const isImage = /\.(jpg|jpeg|png)$/i.test(currentFile);
    if (isImage) {
      // Encontrar el índice en imagesForViewer
      const imagesOnly = images.filter(file => /\.(jpg|jpeg|png)$/i.test(file.url));
      const imageIndex = imagesOnly.findIndex(file => file.url === currentFile);
      setCurrentImageIndex(imageIndex);
      setViewerVisible(true);
    } else {
      try {
        await openDocument(currentFile);
      } catch (error) {
        showCustomAlert('Error', 'No se pudo abrir el documento.');
      }
    }
  };

  const handleViewDetails = () => {
    if (documentData) {
      navigation.navigate('DocumentDetail', { document: documentData });
    } else {
      showCustomAlert('Error', 'No se pudieron cargar los detalles del documento.');
    }
  };

  const handleOpenURL = async () => {
    if (documentData?.url) {
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
      const fileUris = images.map((img) => img.url);

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

  // Define imagesForViewer con solo imágenes
  const imagesForViewer = images
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file.url))
    .map(file => ({ url: file.url }));

  return (
    <View style={[styles.itemContainer, isExpired && styles.expiredContainer]}>
      <TouchableOpacity style={styles.previewContainer} onPress={() => handleOpenDocument(0)}>
        {fileType?.icon === faImage && images[0]?.url ? (
          <Image source={{ uri: images[0]?.url }} style={styles.imagePreview} />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: fileType?.color || '#6c757d' }]}>
            <FontAwesomeIcon icon={fileType?.icon || faFileAlt} size={24} color="#ffffff" />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.documentName} numberOfLines={1}>
            {documentName}
          </Text>
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
          onPress={
            documentData?.url
              ? handleOpenURL
              : () => showCustomAlert('Error', 'Este documento no tiene una URL asociada.')
          }
          disabled={!documentData?.url}
        >
          <FontAwesomeIcon
            icon={faLink}
            size={20}
            color={documentData?.url ? '#185abd' : '#a9a9a9'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <FontAwesomeIcon icon={faShareAlt} size={20} color="#185abd" />
        </TouchableOpacity>
      </View>

      {/* Visor de imágenes */}
      <Modal visible={viewerVisible} transparent={true} onRequestClose={() => setViewerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.closeButton}>
            <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
          </TouchableOpacity>
          <ImageViewer
            imageUrls={imagesForViewer}
            index={currentImageIndex}
            enableSwipeDown
            doubleClickInterval={300}
            onSwipeDown={() => setViewerVisible(false)}
            renderIndicator={(currentIndex, allSize) => (
              <View style={styles.indicatorContainer}>
                <Text style={styles.indicatorText}>{`${currentIndex} / ${allSize}`}</Text>
              </View>
            )}
            onChange={(index) => {
              if (index < imagesForViewer.length) {
                setCurrentImageIndex(index);
              } else {
                setCurrentImageIndex(imagesForViewer.length - 1);
              }
            }}
            saveToLocalByLongPress={false} // Desactiva la opción de guardar imagen por largo clic
            renderHeader={() => null} // Evita duplicar el botón de cierre
          />
        </View>
      </Modal>

      {/* Alerta personalizada */}
      {showAlert && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showAlert}
          onRequestClose={() => setShowAlert(false)}
        >
          <View style={styles.alertContainer}>
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowAlert(false)}
              >
                <Text style={styles.alertButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Ajusta según la plataforma
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fondo semitransparente
    borderRadius: 20, // Botón redondeado
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20, // Ajusta según tu preferencia
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', // Fondo semitransparente para mejor legibilidad
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  alertMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#185abd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default DocumentItem;
