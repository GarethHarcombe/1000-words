
import { ImageSourcePropType } from "react-native";
import { Language } from "@/contexts/UserContext";

export type ImageKey =
  | "progressMapBw"
  | "progressMapColour";

type Catalogue = Record<Language, Record<ImageKey, ImageSourcePropType>>;

export const images: Catalogue = {
  welsh: {
    progressMapBw: require("@/assets/images/welsh-map-no-background-bw.png"),
    progressMapColour: require("@/assets/images/welsh-map-no-background.png"),
  },
  spanish: {
    progressMapBw: require("@/assets/images/spanish-map-no-background-bw.png"),
    progressMapColour: require("@/assets/images/spanish-map-no-background.png"),
  },
};
