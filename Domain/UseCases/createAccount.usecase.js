// Created by Lakshmi Jara on 23/09/26.
// G-01

import bcrypt from 'bcrypt';

import CreateAccountValidator from '../../Data/Validators/createAccount.validator';
import CreateAccountModel from '../../Data/Models/createAccount.model';
import RoleModel from '.../../Data/Models/role.model.js';

const EXTERNAL_ROLE = 'external';
const BCRYPT_SALT_ROUNDS = 10;

class CreateAccountUseCase {
  async execute(body) {
    // validate the information received from the registration form
    const account = CreateAccountValidator.validateBody(body);

    const existingAccount = await CreateAccountModel.findByEmail(account.email);

    if (existingAccount) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    // the role is assigned by the backend and cannot be selected by the user
    const roleId = await RoleModel.findIdByDescription(EXTERNAL_ROLE);

    // store only the encrypted version of the password
    const hashedPassword = await bcrypt.hash(
      account.password,
      BCRYPT_SALT_ROUNDS
    );

    return CreateAccountModel.create({
      name: account.name,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      hashedPassword,
      roleId,
    });
  }
}

export default CreateAccountUseCase;
