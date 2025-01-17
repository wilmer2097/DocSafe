import React, { useState, useEffect } from 'react';
import { View, Button, Modal, Dimensions } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
// import Orientation from 'react-native-orientation-locker';

const App = () => {
  const [visible, setVisible] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const images = [
    {
      url: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/d0db663bf28844dcbd744935cdd8c71083e0031c-5600x3150.jpg',
    },
    {
      url: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/77689751053a9cc507696fce850e345776667f0e-2560x1440.jpg',
    },
  ];

  useEffect(() => {
    const handleDimensionChange = ({ window }) => {
      setDimensions(window);
    };
  
    let subscription;
    if (visible) {
      // Orientation.unlockAllOrientations(); // Comentado para deshabilitar el desbloqueo de orientación
      subscription = Dimensions.addEventListener('change', handleDimensionChange);
    } else {
      // Orientation.lockToPortrait(); // Comentado para bloquear la orientación en vertical
    }
  
    return () => {
      // Orientation.lockToPortrait(); // Comentado para restablecer orientación
      subscription?.remove();
    };
  }, [visible]);
  

  return (
    <View style={{ flex: 1 }}>
      <Button title="Mostrar imágenes" onPress={() => setVisible(true)} />
      <Modal visible={visible} transparent={true} onRequestClose={() => setVisible(false)}>
        <ImageViewer
          imageUrls={images}
          enableSwipeDown
          onSwipeDown={() => setVisible(false)}
          doubleClickInterval={300} // Ajusta este valor según tu preferencia
          renderIndicator={(currentIndex, allSize) => (
            <View style={{ position: 'absolute', top: 40, left: 20 }}>
              <Button title={`Imagen ${currentIndex} de ${allSize}`} />
            </View>
          )}
        />
      </Modal>
    </View>
  );
};

export default App;
