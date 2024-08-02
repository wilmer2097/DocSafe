// import React, { useState, useEffect } from 'react';
// import { View, TextInput, FlatList, Text } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import DocumentItem from './DocumentItem';
// import styles from '../styles/Styles';

// const SearchDocumentComponent = () => {
//   const [documents, setDocuments] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');

//   useEffect(() => {
//     const loadDocuments = async () => {
//       const storedDocuments = await AsyncStorage.getItem('documents');
//       if (storedDocuments) {
//         setDocuments(JSON.parse(storedDocuments));
//       }
//     };
//     loadDocuments();
//   }, []);

//   const filteredDocuments = documents.filter((doc) =>
//     doc.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <View style={styles.container}>
//       <TextInput
//         placeholder="Buscar Documento"
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//         style={styles.textInput}
//       />
//       <FlatList
//         data={filteredDocuments}
//         keyExtractor={(item) => item.path}
//         renderItem={({ item }) => <DocumentItem document={item} />}
//       />
//     </View>
//   );
// };

// export default SearchDocumentComponent;
