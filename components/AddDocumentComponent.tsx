// import React, { useState } from 'react';
// import { View, Button, Alert } from 'react-native';
// import DocumentPicker from 'react-native-document-picker';
// import ImagePicker from 'react-native-image-picker';
// import RNFS from 'react-native-fs';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import styles from '../styles/Styles';

// const AddDocumentComponent = () => {
//   const [documents, setDocuments] = useState([]);

//   const pickDocument = async () => {
//     try {
//       const res = await DocumentPicker.pick({
//         type: [DocumentPicker.types.allFiles],
//       });
//       const documentPath = `${RNFS.DocumentDirectoryPath}/${res.name}`;
//       await RNFS.copyFile(res.uri, documentPath);
//       const newDocuments = [...documents, { name: res.name, path: documentPath }];
//       setDocuments(newDocuments);
//       await AsyncStorage.setItem('documents', JSON.stringify(newDocuments));
//       Alert.alert('Documento añadido', 'Documento añadido exitosamente.');
//     } catch (err) {
//       if (DocumentPicker.isCancel(err)) {
//         Alert.alert('Cancelado', 'Selección de documento cancelada.');
//       } else {
//         Alert.alert('Error', 'Error al seleccionar documento.');
//       }
//     }
//   };

//   const pickImage = () => {
//     const options = {
//       storageOptions: {
//         skipBackup: true,
//         path: 'images',
//       },
//     };
//     ImagePicker.launchCamera(options, (response) => {
//       if (response.didCancel) {
//         Alert.alert('Cancelado', 'Captura de imagen cancelada.');
//       } else if (response.error) {
//         Alert.alert('Error', 'Error al capturar imagen.');
//       } else {
//         const imagePath = `${RNFS.DocumentDirectoryPath}/${response.fileName}`;
//         RNFS.copyFile(response.uri, imagePath)
//           .then(async () => {
//             const newDocuments = [...documents, { name: response.fileName, path: imagePath }];
//             setDocuments(newDocuments);
//             await AsyncStorage.setItem('documents', JSON.stringify(newDocuments));
//             Alert.alert('Imagen añadida', 'Imagen añadida exitosamente.');
//           })
//           .catch((error) => {
//             Alert.alert('Error', `Error al guardar imagen: ${error.message}`);
//           });
//       }
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <Button title="Agregar Documento" onPress={pickDocument} />
//       <Button title="Agregar Imagen" onPress={pickImage} />
//     </View>
//   );
// };

// export default AddDocumentComponent;
