import RecordModel from '../../Data/Models/record.model.js';

const ALLOWED_TRANSITIONS = {
  SIN_EMPEZAR: ['EN_REVISION'],
  EN_REVISION: ['EN_SEGUIMIENTO'],
  EN_SEGUIMIENTO: ['COMPLETADO', 'EN_REVISION'],
  COMPLETADO: [],
};

class UpdateRecordStatusUseCase {
  async execute({ recordId, newStatus }) {
    const record = await RecordModel.findStatusById(recordId);
    const currentStatus = record.status;

    if (currentStatus === newStatus) {
      const error = new Error('The record is already in the status.');
      error.status = 409;
      throw error;
    }

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      const error = new Error(
        `Cannot change status from ${currentStatus} to ${newStatus}.`
      );
      error.status = 409;
      throw error;
    }

    return RecordModel.updateStatus(recordId, newStatus);
  }
}

export default UpdateRecordStatusUseCase;
