const flags = import.meta.glob<string>("/node_modules/flag-icons/flags/4x3/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

export function flagUrl(code: string) {
  return flags[`/node_modules/flag-icons/flags/4x3/${code}.svg`];
}
