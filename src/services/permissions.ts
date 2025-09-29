import { Platform } from 'react-native';
import {check,
  request,
  openSettings,
  RESULTS,
  type PermissionStatus,
  type Permission,
  PERMISSIONS,} from 'react-native-permissions';

const CAMERA: Permission = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
  default: PERMISSIONS.ANDROID.CAMERA,
})!;

const PHOTOS: Permission = Platform.select({
  ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
  android:
    (PERMISSIONS.ANDROID as any).READ_MEDIA_IMAGES ??
    PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  default: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
})!;

export type PermName = 'camera' | 'photos';

export async function getStatus(name: PermName): Promise<PermissionStatus> {
  return check(name === 'camera' ? CAMERA : PHOTOS);
}

export async function requestOnce(name: PermName): Promise<PermissionStatus> {
  return request(name === 'camera' ? CAMERA : PHOTOS);
}

export function isGranted(s: PermissionStatus) {
  return s === RESULTS.GRANTED || s === RESULTS.LIMITED;
}

export { openSettings, RESULTS };
