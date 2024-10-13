import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity, Animated, Alert, useWindowDimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { PinchGestureHandler, PanGestureHandler, TapGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, runOnJS, withSpring } from 'react-native-reanimated';

const CustomImageViewer = ({ visible, images, initialIndex = 0, onClose, documentName }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scrollEnabled, setScrollEnabled] = useState(true); // Controla el scroll del FlatList
  const [documentData, setDocumentData] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const { width, height } = useWindowDimensions();

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const doubleTapRef = useRef();

  const pinchHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = event.scale;
      if (event.scale > 1) {
        runOnJS(setScrollEnabled)(false); // Desactiva el scroll cuando haces zoom
      }
    },
    onEnd: () => {
      if (scale.value <= 1) {
        runOnJS(setScrollEnabled)(true); // Reactiva el scroll cuando el zoom es menor o igual a 1
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const panHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    },
    onEnd: () => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const doubleTapHandler = useAnimatedGestureHandler({
    onActive: () => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(setScrollEnabled)(true); // Reactiva el scroll cuando se restablece el zoom
      } else {
        scale.value = withSpring(2); // Doble toque aumenta el zoom
        runOnJS(setScrollEnabled)(false); // Desactiva el scroll al hacer zoom
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
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

      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: initialIndex, animated: true });
        }
      }, 300);
    } else {
      setCurrentIndex(initialIndex);
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
          setDocumentData(document);
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
    <GestureHandlerRootView>
      <TapGestureHandler
        onHandlerStateChange={doubleTapHandler}
        numberOfTaps={2}
        ref={doubleTapRef}
      >
        <Reanimated.View>
          <PanGestureHandler onGestureEvent={panHandler}>
            <Reanimated.View>
              <PinchGestureHandler onGestureEvent={pinchHandler}>
                <Reanimated.View style={[styles.imageContainer, { width, height }]}>
                  <Reanimated.Image
                    source={{ uri: item.uri }}
                    style={[styles.image, { width, height }, animatedStyle]}
                  />
                </Reanimated.View>
              </PinchGestureHandler>
            </Reanimated.View>
          </PanGestureHandler>
        </Reanimated.View>
      </TapGestureHandler>
    </GestureHandlerRootView>
  );

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
          scrollEnabled={scrollEnabled} // Controla el scroll con base en el zoom
        />
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <FontAwesomeIcon icon={faTimes} size={24} color="#ffffff" />
        </TouchableOpacity>
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
  shareButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 25,
  },
});

export default CustomImageViewer;
