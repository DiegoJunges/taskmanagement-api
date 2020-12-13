import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcryptjs';
import { mocked } from 'ts-jest/utils';

const mockCredentialsDTO = {
  username: 'TestUsername',
  password: 'TestPassword',
};

describe('UserRepository', () => {
  let userRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRepository = await module.get<UserRepository>(UserRepository);
  });

  describe('signUp', () => {
    let save;

    beforeEach(() => {
      save = jest.fn();
      userRepository.create = jest.fn().mockReturnValue({ save });
    });

    it('should successfully signs up the user', async () => {
      save.mockResolvedValue(undefined);
      expect(userRepository.signUp(mockCredentialsDTO)).resolves.not.toThrow();
    });

    it('should throws a conflict exception as username already exists', async () => {
      save.mockRejectedValue({ code: '23505' });
      await expect(userRepository.signUp(mockCredentialsDTO)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throws a conflict exception as username already exists', async () => {
      save.mockRejectedValue({ code: '12345' }); // unhandled error code
      await expect(userRepository.signUp(mockCredentialsDTO)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('validateUserPassword', () => {
    let user;

    beforeEach(() => {
      userRepository.findOne = jest.fn();
      user = new User();
      user.username = 'TestUsername';
      user.validatePassword = jest.fn();
    });

    it('returns the username as validation is successful', async () => {
      userRepository.findOne.mockResolvedValue(user);
      user.validatePassword.mockResolvedValue(true);

      const result = await userRepository.validateUserPassword(
        mockCredentialsDTO,
      );
      expect(result).toEqual('TestUsername');
    });

    it('returns null as user cannot be found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await userRepository.validateUserPassword(
        mockCredentialsDTO,
      );
      expect(user.validatePassword).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('returns null as password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(user);
      user.validatePassword.mockResolvedValue(false);
      const result = await userRepository.validateUserPassword(
        mockCredentialsDTO,
      );
      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should call bcrypt.hash to generate a hash', async () => {
      const mockBcrypt = mocked(bcrypt, true);
      mockBcrypt.hash = jest.fn().mockResolvedValue('testHash');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      const result = await userRepository.hashPassword(
        'testPassword',
        'testSalt',
      );
      expect(mockBcrypt.hash).toHaveBeenCalledWith('testPassword', 'testSalt');
      expect(result).toEqual('testHash');
    });
  });
});
