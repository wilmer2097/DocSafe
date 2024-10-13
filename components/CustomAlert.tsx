import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

const CustomAlert = ({ visible, onClose, title, message, token, onAccept }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={() => {}}
    >
      <Pressable style={styles.backdrop} onPress={() => {}}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.tokenLabel}>Acceder con Token ID:</Text>
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenHighlight}>{token}</Text>
          </View>
          <Pressable style={styles.button} onPress={() => { onAccept(); onClose(); }}>
            <Text style={styles.buttonText}>Aceptar</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
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
  tokenLabel: {
    color: '#777',
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  tokenContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenHighlight: {
    fontSize: 28,
    color: '#155abd',
    fontWeight: 'bold',
    letterSpacing: 2,
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

export default CustomAlert;
