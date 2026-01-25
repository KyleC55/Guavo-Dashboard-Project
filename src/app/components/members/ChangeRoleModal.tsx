import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import Modal from '../modal';
import { Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toastSuccess, toast } from '../../utils/toast';
import { CHANGE_MEMBER_ROLE } from '../../graphql/mutations';
import { GET_MEMBER_BY_UUID, GET_ALL_MEMBERS } from '../../graphql/queries';
import { MemberRow } from './types';

interface ChangeRoleModalProps {
  open: boolean;
  onClose: () => void;
  member: MemberRow | null;
  currentRole?: string | null;
  onSuccess?: () => void;
}

// Available roles based on actual Keycloak groups
const AVAILABLE_ROLES = [
  { value: 'ADMIN', label: 'Admin', description: 'Full system access and management capabilities', group: '/CORPORATE/ADMIN', groupEnum: 'ADMIN' },
  { value: 'EMPLOYEE', label: 'Employee', description: 'Standard access to team resources', group: '/CORPORATE/EMPLOYEE', groupEnum: 'EMPLOYEE' },
  { value: 'OWNER', label: 'Owner', description: 'Full system access and management capabilities', group: '/CORPORATE/OWNER', groupEnum: 'OWNER' },
  { value: 'CORE', label: 'Core', description: 'Individual core membership', group: '/INDIVIDUAL/CORE', groupEnum: 'CORE' },
  { value: 'PREMIUM', label: 'Premium', description: 'Individual premium membership', group: '/INDIVIDUAL/PREMIUM', groupEnum: 'PREMIUM' },
  { value: 'SELECT', label: 'Select', description: 'Individual select membership', group: '/INDIVIDUAL/SELECT', groupEnum: 'SELECT' },
];

export function ChangeRoleModal({
  open,
  onClose,
  member,
  currentRole,
  onSuccess,
}: ChangeRoleModalProps) {
  // Extract role name from path (e.g., "/CORPORATE/ADMIN" -> "ADMIN")
  const getRoleFromPath = (rolePath: string | null | undefined): string => {
    if (!rolePath) return '';
    const parts = rolePath.split('/').filter(p => p);
    return parts[parts.length - 1] || '';
  };

  const currentRoleValue = getRoleFromPath(currentRole);
  const [selectedRole, setSelectedRole] = useState<string>(currentRoleValue || '');
  const [showReview, setShowReview] = useState(false);

  const [changeMemberRole, { loading: isSubmitting }] = useMutation(CHANGE_MEMBER_ROLE, {
    refetchQueries: [
      { query: GET_MEMBER_BY_UUID, variables: { uuid: member?.uuid } },
      { query: GET_ALL_MEMBERS, variables: { limit: 1000, offset: 0 } },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setShowReview(false);
      toastSuccess('Role updated successfully!', {
        description: `${member?.firstName} ${member?.lastName}'s role has been changed to ${AVAILABLE_ROLES.find(r => r.value === selectedRole)?.label}.`,
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('Error changing role:', error);
      setShowReview(false);
      toast('Failed to change role', {
        description: error.message || 'An error occurred while changing the role.',
      });
    },
  });

  const handleReview = () => {
    if (!member || !selectedRole) {
      toast('Please select a role');
      return;
    }

    if (selectedRole === currentRoleValue) {
      toast('User already has this role');
      return;
    }

    setShowReview(true);
  };

  const handleConfirmChangeRole = async () => {
    if (!member || !selectedRole) return;

    try {
      // Send the role value that maps to the GROUP enum (ADMIN, EMPLOYEE, OWNER, CORE, PREMIUM, SELECT)
      const selectedRoleConfig = AVAILABLE_ROLES.find(r => r.value === selectedRole);
      const roleToSend = selectedRoleConfig?.groupEnum || selectedRole;
      
      await changeMemberRole({
        variables: {
          memberUuid: member.uuid,
          role: roleToSend,
        },
      });
      // Don't set showReview to false here - let onCompleted handle it
    } catch (error: any) {
      // Error is handled by onError callback
      console.error('Error changing role:', error);
      // onError will handle closing the review modal
    }
  };

  const handleBackFromReview = () => {
    setShowReview(false);
  };

  const handleClose = () => {
    const resetRole = getRoleFromPath(currentRole);
    setSelectedRole(resetRole || '');
    setShowReview(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !showReview}
        onClose={handleClose}
        title="Change Role"
        size="md"
        showCloseButton={false}
      >
      <div className="space-y-6 py-4">
        {member && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Changing role for:</p>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-gray-600 mt-1">{member.email}</p>
              <div className="mt-2">
                <span className="text-xs text-gray-500">Current role: </span>
                {currentRoleValue ? (
                  <Badge variant="outline" className="ml-1">
                    {AVAILABLE_ROLES.find(r => r.value === currentRoleValue)?.label || currentRoleValue}
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-400 ml-1">N/A</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Select New Role
          </label>
          <div className="space-y-2">
            {AVAILABLE_ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`w-full text-left p-4 border rounded-lg transition-all ${
                  selectedRole === role.value
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedRole === role.value ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Shield className={`h-5 w-5 ${
                        selectedRole === role.value ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{role.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{role.group}</p>
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    </div>
                  </div>
                  {selectedRole === role.value && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReview}
            disabled={!selectedRole || selectedRole === currentRoleValue || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Confirm
          </Button>
        </div>
      </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={open && showReview}
        onClose={handleBackFromReview}
        title="Review Role Change"
        size="md"
        showCloseButton={false}
      >
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Member</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.firstName} {member.lastName}
                </p>
                <p className="text-xs text-gray-600 mt-1">{member.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Current Role</p>
                <p className="text-sm font-medium text-gray-900">
                  {currentRoleValue ? (AVAILABLE_ROLES.find(r => r.value === currentRoleValue)?.label || currentRoleValue) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">New Role</p>
                <p className="text-sm font-medium text-blue-600">
                  {AVAILABLE_ROLES.find(r => r.value === selectedRole)?.label || selectedRole}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBackFromReview}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmChangeRole}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Changing...' : 'Confirm Change Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

