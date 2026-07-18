import { File, UploadType } from "expo-file-system";
import { devError, devLog } from "../utils/log";
import type { UploadAuthorization } from "../types/domain";

/**
 * Uploads the prepared local file directly to the given signed URL.
 *
 * Important: on Expo/React Native (especially iOS) constructing a Blob from
 * an ArrayBuffer/ArrayBufferView to upload a file can fail or silently
 * corrupt data. We avoid that entirely by using expo-file-system's native
 * File.upload(), which streams straight from the file URI on disk.
 */
export async function uploadPreparedPhoto(localUri: string, auth: UploadAuthorization): Promise<void> {
  const file = new File(localUri);

  devLog("upload starting", { localUri, uploadUrl: auth.uploadUrl });

  const result = await file.upload(auth.uploadUrl, {
    httpMethod: auth.method,
    headers: auth.headers,
    uploadType: UploadType.BINARY_CONTENT,
  });

  devLog("upload finished", { status: result.status, body: result.body });

  if (result.status < 200 || result.status >= 300) {
    devError("upload rejected by server", result);
    throw new Error("We could not upload that photo. Check your connection and try again.");
  }
}
