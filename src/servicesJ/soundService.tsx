import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

export type TipoSonido = 'inicio' | 'cierre' | 'error' | 'exito' | 'info';

export const SoundService = {
  reproducir: async (tipo: TipoSonido) => {
    try {
      let archivoAudio;

      switch (tipo) {
        case 'inicio':
          archivoAudio = require('@/assets/sounds/app_start.mp3');
          break;
        case 'error':
          archivoAudio = require('@/assets/sounds/error_alert.mp3');
          break;
        case 'exito':
        case 'cierre':
          archivoAudio = require('@/assets/sounds/success_bip.mp3');
          break;
        case 'info':
          archivoAudio = require('@/assets/sounds/info.mp3');
          break;  
      }

      if (archivoAudio) {
        
        const audio = createAudioPlayer(archivoAudio);
        audio.play();

        audio.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            audio.remove();
          }
        });
      }

      // Vibracion de error
      if (tipo === 'error') {
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Vibration.vibrate([0, 200]);
        }
      }
    } catch (error) {
      console.log('No se pudo reproducir el recurso de audio:', error);
    }
  },
};