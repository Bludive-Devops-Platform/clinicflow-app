import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { NotesService } from './notes.service';
import { RequireRoles } from '../auth/require-roles';
import { AddVisitNoteDto } from './dto';

@Controller('visit-notes')
export class NotesController {
  constructor(private notes: NotesService) {}

  @RequireRoles('STAFF')
  @Post()
  add(@Req() req: any, @Body() dto: AddVisitNoteDto) {
    return this.notes.addVisitNote(req.user.id, dto.appointmentId, dto.note);
  }

  @RequireRoles('STAFF', 'ADMIN')
  @Get()
  list(@Query('appointmentId') appointmentId: string) {
    return this.notes.notesForAppointment(appointmentId);
  }
}
