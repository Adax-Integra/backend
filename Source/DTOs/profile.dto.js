/* 
G-13 / R-04: profile returned by GET /profile/:userId, with the same fields
PATCH can edit, so columns like the password hash never leave the server
*/
class ProfileDTO {
  constructor({ profile, address }) {
    this.user_id = profile.user_id;
    this.name = profile.name;
    this.last_name = profile.last_name;
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
      phone: this.phone,
    };
    if (this.address !== undefined) {
      json.address = this.address;
    }
    return json;
  }
}

export default ProfileDTO;
