import { useEffect, useState } from "react";

const loaded = new Set<string>();

export function useLoadedImage(url: string) {
  const [, setReady] = useState(url);

  useEffect(() => {
    if (loaded.has(url)) return;
    let active = true;
    const image = new Image();
    image.src = url;
    image
      .decode()
      .catch(() => undefined)
      .then(() => {
        loaded.add(url);
        if (active) setReady(url + "#loaded");
      });
    return () => {
      active = false;
    };
  }, [url]);

  return loaded.has(url);
}
