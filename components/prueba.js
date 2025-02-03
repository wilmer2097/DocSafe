// components/ZoomableImage.js
import React, { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const ZoomableImage = ({ uri, onZoomChange, width, height }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  // Valores compartidos para animaciones
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Gesto de Doble Tap para alternar zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(setIsZoomed)(false);
        runOnJS(onZoomChange)(false);
      } else {
        scale.value = withSpring(2);
        runOnJS(setIsZoomed)(true);
        runOnJS(onZoomChange)(true);
      }
    });

  // Gesto de Pinch para zoom in/out
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
      if (event.scale > 1 && !isZoomed) {
        runOnJS(setIsZoomed)(true);
        runOnJS(onZoomChange)(true);
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(setIsZoomed)(false);
        runOnJS(onZoomChange)(false);
      }
    });

  // Gesto de Pan para mover la imagen cuando está en zoom
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(setIsZoomed)(false);
        runOnJS(onZoomChange)(false);
      }
    });

  // Combinar gestos de Pinch, Pan y Doble Tap simultáneamente
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // Estilo animado basado en los valores compartidos
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Reanimated.View style={[styles.imageContainer, { width, height }, animatedStyle]}>
        <Image
          source={{ uri }}
          style={[styles.image, { width, height }]}
          resizeMode="contain"
        />
      </Reanimated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black', // Para depuración
  },
  image: {
    // Las dimensiones se pasan como props
  },
});

export default ZoomableImage;
