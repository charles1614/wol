export async function sendWolSignal(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  serverConfirmed?: boolean;
}> {
  try {
    const response = await fetch("/api/wol", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message || "WOL signal sent successfully",
        serverConfirmed: data.serverConfirmed,
      };
    } else {
      return {
        success: false,
        error: data.error || "Failed to send WOL signal",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getDeviceInfo(): Promise<{
  mac: string;
  deviceName: string;
  status: string;
} | null> {
  try {
    const response = await fetch("/api/wol");
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}
