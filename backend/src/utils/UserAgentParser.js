class UserAgentParser {
  static parse(userAgentString) {
    if (!userAgentString) {
      return {
        browser: "Unknown",
        os: "Unknown",
        device: "Unknown",
        original: null,
      };
    }

    const ua = userAgentString.toLowerCase();

    // Browser detection
    let browser = "Unknown";
    let browserVersion = "";

    if (ua.includes("chrome") && !ua.includes("edg")) {
      browser = "Chrome";
      browserVersion = this.extractVersion(ua, "chrome");
    } else if (ua.includes("firefox")) {
      browser = "Firefox";
      browserVersion = this.extractVersion(ua, "firefox");
    } else if (ua.includes("safari") && !ua.includes("chrome")) {
      browser = "Safari";
      browserVersion = this.extractVersion(ua, "safari");
    } else if (ua.includes("edg")) {
      browser = "Edge";
      browserVersion = this.extractVersion(ua, "edg");
    } else if (ua.includes("opera")) {
      browser = "Opera";
      browserVersion = this.extractVersion(ua, "opera");
    }

    // OS detection
    let os = "Unknown";
    let osVersion = "";

    if (ua.includes("windows nt 10.0")) {
      os = "Windows 10";
      osVersion = "10.0";
    } else if (ua.includes("windows nt 6.3")) {
      os = "Windows 8.1";
      osVersion = "6.3";
    } else if (ua.includes("windows nt 6.2")) {
      os = "Windows 8";
      osVersion = "6.2";
    } else if (ua.includes("windows nt 6.1")) {
      os = "Windows 7";
      osVersion = "6.1";
    } else if (ua.includes("mac os x")) {
      os = "macOS";
      osVersion = this.extractVersion(ua, "mac os x");
    } else if (ua.includes("linux")) {
      os = "Linux";
    } else if (ua.includes("android")) {
      os = "Android";
      osVersion = this.extractVersion(ua, "android");
    } else if (ua.includes("ios") || ua.includes("iphone")) {
      os = "iOS";
      osVersion = this.extractVersion(ua, "os");
    }

    // Device detection
    let device = "Desktop";
    if (ua.includes("mobile")) {
      device = "Mobile";
    } else if (ua.includes("tablet")) {
      device = "Tablet";
    } else if (ua.includes("android")) {
      device = "Mobile";
    } else if (ua.includes("iphone") || ua.includes("ipad")) {
      device = ua.includes("ipad") ? "Tablet" : "Mobile";
    }

    return {
      browser: {
        name: browser,
        version: browserVersion,
        full: `${browser} ${browserVersion}`.trim(),
      },
      os: {
        name: os,
        version: osVersion,
        full: `${os} ${osVersion}`.trim(),
      },
      device: device,
      engine: this.detectEngine(ua),
      original: userAgentString,
      isMobile: device === "Mobile" || device === "Tablet",
      isDesktop: device === "Desktop",
    };
  }

  static extractVersion(ua, identifier) {
    const regex = new RegExp(`${identifier}[\\s/]?([\\d.]+)`, "i");
    const match = ua.match(regex);
    return match ? match[1] : "";
  }

  static detectEngine(ua) {
    if (ua.includes("applewebkit")) {
      return "WebKit";
    } else if (ua.includes("gecko")) {
      return "Gecko";
    } else if (ua.includes("trident")) {
      return "Trident";
    } else if (ua.includes("blink")) {
      return "Blink";
    }
    return "Unknown";
  }

  // Specific format for your requirement
  static parseSimple(userAgentString) {
    const parsed = this.parse(userAgentString);
    return {
      browser: parsed.browser.full || "Unknown",
      os: parsed.os.full || "Unknown",
      device: parsed.device,
      engine: parsed.engine,
    };
  }
}

export default UserAgentParser;
