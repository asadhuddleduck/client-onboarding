"use client";

import { useState, useEffect, useCallback } from "react";
import {
  discoverAccounts as discoverAccountsAction,
  grantAccess as grantAccessAction,
  provisionAccount as provisionAccountAction,
} from "./actions";

// ------ Types ------

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
}

interface BusinessManager {
  id: string;
  name: string;
  adAccounts: AdAccount[];
}

interface HealthResult {
  id: string;
  name: string;
  accountStatus: number;
  accountStatusLabel: string;
  disableReason: number;
  disableReasonLabel: string;
  currency: string;
  timezone: string;
  overallStatus: "green" | "yellow" | "red";
  issues: string[];
}

interface ProvisionResult {
  notionPageId: string;
  dashboardUrl: string;
  health: HealthResult;
  alreadyExists?: boolean;
}

type Step = "welcome" | "selecting" | "granting" | "success";

// ------ FB SDK types ------

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

// ------ Component ------

export default function OnboardClient({ fbAppId }: { fbAppId: string }) {
  const [step, setStep] = useState<Step>("welcome");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessManager[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<{
    bmId: string;
    bmName: string;
    account: AdAccount;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // Load Facebook SDK
  useEffect(() => {
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: fbAppId,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      setSdkReady(true);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [fbAppId]);

  // Handle Facebook Login with CSRF state guard (CRIT-9)
  const handleFBLogin = useCallback(() => {
    if (!window.FB) return;

    setLoading(true);
    setError(null);

    // Generate and store CSRF state token before initiating OAuth
    const state = crypto.randomUUID();
    sessionStorage.setItem("fb_oauth_state", state);

    window.FB.login(
      (response: any) => {
        // Verify CSRF state: ensure this callback originated from a user-initiated login on this page
        const storedState = sessionStorage.getItem("fb_oauth_state");
        if (!storedState) {
          setLoading(false);
          setError("Session expired. Please try again.");
          return;
        }
        sessionStorage.removeItem("fb_oauth_state");

        if (response.authResponse) {
          const token = response.authResponse.accessToken;
          setAccessToken(token);
          handleDiscoverAccounts(token);
        } else {
          setLoading(false);
          setError("Login was cancelled or permissions were not granted.");
        }
      },
      {
        scope: "business_management",
        auth_type: "rerequest",
      }
    );
  }, []);

  // Discover client's BMs and ad accounts via server action
  const handleDiscoverAccounts = async (token: string) => {
    try {
      const data = await discoverAccountsAction(token);

      if (data.error) {
        throw new Error(data.error);
      }

      setBusinesses(data.businesses ?? []);
      setStep("selecting");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Grant partner access + health check + provision via server actions
  const handleGrantAccess = async () => {
    if (!selectedAccount || !accessToken) return;

    setStep("granting");
    setLoading(true);
    setError(null);

    try {
      // Step 1: Grant partner access
      const grantData = await grantAccessAction(
        accessToken,
        selectedAccount.account.id
      );

      if (grantData.error) {
        throw new Error(grantData.error);
      }

      // Step 2: Provision (includes health check)
      const provisionData = await provisionAccountAction({
        businessName: selectedAccount.bmName,
        adAccountId: selectedAccount.account.id,
        adAccountName: selectedAccount.account.name,
        businessManagerId: selectedAccount.bmId,
      });

      if (provisionData.error) {
        throw new Error(provisionData.error);
      }

      setProvisionResult(provisionData);
      setStep("success");
    } catch (err: any) {
      setError(err.message);
      setStep("selecting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-12 min-h-screen flex flex-col">
      {/* Header */}
      <div className="text-center mb-8" style={{ animation: "fadeSlideUp 0.5s var(--ease-premium) backwards" }}>
        <div className="text-3xl mb-3">🦆</div>
        <h1
          className="text-xl font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Huddle Duck
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Client Onboarding
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="mb-6 p-4 rounded-xl text-sm font-semibold"
          style={{
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.25)",
            color: "#f87171",
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Step 1: Welcome */}
      {step === "welcome" && (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center"
          style={{ animation: "fadeSlideUp 0.6s var(--ease-premium) 100ms backwards" }}
        >
          <div
            className="rounded-2xl p-8 w-full"
            style={{
              background: "var(--gradient-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 className="text-2xl font-extrabold mb-3 tracking-tight">
              Connect your Meta
              <br />
              ad account
            </h2>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              This takes 30 seconds. Log in with Facebook, select which ad
              account to share with us, and you&apos;re done.
            </p>

            <button
              onClick={handleFBLogin}
              disabled={loading || !sdkReady}
              className="w-full py-4 px-6 rounded-xl font-bold text-base text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? "var(--text-muted)" : "var(--fb-blue)",
                boxShadow: loading
                  ? "none"
                  : "0 4px 20px rgba(24,119,242,0.4)",
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    style={{ animation: "spin 0.6s linear infinite" }}
                  />
                  Connecting...
                </span>
              ) : (
                "Continue with Facebook"
              )}
            </button>

            {!sdkReady && (
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                Loading Facebook SDK...
              </p>
            )}
          </div>

          <p className="text-xs mt-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            We&apos;ll only request access to your Business Manager.
            <br />
            Your login credentials are never shared with us.
          </p>
        </div>
      )}

      {/* Step 2: Select Account */}
      {step === "selecting" && (
        <div style={{ animation: "fadeSlideUp 0.5s var(--ease-premium) backwards" }}>
          <h2
            className="text-lg font-extrabold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Select an ad account
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Choose which ad account to share with Huddle Duck.
          </p>

          {businesses.length === 0 ? (
            <div
              className="p-6 rounded-xl text-center"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No Business Managers found. Make sure you&apos;re an admin on
                at least one Business Manager.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {businesses.map((bm) => (
                <div key={bm.id}>
                  <div
                    className="flex items-center gap-2 mb-2 px-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {bm.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-md font-semibold"
                      style={{
                        background: "var(--viridian-glow)",
                        color: "var(--viridian)",
                      }}
                    >
                      {bm.adAccounts.length} account{bm.adAccounts.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {bm.adAccounts.length === 0 ? (
                    <div
                      className="p-4 rounded-xl text-sm"
                      style={{
                        background: "var(--gradient-card)",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      No ad accounts found in this Business Manager.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bm.adAccounts.map((acc) => {
                        const isSelected =
                          selectedAccount?.account.id === acc.id;
                        const isActive = acc.account_status === 1;

                        return (
                          <button
                            key={acc.id}
                            onClick={() =>
                              setSelectedAccount({
                                bmId: bm.id,
                                bmName: bm.name,
                                account: acc,
                              })
                            }
                            className="w-full text-left p-4 rounded-xl transition-all duration-200"
                            style={{
                              background: isSelected
                                ? "var(--viridian-soft)"
                                : "var(--gradient-card)",
                              border: isSelected
                                ? "1px solid var(--viridian)"
                                : "1px solid var(--border)",
                              boxShadow: isSelected
                                ? "0 0 20px rgba(30,186,143,0.15)"
                                : "none",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div
                                  className="text-sm font-bold"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {acc.name}
                                </div>
                                <div
                                  className="text-xs mt-0.5 font-mono"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {acc.id}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-md"
                                  style={{
                                    background: isActive
                                      ? "var(--viridian-glow)"
                                      : "rgba(248,113,113,0.1)",
                                    color: isActive
                                      ? "var(--viridian)"
                                      : "#f87171",
                                  }}
                                >
                                  {isActive ? "Active" : "Inactive"}
                                </span>
                                {isSelected && (
                                  <span style={{ color: "var(--viridian)" }}>
                                    ✓
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Grant Access button */}
          {selectedAccount && (
            <button
              onClick={handleGrantAccess}
              disabled={loading}
              className="w-full mt-6 py-4 px-6 rounded-xl font-bold text-base text-white transition-all duration-200 disabled:opacity-50"
              style={{
                background: "var(--gradient-accent)",
                boxShadow: "0 4px 20px rgba(30,186,143,0.3)",
              }}
            >
              {loading ? "Connecting..." : `Grant Access to ${selectedAccount.account.name}`}
            </button>
          )}
        </div>
      )}

      {/* Step 2.5: Granting in progress */}
      {step === "granting" && (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center"
          style={{ animation: "fadeSlideUp 0.5s var(--ease-premium) backwards" }}
        >
          <div
            className="rounded-2xl p-8 w-full"
            style={{
              background: "var(--gradient-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="w-12 h-12 mx-auto mb-4 border-3 rounded-full"
              style={{
                borderColor: "var(--viridian)",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <h2
              className="text-lg font-extrabold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Setting things up...
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Granting access and checking your account health. This only takes
              a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === "success" && provisionResult && (
        <div style={{ animation: "fadeSlideUp 0.6s var(--ease-premium) backwards" }}>
          <div
            className="rounded-2xl p-8 text-center mb-6"
            style={{
              background: "var(--gradient-card)",
              border: `1px solid ${
                provisionResult.health.overallStatus === "green"
                  ? "var(--viridian)"
                  : provisionResult.health.overallStatus === "yellow"
                  ? "var(--sandstorm)"
                  : "rgba(248,113,113,0.5)"
              }`,
            }}
          >
            {/* Traffic light */}
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
              style={{
                background:
                  provisionResult.health.overallStatus === "green"
                    ? "var(--viridian-glow)"
                    : provisionResult.health.overallStatus === "yellow"
                    ? "var(--sandstorm-glow)"
                    : "rgba(248,113,113,0.15)",
                border: `2px solid ${
                  provisionResult.health.overallStatus === "green"
                    ? "var(--viridian)"
                    : provisionResult.health.overallStatus === "yellow"
                    ? "var(--sandstorm)"
                    : "#f87171"
                }`,
              }}
            >
              {provisionResult.health.overallStatus === "green"
                ? "✓"
                : provisionResult.health.overallStatus === "yellow"
                ? "⚠"
                : "✕"}
            </div>

            <h2 className="text-xl font-extrabold mb-1">
              {provisionResult.health.overallStatus === "green"
                ? "You're all set!"
                : provisionResult.health.overallStatus === "yellow"
                ? "Connected with warnings"
                : "Account issue detected"}
            </h2>

            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {provisionResult.health.overallStatus === "green"
                ? "Your ad account is healthy and connected. We'll start pulling your data."
                : provisionResult.health.issues.join(". ")}
            </p>

            {/* Account details */}
            <div
              className="rounded-xl p-4 text-left"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div
                    className="text-xs font-semibold mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Account
                  </div>
                  <div className="text-sm font-bold">
                    {provisionResult.health.name}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-semibold mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Status
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{
                      color:
                        provisionResult.health.overallStatus === "green"
                          ? "var(--viridian)"
                          : provisionResult.health.overallStatus === "yellow"
                          ? "var(--sandstorm)"
                          : "#f87171",
                    }}
                  >
                    {provisionResult.health.accountStatusLabel}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-semibold mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Currency
                  </div>
                  <div className="text-sm font-bold">
                    {provisionResult.health.currency}
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-semibold mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Timezone
                  </div>
                  <div className="text-sm font-bold">
                    {provisionResult.health.timezone}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {provisionResult.health.overallStatus === "green" && (
            <p
              className="text-sm text-center leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Your dashboard will be ready within 24 hours. We&apos;ll
              reach out once everything is set up.
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Powered by{" "}
          <span className="font-bold" style={{ color: "var(--text-secondary)" }}>
            Huddle Duck
          </span>{" "}
          🦆
        </p>
      </div>
    </div>
  );
}
