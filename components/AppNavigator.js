import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import {
  FontAwesomeIcon
} from '@fortawesome/react-native-fontawesome';
import {
  faFolder, faCog, faInfoCircle, faSignOutAlt, faTrashAlt, faArrowLeft, faHome, faUser, faQuestionCircle, faFileExport
} from '@fortawesome/free-solid-svg-icons';

import HomeScreen from './HomeScreen';
import HelpScreen from './HelpScreen';
import WelcomeScreen from './WelcomeScreen';
import ArchivedDocuments from './ArchivedDocuments';
import LoginScreen from './LoginScreen';
import ProfileScreen from './ProfileScreen';
import TestScreen from './pruebaa';
import DocumentDetail from './DocumentDetail';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import RestoreBackupScreen from './RestoreBackupScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const CustomDrawerContent = (props) => {
  const [profile, setProfile] = useState({
    name: 'Admin',
    profileImage: require('../src/presentation/assets/Logo.jpg'),
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
        const profileExists = await RNFS.exists(profilePath);

        if (profileExists) {
          const profileData = await RNFS.readFile(profilePath);
          const { perfilUsuario } = JSON.parse(profileData);

          setProfile({
            name: perfilUsuario.name || 'Admin',
            profileImage: perfilUsuario.profileImage ? { uri: perfilUsuario.profileImage } : require('../src/presentation/assets/Logo.jpg'),
          });
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil.');
      }
    };

    loadProfile();
  }, []);

  return (
    <SafeAreaView style={styles.drawerContent}>
      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.profileImageContainer} onPress={() => props.navigation.navigate('Profile')}>
          <Image source={profile.profileImage} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileRole}>DocSafe</Text>
      </View>

      <View style={styles.menuItems}>
        <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('Documentos')}>
          <View style={styles.iconAndText}>
            <FontAwesomeIcon icon={faFolder} size={20} color="#185abd" style={styles.menuIcon} />
            <Text style={styles.menuText}>Documentos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('Configuración')}>
          <View style={styles.iconAndText}>
            <FontAwesomeIcon icon={faCog} size={20} color="#185abd" style={styles.menuIcon} />
            <Text style={styles.menuText}>Configuración</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('Guía de Uso')}>
          <View style={styles.iconAndText}>
            <FontAwesomeIcon icon={faQuestionCircle} size={20} color="#185abd" style={styles.menuIcon} />
            <Text style={styles.menuText}>Ayuda</Text>
          </View>
        </TouchableOpacity>

       <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('TestScreen')}>
          <View style={styles.iconAndText}>
            <FontAwesomeIcon icon={faQuestionCircle} size={20} color="#185abd" style={styles.menuIcon} />
            <Text style={styles.menuText}>TestScreen</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('Copia Backup')}>
          <View style={styles.iconAndText}>
            <FontAwesomeIcon icon={faFileExport} size={20} color="#185abd" style={styles.menuIcon} />
            <Text style={styles.menuText}>Copia Backup</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => Linking.openURL('https://solucionestecperu.com/contactos.html')}
          accessibilityLabel="Creado por STEC Perú, fábrica de software, enlace a la página de contactos">
          <View style={styles.iconAndText}>
            <FontAwesomeIcon icon={faInfoCircle} size={20} color="#185abd" style={styles.menuIcon} />
            <Text style={styles.menuText}>Creado Por</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.creatorText}>STEC - Perú</Text>
            <Text style={styles.subText}>Fábrica de software</Text>
            <Text style={styles.yearText}>© 2024</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => props.navigation.navigate('Login')}>
        <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#ffffff" style={styles.menuIcon} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#185abd',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerStyle: {
          backgroundColor: '#f5f5f5',
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="DocSafe" 
        component={HomeScreen}
        options={{
          title: 'Documentos',
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faHome} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Documentos" 
        component={HomeScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faFolder} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Perfil" 
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faUser} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Configuración" 
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faCog} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Guía de Uso" 
        component={HelpScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faQuestionCircle} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="TestScreen" 
        component={TestScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faQuestionCircle} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Archivados" 
        component={ArchivedDocuments}
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faFolder} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Copia Backup" 
        component={RestoreBackupScreen} // Componente unificado
        options={{
          drawerIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={faFileExport} color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const AppNavigator = ({ initialRoute }) => {
  const [firstTimeUser, setFirstTimeUser] = useState(null);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      const isFirstTime = await AsyncStorage.getItem('firstTimeUser');
      if (isFirstTime === null) {
        setFirstTimeUser(true);
        await AsyncStorage.setItem('firstTimeUser', 'false');
      } else {
        setFirstTimeUser(false);
      }
    };

    checkFirstTimeUser();
  }, []);

  if (firstTimeUser === null) {
    return null; // Puedes agregar un loading spinner aquí mientras se carga el estado
  }
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={firstTimeUser ? 'Welcome' : initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#185abd',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen} 
          options={{ 
            title: 'Recuperar Contraseña',
            headerLeft: (props) => (
              <TouchableOpacity {...props} style={styles.headerIcon}>
                <FontAwesomeIcon icon={faArrowLeft} size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ 
            title: 'Completa tu Perfil',
            headerLeft: (props) => (
              <TouchableOpacity {...props} style={styles.headerIcon}>
                <FontAwesomeIcon icon={faArrowLeft} size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          }} 
        />
        <Stack.Screen name="Home" component={DrawerNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="DocumentDetail"
          component={DocumentDetail}
          options={({ navigation }) => ({
            title: 'Detalles del Documento',
            headerLeft: () => (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
                <FontAwesomeIcon icon={faArrowLeft} size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={() => {/* Función para eliminar */}} style={styles.headerIcon}>
                <FontAwesomeIcon icon={faTrashAlt} size={24} color="#ffffff" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="ArchivedDocuments"
          component={ArchivedDocuments}
          options={{ title: 'Documentos Archivados' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: '#f5f5f5', 
    justifyContent: 'space-between',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#185abd',
  },
  profileImageContainer: {
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileRole: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  iconAndText: {
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  menuIcon: {
    marginRight: 15,  
  },
  menuText: {
    fontSize: 16,
    color: '#333333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cc0000',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 5,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerIcon: {
    padding: 10,
  },
  infoContainer: {
    marginLeft: 25,         
  },
  creatorText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#185abd'
  },
  subText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666666',  
  },
  yearText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#999999',    
  },
});

export default AppNavigator;
