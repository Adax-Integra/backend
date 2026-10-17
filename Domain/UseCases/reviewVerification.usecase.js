import UserIdValidator from '../../Data/Validators/userId.validator.js';
import ReviewVerificationValidator from '../../Data/Validators/reviewVerification.validator.js';
import RoleModel from '../../Data/Models/role.model.js';
import UserModel from '../../Data/Models/user.model.js';
import MailerService from '../../Data/Services/mailer.service.js';

const EXTERNAL_ROLE = 'external';
const REVIEWABLE_STATUS = 'EN_REVISION';

function requestError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// B-02: an internal user or admin approves or rejects the identity verification
class ReviewVerificationUseCase {
  async execute(actorId, userId, body) {
    const validUserId = UserIdValidator.validateUserId(userId);
    const { status, reason } = ReviewVerificationValidator.validateBody(body);

    // Only external accounts have an identity verification to review
    const roles = await RoleModel.findRolesByUserId(validUserId);
    if (!roles.includes(EXTERNAL_ROLE)) {
      throw requestError('External user not found', 404);
    }

    const current = await UserModel.getVerificationStatus(validUserId);
    if (!current) {
      throw requestError('External user not found', 404);
    }

    // Only an account that is under review can be approved or rejected
    if (current.verification_status !== REVIEWABLE_STATUS) {
      throw requestError('The account is not under review', 409);
    }

    const updated = await UserModel.updateVerificationStatusWithLog({
      userId: validUserId,
      actorId,
      status,
      reason,
    });

    // Best effort: a failed email should not undo the decision
    try {
      if (status === 'VERIFICADO') {
        await MailerService.sendAccountVerifiedNotice(current.email);
      } else {
        await MailerService.sendVerificationRejectedNotice(
          current.email,
          reason
        );
      }
    } catch (error) {
      console.error('[review-verification] Failed to send notice:', error);
    }

    return updated;
  }
}

export default ReviewVerificationUseCase;
