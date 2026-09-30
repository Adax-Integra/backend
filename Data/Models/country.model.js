import { supabase } from '../Config/supabase.js';

class CountryModel {
  // Get all countries with their respective states
  static async getAllCountriesWithStates() {
    const { data, error } = await supabase
      .from('countries')
      .select(
        `
        country_id,
        iso2,
        name_en,
        name_es,
        phone_code,
        states (
          state_id,
          name_en,
          name_es,
          code
        )
        `
      )
      .eq('is_active', true)
      .eq('states.is_active', true)
      // Sort the "countries" table by alphabetical order
      .order('name_es')
      // Sort the nested "states" table by alpahebetical order
      .order('name_es', { referencedTable: 'states' });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export default CountryModel;
