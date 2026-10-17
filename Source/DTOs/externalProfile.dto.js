class ExternalProfileDTO {
  constructor({ profile, address }) {
    this.user_id = profile?.user_id ?? null;
    this.verification_status = profile?.verification_status ?? null;
    this.profile = profile
      ? {
          name: profile.name,
          last_name: profile.last_name,
          email: profile.email,
          birth_date: profile.birth_date,
          phone: profile.phone,
        }
      : null;
    // G-07: the address only keeps the country, the state and the municipality
    this.address = address
      ? {
          country: address.country,
          state: address.state,
          municipality: address.municipality,
        }
      : null;
  }

  toJSON() {
    return {
      user_id: this.user_id,
      verification_status: this.verification_status,
      profile: this.profile,
      address: this.address,
    };
  }
}

export default ExternalProfileDTO;
