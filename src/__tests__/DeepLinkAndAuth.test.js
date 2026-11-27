jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/Login", search: "", state: null }),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams()],
}), { virtual: true });

jest.mock("react-firebase-hooks/auth", () => ({
  useAuthState: () => [null, false],
}));

jest.mock("../Session/firebase", () => ({
  auth: {
    currentUser: null,
    authStateReady: jest.fn(),
  },
  signInWithGoogle: jest.fn(),
}));

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock("jwt-check-expiration", () => ({
  isJwtExpired: jest.fn(),
}));

jest.mock("../services/offlineService", () => ({
  __esModule: true,
  default: {
    registerSyncRunner: jest.fn(),
    isNetworkError: jest.fn(() => false),
    onDataRefreshed: jest.fn(() => () => {}),
    getState: jest.fn(() => ({ syncedNodes: {} })),
    subscribe: jest.fn(() => () => {}),
  },
}));

import axios from "axios";
import { isJwtExpired } from "jwt-check-expiration";
import { auth as mockAuthState } from "../Session/firebase";
import * as apiService from "../services/apiService";
import { getSafeReturnUrl } from "../Session/Login";

describe("Deep-link auth readiness, structured GetTask errors, and Login returnUrl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockAuthState.currentUser = null;
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  test("getValidToken awaits auth.authStateReady() before refreshing an expired cold-start token", async () => {
    localStorage.setItem("token", "expired-jwt-token");
    isJwtExpired.mockReturnValue(true);

    const getIdTokenMock = jest.fn().mockResolvedValue("fresh-refreshed-jwt");
    mockAuthState.authStateReady.mockImplementation(async () => {
      mockAuthState.currentUser = { getIdToken: getIdTokenMock };
    });

    const token = await apiService.getValidToken();

    expect(mockAuthState.authStateReady).toHaveBeenCalledTimes(1);
    expect(getIdTokenMock).toHaveBeenCalledWith(true);
    expect(token).toBe("fresh-refreshed-jwt");
    expect(localStorage.getItem("token")).toBe("fresh-refreshed-jwt");
  });

  test("createGetTaskFromNote preserves structured HTTP status and error code on 404/409/400", async () => {
    localStorage.setItem("token", "valid-jwt");
    isJwtExpired.mockReturnValue(false);
    mockAuthState.currentUser = { getIdToken: jest.fn().mockResolvedValue("valid-jwt") };

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const axiosErr = new Error("Not found");
    axiosErr.response = {
      status: 404,
      data: { code: "INBOX_DELETED", message: "Inbox no longer exists" },
    };
    axios.post.mockRejectedValueOnce(axiosErr);

    await expect(
      apiService.createGetTaskFromNote({
        clientTaskId: "cid-123",
        pageId: 10,
        journalId: 15,
        title: "Test task",
      })
    ).rejects.toMatchObject({
      status: 404,
      code: "INBOX_DELETED",
      apiMessage: "Inbox no longer exists",
    });

    consoleSpy.mockRestore();
  });

  test("getSafeReturnUrl preserves internal /List deep-links and blocks external open redirects", () => {
    expect(getSafeReturnUrl("/List?treeId=15&pageId=842")).toBe(
      "/List?treeId=15&pageId=842"
    );
    expect(getSafeReturnUrl("/List?pageId=842")).toBe("/List?pageId=842");
    expect(getSafeReturnUrl("//evil.com/phish")).toBe("/home");
    expect(getSafeReturnUrl("https://evil.com")).toBe("/home");
    expect(getSafeReturnUrl("/Login?returnUrl=/List")).toBe("/home");
    expect(getSafeReturnUrl("")).toBe("/home");
    expect(getSafeReturnUrl(null)).toBe("/home");
  });
});
