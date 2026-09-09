import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// tipos
type ToastType = 'success' | 'error' | 'info';

interface ToastContextData {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

// Proveedor
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState({ 
    visible: false, 
    type: 'info' as ToastType, 
    title: '', message: '' });

  // Animacion para que caiga desde arriba
  const translateY = useRef(new Animated.Value(-150)).current;

  const showToast = (type: ToastType, title: string, message?: string) => {
    // vibracion segun el tipo
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Seteo textos
    setToast({ visible: true, type, title, message: message || '' });

    // Esta secuencia dura 3 segundos
    Animated.sequence([
      Animated.timing(translateY, { toValue: 50, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(translateY, { toValue: -150, duration: 300, useNativeDriver: true })
    ]).start(() => setToast({ ...toast, visible: false }));
  };

  // Diccionario de colores 
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#31603D', borderClass: 'border-primary' };
      case 'error':
        return { icon: 'alert-circle', color: '#EF4444', borderClass: 'border-danger' };
      case 'info':
        return { icon: 'information-circle', color: '#F5C065', borderClass: 'border-tertiary' };
      default:
        return { icon: 'information-circle', color: '#31603D', borderClass: 'border-primary' };
    }
  };

  const currentStyle = getStyles();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* El Diseño Visual del Toast */}
      {toast.visible && (
        <Animated.View
          style={{ 
            transform: [{ translateY }], 
            position: 'absolute', 
            top: 0, 
            left: 20, 
            right: 20, 
            zIndex: 9999, 
            elevation: 10,
           }}
          className={`flex-row items-center bg-surface-light/95 p-4 rounded-2xl shadow-2xl border-l-8 ${currentStyle.borderClass}`}
        >
          <Ionicons name={currentStyle.icon as any} size={32} color={currentStyle.color} />

          <View className="ml-3 flex-1">
            <Text className="font-bold text-dark text-[15px] uppercase tracking-tight">
              {toast.title}
            </Text>
            {toast.message ? (
              <Text className="text-dark/70 font-medium text-[13px] mt-0.5 leading-tight">
                {toast.message}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

// Hook personalizado 
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider');
  return context;
};