import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Alert, Image, StyleSheet, ScrollView, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSave, faTimesCircle, faCalendarAlt, faFileAlt, faShareAlt, faLink, faImage, faFilePdf, faFileWord, faFileExcel, faFilePowerpoint, faFileVideo, faFileAudio, faFileArchive, faFileCirclePlus, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import ImageViewer from './ImageViewer';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getIconForFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return faFilePdf;
    case 'doc':
    case 'docx':
      return faFileWord;
    case 'xls':
    case 'xlsx':
      return faFileExcel;
    case 'ppt':
    case 'pptx':
      return faFilePowerpoint;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return faImage;
    case 'mp4':
    case 'mov':
    case 'avi':
      return faFileVideo;
    case 'mp3':
    case 'wav':
      return faFileAudio;
    case 'zip':
    case 'rar':
      return faFileArchive;
    default:
      return faFileAlt;
  }
};

const AddDocumentForm = ({ onClose, onDocumentAdded }) => {
  const [principalDocument, setPrincipalDocument] = useState(null);
  const [secondaryDocument, setSecondaryDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [share, setShare] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1))); // Default to one year in the future
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState(0);

  const handlePickDocument = async (type) => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      if (result && result[0]) {
        if (type === 'principal') {
          setPrincipalDocument(result[0]);
        } else {
          setSecondaryDocument(result[0]);
        }
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User canceled the picker');
      } else {
        Alert.alert('Error', 'No se pudo seleccionar el documento.');
      }
    }
  };

  const handleFilePress = (file, index) => {
    const isImage = file?.type?.startsWith('image/');
    if (isImage) {
      setCurrentImageUri(index);
      setIsImageViewerVisible(true);
    } else {
      openDocument(file);
    }
  };

  const deleteFile = (fileType) => {
    if (fileType === 'principal') {
      setPrincipalDocument(null);
    } else {
      setSecondaryDocument(null);
    }
  };

  const handleFileOperation = async (operationType, fileType) => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      if (result && result[0]) {
        if (operationType === 'edit') {
          if (fileType === 'principal') {
            setPrincipalDocument(result[0]);
          } else {
            setSecondaryDocument(result[0]);
          }
        } else if (operationType === 'add') {
          if (!principalDocument) {
            setPrincipalDocument(result[0]);
          } else {
            setSecondaryDocument(result[0]);
          }
        }
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error(`Error al ${operationType === 'edit' ? 'reemplazar' : 'agregar'} el archivo:`, error);
        Alert.alert('Error', `No se pudo ${operationType === 'edit' ? 'reemplazar' : 'agregar'} el archivo.`);
      }
    }
  };

  const renderDocumentFile = (file, fileType, index) => {
    if (!file) {
      return renderAddFileIcon(fileType === 'principal' ? 'Principal/Anverso' : 'Secundario/Reverso');
    }

    const icon = getIconForFileType(file.name);

    return (
      <View key={index} style={styles.documentSection}>
        <Text style={styles.sectionLabel}>{fileType === 'principal' ? 'Principal/Anverso' : 'Secundario/Reverso'}</Text>
        <TouchableOpacity style={styles.fileContainer} onPress={() => handleFilePress(file, index)}>
          {icon === faImage ? (
            <Image source={{ uri: file.uri }} style={styles.filePreview} />
          ) : (
            <FontAwesomeIcon icon={icon} size={50} color="#007BFF" />
          )}
        </TouchableOpacity>
        <View style={styles.iconActions}>
          <TouchableOpacity onPress={() => handleFileOperation('edit', fileType)} style={styles.iconButton}>
            <FontAwesomeIcon icon={faEdit} size={20} color="#185abd" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteFile(fileType)} style={styles.iconButton}>
            <FontAwesomeIcon icon={faTrashAlt} size={20} color="#cc0000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAddFileIcon = (label) => (
    <View style={styles.documentSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TouchableOpacity style={styles.fileContainer} onPress={() => handlePickDocument(label === 'Principal/Anverso' ? 'principal' : 'secondary')}>
        <FontAwesomeIcon icon={faFileCirclePlus} size={50} color="#185abd" />
      </TouchableOpacity>
    </View>
  );

  const handleSave = async () => {
    // Check if either the principal document or URL is provided
    if (!principalDocument && !url) {
      Alert.alert('Error', 'Debe seleccionar al menos un documento principal o proporcionar una URL.');
      return;
    }

    if (!documentName) {
      Alert.alert('Error', 'Debe proporcionar un nombre para el documento.');
      return;
    }

    const folderPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;
    const assetsPath = `${RNFS.DocumentDirectoryPath}/assets`;
    await RNFS.mkdir(folderPath);
    await RNFS.mkdir(assetsPath);

    const imagenes = [];
    let principalFileName = principalDocument?.name || '';

    if (principalDocument) {
      const principalPath = `${folderPath}/${principalFileName}`;
      await RNFS.moveFile(principalDocument.uri, principalPath);
      imagenes.push(principalFileName);
    }

    if (secondaryDocument) {
      const secondaryFileName = secondaryDocument.name;
      const secondaryPath = `${folderPath}/${secondaryFileName}`;
      await RNFS.moveFile(secondaryDocument.uri, secondaryPath);
      imagenes.push(secondaryFileName);
    }

    const documentId = generateUUID();
    const metadata = {
      id_archivo: documentId,
      nombre: documentName,
      descripcion: description,
      url: url,
      expiryDate: expiryDate.toISOString(),
      share: share,
      imagenes: imagenes,
    };

    const metadataPath = `${assetsPath}/archivos.json`;
    let filesData = { archivos: [] };
    if (await RNFS.exists(metadataPath)) {
      const existingData = await RNFS.readFile(metadataPath);
      filesData = JSON.parse(existingData);
    }
    filesData.archivos.push(metadata);
    await RNFS.writeFile(metadataPath, JSON.stringify(filesData));

    Alert.alert('Éxito', 'Documento agregado con éxito.');
    onDocumentAdded();
    onClose();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agregar Documento</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre del documento:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del documento"
          value={documentName}
          onChangeText={setDocumentName}
          placeholderTextColor="#9a9a9a"
        />
      </View>

      <View style={styles.filesContainer}>
        {principalDocument
          ? renderDocumentFile(principalDocument, 'principal', 0)
          : renderAddFileIcon('Principal/Anverso')}
        {secondaryDocument
          ? renderDocumentFile(secondaryDocument, 'secondary', 1)
          : renderAddFileIcon('Secundario/Reverso')}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Comentario:</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Comentario"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor="#9a9a9a"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>URL del documento:</Text>
        <View style={styles.urlContainer}>
          <TextInput
            style={[styles.input, styles.urlInput]}
            placeholder="URL (Opcional)"
            value={url}
            onChangeText={setUrl}
            placeholderTextColor="#9a9a9a"
          />
          <FontAwesomeIcon icon={faLink} size={24} color="#185abd" />
        </View>
      </View>

      <View style={styles.dateAndShareContainer}>
        <View style={styles.dateContainer}>
          <Text style={styles.label}>Fecha de caducidad:</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
            <FontAwesomeIcon icon={faCalendarAlt} size={24} color="#185abd" style={styles.dateIcon} />
            <Text style={styles.dateText}>{expiryDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expiryDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                setExpiryDate(selectedDate || expiryDate);
              }}
            />
          )}
        </View>
        <View style={styles.shareContainer}>
          <Text style={styles.label}>Compartir:</Text>
          <Switch
            value={share}
            onValueChange={setShare}
            trackColor={{ false: "#767577", true: "#185abd" }}
            thumbColor={share ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <FontAwesomeIcon icon={faSave} size={24} color="#fff" />
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <FontAwesomeIcon icon={faTimesCircle} size={24} color="#fff" />
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isImageViewerVisible} transparent={true} animationType="slide">
        <ImageViewer
          visible={isImageViewerVisible}
          images={[
            principalDocument && { uri: principalDocument.uri },
            secondaryDocument && { uri: secondaryDocument?.uri }
          ].filter(Boolean)}
          initialIndex={currentImageUri}
          onClose={() => setIsImageViewerVisible(false)}
        />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#185abd',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    color: '#333',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#ffffff',
    color: '#333',
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  filesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  documentSection: {
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  fileContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  filePreview: {
    width: '100%',
    height: '100%',
    resize: 'contain',
    borderRadius: 12,
  },
  iconActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 12,
  },
  urlInput: {
    flex: 1,
    borderWidth: 0,
  },
  dateAndShareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateContainer: {
    flex: 1,
    marginRight: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#185abd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#cc0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddDocumentForm;