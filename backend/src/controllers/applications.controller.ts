import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { isStudent } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const MAX_MESSAGE_LENGTH = 2_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseBody = (body: unknown): { offerId: number; message: string | null } => {
  if (!isRecord(body)) {
    throw new HttpError(400, "INVALID_BODY", "offerId doit être un entier positif");
  }
  const { offerId } = body;
  if (typeof offerId !== "number" || !Number.isInteger(offerId) || offerId <= 0) {
    throw new HttpError(400, "INVALID_BODY", "offerId doit être un entier positif");
  }
  if (body.message !== undefined && body.message !== null && typeof body.message !== "string") {
    throw new HttpError(400, "INVALID_BODY", "message doit être une chaîne de caractères");
  }
  const message = typeof body.message === "string" ? body.message.trim() : null;
  if (message !== null && message.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_BODY",
      `message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères`,
    );
  }
  return { offerId, message: message === "" ? null : message };
};

const parseId = (value: unknown): number => {
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_QUERY", "L'identifiant de candidature est invalide");
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "INVALID_QUERY", "L'identifiant de candidature est invalide");
  }
  return id;
};

export const createApplicationsRouter = (service: ApplicationsService) => {
  const router = Router();

  router.get("/", authorize(isStudent), (req, res) => {
    res.json(service.listApplications(getCurrentUser(req)).map(toApplicationDto));
  });

  router.post("/", authorize(isStudent), (req, res) => {
    const { offerId, message } = parseBody(req.body);
    res.status(201).json(toApplicationDto(service.apply(getCurrentUser(req), offerId, message)));
  });

  router.delete("/:id", authorize(isStudent), (req, res) => {
    res.json(toApplicationDto(service.withdraw(getCurrentUser(req), parseId(req.params.id))));
  });

  return router;
};