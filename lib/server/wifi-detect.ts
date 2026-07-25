import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

export type DeviceWifiInfo = {
  ssid: string | null;
  connected: boolean;
  platform: string;
  source: "windows-netsh" | "macos" | "linux" | "unavailable";
  raw?: string;
  error?: string;
};

function parseWindowsNetsh(output: string): string | null {
  const lines = output.split(/\r?\n/);
  let connectedBlock = false;
  let ssidInBlock: string | null = null;

  for (const line of lines) {
    if (/^\s*Name\s*:/i.test(line)) {
      // new interface block
      connectedBlock = false;
      ssidInBlock = null;
    }
    if (/^\s*State\s*:\s*connected/i.test(line)) connectedBlock = true;
    if (/^\s*State\s*:\s*disconnected/i.test(line)) connectedBlock = false;

    // Exact SSID line (not BSSID / AP BSSID)
    const m = line.match(/^\s*SSID\s*:\s*(.+)\s*$/i);
    if (m && !/BSSID/i.test(line)) {
      const value = m[1].trim();
      if (value) {
        if (connectedBlock) return value;
        ssidInBlock = value;
      }
    }
  }

  return ssidInBlock;
}

async function detectWindows(): Promise<DeviceWifiInfo> {
  try {
    const { stdout } = await execFileAsync("netsh", ["wlan", "show", "interfaces"], {
      windowsHide: true,
      timeout: 5000,
    });
    const ssid = parseWindowsNetsh(stdout);
    return {
      ssid,
      connected: Boolean(ssid),
      platform: "win32",
      source: "windows-netsh",
      raw: process.env.NODE_ENV === "development" ? stdout.slice(0, 500) : undefined,
    };
  } catch (e) {
    return {
      ssid: null,
      connected: false,
      platform: "win32",
      source: "windows-netsh",
      error: e instanceof Error ? e.message : "netsh failed",
    };
  }
}

async function detectMac(): Promise<DeviceWifiInfo> {
  try {
    // macOS Sonoma+ often needs this; older: networksetup
    try {
      const { stdout } = await execFileAsync(
        "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport",
        ["-I"],
        { timeout: 5000 }
      );
      const m = stdout.match(/^\s*SSID:\s*(.+)$/m);
      if (m?.[1]) {
        return {
          ssid: m[1].trim(),
          connected: true,
          platform: "darwin",
          source: "macos",
        };
      }
    } catch {
      /* try networksetup */
    }
    const { stdout } = await execFileAsync(
      "networksetup",
      ["-getairportnetwork", "en0"],
      { timeout: 5000 }
    );
    const m = stdout.match(/Network:\s*(.+)$/i);
    const ssid = m?.[1]?.trim() || null;
    return {
      ssid: ssid && !/not associated/i.test(ssid) ? ssid : null,
      connected: Boolean(ssid && !/not associated/i.test(ssid)),
      platform: "darwin",
      source: "macos",
    };
  } catch (e) {
    return {
      ssid: null,
      connected: false,
      platform: "darwin",
      source: "macos",
      error: e instanceof Error ? e.message : "mac wifi detect failed",
    };
  }
}

async function detectLinux(): Promise<DeviceWifiInfo> {
  try {
    const { stdout } = await execFileAsync("iwgetid", ["-r"], { timeout: 5000 });
    const ssid = stdout.trim() || null;
    return {
      ssid,
      connected: Boolean(ssid),
      platform: "linux",
      source: "linux",
    };
  } catch (e) {
    try {
      const { stdout } = await execFileAsync(
        "nmcli",
        ["-t", "-f", "active,ssid", "dev", "wifi"],
        { timeout: 5000 }
      );
      const line = stdout.split(/\r?\n/).find((l) => l.startsWith("yes:"));
      const ssid = line ? line.slice(4).trim() : null;
      return {
        ssid,
        connected: Boolean(ssid),
        platform: "linux",
        source: "linux",
      };
    } catch {
      return {
        ssid: null,
        connected: false,
        platform: "linux",
        source: "linux",
        error: e instanceof Error ? e.message : "linux wifi detect failed",
      };
    }
  }
}

/**
 * Reads the WiFi SSID of the machine running the Next.js server.
 * Works when the visitor runs the app on the same device (npm run dev / local start).
 * On hosted cloud (Vercel) this cannot see the visitor's phone WiFi.
 */
export async function detectDeviceWifi(): Promise<DeviceWifiInfo> {
  const platform = os.platform();
  if (platform === "win32") return detectWindows();
  if (platform === "darwin") return detectMac();
  if (platform === "linux") return detectLinux();
  return {
    ssid: null,
    connected: false,
    platform,
    source: "unavailable",
    error: "WiFi SSID detection is not supported on this OS from the server.",
  };
}
