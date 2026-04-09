import apiService from "./api";

const REPORT_ENDPOINT = "Report";

export const OrderSortBy = {
  OrderId: 0,
  DriverId: 1,
  OrgId: 2,
  CreatedAtUtc: 3,
  EbayItemId: 4,
};

export const PointHistorySortBy = {
  CreatedAtUtc: 0,
  DriverId: 1,
  SponsorId: 2,
  OrganizationId: 3,
  PointDelta: 4,
};

export const SortDirection = {
  Asc: 0,
  Desc: 1,
};

export const AuditLogType = {
  All: 0,
  PasswordChanges: 1,
  LoginAttempts: 2,
  Applications: 3,
};

const postWithAuth = async (endpoint, data) => {
  const token = apiService.getToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  return await apiService.postDataWithAuth(
    endpoint,
    JSON.stringify(data),
    token
  );
};

export const buildPointHistoryRequest = (overrides = {}) => ({
  driverId: null,
  sponsorId: null,
  orgId: null,
  reasonLike: null,
  beforeUtcDate: null,
  afterUtcDate: null,
  sortOptions: [
    {
      field: PointHistorySortBy.CreatedAtUtc,
      direction: SortDirection.Desc,
    },
  ],
  ...overrides,
});

export const buildOrderReportRequest = (overrides = {}) => ({
  organizationId: null,
  driverId: null,
  ebayItemId: null,
  beforeUtcDate: null,
  afterUtcDate: null,
  sortOptions: [
    {
      field: OrderSortBy.CreatedAtUtc,
      direction: SortDirection.Desc,
    },
  ],
  ...overrides,
});

export const buildAuditLogReportRequest = (overrides = {}) => ({
  userId: null,
  orgId: null,
  sponsorId: null,
  type: AuditLogType.All,
  ...overrides,
});

const reportService = {
  getPointHistoryReport: async (request) => {
    try {
      return await postWithAuth(
        `${REPORT_ENDPOINT}/point-history`,
        request
      );
    } catch (error) {
      console.error("Point History Report Error:", error);
      throw error;
    }
  },

  getOrderReport: async (request) => {
    try {
      return await postWithAuth(
        `${REPORT_ENDPOINT}/order`,
        request
      );
    } catch (error) {
      console.error("Order Report Error:", error);
      throw error;
    }
  },

  getAuditLogReport: async (request) => {
    try {
      return await postWithAuth(
        `${REPORT_ENDPOINT}/audit-log`,
        request
      );
    } catch (error) {
      console.error("Audit Log Report Error:", error);
      throw error;
    }
  },
};

export default reportService;