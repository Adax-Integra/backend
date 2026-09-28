class CreateAccountDTO {
  constructor(user) {
    this.userId = user.user_id;
    this.name = user.name;
    this.lastName = user.last_name;
    this.email = user.email;
    this.phone = user.phone;
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
