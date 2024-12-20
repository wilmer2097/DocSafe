import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Linking } from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';
import { useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info'; 

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appVersion, setAppVersion] = useState(""); // Estado para la versión de la app
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;

  useEffect(() => {
    const checkIfLoggedIn = async () => {
      try {
        const profileExists = await RNFS.exists(profilePath);
        setIsLoggedIn(profileExists);
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };

    checkIfLoggedIn();

    // Obtener la versión de la app
    const version = DeviceInfo.getVersion();
    setAppVersion(version);
  }, []);

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const handleCreateAccountPress = () => {
    navigation.navigate('Profile');
  };

  const handleHelpCenterPress = () => {
    Linking.openURL('https://solucionestecperu.com/idea.html');
  };

  const images = [
    require('../src/presentation/assets/image1.jpg'),
    require('../src/presentation/assets/image2.jpg'),
    require('../src/presentation/assets/image3.jpg'),
    require('../src/presentation/assets/image4.jpg'),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Bienvenido a DocSafe</Text>
          <Image source={require('../src/presentation/assets/Logo.jpg')} style={styles.logo} />
        </View>

        <Text style={styles.tagline}>
          DocSafe © STEC{"\n"}Gestor documentos personales
        </Text>

        <View style={styles.carouselWrapper}>
          <SwiperFlatList
            autoplay
            autoplayDelay={3}
            autoplayLoop
            index={0}
            showPagination
            paginationActiveColor="#155abd"
            paginationDefaultColor="#ccc"
            paginationStyle={styles.pagination}
            paginationStyleItem={styles.paginationItem}
            data={images}
            renderItem={({ item }) => (
              <View style={[styles.carouselSlide, { width }]}>
                <Image 
                  source={item} 
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              </View>
            )}
          />
        </View>
      </View>

      <View style={styles.bottomContent}>
        <Text style={styles.subtitle}>Protege y gestiona tus documentos de manera segura.</Text>

        <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
          <Text style={styles.buttonText}>{isLoggedIn ? 'Ingresar' : 'Iniciar Sesión'}</Text>
        </TouchableOpacity>

        {!isLoggedIn && (
          <TouchableOpacity style={[styles.button, styles.createAccountButton]} onPress={handleCreateAccountPress}>
            <Text style={styles.buttonText}>Crear Cuenta</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.optionButton} onPress={handleHelpCenterPress}>
          <Text style={styles.optionButtonText}>Ir al Centro de Ayuda</Text>
        </TouchableOpacity>

        {/* Mensaje de versión en la parte inferior */}
        <Text style={styles.versionText}>Versión {appVersion}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  bottomContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#155abd',
    textAlign: 'center',
    marginRight: 10,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  tagline: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  carouselWrapper: {
    marginTop: 100,
    width: width,
    height: 200,
    marginBottom: 15,
  },
  carouselSlide: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: width - 40,
    height: '100%',
    borderRadius: 10,
  },
  pagination: {
    bottom: -50,
  },
  paginationItem: {
    width: 15,
    height: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#155abd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  createAccountButton: {
    backgroundColor: '#1e7eff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionButton: {
    borderColor: '#155abd',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  optionButtonText: {
    fontSize: 14,
    color: '#155abd',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default WelcomeScreen;
