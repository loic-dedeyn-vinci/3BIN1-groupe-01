import { toApplication } from "../mappers/application.mapper.ts";
import type { Application, ApplicationStatus } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { isStudent } from "./permissions.ts";

export const createApplicationsService = (repository: ApplicationsRepository) => {
  const requireStudent = (viewer: User): void => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas accès aux candidatures");
    }
  };

  return {
    listApplications: (viewer: User): Application[] => {
      requireStudent(viewer);
      return repository.findAllByStudent(viewer.id).map(toApplication);
    },
    apply: (viewer: User, offerId: number, message: string | null): Application => {
      requireStudent(viewer);

      const offerStatus = repository.findOfferStatus(offerId);
      if (offerStatus === undefined) {
        throw new HttpError(404, "NOT_FOUND", "Cette offre n'existe pas");
      }
      if (offerStatus !== "PUBLISHED") {
        throw new HttpError(409, "CONFLICT", "Cette offre n'est pas publiée");
      }
      if (repository.exists(offerId, viewer.id)) {
        throw new HttpError(409, "CONFLICT", "Vous avez déjà candidaté à cette offre");
      }

      repository.create({ offerId, studentId: viewer.id, message });
      const application = repository.findAllByStudent(viewer.id).find(
        (candidate) => candidate.offer_id === offerId && candidate.status === "IN_PROGRESS",
      );
      if (application === undefined) {
        throw new HttpError(500, "INTERNAL_ERROR", "La candidature n'a pas pu être créée");
      }
      return toApplication(application);
    },
    withdraw: (viewer: User, id: number): Application => {
      requireStudent(viewer);
      const application = repository.findById({ id, studentId: viewer.id });
      if (application === undefined) {
        throw new HttpError(404, "NOT_FOUND", "Cette candidature n'existe pas");
      }
      if (application.status !== "IN_PROGRESS") {
        throw new HttpError(409, "CONFLICT", "Cette candidature a déjà été traitée");
      }
      if (!repository.withdraw({ id, studentId: viewer.id })) {
        throw new HttpError(409, "CONFLICT", "Cette candidature a déjà été traitée");
      }
      const withdrawn = repository.findById({ id, studentId: viewer.id });
      if (withdrawn === undefined) {
        throw new HttpError(500, "INTERNAL_ERROR", "La candidature n'a pas pu être retirée");
      }
      return toApplication(withdrawn);
    },
  };
};

export type ApplicationsService = ReturnType<typeof createApplicationsService>;

export type { ApplicationStatus };