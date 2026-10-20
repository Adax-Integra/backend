/* 
R-04: keeps only the profile fields the app shows after an update,
so columns like the password hash never leave the server
*/
class UpdateProfileDTO {
  constructor({ profile, address }) {
    this.user_id = profile.user_id;
    this.name = profile.name;
    this.last_name = profile.last_name;
    this.email = profile.email;
    this.birth_date = profile.birth_date;
    this.phone = profile.phone;
    // Only external users have an address
    if (address !== undefined) {
      this.address = address
        ? {
            country: address.country,
            state: address.state,
            municipality: address.municipality,
          }
        : null;
    }
  }

  toJSON() {
    const json = {
      user_id: this.user_id,
      name: this.name,
      last_name: this.last_name,
      email: this.email,
      birth_date: this.birth_date,
      phone: this.phone,
    };
    if (this.address !== undefined) {
      json.address = this.address;
    }
    return json;
  }
}

export default UpdateProfileDTO;
