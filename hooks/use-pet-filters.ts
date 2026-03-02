import { useMemo, useState } from "react";

// 1. define the filters
export interface FilterState {
  type: string | null;
  gender: string | null;
  breed: string | null;
  age_range: string | null;
  neutered_spayed: boolean | null;
  hypoallergenic: boolean | null;
  compatible_with: "dogs" | "cats" | "kids" | null;
}

export function usePetFilters(allPets: any[]) {
  // 2. initialize state as all null
  const [filters, setFilters] = useState<FilterState>({
    type: null,
    gender: null,
    breed: null,
    age_range: null,
    neutered_spayed: null,
    hypoallergenic: null,
    compatible_with: null,
  });

  // 3. this is where the filtering happens!
  const filteredPets = useMemo(() => {
    return allPets.filter((pet) => {
      // A. match species (Cat vs cat is being passed as the same for sake of db as it is right now)
      const matchType =
        !filters.type ||
        pet.species?.toLowerCase() === (filters.type as string).toLowerCase();

      // B. match gender
      const matchGender =
        !filters.gender ||
        pet.gender?.toLowerCase() === (filters.gender as string).toLowerCase();

      // C. match breed
      const matchBreed = !filters.breed || pet.breed === filters.breed;

      // D. map Age Range (String) to age_years (Number from DB)
      let matchAge = true;
      if (filters.age_range) {
        const age = pet.age_years || 0;
        if (filters.age_range === "baby") matchAge = age <= 1;
        else if (filters.age_range === "young") matchAge = age > 1 && age <= 3;
        else if (filters.age_range === "adult") matchAge = age > 3 && age <= 8;
        else if (filters.age_range === "senior") matchAge = age > 8;
      }

      // E. match Booleans (Check specifically for null vs false)
      const matchNeutered =
        filters.neutered_spayed === null
          ? true
          : pet.neutered_spayed === filters.neutered_spayed;

      const matchHypo =
        filters.hypoallergenic === null
          ? true
          : pet.hypoallergenic === filters.hypoallergenic;

      // F. match compatibility
      let matchCompatible = true;
      if (filters.compatible_with === "dogs") {
        matchCompatible = pet.compatible_with_dogs === true;
      } else if (filters.compatible_with === "cats") {
        matchCompatible = pet.compatible_with_cats === true;
      } else if (filters.compatible_with === "kids") {
        matchCompatible = pet.compatible_with_kids === true;
      }

      // only return true if the pet passes every test
      return (
        matchType &&
        matchGender &&
        matchBreed &&
        matchAge &&
        matchNeutered &&
        matchHypo &&
        matchCompatible
      );
    });
  }, [filters, allPets]);

  return { filters, setFilters, filteredPets };
}
