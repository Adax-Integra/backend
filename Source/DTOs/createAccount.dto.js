// Created by Lakshmi Jara on 23/09/26.
// G-01

class CreateAccountDTO {
  constructor(data) {
    this.userId = data.user_id;
    this.name = data.name;
    this.lastName = data.last_name;
    this.email = data.email;
    this.phone = data.phone;
  }

  // return only the account information needed by the app
  toJSON() {
    return {
      userId: this.userId,
      name: this.name,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
    };
  }
}

export default CreateAccountDTO;
