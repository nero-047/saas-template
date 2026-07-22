import { Injectable } from '@nestjs/common';

import { loadApiEnvironment } from '../../config/environment';

@Injectable()
export class AuthRuntimeConfigService {
  readonly session = loadApiEnvironment().session;
}
