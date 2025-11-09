/**
 * QuickBooks Integration Types
 * TypeScript interfaces for QuickBooks Online API
 */

/**
 * OAuth Types
 */
export interface QBOAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  id_token?: string;
  realmId: string;
}

export interface QBOAuthState {
  organizationId: string;
  userId?: string;
  returnUrl?: string;
  nonce: string;
}

/**
 * QuickBooks Entity Types
 */
export interface QBOCustomer {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: QBOAddress;
  ShipAddr?: QBOAddress;
  Balance: number;
  BalanceWithJobs: number;
  Active: boolean;
  Taxable?: boolean;
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOVendor {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: QBOAddress;
  Balance: number;
  Active: boolean;
  Vendor1099?: boolean;
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate?: string;
  CustomerRef: {
    value: string;
    name?: string;
  };
  Line: QBOInvoiceLine[];
  TxnTaxDetail?: {
    TotalTax: number;
  };
  TotalAmt: number;
  Balance: number;
  EmailStatus?: string;
  BillEmail?: {
    Address: string;
  };
  MetaData: QBOMetaData;
  SyncToken: string;
  CustomField?: QBOCustomField[];
}

export interface QBOInvoiceLine {
  Id?: string;
  LineNum?: number;
  Description?: string;
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail';
  SalesItemLineDetail?: {
    ItemRef?: {
      value: string;
      name?: string;
    };
    Qty?: number;
    UnitPrice?: number;
    TaxCodeRef?: {
      value: string;
    };
  };
}

export interface QBOExpense {
  Id: string;
  DocNumber?: string;
  TxnDate: string;
  AccountRef: {
    value: string;
    name?: string;
  };
  PaymentType?: 'Cash' | 'Check' | 'CreditCard';
  EntityRef?: {
    value: string;
    name?: string;
    type: 'Customer' | 'Vendor' | 'Employee';
  };
  Line: QBOExpenseLine[];
  TotalAmt: number;
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOExpenseLine {
  Id?: string;
  Amount: number;
  DetailType: 'AccountBasedExpenseLineDetail';
  AccountBasedExpenseLineDetail: {
    AccountRef: {
      value: string;
      name?: string;
    };
    BillableStatus?: 'Billable' | 'NotBillable' | 'HasBeenBilled';
    TaxCodeRef?: {
      value: string;
    };
  };
  Description?: string;
}

export interface QBOPayment {
  Id: string;
  TxnDate: string;
  CustomerRef: {
    value: string;
    name?: string;
  };
  TotalAmt: number;
  UnappliedAmt?: number;
  DepositToAccountRef?: {
    value: string;
    name?: string;
  };
  PaymentMethodRef?: {
    value: string;
    name?: string;
  };
  Line?: QBOPaymentLine[];
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOPaymentLine {
  Amount: number;
  LinkedTxn?: Array<{
    TxnId: string;
    TxnType: string;
  }>;
}

export interface QBOAccount {
  Id: string;
  Name: string;
  AcctNum?: string;
  AccountType: string;
  AccountSubType: string;
  Classification: 'Asset' | 'Equity' | 'Expense' | 'Liability' | 'Revenue';
  CurrentBalance: number;
  Active: boolean;
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOItem {
  Id: string;
  Name: string;
  Description?: string;
  Active: boolean;
  Type: 'Inventory' | 'Service' | 'NonInventory';
  IncomeAccountRef?: {
    value: string;
    name?: string;
  };
  ExpenseAccountRef?: {
    value: string;
    name?: string;
  };
  UnitPrice?: number;
  PurchaseCost?: number;
  QtyOnHand?: number;
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOAddress {
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  Country?: string;
}

export interface QBOMetaData {
  CreateTime: string;
  LastUpdatedTime: string;
}

export interface QBOCustomField {
  DefinitionId: string;
  Name: string;
  Type: 'StringType' | 'DateType' | 'NumberType' | 'BooleanType';
  StringValue?: string;
  DateValue?: string;
  NumberValue?: number;
  BooleanValue?: boolean;
}

/**
 * API Response Types
 */
export interface QBOResponse<T> {
  QueryResponse?: {
    [key: string]: T[];
    startPosition: number;
    maxResults: number;
    totalCount?: number;
  };
  [key: string]: T | unknown;
  time: string;
}

export interface QBOBatchResponse {
  BatchItemResponse: Array<{
    bId: string;
    [key: string]: unknown;
  }>;
  time: string;
}

export interface QBOErrorResponse {
  Fault: {
    Error: Array<{
      Message: string;
      Detail: string;
      code: string;
      element?: string;
    }>;
    type: string;
  };
  time: string;
}

/**
 * Query Builder Types
 */
export interface QBOQueryOptions {
  select?: string[];
  where?: string;
  orderBy?: string;
  startPosition?: number;
  maxResults?: number;
}

export interface QBOSyncOptions {
  syncToken?: string;
  changedSince?: string;
  includeDeleted?: boolean;
}

/**
 * Webhook Types
 */
export interface QBOWebhookPayload {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: Array<{
        name: string;
        id: string;
        operation: 'Create' | 'Update' | 'Delete' | 'Merge' | 'Void';
        lastUpdated: string;
      }>;
    };
  }>;
}

export interface QBOWebhookVerificationPayload {
  verifier: string;
}

/**
 * Sync Types
 */
export interface QBOSyncResult<T> {
  synced: T[];
  created: number;
  updated: number;
  errors: Array<{
    entity: Partial<T>;
    error: string;
  }>;
}

export interface QBOCustomerSyncResult {
  customers: QBOCustomer[];
  created: number;
  updated: number;
  linked: number;
  errors: Array<{
    customer: Partial<QBOCustomer>;
    error: string;
  }>;
}

export interface QBOTransactionSyncResult {
  transactions: Array<QBOInvoice | QBOExpense | QBOPayment>;
  created: number;
  updated: number;
  errors: Array<{
    transaction: unknown;
    error: string;
  }>;
}

/**
 * Request Types
 */
export interface CreateQBOCustomerRequest {
  displayName: string;
  givenName?: string;
  familyName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  billAddr?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  taxable?: boolean;
  metadata?: Record<string, string>;
}

export interface CreateQBOInvoiceRequest {
  customerId: string;
  txnDate: string;
  dueDate?: string;
  lineItems: Array<{
    description: string;
    amount: number;
    quantity?: number;
    itemId?: string;
  }>;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface CreateQBOExpenseRequest {
  txnDate: string;
  accountId: string;
  amount: number;
  vendorId?: string;
  paymentType?: 'Cash' | 'Check' | 'CreditCard';
  lineItems: Array<{
    accountId: string;
    amount: number;
    description?: string;
  }>;
  metadata?: Record<string, string>;
}

export interface SyncCustomersRequest {
  organizationId: string;
  realmId: string;
  syncType: 'full' | 'incremental';
  changedSince?: string;
}

export interface SyncTransactionsRequest {
  organizationId: string;
  realmId: string;
  syncType: 'full' | 'incremental';
  changedSince?: string;
  entityTypes?: Array<'Invoice' | 'Expense' | 'Payment'>;
}

/**
 * Mapping Types
 */
export interface EntityMapping {
  pacsumId: string;
  quickbooksId: string;
  entityType: 'customer' | 'vendor' | 'invoice' | 'expense' | 'payment';
  syncToken: string;
  lastSynced: string;
}

/**
 * Company Info
 */
export interface QBOCompanyInfo {
  CompanyName: string;
  LegalName?: string;
  CompanyAddr?: QBOAddress;
  CustomerCommunicationAddr?: QBOAddress;
  LegalAddr?: QBOAddress;
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  Email?: {
    Address: string;
  };
  WebAddr?: {
    URI: string;
  };
  Country: string;
  FiscalYearStartMonth?: string;
  NameValue?: Array<{
    Name: string;
    Value: string;
  }>;
}

/**
 * Preferences
 */
export interface QBOPreferences {
  AccountingInfoPrefs?: {
    FirstMonthOfFiscalYear?: string;
    UseAccountNumbers?: boolean;
    TaxYearMonth?: string;
  };
  ProductAndServicesPrefs?: {
    ForSales?: boolean;
    ForPurchase?: boolean;
  };
  SalesFormsPrefs?: {
    DefaultTerms?: {
      value: string;
    };
    CustomTxnNumbers?: boolean;
  };
}

/**
 * Reports (for reconciliation)
 */
export interface QBOReport {
  Header: {
    ReportName: string;
    DateMacro?: string;
    StartPeriod?: string;
    EndPeriod?: string;
    Currency?: string;
    Time: string;
  };
  Columns: {
    Column: Array<{
      ColTitle: string;
      ColType: string;
      MetaData?: Array<{
        Name: string;
        Value: string;
      }>;
    }>;
  };
  Rows: {
    Row: QBOReportRow[];
  };
}

export interface QBOReportRow {
  type: 'Data' | 'Section';
  ColData?: Array<{
    value: string;
    id?: string;
  }>;
  Rows?: {
    Row: QBOReportRow[];
  };
  Header?: {
    ColData: Array<{
      value: string;
    }>;
  };
  Summary?: {
    ColData: Array<{
      value: string;
    }>;
  };
}
