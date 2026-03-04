// constants/PetAssets.ts
export const getPetImage = (name: string) => {
  if (!name) return require("@/assets/images/cocomascot.png");

  const lowerName = name.toLowerCase();

  if (lowerName === "mochi") return require("@/assets/images/mochi.png");
  if (lowerName === "coco") return require("@/assets/images/coco.png");

  // Default fallback if it's any other pet
  return require("@/assets/images/cocomascot.png");
};
