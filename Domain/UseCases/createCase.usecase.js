import UserIdValidator from '../../Data/Validators/userId.validator.js';
import CreateCaseValidator from '../../Data/Validators/createCase.validator.js';
import RecordModel from '../../Data/Models/record.model.js';
import HelpTypesModel from '../../Data/Models/helpTypes.model.js';
import CaseModel from '../../Data/Models/case.model.js';

//"case".state and "case_steps".status are NOT NULL and have no CHECK
// constraint or default in the schema, so the application picks the literals
//Pending confirmation of the catalogue used by the internal collaborators
const INITIAL_CASE_STATE = 'NUEVO';
const INITIAL_STEP_STATUS = 'PENDIENTE';

//Reached only after the user confirms her data in R-01, wich means the
// expediente ("record") is expected to exist by the time this runs
class CreateCaseUseCase{
    async execute(userId, body){
        const validUserId = UserIdValidator.validateUserId(userId);
        const {writtenDescription, helpTypeId, hasExternalSupport}=
            CreateCaseValidator.validateCreateBody(body);

        const [record, helpType] = await Promise.all([
            RecordModel.findActiveByUserId(validUserId),
            HelpTypesModel.findActiveById(helpTypeId),
        ]);

        const created = await CaseModel.create({
            recordId: record.record_id,
            writtenDescription,
            writtenHelpsWanted: helpType.description,
            hasLawyer: hasExternalSupport,
            helpId: helpType.help_id,
            state: INITIAL_CASE_STATE,
            stepStatus: INITIAL_STEP_STATUS,
        });

        return{
            ...created,
            written_description: writtenDescription,
            written_helps_wanted: helpType.description,
            has_lawyer: hasExternalSupport,
            helps:[helpType.description],
        };

    }
}

export default CreateCaseUseCase;