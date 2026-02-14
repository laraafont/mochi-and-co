import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

// react functional component
// export default means this component is the main thing this file provides
// expo router automatically uses this as the screen for this route
export default function HomeScreen() {
  // useState is a react hook
  // it lets us store state (data that changes)
  // pets = the current value of our state
  // setPets = function used to update pets
  // this state will hold an array ([])
  // each item can be "any" type
  // it starts as an empty array
  const [pets, setPets] = useState<any[]>([]);

  // useEffect is another react hook
  // it runs code when the component loads
  // the empty array at the end means -> runs this only once when the screen first appears
  useEffect(() => {
    fetchPets();
  }, []);

  // async function -> means it allows us to use "await"
  // await pauses execution until the database finishes responding
  async function fetchPets() {
    // supabase.from('pets') -> look at the table named "pets"
    // .select('*') -> select all columns
    // result returns data (the rows from db), error (any error that occurred)
    const { data, error } = await supabase.from("pets").select("*");

    // if there is an error, log it to the console
    if (error) {
      console.log("Error fetching pets:", error);
    } else {
      // if there is no error:
      // setPets updates the state with the returned data
      // if data is null, we default to empty array []
      setPets(data || []);
    }
  }

  // the return statement defines what appears on the screen
  return (
    // view is like a container box
    // apply 40 units of spacing inside the box
    <View style={{ padding: 40 }}>
      {/*pets.map(...) means -> for each pet in the pets array, render something */}
      {pets.map((pet) => (
        // text displays the pet's name
        // key={pet.id} is very important in react
        // every item in a list needs a unique key
        // we use the pet's database id
        <Text key={pet.id}>{pet.name}</Text>
      ))}
    </View>
  );
}
