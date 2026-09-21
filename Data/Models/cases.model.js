import sql from '../Config/db.js';

class CasesModel {
  /**
   * Fetches all active cases from a user ID
   * Expects a clean userId
   * Returns an object array
   */
  static async getAllCasesFromUser(userId) {
    const rows = await sql`
      SELECT 
        c.case_id,
        c.written_description,
        c.written_helps_wanted,
        c.has_lawyer,
        c.state,
        c.created_at,
        c.updated_at,
        h.helpDescription,
        v.violenceDescription
      FROM public."case" c
      LEFT JOIN (
        SELECT 
          ch.case_id,
          string_agg(DISTINCT ht.description, ', ') AS helpDescription
        FROM public.case_help ch
        JOIN public.help_types ht ON ch.help_id = ht.help_id
        WHERE ch.deleted_at IS NULL AND ht.deleted_at IS NULL
        GROUP BY ch.case_id
      ) h ON c.case_id = h.case_id
      LEFT JOIN (
        SELECT 
          cv.case_id,
          string_agg(DISTINCT vt.description, ', ') AS violenceDescription
        FROM public.case_violence cv
        JOIN public.violence_types vt ON cv.violence_id = vt.violence_id
        WHERE cv.deleted_at IS NULL AND vt.deleted_at IS NULL
        GROUP BY cv.case_id
      ) v ON c.case_id = v.case_id
      WHERE c.deleted_at IS NULL
        AND c.user_id = ${userId}
      ORDER BY c.created_at DESC;
    `;

    return rows;
  }
}

export default CasesModel;
