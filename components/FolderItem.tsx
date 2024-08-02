import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/styles';

const FolderItem = ({ folderName }) => {
  return (
    <View style={styles.item}>
      <Text style={styles.itemText}>{folderName}</Text>
    </View>
  );
};

export default FolderItem;
