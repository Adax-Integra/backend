import { supabase } from '../../Data/Config/supabase.js';
import UserModel from '../../Data/Models/user.model.js';

class EditPreSubmissionDataUseCase {
  async execute(userId, updateData) {
    const { data, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('userID', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const userModel = new UserModel(data);

    return userModel.toSaveObject();
  }
}

export default EditPreSubmissionDataUseCase;
