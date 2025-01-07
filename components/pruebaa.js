// ImageViewerTest.js
import React, { useState } from 'react';
import { View, Button, StyleSheet, Image } from 'react-native';
import ImageViewing from 'react-native-image-viewing';

export default function ImageViewerTest() {
  const [visible, setVisible] = useState(false);

  // Array de imágenes
  const images = [
    { uri: Image.resolveAssetSource(require('../src/presentation/assets/Logo.jpg')).uri },
    { uri: Image.resolveAssetSource(require('../src/presentation/assets/Logo.jpg')).uri },
  ];

  return (
    <View style={styles.container}>
      <Button title="Mostrar visor" onPress={() => setVisible(true)} />
      <ImageViewing
        images={images}
        imageIndex={0}        // índice inicial
        visible={visible}     // cuando true, se muestra el visor
        onRequestClose={() => setVisible(false)}  // callback de cierre
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
