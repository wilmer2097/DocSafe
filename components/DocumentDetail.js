import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Image,
  ScrollView,
  Modal,
  Platform,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import CustomAlert from './CustomAlert';
import ImageViewer from 'react-native-image-zoom-viewer'; // Asegúrate de tener esta librería instalada
import ImageCropPicker from 'react-native-image-crop-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Share from 'react-native-share';

// import Orientation from 'react-native-orientation-locker';

import {
  faTrashAlt,
  faArrowLeft,
  faEdit,
  faLink,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faFileImage,
  faFileAlt,
  faFileArchive,
  faFileVideo,
  faFileAudio,
  faFileCirclePlus,
  faCalendarAlt,
  faSave,
  faShareAlt,
  faTimesCircle,
  faCamera,
  faImages,
  faFile,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

import { openDocument } from './utils';

const generateUniqueFilename = (extension = '.jpg') => {
  return `docSafe_${Date.now()}_${Math.floor(Math.random() * 10000)}${extension}`;
};

const DocumentDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { document, onGoBack } = route.params;

  const [fileType, setFileType] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [share, setShare] = useState(false);
  const [creationDate, setCreationDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Almacena hasta 2 archivos (índice 0 = principal, índice 1 = secundario)
  const [documentFiles, setDocumentFiles] = useState([null, null]);

  // Estados para el Visor de Imágenes
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [editingFileIndex, setEditingFileIndex] = useState(null);
  const [isPicking, setIsPicking] = useState(false);

  // Para la alerta personalizada
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
  const [navigateOnAccept, setNavigateOnAccept] = useState(false);

  // Alerta para confirmar borrado total del documento
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --------- ESTADO NUEVO para confirmar borrado de archivo individual ---------
  const [fileDeleteConfirm, setFileDeleteConfirm] = useState({ show: false, file: null, index: null });

  // Refs
  const documentNameRef = useRef(null);
  const descriptionRef = useRef(null);
  const urTextlRef = useRef(null);
  Keyboard.dismiss();

  useEffect(() => {
    if (isImageViewerVisible) {
      // Orientation.unlockAllOrientations();
    } else {
      // Orientation.lockToPortrait();
    }
  }, [isImageViewerVisible]);

  useEffect(() => {
    const loadDocumentData = async () => {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      if (await RNFS.exists(filesJsonPath)) {
        const jsonData = await RNFS.readFile(filesJsonPath);
        const filesData = JSON.parse(jsonData).archivos;
        const fileData = filesData.find(file => file.id_archivo === document.id_archivo);

        if (fileData) {
          setName(fileData.nombre);
          setDescription(fileData.descripcion);
          setUrl(fileData.url);
          setExpiryDate(new Date(fileData.expiryDate));
          setCreationDate(new Date(fileData.fecha_creacion).toLocaleDateString());
          setShare(fileData.share);

          // Convertir los nombres guardados en rutas absolutas
          const filesToShow = fileData.imagenes.map(fileName =>
            `${RNFS.DocumentDirectoryPath}/DocSafe/${fileName}`
          );
          const finalFiles = [null, null];
          filesToShow.forEach((filePath, idx) => {
            if (idx < 2) finalFiles[idx] = filePath;
          });
          setDocumentFiles(finalFiles);
        } else {
          showCustomAlert('Error', 'No se encontraron los datos del documento.');
        }
      }
    };

    loadDocumentData();
  }, [document.id_archivo]);

  const saveFilesChangeInJSON = async (updatedFiles) => {
    try {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      if (await RNFS.exists(filesJsonPath)) {
        const jsonData = await RNFS.readFile(filesJsonPath);
        let filesData = JSON.parse(jsonData);
        const fileIndex = filesData.archivos.findIndex(
          file => file.id_archivo === document.id_archivo
        );

        if (fileIndex !== -1) {
          filesData.archivos[fileIndex].imagenes = updatedFiles
            .filter(f => f !== null)
            .map(file => file.split('/').pop());

          await RNFS.writeFile(filesJsonPath, JSON.stringify(filesData));
        }
      }
    } catch (error) {
      console.error('Error al actualizar archivos en JSON:', error);
    }
  };

  const handleBack = () => {
    if (!documentFiles[0]) {
      showCustomAlert('Error', 'No puedes salir sin un archivo principal.');
      return;
    }
    navigation.goBack();
  };

  const confirmDeleteDocument = () => {
    setShowDeleteConfirm(true);
  };

  const deleteDocument = async () => {
    setShowDeleteConfirm(false);
    try {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      if (await RNFS.exists(filesJsonPath)) {
        const jsonData = await RNFS.readFile(filesJsonPath);
        let filesData = JSON.parse(jsonData);
        const fileIndex = filesData.archivos.findIndex(
          file => file.id_archivo === document.id_archivo
        );

        if (fileIndex !== -1) {
          filesData.archivos.splice(fileIndex, 1);
          await RNFS.writeFile(filesJsonPath, JSON.stringify(filesData));

          // Borramos físicamente los archivos
          for (const file of documentFiles) {
            if (file && (await RNFS.exists(file))) {
              await RNFS.unlink(file);
            }
          }

          showCustomAlert('Éxito', 'Documento eliminado correctamente.', false);
          onGoBack?.();
          navigation.goBack();
        } else {
          showCustomAlert('Error', 'No se encontraron los datos del documento.');
        }
      }
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      showCustomAlert('Error', 'No se pudo eliminar el documento.');
    }
  };

  // ------------------ NUEVO: Confirmación previa a borrar un archivo --------------
  const confirmDeleteFile = (file, index) => {
    // Aquí guardamos el archivo y el índice para la confirmación
    setFileDeleteConfirm({ show: true, file, index });
  };

  // Si se confirma en la alerta, llamamos a la función original de borrado.
  const handleConfirmDeleteFile = async () => {
    if (fileDeleteConfirm.file && fileDeleteConfirm.index !== null) {
      await deleteFile(fileDeleteConfirm.file, fileDeleteConfirm.index);
    }
    // Cerramos el modal
    setFileDeleteConfirm({ show: false, file: null, index: null });
  };

  // Cancelar eliminar el archivo
  const handleCancelDeleteFile = () => {
    setFileDeleteConfirm({ show: false, file: null, index: null });
  };
  // --------------------------------------------------------------------------------

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
        Alert.alert('Permiso bloqueado', 'Debe habilitar el permiso en configuración para usar esta función.');
        return false;
      default:
        return false;
    }
  };

  const requestPermission = async (type) => {
    if (Platform.OS === 'ios') {
      if (type === 'gallery') {
        return await checkAndRequestPermission(PERMISSIONS.IOS.PHOTO_LIBRARY);
      } else if (type === 'camera') {
        return await checkAndRequestPermission(PERMISSIONS.IOS.CAMERA);
      }
    } else {
      const androidVersion = Platform.Version;
      if (type === 'gallery') {
        if (androidVersion >= 33) {
          return await checkAndRequestPermission(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        } else {
          return await checkAndRequestPermission(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        }
      } else if (type === 'camera') {
        return await checkAndRequestPermission(PERMISSIONS.ANDROID.CAMERA);
      } else if (type === 'files') {
        return true;
      }
    }
  };

  const abrirCamara = async () => {
    if (isPicking) return;
    setIsPicking(true);
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
      const filePath = imagen.path;
      const destinationPath = `${RNFS.DocumentDirectoryPath}/DocSafe/${uniqueName}`;

      await RNFS.copyFile(filePath, destinationPath);
      handleFileSelection(destinationPath);
    } catch (error) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        console.log('[abrirCamara] Usuario canceló la cámara.');
      } else {
        console.error('Error capturando la imagen:', error);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const abrirGaleria = async () => {
    if (isPicking) return;
    setIsPicking(true);
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
      const filePath = imagen.path;
      const destinationPath = `${RNFS.DocumentDirectoryPath}/DocSafe/${uniqueName}`;

      await RNFS.copyFile(filePath, destinationPath);
      handleFileSelection(destinationPath);
    } catch (error) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        console.log('[abrirGaleria] Usuario canceló la galería.');
      } else {
        console.error('Error seleccionando la imagen de la galería:', error);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const abrirDocumentos = async () => {
    if (isPicking) return;
    setIsPicking(true);
    Keyboard.dismiss();

    try {
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
      if (result && result[0]) {
        const originalExt = result[0].name
          ? '.' + result[0].name.split('.').pop().toLowerCase()
          : '.dat';
        const uniqueName = generateUniqueFilename(originalExt);

        const filePath = result[0].uri;
        const destinationPath = `${RNFS.DocumentDirectoryPath}/DocSafe/${uniqueName}`;

        await RNFS.copyFile(filePath, destinationPath);
        handleFileSelection(destinationPath);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('[abrirDocumentos] Usuario canceló el DocumentPicker');
      } else {
        console.error('Error al seleccionar el archivo:', error);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleFileSelection = async (newFilePath) => {
    try {
      const updatedFiles = [...documentFiles];
      if (fileType === 'principal') {
        updatedFiles[0] = newFilePath;
      } else {
        updatedFiles[1] = newFilePath;
      }
      setDocumentFiles(updatedFiles);

      await saveFilesChangeInJSON(updatedFiles);
      setIsActionSheetVisible(false);
    } catch (error) {
      console.error('Error al asignar archivo:', error);
    }
  };

  // Función ORIGINAL de borrado de un archivo:
  const deleteFile = async (file, index) => {
    if (!file) return;
    try {
      if (await RNFS.exists(file)) {
        await RNFS.unlink(file);
      }
      const updatedFiles = [...documentFiles];
      updatedFiles[index] = null;
      setDocumentFiles(updatedFiles);

      await saveFilesChangeInJSON(updatedFiles);
      showCustomAlert('Éxito', 'Archivo eliminado correctamente.', false);
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
      showCustomAlert('Error', 'No se pudo eliminar el archivo.');
    }
  };

  const handleShare = async (file) => {
    if (!file) {
      showCustomAlert('Error', 'No hay archivo para compartir.');
      return;
    }
    try {
      const fileUri = `file://${file}`;
      const mimeType = getMimeType(fileUri) || '*/*';
      const shareOptions = {
        title: 'Compartir Documento',
        urls: [fileUri],
        message: `Documento: ${name}`,
        type: mimeType,
      };
      await Share.open(shareOptions);
    } catch (error) {
      console.error('Error al compartir el documento:', error);
      showCustomAlert('Error', 'No se pudo compartir el documento.');
    }
  };

  const getMimeType = (fileUri) => {
    const extension = fileUri.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':
      case 'pptx':
        return 'application/vnd.ms-powerpoint';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'mp3':
      case 'wav':
        return 'audio/*';
      case 'mp4':
      case 'mkv':
        return 'video/*';
      default:
        return '*/*';
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  const handleFilePress = (file, index) => {
    if (!file) return;

    const isImage = /\.(jpg|jpeg|png)$/i.test(file);
    if (isImage) {
      const imageIndex = documentFiles
        .filter(f => f && /\.(jpg|jpeg|png)$/i.test(f))
        .findIndex(f => f === file);

      if (imageIndex !== -1) {
        setCurrentImageIndex(imageIndex);
        setIsImageViewerVisible(true);
      } else {
        console.warn('El archivo de imagen no se encontró en imagesForViewer.');
      }
    } else {
      try {
        const mimeType = getMimeType(file);
        openDocument(`file://${file}`, mimeType);
      } catch (error) {
        console.error('Error al abrir el archivo:', error);
        showCustomAlert('Error', 'No se pudo abrir el archivo.');
      }
    }
  };

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
            abrirCamara();
          } else {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
          }
          break;
        case 'gallery':
          permissionResult = await requestPermission('gallery');
          if (permissionResult) {
            abrirGaleria();
          } else {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para seleccionar fotos.');
          }
          break;
        case 'files':
          abrirDocumentos();
          break;
        default:
          console.warn('Opción no reconocida en handleActionSheetPress:', option);
      }
    }, 1000);
  };

  const saveDocumentData = async () => {
    if (!name.trim()) {
      showCustomAlert('Error', 'El nombre del documento es obligatorio.');
      return;
    }
    if (!documentFiles[0]) {
      showCustomAlert('Error', 'Se requiere un archivo principal.');
      return;
    }
    if (url && !validateURL(url)) {
      showCustomAlert(
        'Error',
        'La URL del documento no es válida. Asegúrate de que sea un dominio o subdominio válido.'
      );
      return;
    }

    try {
      const filesJsonPath = `${RNFS.DocumentDirectoryPath}/assets/archivos.json`;
      if (await RNFS.exists(filesJsonPath)) {
        const jsonData = await RNFS.readFile(filesJsonPath);
        let filesData = JSON.parse(jsonData);
        const fileIndex = filesData.archivos.findIndex(
          file => file.id_archivo === document.id_archivo
        );

        if (fileIndex !== -1) {
          filesData.archivos[fileIndex] = {
            ...filesData.archivos[fileIndex],
            nombre: name,
            descripcion: description,
            url: url,
            expiryDate: expiryDate.toISOString(),
            share: share,
          };

          await RNFS.writeFile(filesJsonPath, JSON.stringify(filesData));
          showCustomAlert('Éxito', 'Datos del documento guardados correctamente.', true);
        } else {
          showCustomAlert('Error', 'No se encontraron los datos del documento.');
        }
      }
    } catch (error) {
      console.error('Error al guardar los datos del documento:', error);
      showCustomAlert('Error', 'No se pudieron guardar los datos del documento.');
    }
  };

  const getFileType = (fileName) => {
    if (!fileName) return { icon: faFileAlt, color: '#6c757d' };

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
        return { icon: faFileImage, color: '#ffb100' };
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
        return { icon: faFileAlt, color: '#6c757d' };
    }
  };

  const renderDocumentFile = (file, index) => {
    const label = index === 0 ? 'Principal/Anverso' : 'Secundario/Reverso';

    if (!file) {
      return (
        <View key={index} style={styles.documentSection}>
          <Text style={styles.sectionLabel}>{label}</Text>
          <TouchableOpacity
            onPress={() => {
              setFileType(index === 0 ? 'principal' : 'secondary');
              setIsActionSheetVisible(true);
            }}
            style={styles.fileContainer}
          >
            <FontAwesomeIcon icon={faFileCirclePlus} size={50} color="#185abd" />
          </TouchableOpacity>
        </View>
      );
    }

    const { icon, color } = getFileType(file);
    const isImage = /\.(jpg|jpeg|png)$/i.test(file);
    return (
      <View key={index} style={styles.documentSection}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <TouchableOpacity style={styles.fileContainer} onPress={() => handleFilePress(file, index)}>
          {isImage ? (
            <Image source={{ uri: `file://${file}` }} style={styles.filePreview} />
          ) : (
            <FontAwesomeIcon icon={icon} size={50} color={color} />
          )}
        </TouchableOpacity>
        <View style={styles.iconActions}>
          <TouchableOpacity
            onPress={() => {
              setFileType(index === 0 ? 'principal' : 'secondary');
              setEditingFileIndex(index);
              setIsActionSheetVisible(true);
            }}
            style={styles.iconButton}
          >
            <FontAwesomeIcon icon={faEdit} size={20} color="#185abd" />
          </TouchableOpacity>

          {/* Aquí antes borrábamos el archivo directamente, ahora llamamos a confirmDeleteFile */}
          <TouchableOpacity
            onPress={() => confirmDeleteFile(file, index)}
            style={styles.iconButton}
          >
            <FontAwesomeIcon icon={faTrashAlt} size={20} color="#cc0000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleShare(file)} style={styles.iconButton}>
            <FontAwesomeIcon icon={faShareAlt} size={20} color="#185abd" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const imagesForViewer = documentFiles
    .filter(file => file && /\.(jpg|jpeg|png)$/i.test(file))
    .map(file => ({ url: `file://${file}` }));

  const showCustomAlert = (title, message, shouldNavigate = false) => {
    setAlertConfig({ title, message });
    setShowAlert(true);
    setNavigateOnAccept(shouldNavigate);
  };
  const onAlertAccept = () => {
    setShowAlert(false);
    if (navigateOnAccept) {
      navigation.navigate('Documentos');
    }
  };

  const validateURL = (urlToCheck) => {
    const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return pattern.test(urlToCheck);
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color="#fff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={confirmDeleteDocument} style={styles.headerIcon}>
          <FontAwesomeIcon icon={faTrashAlt} size={24} color="#fff" />
        </TouchableOpacity>
      ),
      title: 'Detalles del Documento',
      headerTitleStyle: styles.headerTitle,
      headerStyle: {
        backgroundColor: '#185abd',
      },
    });
  }, [navigation, documentFiles]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre del documento:</Text>
        <TextInput
          ref={documentNameRef}
          style={styles.input}
          placeholder="Nombre del documento"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9a9a9a"
        />
      </View>

      <View style={styles.filesContainer}>
        {renderDocumentFile(documentFiles[0], 0)}
        {renderDocumentFile(documentFiles[1], 1)}
      </View>

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
            onChangeText={setUrl}
            placeholderTextColor="#9a9a9a"
          />
          <FontAwesomeIcon icon={faLink} size={24} color="#185abd" />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fecha de creación:</Text>
        <Text style={styles.creationDate}>{creationDate}</Text>
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
              onChange={handleDateChange}
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

      <TouchableOpacity style={styles.saveButton} onPress={saveDocumentData}>
        <FontAwesomeIcon icon={faSave} size={24} color="#fff" />
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>

      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        onRequestClose={() => setIsImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            onPress={() => setIsImageViewerVisible(false)}
            style={styles.closeButton2}
          >
            <FontAwesomeIcon icon={faTimes} size={30} color="#fff" />
          </TouchableOpacity>
          <ImageViewer
            imageUrls={imagesForViewer}
            index={currentImageIndex}
            enableSwipeDown
            doubleClickInterval={300}
            onSwipeDown={() => setIsImageViewerVisible(false)}
            renderIndicator={(currentIndex, allSize) => (
              <View style={styles.indicatorContainer}>
                <Text style={styles.indicatorText}>{`${currentIndex} / ${allSize}`}</Text>
              </View>
            )}
            saveToLocalByLongPress={false}
            renderHeader={() => null}
          />
        </View>
      </Modal>

      <Modal visible={isActionSheetVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.actionSheet}>
            <TouchableOpacity onPress={() => setIsActionSheetVisible(false)} style={styles.closeButton}>
              <FontAwesomeIcon icon={faTimesCircle} size={24} color="#999" />
            </TouchableOpacity>
            <View style={styles.optionsContainer}>
              <TouchableOpacity onPress={() => handleActionSheetPress('camera')} style={styles.optionButton}>
                <FontAwesomeIcon icon={faCamera} size={40} color="#185abd" />
                <Text style={styles.optionText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleActionSheetPress('gallery')} style={styles.optionButton}>
                <FontAwesomeIcon icon={faImages} size={40} color="#185abd" />
                <Text style={styles.optionText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleActionSheetPress('files')} style={styles.optionButton}>
                <FontAwesomeIcon icon={faFile} size={40} color="#185abd" />
                <Text style={styles.optionText}>Archivos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showAlert && (
        <CustomAlert
          visible={showAlert}
          onClose={() => setShowAlert(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          onAccept={onAlertAccept}
        />
      )}

      {showDeleteConfirm && (
        <CustomAlert
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirmar"
          message="¿Seguro que desea eliminar este documento?"
          showCancel={true}
          onAccept={deleteDocument}
          onCancel={() => {
            console.log('El usuario canceló la eliminación');
          }}
        />
      )}

      {/* NUEVO: Alerta para confirmar borrado de archivo individual */}
      {fileDeleteConfirm.show && (
        <CustomAlert
          visible={fileDeleteConfirm.show}
          onClose={handleCancelDeleteFile}
          title="Confirmar"
          message="¿Seguro que desea eliminar este archivo?"
          showCancel={true}
          onAccept={handleConfirmDeleteFile}
          onCancel={handleCancelDeleteFile}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  creationDate: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  headerIcon: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
    width: 140,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
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
  shareContainer: {
    paddingTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
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
  saveButton: {
    backgroundColor: '#185abd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
  optionButton: {
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton2: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorText: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
});

export default DocumentDetail;
