<<<<<<< HEAD
//import * as Notifications from 'expo-notifications';
=======
// import * as Notifications from 'expo-notifications';
>>>>>>> origin/desarrollo

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// export async function pedirPermisosNotificaciones() {
//   const { status } = await Notifications.requestPermissionsAsync();
//   return status === 'granted';
// }

// export async function notificarNuevoClientePendiente(nombreCompleto: string) {
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: 'Nuevo cliente pendiente',
//       body: `${nombreCompleto} está esperando aprobación`,
//     },
//     trigger: null,
//   });
// }