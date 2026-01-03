
import { ImageSourcePropType } from "react-native";
import { Language } from "@/contexts/UserContext";

export type ImageKey =
  | "progressMapBw"
  | "progressMapColour"
  | "mapColour";

type Catalogue = Record<Language, Record<ImageKey, ImageSourcePropType>>;

export const images: Catalogue = {
  welsh: {
    progressMapBw: require("@/assets/images/welsh-map-no-background-bw.png"),
    progressMapColour: require("@/assets/images/welsh-map-no-background.png"),
    mapColour: require("@/assets/images/welsh-map-background.png"),

  },
  spanish: {
    progressMapBw: require("@/assets/images/spanish-map-no-background-bw.png"),
    progressMapColour: require("@/assets/images/spanish-map-no-background.png"),
    mapColour: require("@/assets/images/spanish-map-background.png"),
  },
  maori: {
    progressMapBw: require("@/assets/images/nz-map-no-background-bw.png"),
    progressMapColour: require("@/assets/images/nz-map-no-background.png"),
    mapColour: require("@/assets/images/nz-map-background.png"),
  },
};
