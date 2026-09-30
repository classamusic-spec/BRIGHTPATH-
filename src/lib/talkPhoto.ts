import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Talk cards show photos at most ~110 pt wide, so 256 px is sharp at 2x and tiny to store. */
const SIDE = 256;

export class CameraDeniedError extends Error {}

/**
 * Takes or picks a photo for a Talk card and returns a small square JPEG as a
 * data URL (about 20 KB), or null when the grown-up cancels. The photo is
 * kept with the child's board on this device, so it survives the picker's
 * temporary files being cleared.
 */
export async function pickTalkPhoto(camera: boolean): Promise<string | null> {
  if (camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new CameraDeniedError('Camera permission was not given');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
  const res = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = res.canceled ? undefined : res.assets[0];
  if (!asset) return null;

  const ctx = ImageManipulator.manipulate(asset.uri);
  // Not every platform crops in the picker (web never does), so centre-crop to a square here.
  const { width: w, height: h } = asset;
  if (w > 0 && h > 0 && w !== h) {
    const side = Math.min(w, h);
    ctx.crop({ originX: Math.round((w - side) / 2), originY: Math.round((h - side) / 2), width: side, height: side });
  }
  ctx.resize({ width: SIDE, height: SIDE });
  const image = await ctx.renderAsync();
  const out = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.72, base64: true });
  return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
}
