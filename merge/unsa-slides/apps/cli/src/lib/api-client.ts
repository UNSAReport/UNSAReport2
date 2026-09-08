import type {
  CliDeployRequest,
  CliDeployResponse,
  CliLoginExchangeResponse,
  CliLoginInitResponse,
} from "@unsa-slides/schemas/cli-api";
import { getGlobalConfig } from "@/lib/config";

export async function requestDeviceCode(): Promise<CliLoginInitResponse> {
  const { apiUrl } = await getGlobalConfig();
  const res = await fetch(`${apiUrl}/api/v1/auth/device-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to initialize device login: ${res.status} ${res.statusText}`,
    );
  }
  return (await res.json()) as CliLoginInitResponse;
}

export async function pollDeviceCode(
  deviceCode: string,
): Promise<CliLoginExchangeResponse | null> {
  const { apiUrl } = await getGlobalConfig();
  const res = await fetch(`${apiUrl}/api/v1/auth/device-exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceCode }),
  });

  if (res.status === 428 || res.status === 400) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Device exchange failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as CliLoginExchangeResponse;
}

export async function deployPresentation(
  payload: CliDeployRequest,
): Promise<CliDeployResponse> {
  const { apiUrl, token } = await getGlobalConfig();
  if (!token) {
    throw new Error("You are not logged in. Run `slides login` first.");
  }

  const res = await fetch(`${apiUrl}/api/v1/presentations/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Deploy failed (${res.status} ${res.statusText}): ${errorBody}`,
    );
  }
  return (await res.json()) as CliDeployResponse;
}
