import ActivityLogQueryValidator from '../../Data/Validators/activityLogQuery.validator.js';
import ActivityLogModel from '../../Data/Models/activityLog.model.js';

// V-06: the admin consults the activity log, newest entries first
class ListActivityLogUseCase {
  async execute(query) {
    const filters = ActivityLogQueryValidator.validateQuery(query);
    return ActivityLogModel.findAll(filters);
  }
}

export default ListActivityLogUseCase;
