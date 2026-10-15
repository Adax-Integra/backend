// G-16: Prepares the list of external accounts for the app
class ExternalUserListDTO {
  constructor({ users = [], total = 0, page = 1, limit = 10 } = {}) {
    // Only the data shown in the list, the details are consulted in G-07
    this.users = users.map((user) => ({
      user_id: user.user_id,
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      created_at: user.created_at,
      is_active: user.is_active,
    }));

    this.total = total;
    this.page = page;
    this.limit = limit;
  }

  toJSON() {
    return {
      users: this.users,
      total: this.total,
      page: this.page,
      limit: this.limit,
    };
  }
}

export default ExternalUserListDTO;
