class CountriesWithStatesDTO {
  constructor({ country_id, iso2, name_en, name_es, phone_code, states } = {}) {
    this.countryId = country_id;
    this.iso2 = iso2;
    this.nameEn = name_en;
    this.nameEs = name_es;
    this.phoneCode = phone_code;
    this.states = (states ?? []).map((state) => ({
      stateId: state.state_id,
      nameEn: state.name_en,
      nameEs: state.name_es,
      code: state.code,
    }));
  }

  toJSON() {
    return { ...this };
  }
}

export default CountriesWithStatesDTO;
