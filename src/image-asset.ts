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
