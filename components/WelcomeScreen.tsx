import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Linking } from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';
import { useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Bienvenido a DocSafe</Text>
        <Image source={require('../src/presentation/assets/Logo.jpg')} style={styles.logo} />
      </View>

      <Text style={styles.tagline}>
        DocSafe (c) STEC{"\n"}Gestor documentos personales
      </Text>

      <SwiperFlatList
        autoplay
        autoplayDelay={2}
        autoplayLoop
        index={0}
        showPagination
        paginationActiveColor="#155abd"
        paginationStyleItem={styles.paginationItem}
        data={images}
        renderItem={({ item }) => (
          <View style={styles.carouselContainer}>
            <Image source={item} style={styles.carouselImage} />
          </View>
        )}
      />

      <Text style={styles.subtitle}>Protege y gestiona tus documentos de manera segura.</Text>

      {/* Botón de ingresar/iniciar sesión */}
      <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
        <Text style={styles.buttonText}>{isLoggedIn ? 'Ingresar' : 'Iniciar Sesión'}</Text>
      </TouchableOpacity>

      {/* Botón de crear cuenta: solo visible si no está logueado */}
      {!isLoggedIn && (
        <TouchableOpacity style={[styles.button, styles.createAccountButton]} onPress={handleCreateAccountPress}>
          <Text style={styles.buttonText}>Crear Cuenta</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.optionButton} onPress={handleHelpCenterPress}>
        <Text style={styles.optionButtonText}>Ir al Centro de Ayuda</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#155abd',
    textAlign: 'center',
    marginRight: 10,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tagline: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  carouselContainer: {
    marginTop: 50,
    width: width * 0.9,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  paginationItem: {
    marginTop: -370,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#155abd',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginBottom: 15,
  },
  createAccountButton: {
    backgroundColor: '#1e7eff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  optionButton: {
    borderColor: '#155abd',
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginBottom: 15,
  },
  optionButtonText: {
    fontSize: 16,
    color: '#155abd',
    fontWeight: '600',
  },
});

export default WelcomeScreen;
