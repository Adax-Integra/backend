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

  // Strips out sensitive data when returning JSON respones
  // The underscore prefix satisfies the linter rule for unused vars
  toSaveObject() {
    const { password: _, ...safeData } = this;
    return safeData;
  }
}

export default UserModel;
