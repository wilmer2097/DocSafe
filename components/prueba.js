// SimpleModalImagePicker.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

export default function SimpleModalImagePicker() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Abre el modal con las 3 opciones
  const handleOpenModal = () => {
    setModalVisible(true);
  };

  // Cierra el modal
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  // Permiso de galería en Android (opcional, pero recomendado)
  const requestAndroidGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permiso de galería',
          message: 'Se requiere acceder a tu galería para seleccionar una imagen.',
          buttonNeutral: 'Pregúntame luego',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS no usa esta ruta
  };

  // --- NUEVA LÓGICA: cerrar modal y luego abrir la cámara/galería/archivos con un pequeño delay ---

  const handleSelectCamera = () => {
    // Cierra el modal primero
    setModalVisible(false);
    // Espera 200ms para asegurarte de que el modal se haya cerrado
    setTimeout(() => {
      openCamera();
    }, 200);
  };

  const handleSelectGallery = () => {
    setModalVisible(false);
    setTimeout(() => {
      openGallery();
    }, 200);
  };

  const handleSelectFiles = () => {
    setModalVisible(false);
    setTimeout(() => {
      openFiles();
    }, 200);
  };

  // ------------------------------------------------------------------

  // Opción 1: Abrir Cámara
  const openCamera = async () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    };

    const result = await launchCamera(options);
    if (result.didCancel) {
      console.log('El usuario canceló la cámara');
      return;
    } else if (result.errorCode) {
      console.log('Error al usar la cámara:', result.errorMessage);
      return;
    }

    if (result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Opción 2: Abrir Galería
  const openGallery = async () => {
    // Verifica/solicita permisos en Android
    const granted = await requestAndroidGalleryPermission();
    if (!granted) {
      console.log('Permiso de galería denegado');
      return;
    }

    const options = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    };

    const result = await launchImageLibrary(options);
    if (result.didCancel) {
      console.log('El usuario canceló la selección de la galería');
      return;
    } else if (result.errorCode) {
      console.log('Error al abrir galería:', result.errorMessage);
      return;
    }

    if (result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Opción 3: Abrir “Archivos”
  const openFiles = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      if (result && result[0]) {
        setSelectedImage(result[0].uri);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('Usuario canceló la selección de archivos');
      } else {
        console.log('Error al seleccionar archivo:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Seleccionar imagen" onPress={handleOpenModal} />

      {/* Vista previa de la imagen */}
      {selectedImage && (
        <Image
          source={{ uri: selectedImage }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      )}

      {/* Modal con las 3 opciones */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar origen</Text>

            {/* Botón para Cámara */}
            <TouchableOpacity style={styles.optionButton} onPress={handleSelectCamera}>
              <Text style={styles.optionText}>Cámara</Text>
            </TouchableOpacity>

            {/* Botón para Galería */}
            <TouchableOpacity style={styles.optionButton} onPress={handleSelectGallery}>
              <Text style={styles.optionText}>Galería</Text>
            </TouchableOpacity>

            {/* Botón para Archivos */}
            <TouchableOpacity style={styles.optionButton} onPress={handleSelectFiles}>
              <Text style={styles.optionText}>Archivos</Text>
            </TouchableOpacity>

            {/* Botón para Cancelar */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos básicos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  previewImage: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semitransparencia
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#185abd',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  optionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  cancelText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
