// CustomImageViewer.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedRef,
  Easing,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

export default function CustomImageViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
  documentName,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [canScroll, setCanScroll] = useState(true); // Permitir swipe horizontal
  const [documentData, setDocumentData] = useState(null);

  // Animación para fade in/out
  const fadeAnim = useSharedValue(0);

  // Zoom/Pan
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Ref a la FlatList
  const flatListRef = useAnimatedRef();

  // Dimensiones de ventana
  const { width, height } = useWindowDimensions();

  // Efecto al mostrar/ocultar
  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300, easing: Easing.ease });
      loadDocumentData(); // si lo necesitas
    } else {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  // Carga doc (si lo necesitas para compartir)
  const loadDocumentData = async () => {
    try {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      const filesDataExists = await RNFS.exists(filesJsonPath);

      if (filesDataExists) {
        const filesData = await RNFS.readFile(filesJsonPath);
        const parsedFilesData = JSON.parse(filesData);
        const doc = parsedFilesData.archivos.find(
          (d) => d.nombre === documentName
        );
        if (doc) {
          console.log('[CustomImageViewer] Document data found:', doc.nombre);
          setDocumentData(doc);
        } else {
          console.log('[CustomImageViewer] No doc found with nombre=', documentName);
        }
      }
    } catch (error) {
      console.error('[CustomImageViewer] Error loading doc data:', error);
    }
  };

  // Reset de zoom/pan
  const resetValues = useCallback(() => {
    'worklet';
    console.log('[resetValues] → scale=1, translating=0');
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    runOnJS(setCanScroll)(true);
  }, []);

  // Gestos
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      'worklet';
      scale.value = event.scale;
      if (event.scale > 1) {
        runOnJS(setCanScroll)(false);
      }
    })
    .onEnd(() => {
      'worklet';
      if (scale.value <= 1) {
        resetValues();
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      'worklet';
      if (scale.value > 1) {
        resetValues();
      } else {
        scale.value = withSpring(2);
        runOnJS(setCanScroll)(false);
      }
    });

  // Combinar gestos
  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    pinchGesture,
    panGesture
  );

  // Estilo animado de la imagen
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Fade in/out container
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  // Manejo de scroll horizontal
  const scrollHandler = useAnimatedScrollHandler({
    onMomentumEnd: (event) => {
      const offsetX = event.contentOffset.x;
      const newIndex = Math.round(offsetX / width);
      console.log(
        '[scrollHandler] onMomentumEnd offsetX=',
        offsetX,
        ' newIndex=',
        newIndex
      );
      runOnJS(setCurrentIndex)(newIndex);
      runOnJS(resetValues)();
    },
  });

  // Función cerrar
  const handleClose = () => {
    console.log('[handleClose] → anim fade out');
    fadeAnim.value = withTiming(0, { duration: 300, easing: Easing.ease }, () => {
      runOnJS(onClose)();
    });
  };

  // Compartir la imagen actual
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
      console.error('[CustomImageViewer] Error al compartir:', error);
    }
  };

  const getMimeType = (fileUri) => {
    const extension = fileUri.split('.').pop()?.toLowerCase();
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

  // Renderiza cada página
  const renderImage = useCallback(
    ({ item, index }) => {
      console.log('[renderImage] index=', index, ' uri=', item.uri);
      return (
        <GestureHandlerRootView style={{ width, height }}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={styles.imageContainer}>
              <Animated.Image
                source={{ uri: item.uri }}
                style={[styles.image, { width, height }, animatedStyle]}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      );
    },
    [width, height, animatedStyle, composedGesture]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalContainer, fadeStyle]}>
        <Animated.FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(item, i) => `${item.uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentIndex}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          // Forzamos que cada ítem sea width px para que pagingEnabled funcione
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          scrollEnabled={canScroll}
        />

        {/* Botón Cerrar */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <FontAwesomeIcon icon={faTimes} size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Botón Compartir */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <FontAwesomeIcon icon={faShareAlt} size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
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
