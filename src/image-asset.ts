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
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function hasInvalidFileNameCharacter(fileName: string): boolean {
  return [...fileName].some(
    (character) =>
      character === "/" || character === "\\" || character.charCodeAt(0) < 32,
  );
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
  if (Buffer.byteLength(match[2], "base64") > MAX_IMAGE_BYTES) {
    throw new ImageUploadValidationError("image_too_large");
  }
}
