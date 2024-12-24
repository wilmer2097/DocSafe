// components/TestScreen.js
import React, { useState } from 'react';
import { View, Button, StyleSheet, Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

const TestScreen = () => {
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const images = [
    {
      url: 'https://hips.hearstapps.com/es.h-cdn.co/fotoes/images/peliculas/el-grinch-2018/137750092-1-esl-ES/El-Grinch-2018.jpg?resize=320:*',
    },
    {
      url: 'https://media.gq.com.mx/photos/5be9d4c584b96ec6bf9406aa/master/w_1600,c_limit/el_grinch_4929.jpg',
    },
  ];

  return (
    <View style={styles.container}>
      <Button title="Abrir Visor de Imágenes" onPress={() => setIsViewerVisible(true)} />
      <Modal visible={isViewerVisible} transparent={true} onRequestClose={() => setIsViewerVisible(false)}>
        <ImageViewer
          imageUrls={images}
          onSwipeDown={() => setIsViewerVisible(false)}
          enableSwipeDown={true}
          onCancel={() => setIsViewerVisible(false)}
          renderIndicator={(currentIndex, allSize) => (
            <View style={styles.indicator}>
              <Text style={styles.indicatorText}>
                {currentIndex} / {allSize}
              </Text>
            </View>
          )}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  indicator: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
  },
  indicatorText: {
    color: 'white',
    fontSize: 16,
  },
});

export default TestScreen;
