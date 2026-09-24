class RegisterExternalUserDTO {
  constructor({ user, record_id, address_id }) {
    this.user_id = user?.user_id ?? null;
    this.name = user?.name ?? null;
    this.last_name = user?.last_name ?? null;
    this.email = user?.email ?? null;
    this.birth_date = user?.birth_date ?? null;
    this.phone = user?.phone ?? null;
    this.record_id = record_id ?? null;
    this.address_id = address_id ?? null;
  }

  toJSON() {
    return {
      user_id: this.user_id,
      name: this.name,
      last_name: this.last_name,
      email: this.email,
      birth_date: this.birth_date,
      phone: this.phone,
      record_id: this.record_id,
      address_id: this.address_id,
    };
  }
}

export default RegisterExternalUserDTO;
