import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '@/lib/auth/server';
import {
  type AdminPackageItem,
  addTrustedUserServerFn,
  adminCreateScopeServerFn,
  approvePackageVersionServerFn,
  approveScopeRequestServerFn,
  assignRoleServerFn,
  createTagServerFn,
  deletePackageVersionServerFn,
  deleteTagServerFn,
  listAdminPackagesServerFn,
  listPendingPackagesServerFn,
  listScopeRequestsServerFn,
  listSubAppRolesServerFn,
  listTagsServerFn,
  listTrustedUsersServerFn,
  type PendingVersionItem,
  REGISTRY_SUBAPP_NAME,
  rejectPackageVersionServerFn,
  rejectScopeRequestServerFn,
  removeTrustedUserServerFn,
  revokeRoleServerFn,
  type ScopeRequestItem,
  searchUsersServerFn,
  type TagItem,
  type TrustedUserItem,
  type UserRoleItem,
  type UserWithRolesItem,
} from '@/lib/registry/admin';

const TAB_QUEUE = 'queue';
const TAB_TRUSTED = 'trusted';
const TAB_PACKAGES = 'packages';
const TAB_TAGS = 'tags';
const TAB_SCOPE_REQUESTS = 'scope-requests';
const TAB_ROLES = 'roles';

type TabType =
  | typeof TAB_QUEUE
  | typeof TAB_TRUSTED
  | typeof TAB_PACKAGES
  | typeof TAB_TAGS
  | typeof TAB_SCOPE_REQUESTS
  | typeof TAB_ROLES;

const STATUS_ALL = 'all';
const STATUS_APPROVED = 'approved';
const STATUS_PENDING = 'pending';
const STATUS_REJECTED = 'rejected';

type PackageStatusFilter =
  | typeof STATUS_ALL
  | typeof STATUS_APPROVED
  | typeof STATUS_PENDING
  | typeof STATUS_REJECTED;

const DEFAULT_REJECTION_REASON = 'Rejected by registry administrator';
const REGISTRY_ADMIN_ROLE = 'admin';

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const user = await fetchCurrentUser();
    if (!user) {
      throw redirect({ to: '/auth/login' });
    }
    const adminSubApps = Object.entries(user.roles ?? {})
      .filter(([_, role]) => role === REGISTRY_ADMIN_ROLE)
      .map(([subApp]) => subApp);
    if (adminSubApps.length === 0) {
      throw notFound();
    }
    return { user, adminSubApps };
  },
  loader: async ({ context }) => {
    const hasRegistryAdmin =
      context.user.roles?.[REGISTRY_SUBAPP_NAME] === REGISTRY_ADMIN_ROLE;

    const [
      pending,
      trusted,
      packages,
      tags,
      roles,
      initialUsers,
      scopeRequests,
    ] = await Promise.all([
      hasRegistryAdmin
        ? listPendingPackagesServerFn().catch(() => [])
        : Promise.resolve([]),
      hasRegistryAdmin
        ? listTrustedUsersServerFn().catch(() => [])
        : Promise.resolve([]),
      hasRegistryAdmin
        ? listAdminPackagesServerFn({ data: { status: STATUS_ALL } }).catch(
            () => [],
          )
        : Promise.resolve([]),
      hasRegistryAdmin
        ? listTagsServerFn().catch(() => [])
        : Promise.resolve([]),
      hasRegistryAdmin
        ? listSubAppRolesServerFn({
            data: { subApp: REGISTRY_SUBAPP_NAME },
          }).catch(() => [])
        : Promise.resolve([]),
      searchUsersServerFn({ data: {} }).catch(() => []),
      hasRegistryAdmin
        ? listScopeRequestsServerFn().catch(() => [])
        : Promise.resolve([]),
    ]);
    return {
      pending,
      trusted,
      packages,
      tags,
      roles,
      initialUsers,
      scopeRequests,
    };
  },
  component: AdminDashboardComponent,
});

function AdminDashboardComponent() {
  const router = useRouter();
  const { user, adminSubApps } = Route.useRouteContext();
  const loaderData = Route.useLoaderData();

  const hasRegistryAdmin =
    user.roles?.[REGISTRY_SUBAPP_NAME] === REGISTRY_ADMIN_ROLE;

  const defaultTab: TabType = hasRegistryAdmin ? TAB_QUEUE : TAB_ROLES;
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [pendingList, setPendingList] = useState<PendingVersionItem[]>(
    loaderData.pending,
  );
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});

  const [trustedList, setTrustedList] = useState<TrustedUserItem[]>(
    loaderData.trusted,
  );
  const [newTrustedUserId, setNewTrustedUserId] = useState('');

  const [packagesList, setPackagesList] = useState<AdminPackageItem[]>(
    loaderData.packages,
  );
  const [statusFilter, setStatusFilter] =
    useState<PackageStatusFilter>(STATUS_ALL);

  const [tagsList, setTagsList] = useState<TagItem[]>(loaderData.tags);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDisplayName, setNewTagDisplayName] = useState('');
  const [newTagParentId, setNewTagParentId] = useState('');

  const [_rolesList, setRolesList] = useState<UserRoleItem[]>(loaderData.roles);
  const initialAdminSubApp = adminSubApps[0] ?? REGISTRY_SUBAPP_NAME;
  const [targetUserId, setTargetUserId] = useState('');
  const [targetSubApp, setTargetSubApp] = useState(initialAdminSubApp);
  const [targetRole, setTargetRole] = useState<'admin' | 'user'>('admin');

  const [usersList, setUsersList] = useState<UserWithRolesItem[]>(
    loaderData.initialUsers ?? [],
  );
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRolesItem | null>(
    null,
  );
  const [configuredSubApp, setConfiguredSubApp] =
    useState<string>(initialAdminSubApp);
  const [configuredRole, setConfiguredRole] = useState<'admin' | 'user'>(
    'admin',
  );

  const [scopeRequestsList, setScopeRequestsList] = useState<
    ScopeRequestItem[]
  >(loaderData.scopeRequests ?? []);
  const [scopeRejectionReasons, setScopeRejectionReasons] = useState<
    Record<string, string>
  >({});
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeDesc, setNewScopeDesc] = useState('');
  const [newScopeOwnerId, setNewScopeOwnerId] = useState('');

  useEffect(() => {
    setPendingList(loaderData.pending);
    setTrustedList(loaderData.trusted);
    setPackagesList(loaderData.packages);
    setTagsList(loaderData.tags);
    setRolesList(loaderData.roles);
    setUsersList(loaderData.initialUsers ?? []);
    setScopeRequestsList(loaderData.scopeRequests ?? []);
  }, [loaderData]);

  useEffect(() => {
    if (!hasRegistryAdmin && activeTab !== TAB_ROLES) {
      setActiveTab(TAB_ROLES);
    }
  }, [hasRegistryAdmin, activeTab]);

  const clearNotifications = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleApprove = async (name: string, version: string) => {
    clearNotifications();
    try {
      const res = await approvePackageVersionServerFn({
        data: { name, version },
      });
      setPendingList((prev) =>
        prev.filter((p) => !(p.name === name && p.version === version)),
      );
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReject = async (name: string, version: string) => {
    clearNotifications();
    const reasonKey = `${name}@${version}`;
    const reason =
      rejectionReasons[reasonKey]?.trim() || DEFAULT_REJECTION_REASON;
    try {
      const res = await rejectPackageVersionServerFn({
        data: { name, version, reason },
      });
      setPendingList((prev) =>
        prev.filter((p) => !(p.name === name && p.version === version)),
      );
      setSuccessMessage(`${res.message} (Reason: ${res.reason})`);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddTrusted = async (e: React.SubmitEvent) => {
    e.preventDefault();
    clearNotifications();
    if (!newTrustedUserId.trim()) {
      setErrorMessage('User ID is required');
      return;
    }
    try {
      const added = await addTrustedUserServerFn({
        data: { userId: newTrustedUserId.trim() },
      });
      setTrustedList((prev) => [added, ...prev]);
      setNewTrustedUserId('');
      setSuccessMessage(
        `Granted trusted publisher status to user ${added.userId}`,
      );
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemoveTrusted = async (userId: string) => {
    clearNotifications();
    try {
      const res = await removeTrustedUserServerFn({ data: { userId } });
      setTrustedList((prev) => prev.filter((t) => t.userId !== userId));
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFilterStatus = async (status: PackageStatusFilter) => {
    setStatusFilter(status);
    clearNotifications();
    try {
      const pkgs = await listAdminPackagesServerFn({ data: { status } });
      setPackagesList(pkgs);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeletePackageVersion = async (name: string, version: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${name}@${version}? This will permanently remove storage files.`,
      )
    ) {
      return;
    }
    clearNotifications();
    try {
      const res = await deletePackageVersionServerFn({
        data: { name, version },
      });
      setSuccessMessage(res.message);
      const updated = await listAdminPackagesServerFn({
        data: { status: statusFilter },
      });
      setPackagesList(updated);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCreateTag = async (e: React.SubmitEvent) => {
    e.preventDefault();
    clearNotifications();
    if (!newTagName.trim() || !newTagDisplayName.trim()) {
      setErrorMessage('Tag name and display name are required');
      return;
    }
    try {
      const created = await createTagServerFn({
        data: {
          name: newTagName.trim(),
          displayName: newTagDisplayName.trim(),
          parentId: newTagParentId.trim() ? newTagParentId.trim() : null,
        },
      });
      setTagsList((prev) => [created, ...prev]);
      setNewTagName('');
      setNewTagDisplayName('');
      setNewTagParentId('');
      setSuccessMessage(`Tag '${created.name}' created successfully`);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!window.confirm(`Delete tag '${name}'?`)) return;
    clearNotifications();
    try {
      const res = await deleteTagServerFn({ data: { id } });
      setTagsList((prev) => prev.filter((t) => t.id !== id));
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSearchUsers = async (e?: React.SubmitEvent) => {
    if (e) e.preventDefault();
    clearNotifications();
    setIsSearchingUsers(true);
    try {
      const results = await searchUsersServerFn({
        data: { query: userSearchQuery },
      });
      setUsersList(results);
      if (selectedUser) {
        const refreshedSelected = results.find((u) => u.id === selectedUser.id);
        if (refreshedSelected) {
          setSelectedUser(refreshedSelected);
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleResetUserSearch = async () => {
    setUserSearchQuery('');
    clearNotifications();
    setIsSearchingUsers(true);
    try {
      const results = await searchUsersServerFn({ data: {} });
      setUsersList(results);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleAssignRoleForUser = async (
    userId: string,
    subApp: string,
    role: 'admin' | 'user',
  ) => {
    clearNotifications();
    const cleanUserId = userId.trim();
    const cleanSubApp = subApp.trim();
    if (!cleanUserId || !cleanSubApp) {
      setErrorMessage('User ID and Sub-App are required');
      return;
    }
    try {
      const res = await assignRoleServerFn({
        data: {
          userId: cleanUserId,
          subApp: cleanSubApp,
          role,
        },
      });

      setRolesList((prev) => [
        res.role,
        ...prev.filter(
          (r) =>
            !(r.userId === res.role.userId && r.subApp === res.role.subApp),
        ),
      ]);

      setUsersList((prev) =>
        prev.map((u) => {
          if (u.id !== cleanUserId) return u;
          const updatedRoles = [
            res.role,
            ...u.roles.filter((r) => r.subApp !== cleanSubApp),
          ];
          return { ...u, roles: updatedRoles };
        }),
      );

      setSelectedUser((prev) => {
        if (!prev || prev.id !== cleanUserId) return prev;
        const updatedRoles = [
          res.role,
          ...prev.roles.filter((r) => r.subApp !== cleanSubApp),
        ];
        return { ...prev, roles: updatedRoles };
      });

      setSuccessMessage(
        `Assigned role '${res.role.role}' in '${res.role.subApp}' to user ${res.role.userId}`,
      );
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRevokeRoleForUser = async (userId: string, subApp: string) => {
    clearNotifications();
    const cleanUserId = userId.trim();
    const cleanSubApp = subApp.trim();
    try {
      const res = await revokeRoleServerFn({
        data: { userId: cleanUserId, subApp: cleanSubApp },
      });

      setRolesList((prev) =>
        prev.filter(
          (r) => !(r.userId === cleanUserId && r.subApp === cleanSubApp),
        ),
      );

      setUsersList((prev) =>
        prev.map((u) => {
          if (u.id !== cleanUserId) return u;
          return {
            ...u,
            roles: u.roles.filter((r) => r.subApp !== cleanSubApp),
          };
        }),
      );

      setSelectedUser((prev) => {
        if (!prev || prev.id !== cleanUserId) return prev;
        return {
          ...prev,
          roles: prev.roles.filter((r) => r.subApp !== cleanSubApp),
        };
      });

      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleApproveScopeRequest = async (id: string) => {
    clearNotifications();
    try {
      const res = await approveScopeRequestServerFn({ data: { id } });
      setScopeRequestsList((prev) => prev.filter((r) => r.id !== id));
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRejectScopeRequest = async (id: string) => {
    clearNotifications();
    const reason = scopeRejectionReasons[id]?.trim() || 'Rejected by admin';
    try {
      const res = await rejectScopeRequestServerFn({ data: { id, reason } });
      setScopeRequestsList((prev) => prev.filter((r) => r.id !== id));
      setSuccessMessage(`${res.message} (Reason: ${res.rejectionReason})`);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAdminCreateScope = async (e: React.SubmitEvent) => {
    e.preventDefault();
    clearNotifications();
    const name = newScopeName.trim();
    if (!name.startsWith('@')) {
      setErrorMessage('Scope name must start with "@"');
      return;
    }
    try {
      const res = await adminCreateScopeServerFn({
        data: {
          name,
          description: newScopeDesc.trim() || undefined,
          ownerId: newScopeOwnerId.trim() || undefined,
        },
      });
      setSuccessMessage(`Scope "${res.scope.name}" created successfully`);
      setNewScopeName('');
      setNewScopeDesc('');
      setNewScopeOwnerId('');
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAssignRole = async (e: React.SubmitEvent) => {
    e.preventDefault();
    await handleAssignRoleForUser(targetUserId, targetSubApp, targetRole);
    setTargetUserId('');
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === STATUS_APPROVED) {
      return {
        backgroundColor: '#dcfce7',
        color: '#15803d',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
      };
    }
    if (status === STATUS_PENDING) {
      return {
        backgroundColor: '#fef3c7',
        color: '#b45309',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
      };
    }
    if (status === STATUS_REJECTED) {
      return {
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
      };
    }
    return {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.85rem',
    };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Administration Dashboard</h1>

      <div
        style={{
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            Tester Session: {user.name} ({user.email})
          </p>
          <p
            style={{
              margin: '0.25rem 0 0',
              fontSize: '0.85rem',
              color: '#4b5563',
            }}
          >
            User ID: <code>{user.id}</code> | Roles:{' '}
            {JSON.stringify(user.roles ?? {})}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          {successMessage}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {hasRegistryAdmin && (
          <>
            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setActiveTab(TAB_QUEUE);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                border: 'none',
                borderBottom:
                  activeTab === TAB_QUEUE ? '3px solid #2563eb' : 'none',
                fontWeight: activeTab === TAB_QUEUE ? 'bold' : 'normal',
                backgroundColor: 'transparent',
              }}
            >
              1. Moderation Queue ({pendingList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setActiveTab(TAB_TRUSTED);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                border: 'none',
                borderBottom:
                  activeTab === TAB_TRUSTED ? '3px solid #2563eb' : 'none',
                fontWeight: activeTab === TAB_TRUSTED ? 'bold' : 'normal',
                backgroundColor: 'transparent',
              }}
            >
              2. Trusted Publishers ({trustedList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setActiveTab(TAB_PACKAGES);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                border: 'none',
                borderBottom:
                  activeTab === TAB_PACKAGES ? '3px solid #2563eb' : 'none',
                fontWeight: activeTab === TAB_PACKAGES ? 'bold' : 'normal',
                backgroundColor: 'transparent',
              }}
            >
              3. Packages Explorer & Deletion ({packagesList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setActiveTab(TAB_TAGS);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                border: 'none',
                borderBottom:
                  activeTab === TAB_TAGS ? '3px solid #2563eb' : 'none',
                fontWeight: activeTab === TAB_TAGS ? 'bold' : 'normal',
                backgroundColor: 'transparent',
              }}
            >
              4. Tag Taxonomy ({tagsList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setActiveTab(TAB_SCOPE_REQUESTS);
              }}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                border: 'none',
                borderBottom:
                  activeTab === TAB_SCOPE_REQUESTS
                    ? '3px solid #2563eb'
                    : 'none',
                fontWeight:
                  activeTab === TAB_SCOPE_REQUESTS ? 'bold' : 'normal',
                backgroundColor: 'transparent',
              }}
            >
              5. Scope Requests ({scopeRequestsList.length})
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => {
            clearNotifications();
            setActiveTab(TAB_ROLES);
          }}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            border: 'none',
            borderBottom:
              activeTab === TAB_ROLES ? '3px solid #2563eb' : 'none',
            fontWeight: activeTab === TAB_ROLES ? 'bold' : 'normal',
            backgroundColor: 'transparent',
          }}
        >
          {hasRegistryAdmin
            ? `6. Ecosystem Roles (${usersList.length} users)`
            : `1. Sub-App Roles (${usersList.length} users)`}
        </button>
      </div>

      {activeTab === TAB_QUEUE && hasRegistryAdmin && (
        <section>
          <h2>Pending Review Queue</h2>
          <p style={{ color: '#4b5563' }}>
            Package versions submitted by non-trusted users await moderation
            before becoming active in the public registry.
          </p>
          {pendingList.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>
              No packages currently awaiting review.
            </p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '1rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>Package</th>
                  <th style={{ padding: '0.5rem' }}>Version</th>
                  <th style={{ padding: '0.5rem' }}>Author ID</th>
                  <th style={{ padding: '0.5rem' }}>Files</th>
                  <th style={{ padding: '0.5rem' }}>Submitted At</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((item) => {
                  const reasonKey = `${item.name}@${item.version}`;
                  return (
                    <tr
                      key={item.versionId}
                      style={{ borderBottom: '1px solid #e5e7eb' }}
                    >
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                        {item.name}
                        {item.displayName ? (
                          <span
                            style={{ fontWeight: 'normal', color: '#6b7280' }}
                          >
                            {' '}
                            ({item.displayName})
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <code>{item.version}</code>
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                        <code>{item.authorId}</code>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        {item.fileCount} files
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleApprove(item.name, item.version)
                            }
                            style={{
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                          <input
                            type="text"
                            placeholder="Rejection reason"
                            value={rejectionReasons[reasonKey] ?? ''}
                            onChange={(e) =>
                              setRejectionReasons((prev) => ({
                                ...prev,
                                [reasonKey]: e.target.value,
                              }))
                            }
                            style={{
                              padding: '0.3rem',
                              fontSize: '0.85rem',
                              width: '180px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleReject(item.name, item.version)
                            }
                            style={{
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activeTab === TAB_TRUSTED && hasRegistryAdmin && (
        <section>
          <h2>Trusted Publishers Management</h2>
          <p style={{ color: '#4b5563' }}>
            Users with trusted publisher status bypass the moderation queue.
            Their package uploads are automatically approved.
          </p>

          <form
            onSubmit={handleAddTrusted}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <input
              type="text"
              placeholder="User UUID (e.g. 123e4567-e89b-...)"
              value={newTrustedUserId}
              onChange={(e) => setNewTrustedUserId(e.target.value)}
              required
              style={{ padding: '0.4rem 0.6rem', width: '360px' }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Grant Trusted Status
            </button>
          </form>

          {trustedList.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>
              No trusted publishers registered.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>User ID</th>
                  <th style={{ padding: '0.5rem' }}>Granted By</th>
                  <th style={{ padding: '0.5rem' }}>Granted At</th>
                  <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {trustedList.map((item) => (
                  <tr
                    key={item.userId}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '0.5rem' }}>
                      <code>{item.userId}</code>
                      {item.userId === user.id ? (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            fontWeight: 'bold',
                            color: '#16a34a',
                          }}
                        >
                          (You)
                        </span>
                      ) : null}
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      <code>{item.grantedBy}</code>
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrusted(item.userId)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #f87171',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Revoke Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activeTab === TAB_PACKAGES && hasRegistryAdmin && (
        <section>
          <h2>All Packages Explorer & Deletion</h2>
          <p style={{ color: '#4b5563' }}>
            Audit all packages across every state (approved, pending, rejected).
            Delete test versions to clean up database records and S3 assets.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold', alignSelf: 'center' }}>
              Filter Status:
            </span>
            {(
              [
                STATUS_ALL,
                STATUS_APPROVED,
                STATUS_PENDING,
                STATUS_REJECTED,
              ] as PackageStatusFilter[]
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleFilterStatus(st)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border:
                    statusFilter === st
                      ? '2px solid #2563eb'
                      : '1px solid #d1d5db',
                  backgroundColor: statusFilter === st ? '#eff6ff' : '#ffffff',
                  fontWeight: statusFilter === st ? 'bold' : 'normal',
                }}
              >
                {st.toUpperCase()}
              </button>
            ))}
          </div>

          {packagesList.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>
              No packages found with status '{statusFilter}'.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Latest Version</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Rejection Details</th>
                  <th style={{ padding: '0.5rem' }}>Author</th>
                  <th style={{ padding: '0.5rem' }}>Tags</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packagesList.map((pkg) => (
                  <tr
                    key={pkg.id}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                      <a
                        href={`/registry/${pkg.name}`}
                        style={{ color: '#2563eb' }}
                      >
                        {pkg.name}
                      </a>
                      {pkg.displayName ? (
                        <div
                          style={{
                            fontWeight: 'normal',
                            fontSize: '0.85rem',
                            color: '#6b7280',
                          }}
                        >
                          {pkg.displayName}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <code>{pkg.latestVersion ?? 'none'}</code>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={getStatusBadgeStyle(pkg.status)}>
                        {pkg.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#b91c1c',
                      }}
                    >
                      {pkg.rejectionReason ?? '—'}
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      <code>{pkg.authorId}</code>
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      {pkg.tags && pkg.tags.length > 0
                        ? pkg.tags.join(', ')
                        : 'none'}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {(() => {
                        const ver = pkg.latestVersion;
                        if (!ver) {
                          return (
                            <span
                              style={{ color: '#9ca3af', fontSize: '0.85rem' }}
                            >
                              No version
                            </span>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeletePackageVersion(pkg.name, ver)
                            }
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #f87171',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                            }}
                          >
                            Delete v{ver}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activeTab === TAB_TAGS && hasRegistryAdmin && (
        <section>
          <h2>Tag Taxonomy Management</h2>
          <p style={{ color: '#4b5563' }}>
            Manage category tags used for package indexing and discovery across
            the registry.
          </p>

          <form
            onSubmit={handleCreateTag}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Tag Slug (e.g. templates)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              required
              style={{ padding: '0.4rem 0.6rem', width: '200px' }}
            />
            <input
              type="text"
              placeholder="Display Name (e.g. Report Templates)"
              value={newTagDisplayName}
              onChange={(e) => setNewTagDisplayName(e.target.value)}
              required
              style={{ padding: '0.4rem 0.6rem', width: '220px' }}
            />
            <input
              type="text"
              placeholder="Optional Parent Tag ID"
              value={newTagParentId}
              onChange={(e) => setNewTagParentId(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', width: '220px' }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Create Tag
            </button>
          </form>

          {tagsList.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>No tags defined.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>Slug</th>
                  <th style={{ padding: '0.5rem' }}>Display Name</th>
                  <th style={{ padding: '0.5rem' }}>Parent Tag ID</th>
                  <th style={{ padding: '0.5rem' }}>Tag ID</th>
                  <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tagsList.map((tag) => (
                  <tr
                    key={tag.id}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                      {tag.name}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{tag.displayName}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      {tag.parentId ? (
                        <code>{tag.parentId}</code>
                      ) : (
                        'none (root)'
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      <code>{tag.id}</code>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #f87171',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete Tag
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {activeTab === TAB_SCOPE_REQUESTS && hasRegistryAdmin && (
        <section>
          <h2>Scope Requests Moderation</h2>
          <p style={{ color: '#4b5563' }}>
            Review pending requests for custom package scopes and manage scope
            ownership.
          </p>

          <h3>Pending Custom Scope Requests</h3>
          {scopeRequestsList.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>No pending scope requests.</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '2rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>Scope Name</th>
                  <th style={{ padding: '0.5rem' }}>Requester User ID</th>
                  <th style={{ padding: '0.5rem' }}>Reason</th>
                  <th style={{ padding: '0.5rem' }}>Requested At</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scopeRequestsList.map((req) => (
                  <tr
                    key={req.id}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                      {req.scopeName}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <code>{req.requestedBy}</code>
                    </td>
                    <td style={{ padding: '0.5rem' }}>{req.reason}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '0.5rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleApproveScopeRequest(req.id)}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={scopeRejectionReasons[req.id] ?? ''}
                        onChange={(e) =>
                          setScopeRejectionReasons((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                        style={{
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.85rem',
                          width: '160px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRejectScopeRequest(req.id)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #f87171',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Direct Custom Scope Creation</h3>
          <form
            onSubmit={handleAdminCreateScope}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxWidth: '500px',
              border: '1px solid #e5e7eb',
              padding: '1rem',
              borderRadius: '6px',
            }}
          >
            <label>
              Scope Name (must start with @):
              <input
                type="text"
                placeholder="@myorg"
                value={newScopeName}
                onChange={(e) => setNewScopeName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  marginTop: '0.25rem',
                }}
              />
            </label>
            <label>
              Description:
              <input
                type="text"
                placeholder="Organization scope for..."
                value={newScopeDesc}
                onChange={(e) => setNewScopeDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  marginTop: '0.25rem',
                }}
              />
            </label>
            <label>
              Owner User ID (optional, defaults to yourself):
              <input
                type="text"
                placeholder="UUID of target owner"
                value={newScopeOwnerId}
                onChange={(e) => setNewScopeOwnerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  marginTop: '0.25rem',
                }}
              />
            </label>
            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              Create Scope
            </button>
          </form>
        </section>
      )}

      {activeTab === TAB_ROLES && (
        <section>
          <h2>User Search & Ecosystem Roles Configuration</h2>
          <p style={{ color: '#4b5563' }}>
            Search registered users and configure their roles across all
            sub-apps in the UNSAReport ecosystem (e.g. <code>registry</code>,{' '}
            <code>slides</code>).
          </p>

          <form
            onSubmit={handleSearchUsers}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Search by name, email, or user UUID..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', width: '380px' }}
            />
            <button
              type="submit"
              disabled={isSearchingUsers}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {isSearchingUsers ? 'Searching...' : 'Search Users'}
            </button>
            <button
              type="button"
              onClick={handleResetUserSearch}
              disabled={isSearchingUsers}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Show All / Recent
            </button>
          </form>

          {selectedUser ? (
            <div
              style={{
                border: '2px solid #2563eb',
                backgroundColor: '#eff6ff',
                padding: '1.25rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ margin: 0, color: '#1e40af' }}>
                  Configuring Roles: {selectedUser.name} ({selectedUser.email})
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '1rem',
                  }}
                >
                  ✕ Close
                </button>
              </div>
              <p
                style={{
                  margin: '0.25rem 0 1rem',
                  fontSize: '0.85rem',
                  color: '#4b5563',
                }}
              >
                User ID: <code>{selectedUser.id}</code>
                {selectedUser.id === user.id ? (
                  <span
                    style={{
                      marginLeft: '0.5rem',
                      fontWeight: 'bold',
                      color: '#16a34a',
                    }}
                  >
                    (Your Session)
                  </span>
                ) : null}
              </p>

              <h4 style={{ margin: '0.5rem 0' }}>Current Ecosystem Roles:</h4>
              {selectedUser.roles.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#6b7280' }}>
                  No roles currently assigned across any ecosystem sub-app
                  (standard unprivileged user).
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem',
                  }}
                >
                  {selectedUser.roles.map((r) => (
                    <div
                      key={r.subApp}
                      style={{
                        border: '1px solid #93c5fd',
                        backgroundColor: '#ffffff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span>
                        <strong>{r.subApp}</strong>:{' '}
                        <code
                          style={{
                            fontWeight: 'bold',
                            color: r.role === 'admin' ? '#dc2626' : '#2563eb',
                          }}
                        >
                          {r.role}
                        </code>
                      </span>
                      {adminSubApps.includes(r.subApp) ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleAssignRoleForUser(
                                selectedUser.id,
                                r.subApp,
                                r.role === 'admin' ? 'user' : 'admin',
                              )
                            }
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.4rem',
                              cursor: 'pointer',
                            }}
                          >
                            Switch to {r.role === 'admin' ? 'user' : 'admin'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRevokeRoleForUser(selectedUser.id, r.subApp)
                            }
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.4rem',
                              cursor: 'pointer',
                              color: '#b91c1c',
                              backgroundColor: '#fee2e2',
                              border: '1px solid #f87171',
                              borderRadius: '3px',
                            }}
                          >
                            Revoke
                          </button>
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontStyle: 'italic',
                          }}
                        >
                          (managed by {r.subApp} admin)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <h4 style={{ margin: '0.75rem 0 0.5rem' }}>
                Assign or Update Sub-App Role:
              </h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const finalSubApp = configuredSubApp.trim();
                  if (!finalSubApp) {
                    setErrorMessage('Sub-app name is required');
                    return;
                  }
                  handleAssignRoleForUser(
                    selectedUser.id,
                    finalSubApp,
                    configuredRole,
                  );
                }}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <label
                  htmlFor="configuredSubAppSelect"
                  style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Sub-App:
                </label>
                <select
                  id="configuredSubAppSelect"
                  value={configuredSubApp}
                  onChange={(e) => setConfiguredSubApp(e.target.value)}
                  style={{ padding: '0.35rem 0.5rem' }}
                >
                  {adminSubApps.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor="configuredRoleSelect"
                  style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Role:
                </label>
                <select
                  id="configuredRoleSelect"
                  value={configuredRole}
                  onChange={(e) =>
                    setConfiguredRole(e.target.value as 'admin' | 'user')
                  }
                  style={{ padding: '0.35rem 0.5rem' }}
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Save Role
                </button>
              </form>
            </div>
          ) : null}

          <h3>Registered Users Directory ({usersList.length})</h3>
          {usersList.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>
              No registered users found matching the query.
            </p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '0.5rem',
                marginBottom: '2rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>User</th>
                  <th style={{ padding: '0.5rem' }}>User UUID</th>
                  <th style={{ padding: '0.5rem' }}>Ecosystem Roles</th>
                  <th style={{ padding: '0.5rem' }}>Registered At</th>
                  <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.5rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                          {u.email}
                        </div>
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                        <code>{u.id}</code>
                        {u.id === user.id ? (
                          <span
                            style={{
                              marginLeft: '0.5rem',
                              fontWeight: 'bold',
                              color: '#16a34a',
                            }}
                          >
                            (You)
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        {u.roles.length === 0 ? (
                          <span
                            style={{ color: '#9ca3af', fontSize: '0.85rem' }}
                          >
                            none
                          </span>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              gap: '0.35rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            {u.roles.map((r) => (
                              <span
                                key={r.subApp}
                                style={{
                                  backgroundColor:
                                    r.role === 'admin' ? '#fee2e2' : '#f3f4f6',
                                  color:
                                    r.role === 'admin' ? '#b91c1c' : '#374151',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '3px',
                                  fontSize: '0.8rem',
                                  fontWeight:
                                    r.role === 'admin' ? 'bold' : 'normal',
                                }}
                              >
                                {r.subApp}: {r.role}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          style={{
                            backgroundColor: isSelected ? '#1e40af' : '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Configure Roles'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <details style={{ marginTop: '1rem', color: '#4b5563' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Direct UUID Role Assignment (Manual)
            </summary>
            <div style={{ marginTop: '0.5rem' }}>
              <form
                onSubmit={handleAssignRole}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                }}
              >
                <input
                  type="text"
                  placeholder="Target User ID"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required
                  style={{ padding: '0.4rem 0.6rem', width: '320px' }}
                />
                <select
                  value={targetSubApp}
                  onChange={(e) => setTargetSubApp(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  {adminSubApps.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
                <select
                  value={targetRole}
                  onChange={(e) =>
                    setTargetRole(e.target.value as 'admin' | 'user')
                  }
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Assign Role
                </button>
              </form>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
