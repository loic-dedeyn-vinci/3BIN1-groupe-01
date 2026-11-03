import type { Db } from "../db/database.ts";
import type { ApplicationDbo, ApplicationStatus } from "../models/application.ts";

interface ApplicationKey {
  id: number;
  studentId: number;
}

interface NewApplication {
  offerId: number;
  studentId: number;
  message: string | null;
}

interface OfferStatusRow {
  status: string;
}

export const createApplicationsRepository = (db: Db) => {
  const findAllByStudent = db.prepare<{ studentId: number }, ApplicationDbo>(`
    SELECT a.id, a.offer_id, o.title AS offer_title, c.short_name AS company_short_name,
           a.student_id, a.message, a.status, a.applied_at
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    WHERE a.student_id = @studentId
    ORDER BY a.applied_at DESC, a.id DESC
  `);
  const findById = db.prepare<ApplicationKey, ApplicationDbo>(`
    SELECT a.id, a.offer_id, o.title AS offer_title, c.short_name AS company_short_name,
           a.student_id, a.message, a.status, a.applied_at
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    WHERE a.id = @id AND a.student_id = @studentId
  `);
  const findOfferStatus = db.prepare<{ offerId: number }, OfferStatusRow>(
    "SELECT status FROM offers WHERE id = @offerId",
  );
  const findExisting = db.prepare<{ offerId: number; studentId: number }, { id: number }>(`
    SELECT id FROM applications
    WHERE offer_id = @offerId AND student_id = @studentId
  `);
  const insert = db.prepare<NewApplication>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
  `);
  const withdraw = db.prepare<ApplicationKey>(`
    UPDATE applications
    SET status = 'WITHDRAWN'
    WHERE id = @id AND student_id = @studentId AND status = 'IN_PROGRESS'
  `);

  return {
    findAllByStudent: (studentId: number): ApplicationDbo[] => findAllByStudent.all({ studentId }),
    findById: ({ id, studentId }: ApplicationKey): ApplicationDbo | undefined =>
      findById.get({ id, studentId }),
    findOfferStatus: (offerId: number): string | undefined =>
      findOfferStatus.get({ offerId })?.status,
    exists: (offerId: number, studentId: number): boolean =>
      findExisting.get({ offerId, studentId }) !== undefined,
    create: ({ offerId, studentId, message }: NewApplication): void => {
      insert.run({ offerId, studentId, message });
    },
    withdraw: ({ id, studentId }: ApplicationKey): boolean =>
      withdraw.run({ id, studentId }).changes === 1,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;

export type { ApplicationStatus };