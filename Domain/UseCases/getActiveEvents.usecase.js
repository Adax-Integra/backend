import EventModel from '../../Data/Models/event.model.js';

// Usecase that stablishes the UTC offset for Mexico City, which is used to determine the start of the next month in Mexico time

const MEXICO_UTC_OFFSET_HOURS = 6;

const startOfNextMonthUtc = (now = new Date()) => {
  const mexicoNow = new Date(
    now.getTime() - MEXICO_UTC_OFFSET_HOURS * 60 * 60 * 1000
  );

  return new Date(
    Date.UTC(
      mexicoNow.getUTCFullYear(),
      mexicoNow.getUTCMonth() + 1,
      1,
      MEXICO_UTC_OFFSET_HOURS
    )
  ).toISOString();
};

class GetActiveEventsUseCase {
  static async execute({ scope = 'all' } = {}) {
    if (scope === 'month') {
      return EventModel.findActive({ startsBefore: startOfNextMonthUtc() });
    }

    return EventModel.findActive();
  }
}

export default GetActiveEventsUseCase;
