import type {
  PlatformJobName,
  PlatformJobPayload,
} from '../queues/catalogue.js';

export type PlatformEvent = {
  [TName in PlatformJobName]: {
    readonly type: TName;
    readonly payload: PlatformJobPayload[TName];
  };
}[PlatformJobName];
