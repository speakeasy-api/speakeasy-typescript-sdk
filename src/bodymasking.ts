import * as contentType from "content-type";

export function maskBodyRegex(
  body: string,
  mimeType: string,
  stringMasks: Record<string, string>,
  numberMasks: Record<string, string>
): string {
  const ct = contentType.parse(mimeType);
  if (ct.type !== "application/json") {
    return body;
  }

  for (const field in stringMasks) {
    const escapedField = escapeRegExp(field);

    const regexString = `("${escapedField}": *)(".*?[^\\\\]")( *[, \\n\\r}]?)`;

    body = body.replace(
      new RegExp(regexString, "g"),
      (_: string, ...groups: string[]): string => {
        return groups[0] + `"${stringMasks[field]}"` + groups[2];
      }
    );
  }

  for (const field in numberMasks) {
    const escapedField = escapeRegExp(field);

    const regexString = `("${escapedField}": *)(-?[0-9]+\\.?[0-9]*)( *[, \\n\\r}]?)`;

    body = body.replace(
      new RegExp(regexString, "g"),
      (_: string, ...groups: string[]): string => {
        return groups[0] + numberMasks[field] + groups[2];
      }
    );
  }

  return body;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
