class AssignableCollaboratorsDTO {
  static collaboratorFromRow(row = {}) {
    return {
      userId: row?.user_id ?? null,
      name: row?.name ?? null,
      lastName: row?.last_name ?? null,
    };
  }

  static fromRows(rows = []) {
    return (rows || []).map((row) =>
      AssignableCollaboratorsDTO.collaboratorFromRow(row)
    );
  }
}

export default AssignableCollaboratorsDTO;
