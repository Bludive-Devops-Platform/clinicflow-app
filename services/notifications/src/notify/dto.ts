import { IsEmail, IsOptional, IsString } from 'class-validator';

export class BookingConfirmationDto {
  @IsEmail() recipient: string;
  @IsString() patientName: string;
  @IsString() serviceName: string;
  @IsString() startAt: string; // ISO string
  @IsOptional() @IsString() clinicName?: string;
}

export class ReminderDto {
  @IsEmail() recipient: string;
  @IsString() patientName: string;
  @IsString() serviceName: string;
  @IsString() startAt: string;
  @IsOptional() @IsString() clinicName?: string;
}
