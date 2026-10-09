class ExternalProfileDTO {
  constructor({ profile, address }) {
    this.user_id = profile?.user_id ?? null;
    this.profile = profile
      ? {
          name: profile.name,
          last_name: profile.last_name,
          email: profile.email,
          birth_date: profile.birth_date,
          phone: profile.phone,
        }
      : null;
    this.address = address
      ? {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          neighborhood: address.neighborhood,
          zip_code: address.zip_code,
          country: address.country,
          state: address.state,
          city: address.city,
        }
      : null;
  }

  toJSON() {
    return {
      user_id: this.user_id,
      profile: this.profile,
      address: this.address,
    };
  }
}

export default ExternalProfileDTO;
