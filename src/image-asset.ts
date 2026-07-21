export function resolveAvailableAssetName(
  requestedName: string,
  existingNames: ReadonlySet<string>,
): string {
  if (!existingNames.has(requestedName)) return requestedName;
  const dot = requestedName.lastIndexOf(".");
  const base = dot > 0 ? requestedName.slice(0, dot) : requestedName;
  const extension = dot > 0 ? requestedName.slice(dot) : "";
  let suffix = 2;
  while (existingNames.has(`${base}-${suffix}${extension}`)) suffix += 1;
  return `${base}-${suffix}${extension}`;
}

export class ImageUploadValidationError extends Error {
  constructor(
    readonly code:
      | "invalid_image_type"
      | "invalid_image_content"
      | "image_too_large"
      | "invalid_file_name",
  ) {
    super(`Invalid image upload: ${code}`);
    this.name = "ImageUploadValidationError";
  }
}

const EXTENSIONS: Record<string, string[]> = {
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
};
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectImageMimeType(bytes: Uint8Array): string | undefined {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  const header = Buffer.from(bytes.subarray(0, 12)).toString("ascii");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a"))
    return "image/gif";
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP")
    return "image/webp";
  return undefined;
}

function hasInvalidFileNameCharacter(fileName: string): boolean {
  return [...fileName].some(
    (character) =>
      character === "/" || character === "\\" || character.charCodeAt(0) < 32,
  );
}

export function validateImageBytes(input: {
  bytes: Uint8Array;
  fileName: string;
  declaredMimeType?: string;
}): string {
  if (
    !input.fileName ||
    input.fileName.length > 128 ||
    hasInvalidFileNameCharacter(input.fileName)
  ) {
    throw new ImageUploadValidationError("invalid_file_name");
  }
  if (input.bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageUploadValidationError("image_too_large");
  }
  const detectedMimeType = detectImageMimeType(input.bytes);
  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (
    !detectedMimeType ||
    !EXTENSIONS[detectedMimeType]?.includes(extension) ||
    (input.declaredMimeType !== undefined &&
      input.declaredMimeType !== detectedMimeType)
  ) {
    throw new ImageUploadValidationError("invalid_image_content");
  }
  return detectedMimeType;
}

export function validateImageUpload(input: {
  data: string;
  fileName: string;
}): void {
  if (
    !input.fileName ||
    input.fileName.length > 128 ||
    hasInvalidFileNameCharacter(input.fileName)
  ) {
    throw new ImageUploadValidationError("invalid_file_name");
  }
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(input.data);
  const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!match || !EXTENSIONS[match[1]]?.includes(extension)) {
    throw new ImageUploadValidationError("invalid_image_type");
  }
  const bytes = new Uint8Array(Buffer.from(match[2], "base64"));
  validateImageBytes({
    bytes,
    fileName: input.fileName,
    declaredMimeType: match[1],
  });
}
