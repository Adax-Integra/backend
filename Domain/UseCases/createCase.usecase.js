import UserIdValidator from '../../Data/Validators/userId.validator.js';
import CreateCaseValidator from '../../Data/Validators/createCase.validator.js';
import RecordModel from '../../Data/Models/record.model.js';
import CaseModel from '../../Data/Models/case.model.js';

//"case".state and "case_steps".status are NOT NULL and have no CHECK
// constraint or default in the schema, so the application picks the literals
//Pending confirmation of the catalogue used by the internal collaborators
const INITIAL_CASE_STATE = 'NUEVO';
const INITIAL_STEP_STATUS = 'PENDIENTE';
const MAX_ACTIVE_CASES = 3;

//Reached only after the user confirms her data in R-01, which means the
// expediente ("record") is expected to exist by the time this runs
class CreateCaseUseCase {
  async execute(userId, body) {
    const validUserId = UserIdValidator.validateUserId(userId);
    const { writtenDescription, writtenHelpsWanted, hasExternalSupport } =
      CreateCaseValidator.validateCreateBody(body);

    const record = await RecordModel.findActiveByUserId(validUserId);

    //Up to MAX_ACTIVE_CASES open cases per record. Rejecting past the cap
    // stops a user or an automated script from flooding the table with cases
    const activeCases = await CaseModel.countActiveByRecordId(record.record_id);
    if (activeCases >= MAX_ACTIVE_CASES) {
      const error = new Error(
        `This record already has ${MAX_ACTIVE_CASES} active cases.`
      );
      error.status = 409;
      throw error;
    }

    const created = await CaseModel.create({
      recordId: record.record_id,
      writtenDescription,
      writtenHelpsWanted,
      hasLawyer: hasExternalSupport,
      state: INITIAL_CASE_STATE,
      stepStatus: INITIAL_STEP_STATUS,
    });

    return {
      ...created,
      written_description: writtenDescription,
      written_helps_wanted: writtenHelpsWanted,
      has_lawyer: hasExternalSupport,
    };
  }
}

export default CreateCaseUseCase;
