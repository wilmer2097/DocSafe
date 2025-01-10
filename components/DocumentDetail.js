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
  Modal,
  ScrollView,
  Platform,
  Keyboard
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import CustomAlert from './CustomAlert';
import ImageViewing from 'react-native-image-viewing';
import ImageCropPicker from 'react-native-image-crop-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Share from 'react-native-share';

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
  faFile
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

  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState(0);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [editingFileIndex, setEditingFileIndex] = useState(null);
  const [isPicking, setIsPicking] = useState(false);

  // Para la alerta personalizada
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
  const [navigateOnAccept, setNavigateOnAccept] = useState(false);

  // Alerta para confirmar borrado total del documento
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Refs
  const documentNameRef = useRef(null);
  const descriptionRef = useRef(null);
  const urTextlRef = useRef(null);
  Keyboard.dismiss();

  // --------------------------------------------------------------------
  // CARGAR datos del documento
  // --------------------------------------------------------------------
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
          // Aseguramos que haya 2 slots (0, 1)
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

  // --------------------------------------------------------------------
  // Actualizar SOLO la parte de “imagenes” en el JSON
  // --------------------------------------------------------------------
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
          // Actualizamos SOLO las imagenes
          filesData.archivos[fileIndex].imagenes = updatedFiles
            .filter(f => f !== null) // solo rutas no-nulas
            .map(file => file.split('/').pop()); // extrae nombre de archivo

          await RNFS.writeFile(filesJsonPath, JSON.stringify(filesData));
        }
      }
    } catch (error) {
      console.error('Error al actualizar archivos en JSON:', error);
    }
  };

  // --------------------------------------------------------------------
  // NO dejar salir si no hay principal
  // --------------------------------------------------------------------
  const handleBack = () => {
    if (!documentFiles[0]) {
      // No hay principal
      showCustomAlert('Error', 'No puedes salir sin un archivo principal.');
      return;
    }
    navigation.goBack();
  };

  // --------------------------------------------------------------------
  // Pedir confirmación para eliminar todo el documento
  // --------------------------------------------------------------------
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
          // Quitamos todo el documento del JSON
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

  // --------------------------------------------------------------------
  // Abrir Cámara / Galería / Archivos con nombre único
  // --------------------------------------------------------------------
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
        return true; // DocumentPicker no suele requerir permisos
      }
    }
  };

  const abrirCamara = async () => {
    if (isPicking) return;
    setIsPicking(true);
    Keyboard.dismiss();

    try {
      // Cambia a openCamera si quieres tomar fotos
      // En este ejemplo seguimos usando openPicker para “simular” la cámara
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
        const originalExt = result[0].name ? '.' + result[0].name.split('.').pop() : '.dat';
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

  // --------------------------------------------------------------------
  // handleFileSelection => se actualiza JSON en ese momento
  // --------------------------------------------------------------------
  const handleFileSelection = async (newFilePath) => {
    try {
      const updatedFiles = [...documentFiles];
      if (fileType === 'principal') {
        updatedFiles[0] = newFilePath;
      } else {
        updatedFiles[1] = newFilePath;
      }
      setDocumentFiles(updatedFiles);

      // Guardar cambio inmediato en JSON
      await saveFilesChangeInJSON(updatedFiles);
      setIsActionSheetVisible(false);
    } catch (error) {
      console.error('Error al asignar archivo:', error);
    }
  };

  // --------------------------------------------------------------------
  // Eliminar UN archivo => se actualiza JSON en ese momento
  // --------------------------------------------------------------------
  const deleteFile = async (file, index) => {
    if (!file) return;

    try {
      if (await RNFS.exists(file)) {
        await RNFS.unlink(file);
      }
      const updatedFiles = [...documentFiles];
      updatedFiles[index] = null;
      setDocumentFiles(updatedFiles);

      // Guardar cambio inmediato en JSON
      await saveFilesChangeInJSON(updatedFiles);

      showCustomAlert('Éxito', 'Archivo eliminado correctamente.', false);
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
      showCustomAlert('Error', 'No se pudo eliminar el archivo.');
    }
  };

  // --------------------------------------------------------------------
  // Compartir un archivo
  // --------------------------------------------------------------------
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

  // --------------------------------------------------------------------
  // Cambiar fecha (fecha de caducidad)
  // --------------------------------------------------------------------
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  // --------------------------------------------------------------------
  // handleFilePress: si es imagen -> visor, si no -> openDocument
  // --------------------------------------------------------------------
  const handleFilePress = (file, index) => {
    if (!file) return;

    const isImage = /\.(jpg|jpeg|png)$/i.test(file);
    if (isImage) {
      setCurrentImageUri(index);
      setIsImageViewerVisible(true);
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

  // --------------------------------------------------------------------
  // BOTÓN GUARDAR => actualiza name, description, url, expiryDate
  // --------------------------------------------------------------------
  const saveDocumentData = async () => {
    if (!name.trim()) {
      showCustomAlert('Error', 'El nombre del documento es obligatorio.');
      return;
    }
    // Validamos que haya principal
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
          // Actualizamos datos generales
          filesData.archivos[fileIndex] = {
            ...filesData.archivos[fileIndex],
            nombre: name,
            descripcion: description,
            url: url,
            expiryDate: expiryDate.toISOString(),
            share: share
            // "imagenes" ya se actualizó en cada cambio individual
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

  // --------------------------------------------------------------------
  // RENDER archivo en pantalla
  // --------------------------------------------------------------------
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
      // Mostrar ícono para agregar
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

    // Hay un archivo
    const { icon, color } = getFileType(file);
    return (
      <View key={index} style={styles.documentSection}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <TouchableOpacity style={styles.fileContainer} onPress={() => handleFilePress(file, index)}>
          {icon === faFileImage ? (
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

          <TouchableOpacity onPress={() => deleteFile(file, index)} style={styles.iconButton}>
            <FontAwesomeIcon icon={faTrashAlt} size={20} color="#cc0000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleShare(file)} style={styles.iconButton}>
            <FontAwesomeIcon icon={faShareAlt} size={20} color="#185abd" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --------------------------------------------------------------------
  // Imagenes para el Visor
  // --------------------------------------------------------------------
  const images = documentFiles
    .filter(file => file && /\.(jpg|jpeg|png)$/i.test(file))
    .map(file => ({ uri: `file://${file}` }));

  // --------------------------------------------------------------------
  // Alertas personalizadas
  // --------------------------------------------------------------------
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

  const validateURL = (url) => {
    const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return pattern.test(url);
  };

  // --------------------------------------------------------------------
  // Header custom: Botón Back con validación y Botón Eliminar doc
  // --------------------------------------------------------------------
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
    });
  }, [navigation, documentFiles]);

  // --------------------------------------------------------------------
  // Render principal
  // --------------------------------------------------------------------
  return (
    <ScrollView style={styles.container}>

      {/* Nombre */}
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

      {/* Files */}
      <View style={styles.filesContainer}>
        {renderDocumentFile(documentFiles[0], 0)}
        {renderDocumentFile(documentFiles[1], 1)}
      </View>

      {/* Descripción */}
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

      {/* URL */}
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

      {/* Fecha de creación */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fecha de creación:</Text>
        <Text style={styles.creationDate}>{creationDate}</Text>
      </View>

      {/* Fecha de caducidad + Switch “Archivar” */}
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

      {/* Botón GUARDAR => solo actualiza datos textuales */}
      <TouchableOpacity style={styles.saveButton} onPress={saveDocumentData}>
        <FontAwesomeIcon icon={faSave} size={24} color="#fff" />
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>

      {/* Visor de imágenes */}
      <ImageViewing
        images={images}
        imageIndex={currentImageUri}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />

      {/* Modal para ActionSheet (Cámara, Galería, Archivos) */}
      <Modal visible={isActionSheetVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.actionSheet}>
            <TouchableOpacity onPress={() => setIsActionSheetVisible(false)} style={styles.closeButton}>
              <FontAwesomeIcon icon={faTimesCircle} size={24} color="#999" />
            </TouchableOpacity>
            <View style={styles.optionsContainer}>
              <TouchableOpacity onPress={async () => {
                setIsActionSheetVisible(false);
                const granted = await requestPermission('camera');
                if (granted) abrirCamara();
              }}>
                <FontAwesomeIcon icon={faCamera} size={40} color="#185abd" />
                <Text style={styles.optionText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                setIsActionSheetVisible(false);
                const granted = await requestPermission('gallery');
                if (granted) abrirGaleria();
              }}>
                <FontAwesomeIcon icon={faImages} size={40} color="#185abd" />
                <Text style={styles.optionText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setIsActionSheetVisible(false);
                abrirDocumentos();
              }}>
                <FontAwesomeIcon icon={faFile} size={40} color="#185abd" />
                <Text style={styles.optionText}>Archivos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alerta personalizada */}
      {showAlert && (
        <CustomAlert
          visible={showAlert}
          onClose={() => setShowAlert(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          onAccept={onAlertAccept}
        />
      )}

      {/* Alerta para confirmar borrado TOTAL */}
      {showDeleteConfirm && (
      <CustomAlert
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirmar"
        message="¿Seguro que desea eliminar este documento?"
        showCancel={true}          // Mostrará el botón “Cancelar”
        onAccept={deleteDocument}  // Acción al Aceptar
        onCancel={() => {
          console.log('El usuario canceló la eliminación');
          // Otras acciones si quieres
        }}
      />
    )}


    </ScrollView>
  );
};

// --------------------------------------------------------------------
// Estilos
// --------------------------------------------------------------------
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

export default DocumentDetail;
