import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const AnimatedSection = ({ title, content }) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Cambiar a true si solo estás animando propiedades compatibles
    }).start();
  }, [expanded]);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const bodyHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // Ajusta el rango de altura según el contenido esperado
  });

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggleExpand}>
        <Text style={styles.subheader}>{title}</Text>
        <FontAwesomeIcon 
          icon={expanded ? faChevronUp : faChevronDown} 
          size={20} 
          color="#185abd" 
        />
      </TouchableOpacity>
      <Animated.View style={[styles.sectionBody, { height: bodyHeight }]}>
        <Text style={styles.text}>{content}</Text>
      </Animated.View>
    </View>
  );
};

export default function HelpScreen() {
  const sections = [
    {
      title: "Registro de Perfil",
      content: "Cuando inicias la aplicación por primera vez, deberás completar tu perfil ingresando tus datos personales. Asegúrate de proporcionar un correo electrónico válido, ya que es necesario para recuperar tu código de acceso en caso de que lo olvides."
    },
    {
      title: "Inicio de Sesión",
      content: "Ingresa el código de acceso de 4 dígitos que se generó al crear tu perfil para acceder a la aplicación. Si olvidaste tu código, puedes recuperarlo usando la opción 'Olvidé mi contraseña'."
    },
    {
      title: "Agregar Documentos",
      content: "Puedes agregar documentos a tu carpeta principal. Para ello, selecciona 'Agregar Documento' y elige el archivo desde tu dispositivo. Puedes cargar una imagen o cualquier otro tipo de archivo compatible."
    },
    {
      title: "Visualizar y Editar Documentos",
      content: "Todos los documentos agregados se mostrarán en la pantalla principal. Puedes visualizar, editar, o eliminar documentos en cualquier momento. Para visualizar imágenes, haz clic en ellas para verlas en pantalla completa."
    },
    {
      title: "Configuración",
      content: "Accede a la sección de Configuración para actualizar tu perfil, cambiar tu código de acceso, o ajustar otras preferencias de la aplicación."
    },
    {
      title: "Ayuda y Soporte",
      content: "Si necesitas ayuda adicional, puedes consultar esta guía o ponerte en contacto con nuestro equipo de soporte a través de la opción 'Ayuda' en el menú principal."
    }
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {sections.map((section, index) => (
        <AnimatedSection key={index} title={section.title} content={section.content} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  subheader: {
    color: '#185abd',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionBody: {
    overflow: 'hidden',
  },
  text: {
    padding: 15,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});
