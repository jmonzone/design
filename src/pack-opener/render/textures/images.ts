const pending = new Map<string, Promise<HTMLImageElement | undefined>>();
const loaded = new Map<string, HTMLImageElement>();

/** Loads an image once per URL (CORS-enabled so it can be drawn into a texture); resolves undefined if it fails. */
export function loadImage(url: string): Promise<HTMLImageElement | undefined> {
  let promise = pending.get(url);
  if (!promise) {
    promise = new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        loaded.set(url, image);
        resolve(image);
      };
      image.onerror = () => resolve(undefined);
      image.src = url;
    });
    pending.set(url, promise);
  }
  return promise;
}

/** The image at `url` if it has finished loading. */
export function loadedImage(url: string | undefined): HTMLImageElement | undefined {
  return url ? loaded.get(url) : undefined;
}
