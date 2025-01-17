import React, { useState, useRef, useEffect } from 'react'; 
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
  Platform,
  Keyboard 
} from 'react-native';
import { openDocument } from './utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSave,
  faTimes,
  faTimesCircle,
  faCalendarAlt,
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
  faFile,
  faShareAlt,
} from '@fortawesome/free-solid-svg-icons';
import ImageViewer from 'react-native-image-zoom-viewer';
import CustomAlert from './CustomAlert';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// **Importación añadida**
//import Orientation from 'react-native-orientation-locker';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Genera un nombre de archivo único
const generateUniqueFilename = (extension = '.jpg') => {
  return `docSafe_${Date.now()}_${Math.floor(Math.random() * 10000)}${extension}`;
};

const getIconForFileType = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    console.error('Nombre de archivo no válido:', fileName);
    return { icon: faFileAlt, color: '#6c757d' }; // Ícono genérico
  }
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
      return { icon: faFile, color: '#6c757d' }; 
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // ---- Estados para ImageViewing ----
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState(0);

  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false); 
  const [fileType, setFileType] = useState(null);

  // ---- Alertas personalizadas ----
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  // Index para editar el archivo
  const [editingFileIndex, setEditingFileIndex] = useState(null);

  // Para prevenir aperturas de picker múltiples
  const [isPicking, setIsPicking] = useState(false);

  // Refs para inputs
  const documentNameRef = useRef(null);
  const descriptionRef = useRef(null);
  const urTextlRef = useRef(null);

  // **Hook useEffect añadido para manejar la orientación**
  useEffect(() => {
    if (viewerVisible) {
      // Si se abrió el visor, desbloquear para permitir landscape
      // Orientation.unlockAllOrientations();
    } else {
      // Si se cerró el visor, bloquear en modo vertical
      // Orientation.lockToPortrait();
    }
    // Limpieza no es necesaria aquí, ya que en cada cambio de viewerVisible se maneja
  }, [viewerVisible]);

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
      case RESULTS.DENIED: {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }
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
    setIsActionSheetVisible(false);
    documentNameRef.current?.blur();
    descriptionRef.current?.blur();
    urTextlRef.current?.blur();
    Keyboard.dismiss();

    setTimeout(async () => {
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
    }, 1000);
  };

  // ------------------------------
  // PICKERS (con nombre de archivo único)
  // ------------------------------
  const abrirCamara = async (tipo) => {
    if (isPicking) return;
    setIsPicking(true);

    documentNameRef.current?.blur();
    descriptionRef.current?.blur();
    urTextlRef.current?.blur();
    Keyboard.dismiss();

    try {
      const imagen = await ImageCropPicker.openCamera({
        cropping: true,
        includeBase64: false,
        freeStyleCropEnabled: true,
        width: 3000,
        height: 3000,
        compressImageQuality: 1.0,
      });
      if (!imagen) return;

      const uniqueName = generateUniqueFilename('.jpg');

      if (tipo === 'principal') {
        setPrincipalDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime,
        });
      } else if (tipo === 'secondary') {
        setSecondaryDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime,
        });
      }
    } catch (error) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        console.log('[abrirCamara] Usuario canceló la cámara.');
      } else {
        console.log('Error al capturar la imagen con la cámara', error);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const abrirGaleria = async (tipo) => {
    if (isPicking) return;
    setIsPicking(true);

    documentNameRef.current?.blur();
    descriptionRef.current?.blur();
    urTextlRef.current?.blur();
    Keyboard.dismiss();

    try {
      const imagen = await ImageCropPicker.openPicker({
        cropping: true,
        includeBase64: false,
        freeStyleCropEnabled: true,
        width: 3000,
        height: 3000,
        compressImageQuality: 1.0,
      });
      if (!imagen) return;

      const uniqueName = generateUniqueFilename('.jpg');

      if (tipo === 'principal') {
        setPrincipalDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime,
        });
      } else if (tipo === 'secondary') {
        setSecondaryDocument({
          uri: imagen.path,
          name: uniqueName,
          type: imagen.mime,
        });
      }
    } catch (error) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        console.log('[abrirGaleria] El usuario canceló la selección de la galería');
      } else {
        console.log('Error al seleccionar la imagen de la galería', error);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const abrirSelectorDocumentos = async (tipo) => {
    if (isPicking) return;
    setIsPicking(true);

    documentNameRef.current?.blur();
    descriptionRef.current?.blur();
    urTextlRef.current?.blur();
    Keyboard.dismiss();

    try {
      const resultado = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
      if (resultado && resultado[0]) {
        const archivo = resultado[0];
        const extension = archivo.name ? `.${archivo.name.split('.').pop().toLowerCase()}` : '.dat';
        const uniqueName = generateUniqueFilename(extension);

        const archivoProcesado = {
          uri: archivo.uri,
          name: uniqueName,
          type: archivo.type || 'application/octet-stream',
        };

        if (tipo === 'principal') {
          setPrincipalDocument(archivoProcesado);
        } else if (tipo === 'secondary') {
          setSecondaryDocument(archivoProcesado);
        }
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('[abrirSelectorDocumentos] Usuario canceló el selector de documentos.');
      } else {
        console.error('[abrirSelectorDocumentos] Error al seleccionar documento:', error);
        Alert.alert('Error', `No se pudo seleccionar el documento: ${error.message || error}`);
      }
    } finally {
      setIsPicking(false);
      console.log('[abrirSelectorDocumentos] Fin. isPicking:', isPicking);
    }
  };

  // ------------------------------
  // MANEJO DE ARCHIVOS (abrir, eliminar, visor)
  // ------------------------------
  const handleFilePress = async (fileType) => {
    try {
      // Configura el índice según el tipo de archivo
      if (fileType === 'principal') {
        setCurrentImageIndex(0); // Índice para la imagen principal
      } else if (fileType === 'secondary') {
        setCurrentImageIndex(1); // Índice para la imagen secundaria
      }
  
      // Verifica si el archivo es una imagen antes de abrir el visor
      const isImage = fileType === 'principal'
        ? /\.(jpg|jpeg|png)$/i.test(principalDocument?.name || '')
        : /\.(jpg|jpeg|png)$/i.test(secondaryDocument?.name || '');
  
      if (isImage) {
        setViewerVisible(true); // Muestra el visor para imágenes
        return;
      }
  
      // Manejo para documentos no imagen
      const file = fileType === 'principal' ? principalDocument : secondaryDocument;
      if (!file) return;
  
      const persistentPath = `${RNFS.DocumentDirectoryPath}/DocSafe/${file.name}`;
      const fileExists = await RNFS.exists(persistentPath);
  
      if (!fileExists) {
        await RNFS.copyFile(file.uri, persistentPath);
      }
  
      const mimeType = file?.type || '*/*';
      openDocument(persistentPath, mimeType);
    } catch (error) {
      console.error('Error al abrir o copiar el archivo:', error);
      showCustomAlert('Error', 'No se pudo abrir el archivo. Asegúrate de que exista.');
    }
  };
  
  

  // Array de imágenes para el visor
  const images = [
    principalDocument && { url: principalDocument.uri },
    secondaryDocument && { url: secondaryDocument.uri },
  ].filter(Boolean); 
  const deleteFile = (fileType) => {
    if (fileType === 'principal') {
      setPrincipalDocument(null);
    } else if (fileType === 'secondary') {
      setSecondaryDocument(null);
      if (currentImageIndex === 1) {
        setCurrentImageIndex(0);
      }
    }
  };
  


  // Render de un archivo existente o icono para agregar
  const renderDocumentFile = (file, fileType, index) => {
    if (!file || !file.name) {
      return renderAddFileIcon(
        fileType === 'principal' ? 'Principal/Anverso' : 'Secundario/Reverso'
      );
    }
    const { icon, color } = getIconForFileType(file.name);
  
    return (
      <View key={`${fileType}-${index}`} style={styles.documentSection}>
        <Text style={styles.sectionLabel}>
          {fileType === 'principal' ? 'Principal/Anverso' : 'Secundario/Reverso'}
        </Text>
        <TouchableOpacity onPress={() => handleFilePress(fileType)} style={styles.fileContainer}>
          {/\.(jpg|jpeg|png)$/i.test(file.name) ? (
            <Image source={{ uri: file.uri }} style={styles.filePreview} />
          ) : (
            <FontAwesomeIcon icon={icon} size={50} color={color} />
          )}
        </TouchableOpacity>
        <View style={styles.iconActions}>
          <TouchableOpacity
            onPress={() => {
              setFileType(fileType);
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
  // GUARDAR
  // ------------------------------
  const validateURL = (urlToCheck) => {
    const pattern = /^(https?:\/\/)?([\w\d\-]+\.)+[\w]{2,}(\/\S*)?$/;
    return pattern.test(urlToCheck);
  };

  const handleSave = async () => {
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

      await RNFS.mkdir(folderPath);
      await RNFS.mkdir(assetsPath);

      const imagenes = [];

      if (principalDocument) {
        const principalFilePath = `${folderPath}/${principalDocument.name}`;
        await RNFS.moveFile(principalDocument.uri, principalFilePath);
        imagenes.push(principalDocument.name);
      }

      if (secondaryDocument) {
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

      showCustomAlert('Éxito', 'Documento agregado con éxito.');
    } catch (error) {
      console.error('Error al guardar el documento:', error);
      showCustomAlert('Error', 'Ocurrió un error al guardar el documento.');
    }
  };

  const handleAlertAccept = () => {
    setShowAlert(false);
    if (
      alertConfig.title === 'Éxito' &&
      alertConfig.message.includes('Documento agregado con éxito')
    ) {
      onDocumentAdded();
      onClose();
    }
  };

  // ------------------------------
  // RENDER PRINCIPAL
  // ------------------------------
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} scrollEnabled={!viewerVisible}>
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

        {/* Sección de archivos principal y secundario */}
        <View style={styles.filesContainer}>
          {principalDocument
            ? renderDocumentFile(principalDocument, 'principal', 0)
            : renderAddFileIcon('Principal/Anverso')}
          {secondaryDocument
            ? renderDocumentFile(secondaryDocument, 'secondary', 1)
            : renderAddFileIcon('Secundario/Reverso')}
        </View>

        {/* Alerta personalizada */}
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
                  if (selectedDate) setExpiryDate(selectedDate);
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

        {/* Botones de Guardar y Cancelar */}
        <View style={styles.buttonContainer}>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <FontAwesomeIcon icon={faTimesCircle} size={24} color="#fff" />
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <FontAwesomeIcon icon={faSave} size={24} color="#fff" />
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de opciones (Cámara/Galería/Archivos) */}
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
      </ScrollView>
      {/* Modal de visor de imágenes */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => {
          setViewerVisible(false);
          setCurrentImageIndex(0); // Reinicia el índice actual
        }}
      >
        <View style={styles.modalContainer}>
          {/* Botón "X" para cerrar el modal */}
          <TouchableOpacity
            onPress={() => {
              setViewerVisible(false);
              setCurrentImageIndex(0); // Reinicia el índice actual al cerrar
            }}
            style={styles.closeButton2} // Botón actualizado
          >
            <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
          </TouchableOpacity>

          {/* Visor de imágenes */}
          <ImageViewer
            imageUrls={images}
            index={currentImageIndex} // Índice dinámico
            enableSwipeDown
            onSwipeDown={() => {
              setViewerVisible(false);
              setCurrentImageIndex(0); // Reinicia el índice actual
            }}
            doubleClickInterval={300}
            onChange={(index) => setCurrentImageIndex(index || 0)}
            renderIndicator={(currentIndex, allSize) => (
              <View style={styles.indicatorContainer}>
                <Text style={styles.indicatorText}>{`${currentIndex} / ${allSize}`}</Text>
              </View>
            )}
            saveToLocalByLongPress={false} // Opcional: Desactiva la opción de guardar imagen por largo clic
            renderHeader={() => null} // Opcional: Evita duplicar el botón de cierre si está implementado
          />
        </View>
      </Modal>
    </View>
  );
};

// ------------------------------------------------
// Estilos
// ------------------------------------------------
const styles = StyleSheet.create({
  indicatorContainer: {
    position: 'absolute',
    bottom: 20, // Ajusta según tu preferencia
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', // Fondo semitransparente para mejor legibilidad
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  container: {
    flexGrow: 1, // Cambiado de padding a flexGrow para mejor manejo del espacio
    backgroundColor: '#f5f5f5',
    padding: 20, // Mantener el padding solo para el formulario
  },
  imageContainer: {
    // Asegura que las imágenes se centren correctamente
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
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
  closeButton2: {
    position: 'absolute',
    top: 40, // Ajusta según sea necesario
    right: 20, // Ajusta según sea necesario
    zIndex: 10, // Asegura que esté sobre el visor
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fondo semitransparente
    borderRadius: 20, // Botón redondeado
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    shadowOffset: { width: 0, height: 2 },
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
    marginRight: 10,
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
  footerContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 99,
  },
});

export default AddDocumentForm;
