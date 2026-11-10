import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsPage from "../src/pages/ApplicationsPage.tsx";
import { stubFetch } from "./helpers/fetchMock.ts";

const applications = [
  {
    id: 1,
    offerId: 1,
    offerTitle: "Application React de gestion de flotte",
    companyShortName: "Lumen Digital",
    message: "Mon message",
    status: "IN_PROGRESS",
    appliedAt: "2026-10-02 18:10:00",
  },
  {
    id: 5,
    offerId: 3,
    offerTitle: "API REST de facturation",
    companyShortName: "Orbis",
    message: null,
    status: "WITHDRAWN",
    appliedAt: "2026-09-30 10:30:00",
  },
  {
    id: 3,
    offerId: 6,
    offerTitle: "Migration cloud",
    companyShortName: "Datavia",
    message: null,
    status: "SELECTED",
    appliedAt: "2026-09-28 09:00:00",
  },
  {
    id: 4,
    offerId: 6,
    offerTitle: "Migration cloud",
    companyShortName: "Datavia",
    message: null,
    status: "REJECTED",
    appliedAt: "2026-09-27 09:00:00",
  },
];

describe("ApplicationsPage", () => {
  it("affiche un message lorsqu'il n'y a aucune candidature", async () => {
    stubFetch({ "/api/applications": () => Response.json([]) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Vous n'avez encore aucune candidature.")).toBeInTheDocument();
  });

  it("affiche les candidatures et leurs statuts français", async () => {
    stubFetch({ "/api/applications": () => Response.json(applications) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Application React de gestion de flotte")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getByText("Retirée")).toBeInTheDocument();
    expect(screen.getByText("Retenue")).toBeInTheDocument();
    expect(screen.getByText("Non retenue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retirer" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Retirer" })).toHaveLength(1);
  });

  it("retire une candidature après confirmation et recharge la liste", async () => {
    const fetchMock = stubFetch({
      "/api/applications/1": () => Response.json({ ...applications[0], status: "WITHDRAWN" }),
      "/api/applications": () => Response.json(applications),
    });
    vi.stubGlobal("confirm", vi.fn(() => true));

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("En cours");
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/applications/1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("n'envoie aucune requête si le retrait est annulé", async () => {
    const fetchMock = stubFetch({ "/api/applications": () => Response.json(applications) });
    vi.stubGlobal("confirm", vi.fn(() => false));

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("En cours");
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/applications/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});