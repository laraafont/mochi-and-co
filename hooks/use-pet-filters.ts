import { useMemo, useState } from "react";

// a "custom hook" is jsut a function that starts with 'use'
// allows us to reuse logic across different screens
export function usePetFilters(allPets: any[]) {
  // 'useState' creates a variable (filters) and a function to update it (setFilters)
  // initialize all with 'null' because no filters are selected yet
  const [filters, setFilters] = useState({
    type: null, // dog or cat
    gender: null, // male or female
    breed: null, // string
    neutered_spayed: null,
    hypoallergenic: null,
  });

  // 'useMemo' is for performance
  // makes sure only re-calculate this if 'filters' or 'allPets' changes
  const filteredPets = useMemo(() => {
    // 'filter' is a built-in JS function used to create a new array with return results
    // we'll be testing every single pet against rules
    return allPets.filter((pet) => {
      return (
        // 1. if filters.type is null -> let it through
        // if not null, the pet's type must match the filter
        (!filters.type ||
          String(pet.species ?? "").toLowerCase() ===
            String(filters.type).toLowerCase()) &&
        // same for gender
        (!filters.gender || pet.gender === filters.gender) &&
        // same for breed
        (!filters.breed || pet.breed === filters.breed) &&
        // for booleans, check if the filter is null
        // if the user hasn't picked a boolean filter, let the pet go through
        (filters.neutered_spayed === null
          ? true
          : pet.neutered_spayed === filters.neutered_spayed) &&
        (filters.hypoallergenic === null
          ? true
          : pet.hypoallergenic === filters.hypoallergenic)
      );
    });
  }, [filters, allPets]); // re-run the memo when these arrays get changed

  // return these to be used in browse
  return { filters, setFilters, filteredPets };
}
