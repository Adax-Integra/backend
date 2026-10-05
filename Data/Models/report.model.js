import { supabase } from '../Config/supabase.js';

class ReportsModel {
  static async getInformationForReport(startDate, endDate) {
    console.log(startDate);
    console.log(endDate);
    console.log(supabase.channel);
    const data = 'a';
    //only to be able to commit the work
    return data;
  }
}

export default ReportsModel;
