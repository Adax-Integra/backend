class RecordListDTO {
  constructor({ records = [], total = 0, page = 1, limit = 10 } = {}) {
    // Expose only the fields needed by the listing and its navigation.
    this.records = records.map((record) => ({
      record_id: record.record_id,
      user_id: record.user_id,
      name: record.name,
      record_number: record.record_number,
      status: record.status,
      active_cases_count: record.active_cases_count,
      updated_at: record.updated_at,
    }));

    // Preserve the filtered total and the page returned by the model.
    this.total = total;
    this.page = page;
    this.limit = limit;
  }

  toJSON() {
    return {
      records: this.records,
      total: this.total,
      page: this.page,
      limit: this.limit,
    };
  }
}

export default RecordListDTO;
