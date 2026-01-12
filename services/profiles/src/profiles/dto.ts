import { IsOptional, IsString } from 'class-validator';

export class UpdatePatientProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() emergencyContact?: string;
}
