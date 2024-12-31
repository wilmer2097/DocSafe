// SimpleImagePicker.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Button, 
  Image, 
  StyleSheet, 
  Platform, 
  PermissionsAndroid 
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

export default function SimpleImagePicker() {
  const [selectedImage, setSelectedImage] = useState(null);

  // Función para abrir la galería
  const handleChoosePhoto = async () => {
    // En Android, es recomendable solicitar permiso para leer la galería
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permiso de acceso a la galería',
          message: 'La aplicación necesita acceder a tu galería para seleccionar una foto.',
          buttonNeutral: 'Pregúntame más tarde',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permiso de galería denegado');
        return;
      }
    }

    // Opciones para la galería
    const options = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('El usuario canceló la selección de imagen');
      } else if (response.errorCode) {
        console.log('Error al seleccionar la imagen: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        // Tomamos la primera imagen seleccionada
        const { uri } = response.assets[0];
        setSelectedImage(uri);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Button 
        title="Seleccionar imagen"
        onPress={handleChoosePhoto}
      />

      {/* Mostrar la imagen seleccionada */}
      {selectedImage && (
        <Image
          source={{ uri: selectedImage }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  previewImage: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 10,
  },
});