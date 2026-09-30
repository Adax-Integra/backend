// G-03: Collaborator data returned to the app
class CreateCollaboratorDTO {
  constructor({ user, role }) {
    this.user_id = user?.user_id ?? null;
    this.name = user?.name ?? null;
    this.last_name = user?.last_name ?? null;
    this.email = user?.email ?? null;
    this.phone = user?.phone ?? null;
    this.role = role ?? null;
  }

  toJSON() {
    return {
      user_id: this.user_id,
      name: this.name,
      last_name: this.last_name,
      email: this.email,
      phone: this.phone,
      role: this.role,
    };
  }
}

export default CreateCollaboratorDTO;
