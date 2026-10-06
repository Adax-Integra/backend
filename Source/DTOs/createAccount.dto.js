// prepares the created account information to send back to the app
class CreateAccountDTO {
  constructor(user) {
    // takes the user data retured by the database
    this.userId = user.user_id;
    this.name = user.name;
    this.lastName = user.last_name;
    this.email = user.email;
    this.phone = user.phone;
  }

  // returns only the account information needed by the app
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
