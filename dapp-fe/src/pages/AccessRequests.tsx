import { useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  MailOpen,
  ShieldCheck,
  XCircle,
  Wallet,
} from "lucide-react";
import { useAppStore } from "../store";

type AccessRequest = {
  id: string;
  document_id: string;
  requester_wallet_address: string;
  requester_name: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected" | string;
  title: string;
  file_name: string;
  document_type: string;
  created_at: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AccessRequests = () => {
  const { token, wallet } = useAppStore();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      if (!token) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"
          }/documents/access-requests`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response
          .json()
          .catch(
            () => ({} as { message?: string; requests?: AccessRequest[] }),
          );
        if (!response.ok) {
          throw new Error(data.message || "Không tải được danh sách yêu cầu");
        }

        setRequests(data.requests ?? []);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Không tải được danh sách yêu cầu";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRequests();
  }, [token]);

  const handleResolve = async (
    requestId: string,
    status: "approved" | "rejected",
  ) => {
    if (!token) return;

    setActiveRequestId(requestId);
    setError(null);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"
        }/documents/access-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({} as { message?: string }));
      if (!response.ok) {
        throw new Error(data.message || "Không cập nhật được yêu cầu");
      }

      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? { ...request, status } : request,
        ),
      );
    } catch (resolveError) {
      const message =
        resolveError instanceof Error
          ? resolveError.message
          : "Không cập nhật được yêu cầu";
      setError(message);
    } finally {
      setActiveRequestId(null);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="notary-card rounded-2xl p-8 text-center">
            <Wallet className="w-12 h-12 text-notary-cyan mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-semibold text-white mb-2">
              Access Requests
            </h1>
            <p className="text-slate-400">
              Connect your wallet to review incoming requests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Access Requests
            </h1>
            <p className="text-slate-400">
              Approve or reject access requests from other wallets.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-notary-dark-secondary border border-notary-cyan/20 text-notary-cyan text-sm">
            <Wallet className="w-4 h-4" />
            {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
          </div>
        </div>

        {error ? (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="py-24 text-center text-slate-400">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-notary-cyan" />
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="notary-card rounded-2xl p-10 text-center">
            <MailOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-white mb-2">
              No requests yet
            </h2>
            <p className="text-slate-400">
              When someone asks for a document, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="notary-card rounded-2xl p-5">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-heading text-lg font-semibold text-white">
                        {request.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${
                          request.status === "approved"
                            ? "bg-notary-success/15 text-notary-success border-notary-success/30"
                            : request.status === "rejected"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-notary-gold/10 text-notary-gold border-notary-gold/30"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">
                      Requester:{" "}
                      {request.requester_name ||
                        request.requester_wallet_address}
                    </p>
                    <p className="text-slate-500 text-xs mb-2 break-all">
                      {request.message || "No message provided"}
                    </p>
                    <p className="text-slate-500 text-xs">
                      Requested {formatDate(request.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {request.status === "pending" ? (
                      <>
                        <button
                          onClick={() => {
                            void handleResolve(request.id, "approved");
                          }}
                          disabled={activeRequestId === request.id}
                          className="px-4 py-2 rounded-xl bg-notary-success/15 text-notary-success border border-notary-success/30 hover:bg-notary-success/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
                        >
                          {activeRequestId === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            void handleResolve(request.id, "rejected");
                          }}
                          disabled={activeRequestId === request.id}
                          className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessRequests;
