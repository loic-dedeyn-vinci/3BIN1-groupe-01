import { useState } from "react";
import type { Offer } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import { createApplication } from "../services/applications.service.ts";
import { ApiError, isUnauthorized } from "../utils/api.ts";
import { OFFER_STATUS_LABELS, OFFER_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface OfferTableProps {
  offers: Offer[];
  user?: User;
  token?: string;
  onUnauthorized?: () => void;
}

interface ApplyButtonProps {
  offer: Offer;
  token: string;
  onUnauthorized: () => void;
}

const ApplyButton = ({ offer, token, onUnauthorized }: ApplyButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await createApplication(token, offer.id, message);
      setFeedback("Candidature envoyée.");
      setIsOpen(false);
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) onUnauthorized();
      else if (reason instanceof ApiError && reason.status === 409) {
        setFeedback("Une seule candidature est autorisée par offre.");
      }
      else setFeedback(reason instanceof Error ? reason.message : "Candidature impossible");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="application-action">
      {feedback && <span role="status">{feedback}</span>}
      {!isOpen && !feedback && (
        <button className="button button-secondary" type="button" onClick={() => setIsOpen(true)}>
          Candidater
        </button>
      )}
      {isOpen && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label>
            Message (facultatif)
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <button className="button button-secondary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi…" : "Envoyer"}
          </button>
          <button className="button" type="button" onClick={() => setIsOpen(false)}>
            Annuler
          </button>
        </form>
      )}
    </div>
  );
};

const OfferTable = ({ offers, user, token, onUnauthorized }: OfferTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Titre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Année</th>
          <th scope="col">Période</th>
          <th scope="col">Statut</th>
          {user?.kind === "STUDENT" && <th scope="col">Action</th>}
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td>{offer.title}</td>
            <td>{offer.companyShortName}</td>
            <td>{offer.academicYear}</td>
            <td>{PERIOD_LABELS[offer.period]}</td>
            <td>
              <StatusBadge
                label={OFFER_STATUS_LABELS[offer.status]}
                tone={OFFER_STATUS_TONES[offer.status]}
              />
            </td>
            {user?.kind === "STUDENT" &&
              offer.status === "PUBLISHED" &&
              token &&
              onUnauthorized && (
              <td>
                <ApplyButton offer={offer} token={token} onUnauthorized={onUnauthorized} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default OfferTable;
