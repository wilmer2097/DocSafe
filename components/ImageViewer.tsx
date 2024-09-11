import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Modal, FlatList, Dimensions, TouchableOpacity, Animated, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faChevronLeft, faChevronRight, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share'; // Esta es la importación correcta

const { width, height } = Dimensions.get('window');

const ImageViewer = ({ visible, images, initialIndex = 0, onClose, documentName }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isShareEnabled, setIsShareEnabled] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      checkShareStatus();
    }
  }, [visible]);

  const checkShareStatus = async () => {
    try {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      const filesDataExists = await RNFS.exists(filesJsonPath);

      if (filesDataExists) {
        const filesData = await RNFS.readFile(filesJsonPath);
        const parsedFilesData = JSON.parse(filesData);
        const document = parsedFilesData.archivos.find(doc => doc.nombre === documentName);

        if (document && document.share) {
          setIsShareEnabled(true);
        } else {
          setIsShareEnabled(false);
        }
      }
    } catch (error) {
      console.error('Error checking share status:', error);
      setIsShareEnabled(false);
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
    if (!isShareEnabled) {
      Alert.alert('Compartir deshabilitado', 'No puedes compartir este documento porque la opción de compartir no está activa.');
      return;
    }
  
    try {
      const fileUri = images[currentIndex].uri;
      const shareOptions = {
        title: 'Compartir Imagen',
        url: fileUri,
        message: `Mira esta imagen: ${documentName}`, // Aquí se usa el nombre del documento
        type: 'image/jpeg',
      };
  
      const result = await Share.open(shareOptions);
  
      if (result.success) {
        console.log('Imagen compartida con éxito');
      } else {
        console.log('Compartir cancelado');
      }
    } catch (error) {
      console.error('Error al compartir la imagen:', error.message);
      Alert.alert('Error', 'No se pudo compartir la imagen.');
    }
  };
  

  const renderImage = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={styles.image} />
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

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: currentIndex, animated: true });
    }
  }, [currentIndex]);

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
          onMomentumScrollEnd={(event) => {
            const index = Math.floor(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
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
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
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
    top: height / 2 - 20,
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
