// G-06: Prepares collaborator data for the app
class CollaboratorListDTO {
  constructor(user) {
    this.user_id = user.user_id;

    // Joins first and last name
    this.name = `${user.name ?? ''} ${user.last_name ?? ''}`.trim();

    // Gets the user's first role
    this.role = user.user_role[0].role.description;

    // // Checks if the account is active
    this.is_active = user.deleted_at === null;
  }

  toJSON() {
    // Returns the data for the app
    return {
      user_id: this.user_id,
      name: this.name,
      role: this.role,
      is_active: this.is_active,
    };
  }
}

export default CollaboratorListDTO;
