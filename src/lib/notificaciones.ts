import Constants from 'expo-constants';
import { Platform } from 'react-native';

const esExpoGo = Constants.appOwnership === 'expo';
const notificacionesDisponibles = !(Platform.OS === 'android' && esExpoGo);

function cargarNotifications() {
  if (!notificacionesDisponibles) return null;
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return Notifications;
  } catch (error) {
    console.warn('expo-notifications no está disponible en este entorno:', error);
    return null;
  }
}

export async function pedirPermisosNotificaciones() {
  const Notifications = cargarNotifications();
  if (!Notifications) return false;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('No se pudieron pedir permisos de notificaciones:', error);
    return false;
  }
}

export async function notificarNuevoClientePendiente(nombreCompleto: string) {
  const Notifications = cargarNotifications();
  if (!Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nuevo cliente pendiente',
        body: `${nombreCompleto} está esperando aprobación`,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('No se pudo enviar la notificación local:', error);
  }
}