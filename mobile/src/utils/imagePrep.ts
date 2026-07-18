import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { devError, devLog } from "./log";

const MAX_WIDTH = 2000;
const JPEG_QUALITY = 0.88;

export interface PreparedPhoto {
  uri: string;
  width: number;
  height: number;
  mimeType: "image/jpeg";
  byteSize: number;
}

/**
 * Normalizes a picked/captured photo for upload: bakes in EXIF orientation
 * (expo-image-manipulator re-renders pixels, discarding the raw orientation
 * flag), converts to JPEG, and downsizes very large photos so uploads stay
 * fast on cellular connections.
 */
export async function preparePhotoForUpload(source: {
  uri: string;
  width: number;
  height: number;
}): Promise<PreparedPhoto> {
  devLog("image manipulator input", source);

  try {
    const context = ImageManipulator.manipulate(source.uri);
    if (source.width > MAX_WIDTH) {
      context.resize({ width: MAX_WIDTH });
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: JPEG_QUALITY,
    });

    const file = new File(saved.uri);
    const byteSize = file.size ?? 0;

    const prepared: PreparedPhoto = {
      uri: saved.uri,
      width: saved.width,
      height: saved.height,
      mimeType: "image/jpeg",
      byteSize,
    };

    devLog("image manipulator output", prepared);
    return prepared;
  } catch (err) {
    devError("image preparation failed", err);
    throw new Error("That photo could not be prepared. Please try another image.");
  }
}
