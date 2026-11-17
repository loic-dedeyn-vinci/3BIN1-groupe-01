import { Router } from "express";
import { toOfferDto } from "../mappers/offer.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import { PERIOD_CODES, type PeriodCode } from "../models/offer.ts";
import type { OffersService } from "../services/offers.service.ts";
import { canListOffers } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const MAX_SEARCH_LENGTH = 100;

/** Valide le paramètre ?q= : texte facultatif, ignoré s'il est vide. */
const parseSearch = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_QUERY", "Le paramètre q doit apparaître une seule fois");
  }
  if (value.length > MAX_SEARCH_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_QUERY",
      `Le paramètre q ne peut pas dépasser ${MAX_SEARCH_LENGTH} caractères`,
    );
  }

  const search = value.trim();
  return search === "" ? undefined : search;
};

/** Valide le paramètre ?period= : code de période facultatif ('P1', 'P2', 'OTHER'). */
const parsePeriod = (value: unknown): PeriodCode | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_QUERY", "Le paramètre period doit apparaître une seule fois");
  }
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  if (!(PERIOD_CODES as readonly string[]).includes(trimmed)) {
    throw new HttpError(
      400,
      "INVALID_QUERY",
      `Le paramètre period doit être l'un des suivants : ${PERIOD_CODES.join(", ")}`,
    );
  }
  return trimmed as PeriodCode;
};

export const createOffersRouter = (offersService: OffersService) => {
  const router = Router();

  router.get("/", authorize(canListOffers), (req, res) => {
    const search = parseSearch(req.query.q);
    const period = parsePeriod(req.query.period);
    res.json(offersService.listOffers(getCurrentUser(req), period, search).map(toOfferDto));
  });

  return router;
};
