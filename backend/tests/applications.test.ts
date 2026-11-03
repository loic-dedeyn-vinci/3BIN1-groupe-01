import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, APPLICATION, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const applicationsAs = (studentId: number) =>
  request(app).get("/applications").set("Authorization", tokenFor("STUDENT", studentId));

describe("GET /applications", () => {
  it("refuse une requête sans session", async () => {
    const response = await request(app).get("/applications");

    expect(response.status).toBe(401);
  });

  it("réserve la liste aux étudiants", async () => {
    const response = await request(app)
      .get("/applications")
      .set("Authorization", tokenFor("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ));

    expect(response.status).toBe(403);
  });

  it("ne retourne que les candidatures de l'étudiant connecté", async () => {
    const response = await applicationsAs(STUDENT.LUCAS_DUPONT);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: APPLICATION.LUCAS_FLEET_APP,
        offerId: OFFER.FLEET_APP,
        offerTitle: "Application React de gestion de flotte",
        companyShortName: "Lumen Digital",
        message: "Le développement React m'intéresse particulièrement.",
        status: "IN_PROGRESS",
        appliedAt: "2026-10-02 18:10:00",
      },
    ]);
  });
});

describe("POST /applications", () => {
  it("crée une candidature avec un message facultatif", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT))
      .send({ offerId: OFFER.INTERNAL_CHATBOT, message: "Mon message de candidature" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.INTERNAL_CHATBOT,
      message: "Mon message de candidature",
      status: "IN_PROGRESS",
    });
  });

  it("refuse une offre non publiée", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT))
      .send({ offerId: OFFER.CLIENT_PORTAL });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("refuse une candidature déjà existante, y compris retirée", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT))
      .send({ offerId: OFFER.FLEET_APP });

    expect(response.status).toBe(409);
  });

  it("valide le corps de la requête", async () => {
    const response = await request(app)
      .post("/applications")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT))
      .send({ offerId: "7" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
  });
});

describe("DELETE /applications/:id", () => {
  it("retire une candidature en cours sans la supprimer", async () => {
    const response = await request(app)
      .delete(`/applications/${APPLICATION.LUCAS_FLEET_APP}`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("WITHDRAWN");

    const list = await applicationsAs(STUDENT.LUCAS_DUPONT);
    expect(list.body[0].status).toBe("WITHDRAWN");
  });

  it("refuse le retrait d'une candidature traitée", async () => {
    const response = await request(app)
      .delete(`/applications/${APPLICATION.MATEUSZ_CLOUD_MIGRATION}`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.MATEUSZ_KOWALSKI));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("ne permet pas de retirer la candidature d'un autre étudiant", async () => {
    const response = await request(app)
      .delete(`/applications/${APPLICATION.LUCAS_FLEET_APP}`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.INES_HADDAD));

    expect(response.status).toBe(404);
  });
});