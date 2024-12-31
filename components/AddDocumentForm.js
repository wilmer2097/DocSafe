import React, { useState, useRef } from 'react'; 
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  Image, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSave,
  faTimesCircle,
  faCalendarAlt,
  faFileAlt,
  faShareAlt,
  faLink,
  faImage,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileVideo,
  faFileAudio,
  faFileArchive,
  faFileCirclePlus,
  faEdit,
  faTrashAlt,
  faCamera,
  faImages,
  faFile
} from '@fortawesome/free-solid-svg-icons';

import CustomImageViewer from './CustomImageViewer'; 
import CustomAlert from './CustomAlert';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Genera un nombre de archivo único para DocSafe (puedes ajustarlo como gustes)
const generateUniqueFilename = (extension = '.jpg') => {
  return `docSafe_${Date.now()}_${Math.floor(Math.random() * 10000)}${extension}`;
};

const getIconForFileType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return { icon: faFilePdf, color: '#f40000' };
    case 'doc':
    case 'docx':
      return { icon: faFileWord, color: '#1e90ff' };
    case 'xls':
    case 'xlsx':
      return { icon: faFileExcel, color: '#28a745' };
    case 'ppt':
    case 'pptx':
      return { icon: faFilePowerpoint, color: '#ff6347' };
    case 'jpg':
    case 'jpeg':
    case 'png':
      return { icon: faImage, color: '#ffb100' };
    case 'zip':
    case 'rar':
      return { icon: faFileArchive, color: '#f39c12' };
    case 'mp4':
    case 'mkv':
      return { icon: faFileVideo, color: '#f1c40f' };
    case 'mp3':
    case 'wav':
      return { icon: faFileAudio, color: '#8e44ad' };
    default:
      return { icon: faFileAlt, color: '#6c757d' };  // Ícono genérico
  }
};

const AddDocumentForm = ({ onClose, onDocumentAdded }) => {
  const [principalDocument, setPrincipalDocument] = useState(null);
  const [secondaryDocument, setSecondaryDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [share, setShare] = useState(false);
  const [expiryDate, setExpiryDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState(0);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false); 
  const [fileType, setFileType] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});
  const [editingFileIndex, setEditingFileIndex] = useState(null);
  const [isPicking, setIsPicking] = useState(false);

  const documentNameRef = useRef(null);
  const descriptionRef = useRef(null);
  const urTextlRef = useRef(null);

  // ------------------------------
  // PERMISOS
  // ------------------------------
  const requestPermission = async (type) => {
    if (Platform.OS === 'ios') {
      if (type === 'gallery') {
        return await checkAndRequestPermission(PERMISSIONS.IOS.PHOTO_LIBRARY);
      } else if (type === 'camera') {
        return await checkAndRequestPermission(PERMISSIONS.IOS.CAMERA);
      }
    } else {
      // Para Android, detecta la versión
      const androidVersion = Platform.Version;
      if (type === 'gallery') {
        if (androidVersion >= 33) {
          return await checkAndRequestPermission(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        } else {
          return await checkAndRequestPermission(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        }
      } else if (type === 'camera') {
        return await checkAndRequestPermission(PERMISSIONS.ANDROID.CAMERA);
      }
    }
  };

  const checkAndRequestPermission = async (permission) => {
    const result = await check(permission);
    switch (result) {
      case RESULTS.UNAVAILABLE:
        Alert.alert('Permiso no disponible', 'Este permiso no está disponible en este dispositivo.');
        return false;
      case RESULTS.DENIED:
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      case RESULTS.LIMITED:
        return true;
      case RESULTS.GRANTED:
        return true;
      case RESULTS.BLOCKED:
        Alert.alert('Permiso bloqueado', 'Debe habilitar el permiso en la configuración para usar esta función.');
        return false;
    }
  };

  // ------------------------------
  // ACTION SHEET
  // ------------------------------
  const handleActionSheetPress = (option) => {
    console.log('[handleActionSheetPress] Opción elegida:', option);
    // Cierra el modal
    setIsActionSheetVisible(false);

    // Espera 500 ms antes de abrir la galería/cámara/archivos
    setTimeout(async () => {
      console.log('[handleActionSheetPress -> setTimeout] Iniciando...');
      let permissionResult;
      switch (option) {
        case 'camera':
          permissionResult = await requestPermission('camera');
          if (permissionResult) {
            abrirCamara(fileType);
          } else {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
          }
          break;
        case 'gallery':
          permissionResult = await requestPermission('gallery');
          if (permissionResult) {
            abrirGaleria(fileType);
          } else {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar fotos.');
          }
          break;
        case 'files':
          abrirSelectorDocumentos(fileType);
          break;
      }
    }, 500);
  };

  // ------------------------------
  // PICKERS (con nombre de archivo único)
  // ------------------------------
  const abrirCamara = async (tipo) => {
    console.log('[abrirCamara] Inicio. isPicking:', isPicking);
    if (isPicking) {
      console.log('[abrirCamara] Bloqueado por isPicking.');
      return;
    }
    setIsPicking(true);

    // Blur a cualquier input activo
    documentNameRef.current?.blur();
    descriptionRef.current?.blur();
    urTextlRef.current?.blur();

    try {
      const imagen = await ImageCropPicker.openCamera({
        cropping: true,
        freeStyleCropEnabled: true,
        includeBase64: false,
        compressImageQuality: 0.8,
      });
      if (!imagen) {
        console.log('[abrirCamara] No se obtuvo imagen (posible cancel o error).');
        return;
      }

      // Generamos un nombre único (jpg por defecto)
      const uniqueName = generateUniqueFilename('.jpg');
      
      if (tipo === 'principal') {
        setPrincipalDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime
        });
      } else if (tipo === 'secondary') {
        setSecondaryDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime
        });
      }
      console.log('[abrirCamara] Imagen capturada con nombre único:', uniqueName);
    } catch (error) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        console.log('[abrirCamara] Usuario canceló la cámara.');
      } else {
        console.log('Error al capturar la imagen con la cámara', error);
      }
    } finally {
      setIsPicking(false);
      console.log('[abrirCamara] Fin. isPicking:', isPicking);
    }
  };

  const abrirGaleria = async (tipo) => {
    console.log('[abrirGaleria] Inicio. isPicking:', isPicking);
    if (isPicking) {
      console.log('[abrirGaleria] Bloqueado por isPicking.');
      return;
    }
    setIsPicking(true);

    documentNameRef.current?.blur();
    descriptionRef.current?.blur();
    urTextlRef.current?.blur();

    try {
      console.log('[abrirGaleria] Llamando a ImageCropPicker.openPicker...');
      const imagen = await ImageCropPicker.openPicker({
        cropping: true,
        freeStyleCropEnabled: true,
        includeBase64: false,
        compressImageQuality: 0.8,
      });

      if (!imagen) {
        console.log('[abrirGaleria] No se obtuvo imagen (posible cancel).');
        return;
      }

      // Generamos un nombre único (jpg por defecto)
      const uniqueName = generateUniqueFilename('.jpg');
      
      if (tipo === 'principal') {
        setPrincipalDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime
        });
      } else if (tipo === 'secondary') {
        setSecondaryDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime
        });
      }
      console.log('[abrirGaleria] Imagen seleccionada con nombre único:', uniqueName);
    } catch (error) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        console.log('[abrirGaleria] El usuario canceló la selección de la galería');
      } else {
        console.log('Error al seleccionar la imagen de la galería', error);
      }
    } finally {
      setIsPicking(false);
      console.log('[abrirGaleria] Fin. isPicking:', isPicking);
    }
  };

  const abrirSelectorDocumentos = async (tipo) => {
    console.log('[abrirSelectorDocumentos] Inicio. isPicking:', isPicking);
    if (isPicking) {
      console.log('[abrirSelectorDocumentos] Bloqueado por isPicking.');
      return;
    }
    setIsPicking(true);

    documentNameRef.current?.blur();
    descriptionRef.current?.blur();
    urTextlRef.current?.blur();

    try {
      const resultado = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
      if (resultado && resultado[0]) {
        const archivo = resultado[0];
        
        // Si quieres extraer la extensión real, haz algo como:
        // const ext = archivo.name ? `.${archivo.name.split('.').pop()}` : '.dat';
        // Para simplicidad, aquí usamos .dat:
        const uniqueName = generateUniqueFilename('.dat');

        if (tipo === 'principal') {
          setPrincipalDocument({
            uri: archivo.uri,
            name: uniqueName,
            type: archivo.type
          });
        } else if (tipo === 'secondary') {
          setSecondaryDocument({
            uri: archivo.uri,
            name: uniqueName,
            type: archivo.type
          });
        }
        console.log('[abrirSelectorDocumentos] Archivo seleccionado con nombre único:', uniqueName);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('[abrirSelectorDocumentos] Usuario canceló el selector de documentos');
      } else {
        console.error('Error seleccionando archivo:', error);
        Alert.alert('Error', `No se pudo seleccionar el documento: ${error.message || error}`);
      }
    } finally {
      setIsPicking(false);
      console.log('[abrirSelectorDocumentos] Fin. isPicking:', isPicking);
    }
  };

  // ------------------------------
  // Manejo de archivos (eliminar, visualizar)
  // ------------------------------
  const handleFilePress = (file, index) => {
    const isImage = file?.type?.startsWith('image/');
    if (isImage) {
      setCurrentImageUri(index);
      setIsImageViewerVisible(true);
    }
  };

  const deleteFile = (fileType) => {
    console.log('[deleteFile] Eliminando archivo:', fileType);
    if (fileType === 'principal') {
      setPrincipalDocument(null);
    } else if (fileType === 'secondary') {
      setSecondaryDocument(null);
    }
  };

  const renderDocumentFile = (file, fileType, index) => {
    if (!file) {
      return renderAddFileIcon(
        fileType === 'principal' ? 'Principal/Anverso' : 'Secundario/Reverso'
      );
    }
    const { icon, color } = getIconForFileType(file.name);
    const isImage = file?.type?.startsWith('image/');

    return (
      <View key={`${fileType}-${index}`} style={styles.documentSection}>
        <Text style={styles.sectionLabel}>
          {fileType === 'principal' ? 'Principal/Anverso' : 'Secundario/Reverso'}
        </Text>
        <TouchableOpacity onPress={() => handleFilePress(file, index)} style={styles.fileContainer}>
          {isImage ? (
            <Image source={{ uri: file.uri }} style={styles.filePreview} /> 
          ) : (
            <FontAwesomeIcon icon={icon} size={50} color={color} />
          )}
        </TouchableOpacity>
        <View style={styles.iconActions}>
          <TouchableOpacity
            onPress={() => {
              // Abrir ActionSheet
              setFileType(index === 0 ? 'principal' : 'secondary');
              setEditingFileIndex(index);
              setIsActionSheetVisible(true);
            }}
            style={styles.iconButton}
          >
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
    <View key={label} style={styles.documentSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TouchableOpacity
        onPress={() => {
          setIsActionSheetVisible(true);
          setFileType(label === 'Principal/Anverso' ? 'principal' : 'secondary');
        }}
        style={styles.fileContainer}
      >
        <FontAwesomeIcon icon={faFileCirclePlus} size={50} color="#185abd" />
      </TouchableOpacity>
    </View>
  );

  // ------------------------------
  // CustomAlert
  // ------------------------------
  const showCustomAlert = (title, message) => {
    setAlertConfig({ title, message });
    setShowAlert(true);
  };

  // ------------------------------
  // Guardar
  // ------------------------------
  const validateURL = (urlToCheck) => {
    const pattern = /^(https?:\/\/)?([\w\d\-]+\.)+[\w]{2,}(\/\S*)?$/;
    return pattern.test(urlToCheck);
  };

  const handleSave = async () => {
    console.log('[handleSave] Iniciando guardado...');
    if (!principalDocument && !url) {
      showCustomAlert(
        'Error',
        'Debe seleccionar al menos un documento principal o proporcionar una URL válida.'
      );
      return;
    }

    if (url && !validateURL(url)) {
      showCustomAlert(
        'Error',
        'La URL del documento no es válida. Asegúrese de que tiene un formato correcto.'
      );
      return;
    }

    if (!documentName) {
      showCustomAlert('Error', 'Debe proporcionar un nombre para el documento.');
      return;
    }

    try {
      const folderPath = `${RNFS.DocumentDirectoryPath}/DocSafe`;
      const assetsPath = `${RNFS.DocumentDirectoryPath}/assets`;

      // Crear carpetas (no da error si ya existen)
      await RNFS.mkdir(folderPath);
      await RNFS.mkdir(assetsPath);

      const imagenes = [];

      // Mover el documento principal, si existe
      if (principalDocument) {
        console.log('[handleSave] Moviendo archivo principal:', principalDocument.name);
        const principalFilePath = `${folderPath}/${principalDocument.name}`;
        await RNFS.moveFile(principalDocument.uri, principalFilePath);
        imagenes.push(principalDocument.name);
      }

      // Mover el documento secundario, si existe
      if (secondaryDocument) {
        console.log('[handleSave] Moviendo archivo secundario:', secondaryDocument.name);
        const secondaryFilePath = `${folderPath}/${secondaryDocument.name}`;
        await RNFS.moveFile(secondaryDocument.uri, secondaryFilePath);
        imagenes.push(secondaryDocument.name);
      }

      const documentId = generateUUID();
      const metadata = {
        id_archivo: documentId,
        nombre: documentName,
        descripcion: description,
        url: url || '',
        imagenes,
        fecha_creacion: new Date().toISOString(),
        expiryDate: expiryDate.toISOString(),
        share,
      };

      const metadataPath = `${assetsPath}/archivos.json`;
      let filesData = { archivos: [] };

      if (await RNFS.exists(metadataPath)) {
        const existingData = await RNFS.readFile(metadataPath);
        filesData = JSON.parse(existingData);
      }

      filesData.archivos.push(metadata);
      await RNFS.writeFile(metadataPath, JSON.stringify(filesData));

      console.log('[handleSave] Documento guardado con éxito:', metadata);
      showCustomAlert('Éxito', 'Documento agregado con éxito.');
    } catch (error) {
      console.error('Error al guardar el documento:', error);
      showCustomAlert('Error', 'Ocurrió un error al guardar el documento.');
    }
  };

  // ------------------------------
  // CustomAlert - al aceptar
  // ------------------------------
  const handleAlertAccept = () => {
    setShowAlert(false);
    if (
      alertConfig.title === 'Éxito' &&
      alertConfig.message.includes('Documento agregado con éxito')
    ) {
      console.log('[handleAlertAccept] Documento guardado con éxito, navegando...');
      onDocumentAdded();
      onClose();
    } else {
      console.log('[handleAlertAccept] Cerrar alerta de error, sin navegar.');
    }
  };

  // ------------------------------
  // Render principal
  // ------------------------------
  return (
    <ScrollView contentContainerStyle={styles.container} scrollEnabled={!isImageViewerVisible}>
      <Text style={styles.title}>Agregar Documento</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre del documento:</Text>
        <TextInput
          ref={documentNameRef}
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

      {/* CustomAlert */}
      {showAlert && (
        <CustomAlert
          visible={showAlert}
          onClose={() => setShowAlert(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          onAccept={handleAlertAccept}
        />
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Comentario:</Text>
        <TextInput
          ref={descriptionRef}
          style={styles.textArea}
          placeholder="Comentario"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor="#9a9a9a"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Sitio web de consulta del documento:</Text>
        <View style={styles.urlContainer}>
          <TextInput
            ref={urTextlRef}
            style={[styles.input, styles.urlInput]}
            placeholder="URL (Opcional)"
            value={url}
            onChangeText={(text) => setUrl(text.toLowerCase())}
            placeholderTextColor="#9a9a9a"
          />
          <FontAwesomeIcon icon={faLink} size={24} color="#185abd" />
        </View>
      </View>

      <View style={styles.dateAndShareContainer}>
        <View style={styles.dateContainer}>
          <Text style={styles.label}>Fecha de caducidad:</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
          >
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
          <Text style={styles.label}>Archivar:</Text>
          <Switch
            value={share}
            onValueChange={setShare}
            trackColor={{ false: '#767577', true: '#185abd' }}
            thumbColor={share ? '#f4f3f4' : '#f4f3f4'}
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

      {/* Modal: Opciones (Cámara/Galería/Archivos) */}
      <Modal visible={isActionSheetVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.actionSheet}>
            <TouchableOpacity
              onPress={() => setIsActionSheetVisible(false)}
              style={styles.closeButton}
            >
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

      {/* Modal para visor de imágenes */}
      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsImageViewerVisible(false)}
      >
        <CustomImageViewer
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    shadowColor: '#000',
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
    resizeMode: 'contain',
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
    paddingTop: 25,
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

export default AddDocumentForm;
