import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@stitchflow.app' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Demo@1234' })
  @IsString()
  @MinLength(1)
  password: string;
}
