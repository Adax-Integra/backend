import { supabase } from '../../Data/Config/supabase.js';
import UserModel from '../../Data/Models/user.model.js';

class CheckPreSubmissionDataUseCase {
  async execute(userId) {
    const { data, error } = await supabase
      .from('User')
      .select(
        `
        userID, name, email, birthDate, phone,
        Address (country, state, city),
        UserDocuments (ine, proofOfAddress)
      `
      )
      .eq('userID', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new UserModel(data).toSaveObject();
  }
}

export default CheckPreSubmissionDataUseCase;
