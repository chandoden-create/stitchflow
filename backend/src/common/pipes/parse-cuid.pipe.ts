import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Validates that the incoming param looks like a valid CUID string.
 * CUIDs start with 'c' and are ~25 characters.
 */
@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  private readonly CUID_REGEX = /^c[a-z0-9]{24,}$/;

  transform(value: string): string {
    if (!this.CUID_REGEX.test(value)) {
      throw new BadRequestException(`'${value}' is not a valid ID`);
    }
    return value;
  }
}
