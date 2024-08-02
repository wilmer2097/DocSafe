import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';

const DocumentItem = ({ documentName, uri, type }) => {
  return (
    <View style={styles.item}>
      {type === 'image' ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <Text style={styles.itemText}>{documentName}</Text>
      )}
    </View>
  );
};

export default DocumentItem;
