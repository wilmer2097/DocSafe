import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Modal, FlatList, TouchableOpacity, Animated, Alert, useWindowDimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const ImageViewer = ({ visible, images, initialIndex = 0, onClose, documentName }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [documentData, setDocumentData] = useState(null); // Almacena los datos del documento
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const { width, height } = useWindowDimensions();

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index); // Actualiza el índice actual
    }
  }).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      loadDocumentData();

      // Asegurarnos de que el FlatList se desplace al índice correcto
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: initialIndex, animated: true });
        }
      }, 300); // Pequeño retraso para asegurar que el FlatList esté listo
    } else {
      setCurrentIndex(initialIndex); // Reiniciar el índice cuando el modal se cierra
    }
  }, [visible, initialIndex]);

  const loadDocumentData = async () => {
    try {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      const filesDataExists = await RNFS.exists(filesJsonPath);

      if (filesDataExists) {
        const filesData = await RNFS.readFile(filesJsonPath);
        const parsedFilesData = JSON.parse(filesData);
        const document = parsedFilesData.archivos.find(doc => doc.nombre === documentName);

        if (document) {
          setDocumentData(document); // Guardar datos del documento
        }
      }
    } catch (error) {
      console.error('Error loading document data:', error);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(onClose);
  };

  const handleShare = async () => {
    try {
      if (!documentData || !documentData.imagenes || documentData.imagenes.length === 0) {
        Alert.alert('Error', 'No hay imágenes disponibles para compartir.');
        return;
      }

      const fileName = documentData.imagenes[currentIndex];
      const fileUri = `file://${RNFS.DocumentDirectoryPath}/DocSafe/${fileName}`;

      if (!fileUri) {
        Alert.alert('Error', 'No hay archivo disponible para compartir.');
        return;
      }

      const mimeType = getMimeType(fileUri) || '*/*';

      const shareOptions = {
        title: 'Compartir Imagen',
        url: fileUri,
        message: `Mira esta imagen: ${documentName}`,
        type: mimeType,
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error al compartir la imagen:', error);
      Alert.alert('Error', 'No se pudo compartir la imagen.');
    }
  };

  const getMimeType = (fileUri) => {
    const extension = fileUri.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return '*/*';
    }
  };

  const renderImage = ({ item }) => (
    <View style={[styles.imageContainer, { width, height }]}>
      <Image source={{ uri: item.uri }} style={[styles.image, { width, height }]} />
    </View>
  );

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => {
        flatListRef.current.scrollToIndex({ index: prevIndex - 1, animated: true });
        return prevIndex - 1;
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prevIndex => {
        flatListRef.current.scrollToIndex({ index: prevIndex + 1, animated: true });
        return prevIndex + 1;
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentIndex}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(data, index) => (
            { length: width, offset: width * index, index }
          )}
          style={styles.flatList}
        />
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <FontAwesomeIcon icon={faTimes} size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.navigationButtons}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.navButton} onPress={handlePrev}>
              <FontAwesomeIcon icon={faChevronLeft} size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
          {currentIndex < images.length - 1 && (
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <FontAwesomeIcon icon={faChevronRight} size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <FontAwesomeIcon icon={faShareAlt} size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'contain',
  },
  flatList: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 25,
  },
  navigationButtons: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    top: '50%',
  },
  navButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 25,
  },
  shareButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 25,
  },
});

export default ImageViewer;
