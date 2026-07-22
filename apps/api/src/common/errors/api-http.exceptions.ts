import { UnauthorizedException } from '@nestjs/common';
import { API_ERROR_CODES, type ApiErrorCode } from '@saas-template/validation';

export interface CodedApiException {
  readonly errorCode: ApiErrorCode;
}

export class InvalidCredentialsException
  extends UnauthorizedException
  implements CodedApiException
{
  readonly errorCode = API_ERROR_CODES.INVALID_CREDENTIALS;

  constructor() {
    super('Email or password is invalid.');
  }
}
