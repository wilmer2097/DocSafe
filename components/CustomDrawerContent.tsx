import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.profileSection}>
        <Image source={require('../src/presentation/assets/foto.jpg')} style={styles.profileImage} />
        <Text style={styles.profileName}>Ulises Ubillus</Text>
        <Text style={styles.profileRole}>DocSafe</Text>
      </View>
      <DrawerItem
        label="Documentos"
        icon={() => <Icon name="file" size={24} color="#000" />}
        onPress={() => props.navigation.navigate('Documentos')}
      />
      <DrawerItem
        label="Configurar"
        icon={() => <Icon name="cog" size={24} color="#000" />}
        onPress={() => props.navigation.navigate('Configurar')}
      />
      <DrawerItem
        label="Ayuda"
        icon={() => <Icon name="question-circle" size={24} color="#000" />}
        onPress={() => props.navigation.navigate('Ayuda')}
      />
      <DrawerItem
        label="Cerrar Sesión"
        icon={() => <Icon name="sign-out" size={24} color="#000" />}
        onPress={() => props.navigation.navigate('Login')}
      />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileRole: {
    fontSize: 14,
    color: 'gray',
  },
});
