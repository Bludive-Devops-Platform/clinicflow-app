import { IsString } from 'class-validator';

export class AddVisitNoteDto {
  @IsString()
  appointmentId: string;

  @IsString()
  note: string;
}
