/**
 * QuickBooks Entities Module
 * CRUD operations for QuickBooks entities
 */

import { createQuickBooksClient } from './client';
import { QBOCustomer, QBOInvoice, QBOExpense, CreateQBOCustomerRequest, CreateQBOInvoiceRequest, CreateQBOExpenseRequest } from './types';

export async function createCustomer(organizationId: string, request: CreateQBOCustomerRequest): Promise<QBOCustomer> {
  const client = await createQuickBooksClient(organizationId);

  const customer: Partial<QBOCustomer> = {
    DisplayName: request.displayName,
    GivenName: request.givenName,
    FamilyName: request.familyName,
    CompanyName: request.companyName,
    PrimaryEmailAddr: request.email ? { Address: request.email } : undefined,
    PrimaryPhone: request.phone ? { FreeFormNumber: request.phone } : undefined,
    BillAddr: request.billAddr ? {
      Line1: request.billAddr.line1,
      Line2: request.billAddr.line2,
      City: request.billAddr.city,
      CountrySubDivisionCode: request.billAddr.state,
      PostalCode: request.billAddr.postalCode,
      Country: request.billAddr.country || 'US',
    } : undefined,
    Taxable: request.taxable,
  };

  return client.create<QBOCustomer>('customer', customer);
}

export async function getCustomer(organizationId: string, customerId: string): Promise<QBOCustomer> {
  const client = await createQuickBooksClient(organizationId);
  return client.read<QBOCustomer>('customer', customerId);
}

export async function queryCustomers(organizationId: string, query?: string): Promise<QBOCustomer[]> {
  const client = await createQuickBooksClient(organizationId);
  const q = query || "SELECT * FROM Customer MAXRESULTS 1000";
  const response = await client.query<QBOCustomer>(q);
  return response.QueryResponse?.Customer || [];
}

export async function createInvoice(organizationId: string, request: CreateQBOInvoiceRequest): Promise<QBOInvoice> {
  const client = await createQuickBooksClient(organizationId);

  const invoice: Partial<QBOInvoice> = {
    CustomerRef: { value: request.customerId },
    TxnDate: request.txnDate,
    DueDate: request.dueDate,
    Line: request.lineItems.map((item, index) => ({
      LineNum: index + 1,
      Description: item.description,
      Amount: item.amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: item.itemId ? { value: item.itemId } : undefined,
        Qty: item.quantity || 1,
        UnitPrice: item.amount / (item.quantity || 1),
      },
    })),
    BillEmail: request.customerEmail ? { Address: request.customerEmail } : undefined,
  };

  return client.create<QBOInvoice>('invoice', invoice);
}

export async function createExpense(organizationId: string, request: CreateQBOExpenseRequest): Promise<QBOExpense> {
  const client = await createQuickBooksClient(organizationId);

  const expense: Partial<QBOExpense> = {
    TxnDate: request.txnDate,
    AccountRef: { value: request.accountId },
    TotalAmt: request.amount,
    PaymentType: request.paymentType || 'Cash',
    EntityRef: request.vendorId ? { value: request.vendorId, type: 'Vendor' } : undefined,
    Line: request.lineItems.map((item) => ({
      Amount: item.amount,
      DetailType: 'AccountBasedExpenseLineDetail',
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: item.accountId },
      },
      Description: item.description,
    })),
  };

  return client.create<QBOExpense>('purchase', expense);
}
