// ImageViewerTest.js
import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import ImageViewing from 'react-native-image-viewing';

export default function ImageViewerTest() {
  const [visible, setVisible] = useState(false);

  // Array de imágenes
  const images = [
    { uri: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/d0db663bf28844dcbd744935cdd8c71083e0031c-5600x3150.jpg' },
    { uri: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/77689751053a9cc507696fce850e345776667f0e-2560x1440.jpg' },
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
