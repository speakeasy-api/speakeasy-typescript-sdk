export function normalizePathHint(pathHint: string): string {
  const matched = [...pathHint.matchAll(/:(.+?)\/|:(.*)/g)];

  for (var i = 0; i < matched.length; i++) {
    const matched = [...pathHint.matchAll(/:(.+?)\/|:(.*)/g)];
    if (matched.length == 0) {
      break;
    }

    if (matched[0].index !== undefined) {
      pathHint = pathHint.replace(
        pathHint.substring(
          matched[0].index,
          matched[0].index + matched[0][0].length
        ),
        `{${matched[0][1] ? matched[0][1] : matched[0][2]}}${
          matched[0][0].endsWith("/") ? "/" : ""
        }`
      );
    }
  }

  return pathHint;
}
