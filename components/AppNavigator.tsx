import React, { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import RNFS from 'react-native-fs';
import HomeScreen from './HomeScreen';
import HelpScreen from './HelpScreen';
import LoginScreen from './LoginScreen';
import ProfileScreen from './ProfileScreen';
import DocumentDetail from './DocumentDetail';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFolder, faCog, faInfoCircle, faSignOutAlt, faTrashAlt, faArrowLeft, faHome, faUser, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

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
        <TouchableOpacity onPress={() => props.navigation.navigate('Profile')}>
          <Image source={profile.profileImage} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileRole}>DocSafe</Text>
      </View>
      <View style={styles.menuItems}>
        <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('Documentos')}>
          <FontAwesomeIcon icon={faFolder} size={20} color="#185abd" style={styles.menuIcon} />
          <Text style={styles.menuText}>Documentos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('Configuración')}>
          <FontAwesomeIcon icon={faCog} size={20} color="#185abd" style={styles.menuIcon} />
          <Text style={styles.menuText}>Configuración</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => props.navigation.navigate('Guía de Uso')}>
          <FontAwesomeIcon icon={faQuestionCircle} size={20} color="#185abd" style={styles.menuIcon} />
          <Text style={styles.menuText}>Ayuda</Text>
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
          title: 'Inicio',
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
    </Drawer.Navigator>
  );
};

const AppNavigator = ({ initialRoute }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#185abd',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    color: '#333333',
    fontSize: 16,
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
});

export default AppNavigator;