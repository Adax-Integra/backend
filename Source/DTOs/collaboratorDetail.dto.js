// DTO for US g-10 getCollaboratorDetail
class CollaboratorDetailDTO {
  constructor(user) {
    this.user_id = user.user_id;
    this.name = user.name;
    this.last_name = user.last_name;

    // Full name shown in the profile header
    this.full_name = `${user.name} ${user.last_name}`;

    // Initials shown in the avatar first letter of name and last name (for the front end
    // I saw a teammate has done an atom to achieve this sso maybe Ill use that instead of this
    //  but for now I will keep it here)

    this.initials = `${user.name[0]}${user.last_name[0]}`.toUpperCase();

    this.email = user.email;
    this.phone = user.phone;

    // Gets the user  role
    this.role = user.user_role[0].role.description;

    // The office can be missing if it was never assigned
    this.office = user.office?.location ?? null;

    // Keeps only the date part (YYYY-MM-DD) of the creation timestamp
    this.joined_at = user.created_at.split('T')[0];

    // The account is active if it has not been deleted
    this.is_active = user.deleted_at === null;
  }

  toJSON() {
    // Returns the data for the app
    return {
      user_id: this.user_id,
      name: this.name,
      last_name: this.last_name,
      full_name: this.full_name,
      initials: this.initials,
      email: this.email,
      phone: this.phone,
      role: this.role,
      office: this.office,
      joined_at: this.joined_at,
      is_active: this.is_active,
    };
  }
}
export default CollaboratorDetailDTO;
