import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/styles';

const FolderItem = ({ folderName }) => {
  return (
    <View style= { styles.folderItem } >
    <Text style={ styles.folderItem }> { folderName } < /Text>
      < /View>
  );
};

export default FolderItem;
