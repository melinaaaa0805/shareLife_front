/**
 * Notification push via Expo Push API.
 *
 * Prérequis — installer les packages Expo manquants :
 *   npx expo install expo-notifications expo-constants
 *
 * Configurer ensuite le projectId EAS dans app.json :
 *   { "expo": { "extra": { "eas": { "projectId": "<votre-project-id>" } } } }
 */

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/api';

// Afficher les notifications même quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Demande la permission, obtient le token Expo et l'envoie au backend.
 * Doit être appelé après une connexion réussie.
 * Silencieux en cas d'échec (simulateur, refus de permission, réseau).
 */
export async function registerPushToken(): Promise<void> {
  // Les simulateurs iOS/Android ne peuvent pas recevoir de push
  if (!Constants.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  // Canal Android requis pour Expo SDK 33+
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ShareLife',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9B7BEA',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  await api.post('/notifications/token', { token: tokenData.data });
}

/**
 * Nettoie le token push lors de la déconnexion pour ne plus recevoir
 * de notifications sur cet appareil.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    await api.delete('/notifications/token');
  } catch {
    // Silencieux — le token sera simplement ignoré si invalide
  }
}

/**
 * Ajoute un listener exécuté quand l'utilisateur appuie sur une notification.
 * Retourne une fonction de nettoyage à appeler dans le useEffect.
 */
export function addNotificationTapListener(
  onTap: (data: Record<string, unknown>) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data ?? {};
      onTap(data as Record<string, unknown>);
    },
  );
  return () => sub.remove();
}
