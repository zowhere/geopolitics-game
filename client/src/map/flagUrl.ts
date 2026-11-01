const wideFlags = import.meta.glob<string>("/node_modules/flag-icons/flags/4x3/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

const squareFlags = import.meta.glob<string>("/node_modules/flag-icons/flags/1x1/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

export function flagUrl(code: string) {
  return wideFlags[`/node_modules/flag-icons/flags/4x3/${code}.svg`];
}

export function squareFlagUrl(code: string) {
  return squareFlags[`/node_modules/flag-icons/flags/1x1/${code}.svg`];
}
