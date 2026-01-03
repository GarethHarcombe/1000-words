
import { useEffect, useState } from "react";
import { Image, ImageSourcePropType } from "react-native";
import { Asset } from "expo-asset";

type Dims = { width: number; height: number };

export function useImageDimensions(source: ImageSourcePropType) {
  const [dims, setDims] = useState<Dims | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 1) Native fast path (iOS/Android)
      const resolver = (Image as any).resolveAssetSource;
      if (typeof resolver === "function") {
        const resolved = resolver(source);
        if (resolved?.width && resolved?.height) {
          if (!cancelled) setDims({ width: resolved.width, height: resolved.height });
          return;
        }
      }

      // 2) Expo fallback (works on web too) for static require() assets
      // Static assets are usually numbers in RN (module IDs).
      if (typeof source === "number") {
        const asset = Asset.fromModule(source);
        if (!asset.downloaded) {
          try {
            await asset.downloadAsync();
          } catch {
            // ignore, we will fall through
          }
        }
        if (asset.width && asset.height) {
          if (!cancelled) setDims({ width: asset.width, height: asset.height });
          return;
        }
      }

      // 3) Last fallback if you ever pass { uri: ... } sources
      const uri = (source as any)?.uri;
      if (typeof uri === "string") {
        Image.getSize(
          uri,
          (width, height) => {
            if (!cancelled) setDims({ width, height });
          },
          () => {
            if (!cancelled) setDims(null);
          }
        );
      }
    };

    setDims(null);
    run();

    return () => {
      cancelled = true;
    };
  }, [source]);

  return dims;
}
