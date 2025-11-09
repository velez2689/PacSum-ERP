/**
 * Authorization Middleware
 * Role-based access control and permission checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/auth';
import { InsufficientPermissionsError, OrganizationAccessDeniedError } from '@/lib/errors/auth-errors';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthorizedUser {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  sessionId: string;
}

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.ACCOUNTANT]: 2,
  [UserRole.USER]: 1,
};

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Require specific role middleware
 */
export async function requireRole(
  request: NextRequest,
  user: AuthorizedUser,
  requiredRole: UserRole,
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  if (!hasRole(user.role, requiredRole)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: `This action requires ${requiredRole} role or higher`,
          code: 'INSUFFICIENT_PERMISSIONS',
          statusCode: 403,
          details: { requiredRole },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 403 }
    );
  }

  return handler(request, user);
}

/**
 * Require admin role
 */
export async function requireAdmin(
  request: NextRequest,
  user: AuthorizedUser,
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireRole(request, user, UserRole.ADMIN, handler);
}

/**
 * Require accountant role or higher
 */
export async function requireAccountant(
  request: NextRequest,
  user: AuthorizedUser,
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireRole(request, user, UserRole.ACCOUNTANT, handler);
}

/**
 * Check if user has access to organization
 */
export async function hasOrganizationAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Get user's organization
  const { data: user } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (!user) {
    return false;
  }

  // Admins can access any organization
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // Users can only access their own organization
  return user.organization_id === organizationId;
}

/**
 * Require organization access middleware
 */
export async function requireOrganizationAccess(
  request: NextRequest,
  user: AuthorizedUser,
  organizationId: string,
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const hasAccess = await hasOrganizationAccess(user.id, organizationId);

  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Access to this organization is denied',
          code: 'ORGANIZATION_ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 403 }
    );
  }

  return handler(request, user);
}

/**
 * Check if user owns a resource
 */
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Map resource types to database tables and columns
  const resourceMap: Record<string, { table: string; userColumn: string }> = {
    transaction: { table: 'transactions', userColumn: 'created_by' },
    client: { table: 'clients', userColumn: 'created_by' },
    document: { table: 'documents', userColumn: 'uploaded_by' },
  };

  const resource = resourceMap[resourceType];
  if (!resource) {
    return false;
  }

  const { data } = await supabase
    .from(resource.table)
    .select(resource.userColumn)
    .eq('id', resourceId)
    .single();

  return data?.[resource.userColumn] === userId;
}

/**
 * Require resource ownership or admin
 */
export async function requireOwnershipOrAdmin(
  request: NextRequest,
  user: AuthorizedUser,
  resourceType: string,
  resourceId: string,
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  // Admins can access any resource
  if (user.role === UserRole.ADMIN) {
    return handler(request, user);
  }

  // Check ownership
  const isOwner = await isResourceOwner(user.id, resourceType, resourceId);

  if (!isOwner) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'You do not have permission to access this resource',
          code: 'INSUFFICIENT_PERMISSIONS',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 403 }
    );
  }

  return handler(request, user);
}

/**
 * Check custom permission
 */
export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  // Get user role and check permissions
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (!user) {
    return false;
  }

  // Define role-based permissions
  const permissions: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: ['*'], // Admin has all permissions
    [UserRole.ACCOUNTANT]: [
      'transactions.read',
      'transactions.create',
      'transactions.update',
      'transactions.delete',
      'clients.read',
      'clients.create',
      'clients.update',
      'documents.read',
      'documents.upload',
      'reports.generate',
    ],
    [UserRole.USER]: [
      'transactions.read',
      'transactions.create',
      'clients.read',
      'documents.read',
    ],
  };

  const userPermissions = permissions[user.role as UserRole] || [];

  // Check if user has permission
  return userPermissions.includes('*') || userPermissions.includes(permission);
}

/**
 * Require custom permission middleware
 */
export async function requirePermission(
  request: NextRequest,
  user: AuthorizedUser,
  permission: string,
  handler: (request: NextRequest, user: AuthorizedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const hasAccess = await hasPermission(user.id, permission);

  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'You do not have permission to perform this action',
          code: 'INSUFFICIENT_PERMISSIONS',
          statusCode: 403,
          details: { requiredPermission: permission },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 403 }
    );
  }

  return handler(request, user);
}
