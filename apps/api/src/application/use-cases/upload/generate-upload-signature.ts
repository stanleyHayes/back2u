import { inject, injectable } from 'inversify';

import { ValidationError } from '../../../domain/shared/errors.js';
import type { IImageStorage, UploadSignature } from '../../ports/services.js';
import { TOKENS } from '../../ports/tokens.js';

const FOLDER_PATTERN = /^[a-z0-9][a-z0-9/_-]{0,63}$/i;

@injectable()
export class GenerateUploadSignatureUseCase {
  constructor(@inject(TOKENS.ImageStorage) private readonly storage: IImageStorage) {}

  async execute(folder: string): Promise<UploadSignature> {
    const safe = (folder || 'items').trim();
    if (!FOLDER_PATTERN.test(safe)) throw new ValidationError('Invalid upload folder');
    return this.storage.signUpload(safe);
  }
}
