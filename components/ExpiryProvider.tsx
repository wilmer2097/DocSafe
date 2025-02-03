import React, { createContext, useContext, useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';

interface ExpiryContextProps {
  checkExpiryDate: () => Promise<void>;
}

const ExpiryContext = createContext<ExpiryContextProps | undefined>(undefined);

export const useExpiry = (): ExpiryContextProps => {
  const context = useContext(ExpiryContext);
  if (!context) {
    throw new Error('useExpiry must be used within an ExpiryProvider');
  }
  return context;
};

export const ExpiryProvider: React.FC = ({ children }) => {
  const profilePath = `${RNFS.DocumentDirectoryPath}/perfilUsuario.json`;
  const [alertVisible, setAlertVisible] = useState(false);

  const checkExpiryDate = async () => {
    try {
      const profileExists = await RNFS.exists(profilePath);
      if (profileExists) {
        const profileData = await RNFS.readFile(profilePath);
        const savedProfile = JSON.parse(profileData).perfilUsuario;
        const expiryDate = new Date(savedProfile.fec_fin);
        const currentDate = new Date();

        if (currentDate >= expiryDate) {
          setAlertVisible(true);
        }
      }
    } catch (error) {
      console.error('Error checking expiry date:', error);
    }
  };

  useEffect(() => {
    checkExpiryDate();
  }, []);

  const onCloseAlert = () => setAlertVisible(false);

  return (
    <ExpiryContext.Provider value={{ checkExpiryDate }}>
      {children}
      <Modal visible={alertVisible} transparent={true} onRequestClose={() => {}}>
        <Pressable style={styles.backdrop} onPress={() => {}}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Cuenta Caducada</Text>
            <Text style={styles.message}>Tu cuenta ha caducado. Actualiza tus datos para seguir usando la aplicación.</Text>
            <Pressable style={styles.button} onPress={() => onCloseAlert()}>
              <Text style={styles.buttonText}>Aceptar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ExpiryContext.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#555',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#155abd',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ExpiryProvider;
