import ActivityLogModel from '../../Data/Models/activityLog.model.js';

// V-06: saves an action in the activity log.
// If the log fails, the main action is not undone, the error only goes to the server logs
class LogActivityUseCase {
  async execute({ actorId, action, entity, entityId, details = null }) {
    try {
      await ActivityLogModel.create({
        actorId,
        action,
        entity,
        entityId,
        details,
      });
    } catch (error) {
      console.error('Failed to write activity log: ', error);
    }
  }
}

export default LogActivityUseCase;
