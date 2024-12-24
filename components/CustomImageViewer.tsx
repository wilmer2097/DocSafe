import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Modal, FlatList, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTimes, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS,
  useAnimatedRef,
  Easing,
  useAnimatedScrollHandler
} from 'react-native-reanimated';

interface CustomImageViewerProps {
  visible: boolean;
  images: { uri: string }[];
  initialIndex?: number;
  onClose: () => void;
  documentName: string;
}

const CustomImageViewer: React.FC<CustomImageViewerProps> = ({ 
  visible, 
  images, 
  initialIndex = 0, 
  onClose, 
  documentName 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [documentData, setDocumentData] = useState<any>(null);
  const flatListRef = useAnimatedRef<FlatList>();
  const { width, height } = useWindowDimensions();

  const fadeAnim = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scrollEnabled = useSharedValue(true);

  const resetValues = useCallback(() => {
    'worklet';
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    scrollEnabled.value = true;
  }, []);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300, easing: Easing.ease });
      loadDocumentData();
    } else {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex, fadeAnim]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      'worklet';
      scale.value = event.scale;
      if (event.scale > 1) {
        scrollEnabled.value = false;
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
        scrollEnabled.value = false;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onMomentumEnd: (event) => {
      const newIndex = Math.round(event.contentOffset.x / width);
      runOnJS(setCurrentIndex)(newIndex);
      resetValues();
    },
  });

  const loadDocumentData = async () => {
    try {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      const filesDataExists = await RNFS.exists(filesJsonPath);

      if (filesDataExists) {
        const filesData = await RNFS.readFile(filesJsonPath);
        const parsedFilesData = JSON.parse(filesData);
        const document = parsedFilesData.archivos.find((doc: any) => doc.nombre === documentName);

        if (document) {
          setDocumentData(document);
        }
      }
    } catch (error) {
      console.error('Error loading document data:', error);
    }
  };

  const handleClose = () => {
    fadeAnim.value = withTiming(0, { duration: 300, easing: Easing.ease }, () => {
      runOnJS(onClose)();
    });
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

  const getMimeType = (fileUri: string) => {
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

  const renderImage = useCallback(({ item }: { item: { uri: string } }) => (
    <GestureHandlerRootView>
      <GestureDetector gesture={Gesture.Simultaneous(doubleTapGesture, Gesture.Race(pinchGesture, panGesture))}>
        <Animated.View style={[styles.imageContainer, { width, height }]}>
          <Animated.Image
            source={{ uri: item.uri }}
            style={[styles.image, { width, height }, animatedStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  ), [width, height, animatedStyle, doubleTapGesture, pinchGesture, panGesture]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalContainer, fadeStyle]}>
        <Animated.FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentIndex}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => (
            { length: width, offset: width * index, index }
          )}
          scrollEnabled={scrollEnabled}
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

