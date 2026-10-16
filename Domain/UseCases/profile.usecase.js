import ProfileModel from '../../Data/Models/profile.model.js';
import AddressModel from '../../Data/Models/address.model.js';

// R-04: admin and internal users have no address
function hasAddress(roles = []) {
  return (
    roles.includes('external') &&
    !roles.includes('admin') &&
    !roles.includes('internal')
  );
}

// Handles profile info retrieval from controller (g-13)
class ProfileUseCase {
  async execute(userId, roles) {
    const profile = await ProfileModel.getProfileByUserId(userId);
    if (!hasAddress(roles)) {
      return { profile };
    }

    const address = await AddressModel.findByUserId(userId);
    return { profile, address };
  }
}

export default ProfileUseCase;
