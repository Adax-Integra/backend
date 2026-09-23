//One option of the "¿Qué ayuda esperas recibir?" dropdown
//helpId is what the app sends back when creating the case
class HelpTypeDTO {
  constructor({ help_id, description }) {
    this.helpId = help_id ?? null;
    this.description = description ?? null;
  }

  toJSON() {
    return {
      helpId: this.helpId,
      description: this.description,
    };
  }

  //Maps an array of database rows to an array of serialized JSON objects
  static fromRows(rows = []) {
    return rows.map((row) => new HelpTypeDTO(row).toJSON());
  }
}

export default HelpTypeDTO;
