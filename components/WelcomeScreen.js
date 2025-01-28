import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Dimensions, 
  Linking, 
  ScrollView, 
  useWindowDimensions 
} from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';
import { useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appVersion, setAppVersion] = useState("");

  // Obtenemos el ancho y alto actuales (recalcula al girar)
  const { width: deviceWidth, height: deviceHeight } = useWindowDimensions();
  const isLandscape = deviceWidth > deviceHeight;

  // Definimos la altura del carrusel según la orientación
  const carouselHeight = isLandscape ? deviceHeight * 0.4 : deviceHeight * 0.35;

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
    <ScrollView 
      contentContainerStyle={styles.scrollContent} 
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, isLandscape && styles.landscapeContainer]}>
        
        {/* Contenido superior */}
        <View style={[styles.topContent, isLandscape && styles.landscapeTopContent]}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Bienvenido a Wallet DS</Text>
            <Image 
              source={require('../src/presentation/assets/Logo.jpg')} 
              style={styles.logo} 
            />
          </View>

          <Text style={styles.tagline}>
            Wallet DS © STEC{"\n"}Gestor documentos personales
          </Text>

          {/* Carrusel con altura dinámica y ancho de la pantalla */}
          <View 
            style={[
              styles.carouselWrapper, 
              { 
                width: deviceWidth, 
                height: carouselHeight 
              }
            ]}
          >
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
                <View 
                  style={[
                    styles.carouselSlide, 
                    { 
                      width: deviceWidth, 
                      height: carouselHeight 
                    }
                  ]}
                >
                  <Image
                    source={item}
                    style={[
                      styles.carouselImage, 
                      { 
                        width: deviceWidth - 40, // deja 20px de margen a cada lado
                        height: carouselHeight - 40, // ajusta la altura para mantener la relación de aspecto
                      }
                    ]}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
          </View>
        </View>

        {/* Contenido inferior */}
        <View style={[styles.bottomContent, isLandscape && styles.landscapeBottomContent]}>
          <Text style={styles.subtitle}>
            Protege y gestiona tus documentos de manera segura.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
            <Text style={styles.buttonText}>
              {isLoggedIn ? 'Ingresar' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          {!isLoggedIn && (
            <TouchableOpacity 
              style={[styles.button, styles.createAccountButton]} 
              onPress={handleCreateAccountPress}
            >
              <Text style={styles.buttonText}>Crear Cuenta</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.optionButton} onPress={handleHelpCenterPress}>
            <Text style={styles.optionButtonText}>Ir al Centro de Ayuda</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Versión {appVersion}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  landscapeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  landscapeTopContent: {
    width: '50%',
    paddingRight: 10,
  },
  bottomContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  landscapeBottomContent: {
    width: '50%',
    paddingLeft: 10,
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
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

  // Carrusel (estilo base, el alto lo pondremos dinámico en línea):
  carouselWrapper: {
    marginTop: 10,
    marginBottom: 15,
  },
  carouselSlide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    borderRadius: 30,
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
    marginTop: 10,
  },
});

export default WelcomeScreen;