import sql from '../Config/db.js';

class RegisterExternalUserModel {
  static async findByEmail(email) {
    const [existing] = await sql`
            SELECT user_id
            FROM "user"
            WHERE email = ${email}
                AND deleted_at IS NULL
            LIMIT 1
        `;

    return existing ?? null;
  }

  static async create({ profile, address, roleId, hashedPassword }) {
    return sql.begin(async (tx) => {
      const [user] = await tx`
                INSERT INTO "user" (name, last_name, email, password, birth_date, phone)
                VALUES (
                    ${profile.name},
                    ${profile.last_name},
                    ${profile.email},
                    ${hashedPassword},
                    ${profile.birth_date ?? null},
                    ${profile.phone ?? null}
                )
                RETURNING user_id, name, last_name, email, birth_date::text AS birth_date, phone
            `;

      await tx`
                INSERT INTO user_role (user_id, role_id)
                VALUES (${user.user_id}, ${roleId})
            `;

      const [record] = await tx`
                INSERT INTO record (user_id)
                VALUES (${user.user_id})
                RETURNING record_id
            `;

      const [createdAddress] = await tx`
                INSERT INTO address (
                    user_id, address_line_1, address_line_2, neighborhood,
                    zip_code, country, state, city
                )
                VALUES (
                    ${user.user_id},
                    ${address.address_line_1},
                    ${address.address_line_2 ?? null},
                    ${address.neighborhood},
                    ${address.zip_code},
                    ${address.country},
                    ${address.state},
                    ${address.city}
                )
                RETURNING address_id
            `;

      return {
        user,
        record_id: record.record_id,
        address_id: createdAddress.address_id,
      };
    });
  }
}

export default RegisterExternalUserModel;
