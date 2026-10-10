// G-06: Prepares collaborator data for the app
class CollaboratorListDTO {
  constructor(user) {
    this.user_id = user.user_id;
    this.name = user.name;
    this.last_name = user.last_name;
    this.email = user.email;

    // Gets the user's first role
    this.role = user.user_role[0].role.description;

    // The account is active if it has not been deleted
    this.is_active = user.deleted_at === null;
  }

  toJSON() {
    // Returns the data for the app
    return {
      user_id: this.user_id,
      name: this.name,
      last_name: this.last_name,
      email: this.email,
      role: this.role,
      is_active: this.is_active,
    };
  }
}

export default CollaboratorListDTO;
