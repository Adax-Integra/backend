class CountriesWithStatesDTO {
  constructor({ country_id, iso2, name_en, name_es, phone_code, states } = {}) {
    this.country_id = country_id;
    this.iso2 = iso2;
    this.name_en = name_en;
    this.name_es = name_es;
    this.phone_code = phone_code;
    this.states = (states ?? []).map((state) => ({
      state_id: state.state_id,
      name_en: state.name_en,
      name_es: state.name_es,
      code: state.code,
    }));
  }

  toJSON() {
    return { ...this };
  }
}

export default CountriesWithStatesDTO;
