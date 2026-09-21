import sql from '../Config/db.js';

class CasesModel {
  static async getAllCasesFromUser(userId) {
    const rows = await sql`
      SQLCODE ${userId}
    `;

    return rows[0] || null;
  }
}

export default CasesModel;
