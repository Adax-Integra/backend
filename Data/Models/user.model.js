class UserModel {
  constructor(userData) {
    this.userId = userData.userID;
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password;
    this.officeId = userData.officeID;
    this.birthDate = userData.birthDate;
    this.phone = userData.phone;
    this.createdAt = userData.createdAt;
    this.address = userData.Address || null;
    this.documents = userData.UserDocuments || null;
  }
}

export default UserModel;
