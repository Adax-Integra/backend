// G-04 - Collaborator status DTO
class CollaboratorStatusDTO {
  constructor(user) {
    this.user_id = user.user_id;

    // If deleted_at is empty, the account is active
    if (user.deleted_at === null) {
      this.is_active = true;
    } else {
      this.is_active = false;
    }
  }

  toJSON() {
    return {
      user_id: this.user_id,
      is_active: this.is_active,
    };
  }
}

export default CollaboratorStatusDTO;
