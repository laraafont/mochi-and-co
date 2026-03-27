// constants/PetAssets.ts
import type { ImageSourcePropType } from "react-native";

import { supabase } from "@/lib/supabase";

const fallbackPetImage = require("@/assets/images/cocomascot.png");
const PET_PHOTOS_BUCKET = "pet-photos";

type PetImageLike = {
  image_url?: string | null;
};

function isRemoteUrl(value: string) {
  return /^(https?:|data:|blob:)/i.test(value);
}

function normalizeStoragePath(value: string) {
  return value
    .trim()
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${PET_PHOTOS_BUCKET}\/`), "");
}

export function getPetImageSource(
  pet?: PetImageLike | null,
): ImageSourcePropType {
  const imageUrl = pet?.image_url?.trim();

  if (!imageUrl) {
    return fallbackPetImage;
  }

  if (isRemoteUrl(imageUrl)) {
    return { uri: imageUrl };
  }

  const { data } = supabase.storage
    .from(PET_PHOTOS_BUCKET)
    .getPublicUrl(normalizeStoragePath(imageUrl));

  return data.publicUrl ? { uri: data.publicUrl } : fallbackPetImage;
}

export const getPetImage = getPetImageSource;
