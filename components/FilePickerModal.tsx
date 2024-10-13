import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCamera, faImages, faFile, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import ImageCropPicker from 'react-native-image-crop-picker';
import DocumentPicker from 'react-native-document-picker';

const FilePickerModal = ({ visible, onClose, onFileSelected }) => {
  const handleActionSheetPress = (option) => {
    if (option === 'camera') openCamera();
    if (option === 'gallery') openGallery();
    if (option === 'files') openDocumentPicker();
  };

  const openCamera = async () => {
    try {
      const image = await ImageCropPicker.openCamera({
        cropping: true,
        freeStyleCropEnabled: true,
        includeBase64: false,
        compressImageQuality: 0.8,
      });
      onFileSelected({ uri: image.path, name: `camera_${new Date().toISOString()}.jpg`, type: image.mime });
      onClose();  // Cerrar el modal solo después de seleccionar el archivo
    } catch (error) {
      console.log('Error abriendo la cámara', error);
    }
  };

  const openGallery = async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        cropping: true,
        freeStyleCropEnabled: true,
        includeBase64: false,
        compressImageQuality: 0.8,
      });
      onFileSelected({ uri: image.path, name: image.filename || `gallery_${new Date().toISOString()}.jpg`, type: image.mime });
      onClose();  // Cerrar el modal solo después de seleccionar el archivo
    } catch (error) {
      console.log('Error seleccionando de la galería', error);
    }
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
      if (result && result[0]) {
        onFileSelected(result[0]);
        onClose();  // Cerrar el modal solo después de seleccionar el archivo
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.log('Error seleccionando documento', error);
      }
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.actionSheetContainer}>
        <View style={styles.actionSheet}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.optionsContainer}>
            <TouchableOpacity onPress={() => handleActionSheetPress('camera')}>
              <FontAwesomeIcon icon={faCamera} size={40} color="#185abd" />
              <Text style={styles.optionText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleActionSheetPress('gallery')}>
              <FontAwesomeIcon icon={faImages} size={40} color="#185abd" />
              <Text style={styles.optionText}>Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleActionSheetPress('files')}>
              <FontAwesomeIcon icon={faFile} size={40} color="#185abd" />
              <Text style={styles.optionText}>Archivos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  optionText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    color: '#333',
  },
});

export default FilePickerModal;
