import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - local workspace lacks luxon type declarations
import { DateTime } from 'luxon';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { EditUserModal } from './EditUserModal';
import { DeactivateUserModal } from './DeactivateUserModal';
import { ChangeRoleModal } from './ChangeRoleModal';
import Modal from '../modal';
import { GET_MEMBER_BY_UUID, GET_ALL_RESERVATIONS, GET_MEMBER_TEAMS, GET_MEMBER_CORPORATION_RELATIONSHIPS } from '../../graphql/queries';
import { UPDATE_MEMBER_INFORMATION } from '../../graphql/mutations';
import { toast, toastSuccess } from '../../utils/toast';
import { Copy, Camera, Trash2 } from 'lucide-react';
import { 
  HiOutlineShieldCheck as Shield,
  HiOutlineUser as User,
  HiOutlineEye as Eye,
  HiOutlinePencil as Edit,
  HiOutlineMail as Mail,
  HiOutlinePhone as Phone,
  HiOutlineLocationMarker as MapPin,
  HiOutlineOfficeBuilding as Building2,
  HiOutlineUserGroup as UsersRound,
  HiOutlineCalendar as Calendar,
  HiOutlineCheckCircle as CheckCircle2,
  HiOutlineXCircle as XCircle,
  HiOutlineArrowLeft as ArrowLeft,
  HiOutlineCog as Utensils,
  HiOutlineExclamationCircle as AlertTriangle,
  HiOutlineInformationCircle as Info,
  HiOutlineFlag as Leaf,
  HiOutlineKey as Key,
  HiOutlineFingerPrint as Fingerprint,
  HiOutlineCreditCard as CreditCard,
  HiOutlineShoppingBag as ShoppingBag,
  HiOutlineCollection as Collection,
  HiOutlineStar as Star,
  HiOutlineTag as Tag,
  HiOutlineTicket as Ticket,
  HiOutlineClock as Clock,
} from 'react-icons/hi';

interface UserProfileViewProps {
  userUuid: string;
  onBack?: () => void;
}

export function UserProfileView({ userUuid, onBack }: UserProfileViewProps) {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [showProfilePictureConfirm, setShowProfilePictureConfirm] = useState(false);
  const [showRemoveProfilePictureConfirm, setShowRemoveProfilePictureConfirm] = useState(false);
  const [isHoveringProfilePicture, setIsHoveringProfilePicture] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseCardClassName = 'border border-gray-200 shadow-sm';
  const cardHeaderClassName = 'border-b border-gray-100 bg-gray-50/60';
  const dividerClassName = 'bg-gray-100';

  const { data, loading, error, refetch } = useQuery(GET_MEMBER_BY_UUID, {
    variables: { uuid: userUuid },
    fetchPolicy: 'network-only',
  });

  const member = (data as any)?.member;

  // Build full name for member filter (backend expects "FirstName LastName")
  const memberFullName = useMemo(() => {
    if (!member) return undefined;
    const firstName = member.firstName || '';
    const lastName = member.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || undefined;
  }, [member]);

  const { data: bookingsData, loading: bookingsLoading } = useQuery(GET_ALL_RESERVATIONS, {
    variables: { 
      limit: 50,
      offset: 0,
      member: memberFullName,
    },
    skip: !memberFullName,
    fetchPolicy: 'network-only',
  });

  const { data: memberTeamsData, loading: teamsLoading } = useQuery(GET_MEMBER_TEAMS, {
    variables: { memberUuid: userUuid },
    skip: !userUuid,
    fetchPolicy: 'network-only',
  });

  const { data: corporationRelationshipsData, loading: corporationsLoading } = useQuery(GET_MEMBER_CORPORATION_RELATIONSHIPS, {
    skip: !userUuid,
    fetchPolicy: 'network-only',
  });

  const teams = (memberTeamsData as any)?.membersTeams?.teams ?? [];
  
  // Get corporations from relationships (even if member is not in a team)
  const corporationRelationships = (corporationRelationshipsData as any)?.memberCorporationRelationships ?? [];
  const memberCorporations = corporationRelationships
    .filter((rel: any) => rel.memberUuid === userUuid)
    .map((rel: any) => rel.corporationName)
    .filter((name: string) => name); // Remove duplicates and empty values
  
  // Get the first corporation and team for display
  // Priority: corporation from team > corporation from direct relationship
  const primaryCorporation = teams.length > 0 && teams[0]?.corporation?.name 
    ? teams[0].corporation.name 
    : (memberCorporations.length > 0 ? memberCorporations[0] : null);
  const primaryTeam = teams.length > 0 ? teams[0]?.name : null;

  const [updateMemberInformation] = useMutation(UPDATE_MEMBER_INFORMATION, {
    refetchQueries: [{ query: GET_MEMBER_BY_UUID, variables: { uuid: userUuid } }],
  });

  const activeBookings = useMemo(() => {
    if (!bookingsData?.allReservations?.items) return [];
    return bookingsData.allReservations.items
      .filter((booking: any) => {
        const status = booking.status?.toUpperCase();
        // Only show RESERVED bookings
        return status === 'RESERVED';
      })
      .sort((a: any, b: any) => {
        try {
          const aDt = DateTime.fromISO(String(a.dateStart), { zone: 'utc' });
          const bDt = DateTime.fromISO(String(b.dateStart), { zone: 'utc' });
          if (!aDt.isValid) {
            const n = Number(a.dateStart);
            if (!isNaN(n)) {
              const aDtMillis = DateTime.fromMillis(n, { zone: 'utc' });
              if (aDtMillis.isValid && bDt.isValid) {
                return aDtMillis.toMillis() - bDt.toMillis();
              }
            }
          }
          if (aDt.isValid && bDt.isValid) {
            return aDt.toMillis() - bDt.toMillis();
          }
        } catch {}
        return 0;
      });
  }, [bookingsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading user profile...</div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error loading user profile: {error?.message || 'User not found'}</div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateValue?: string | number | null) => {
    if (dateValue === null || dateValue === undefined || dateValue === '') return null;

    const raw = String(dateValue).trim();
    if (!raw) return null;

    if (raw.includes(',') || raw.toLowerCase().includes('at')) {
      return raw;
    }

    const asNumber = Number(raw);
    if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
      const millis = raw.length > 10 ? asNumber : asNumber * 1000;
      const dt = DateTime.fromMillis(millis);
      if (dt.isValid) {
        return dt.toLocaleString(DateTime.DATE_FULL);
      }
    }

    const iso = DateTime.fromISO(raw);
    if (iso.isValid) {
      return iso.toLocaleString(DateTime.DATE_FULL);
    }

    const fallback = new Date(raw);
    if (!Number.isNaN(fallback.getTime())) {
      return fallback.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return null;
  };

  const formatUnixTimestamp = (timestamp?: number | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (cents?: number | null, currency: string = 'USD') => {
    if (cents === null || cents === undefined) return null;
    const dollars = cents / 100;
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${dollars.toFixed(2)}`;
  };

  const formatPhoneNumber = (phone?: string | null) => {
    if (!phone) return null;
    const normalized = phone.trim();
    if (!normalized) return null;

    const countryCodes = [
      "+971", "+972", "+852", "+358", "+376", "+355", "+213", "+1", "+93", "+244",
      "+54", "+55", "+52", "+91", "+86", "+81", "+82", "+65", "+64", "+61", "+49",
      "+47", "+46", "+45", "+44", "+43", "+41", "+39", "+34", "+33", "+32", "+31",
      "+27",
    ];

    const formatGeneric = (digits: string) => {
      if (digits.length <= 3) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 10) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      }
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
    };

    if (normalized.startsWith("+")) {
      const digits = normalized.replace(/\D/g, "");
      const matchedCode = countryCodes
        .sort((a, b) => b.length - a.length)
        .find((code) => digits.startsWith(code.replace("+", "")));
      const countryCode = matchedCode ? matchedCode.replace("+", "") : digits.slice(0, 3);
      const restDigits = digits.slice(countryCode.length);
      if (!restDigits) return `+${countryCode}`;
      if (countryCode === '1' && restDigits.length >= 10) {
        const main = restDigits.slice(0, 10);
        const extra = restDigits.slice(10);
        const formatted = `(${main.slice(0, 3)}) ${main.slice(3, 6)}-${main.slice(6, 10)}`;
        return extra ? `+1 ${formatted} ${extra}` : `+1 ${formatted}`;
      }
      return `+${countryCode} ${formatGeneric(restDigits)}`;
    }

    const digits = normalized.replace(/\D/g, '');
    if (!digits) return normalized;
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return formatGeneric(digits);
  };

  const getSubscriptionStatusDisplay = (status?: string) => {
    if (!status) return { label: 'N/A', className: 'bg-gray-100 text-gray-700' };
    const statusMap: Record<string, { label: string; className: string }> = {
      TRIAL: { label: 'Trial', className: 'bg-blue-100 text-blue-700' },
      TRIAL_CANCELED: { label: 'Trial Canceled', className: 'bg-yellow-100 text-yellow-700' },
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
      ACTIVE_CANCELED: { label: 'Active Canceled', className: 'bg-orange-100 text-orange-700' },
      NEVER_SUBSCRIBED: { label: 'Never Subscribed', className: 'bg-gray-100 text-gray-700' },
      ENDED: { label: 'Ended', className: 'bg-red-100 text-red-700' },
    };
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  const formatReservationDateTime = (dateString?: string | null, timezone?: string | null) => {
    if (!dateString) return null;
    try {
      let dt = DateTime.fromISO(String(dateString), { zone: 'utc' });
      if (!dt.isValid) {
        const n = Number(dateString);
        if (!isNaN(n)) dt = DateTime.fromMillis(n, { zone: 'utc' });
      }
      if (!dt.isValid) return dateString;
      const zone = timezone || 'America/New_York';
      const local = dt.setZone(zone);
      if (!local.isValid) return dateString;
      return local.toFormat('LLL d, yyyy • h:mm a');
    } catch {
      return dateString;
    }
  };

  const getReservationStatusDisplay = (status?: string) => {
    if (!status) return { label: 'N/A', className: 'bg-gray-100 text-gray-700' };
    const statusMap: Record<string, { label: string; className: string }> = {
      RESERVED: { label: 'Reserved', className: 'bg-green-100 text-green-700' },
      FREE_BOOKED: { label: 'Free Booked', className: 'bg-blue-100 text-blue-700' },
      CASH_BOOKED: { label: 'Cash Booked', className: 'bg-purple-100 text-purple-700' },
      RESERVATION_PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
      CANCELED: { label: 'Canceled', className: 'bg-red-100 text-red-700' },
      RELEASED: { label: 'Released', className: 'bg-gray-100 text-gray-700' },
      CANCEL_PENDING: { label: 'Cancel Pending', className: 'bg-orange-100 text-orange-700' },
      LISTED: { label: 'Listed', className: 'bg-gray-100 text-gray-700' },
    };
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  const getRoleDisplay = (role: string) => {
    const roleName = role.split('/').pop()?.toUpperCase() || role.toUpperCase();

    const roleConfig: Record<string, { label: string; icon: any; className: string; description: string }> = {
      OWNER: {
        label: 'Owner',
        icon: Shield,
        className: 'bg-amber-100 text-amber-700 border-amber-200',
        description: 'Full system access and management capabilities',
      },
      ADMIN: {
        label: 'Admin',
        icon: Shield,
        className: 'bg-purple-100 text-purple-700 border-purple-200',
        description: 'Full system access and management capabilities',
      },
      MEMBER: {
        label: 'Member',
        icon: User,
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        description: 'Standard access to team resources',
      },
      VIEWER: {
        label: 'Viewer',
        icon: Eye,
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        description: 'Read-only access to resources',
      },
    };

    return roleConfig[roleName] || {
      label: roleName,
      icon: User,
      className: 'bg-gray-100 text-gray-700 border-gray-200',
      description: 'User access',
    };
  };

  const roleDisplay = getRoleDisplay(member.role || '');
  const RoleIcon = roleDisplay.icon;

  // Always include lastName when available
  const displayName = (() => {
    const firstName = member.firstName || '';
    const lastName = member.lastName || '';
    const preferredName = member.preferredName || '';
    
    // If we have a preferredName and lastName, show "PreferredName LastName"
    if (preferredName && lastName) {
      return `${preferredName} ${lastName}`.trim();
    }
    // If we have preferredName but no lastName, show preferredName
    if (preferredName) {
      return preferredName;
    }
    // If we have firstName and lastName, show "FirstName LastName"
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    // If we have firstName only, show firstName
    if (firstName) {
      return firstName;
    }
    // Fallbacks
    return member.username || member.email || 'Unknown User';
  })();

  const fullAddress = member.address
    ? (() => {
        const line1 = member.address.addressLine1 || '';
        const line2 = member.address.addressLine2 || '';
        const city = member.address.city || '';
        const state = member.address.state || '';
        const zipcode = member.address.zipcode || '';
        const lineParts = [line1, line2].filter(Boolean).join(', ');
        const cityStateZip = [city, state, zipcode].filter(Boolean).join(' ');
        const combined = [lineParts, cityStateZip].filter(Boolean).join('\n').trim();
        return combined || null;
      })()
    : null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(member.uuid);
    toastSuccess('User ID copied to clipboard', {
      description: member.uuid,
    });
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(member.email);
    toastSuccess('Email copied to clipboard');
  };

  const handleCopyFederateId = () => {
    if (member.federatedId) {
      navigator.clipboard.writeText(member.federatedId);
      toastSuccess('Federate ID copied to clipboard', {
        description: member.federatedId,
      });
    }
  };

  const handleCopyUuid = () => {
    if (member.uuid) {
      navigator.clipboard.writeText(member.uuid);
      toastSuccess('UUID copied to clipboard', {
        description: member.uuid,
      });
    }
  };

  const handleChangeRole = () => {
    setIsChangeRoleModalOpen(true);
  };

  const handleOpenEditProfilePicture = () => {
    setShowProfilePictureConfirm(true);
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleRequestPasswordReset = () => {
    if (!member.email) {
      toast('Email address not available', {
        description: 'This user does not have an email address configured.',
      });
      return;
    }
    setShowResetPasswordConfirm(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!member.email) {
      toast('Email address not available', {
        description: 'This user does not have an email address configured.',
      });
      return;
    }
    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/forgot-password/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: member.email,
          isCorporate: false,
        }),
      });
      if (!response.ok) {
        throw new Error('Request failed');
      }
      const result = await response.json().catch(() => ({}));
      if (result?.status) {
        toastSuccess('Password reset email sent', {
          description: member.email,
        });
      } else {
        toast('Password reset request failed', {
          description: 'Please try again or contact support.',
        });
      }
    } catch (err) {
      toast('Failed to request password reset', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setIsResettingPassword(false);
      setShowResetPasswordConfirm(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
        setShowProfilePictureConfirm(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleConfirmSaveProfilePicture = async () => {
    if (!profilePictureFile || !member) return;
    
    setShowProfilePictureConfirm(false);
    
    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          
          // Update member profile picture via mutation
          await updateMemberInformation({
            variables: {
              uuid: member.uuid,
              information: {
                profilePicture: base64String,
              },
            },
          });
          
          toastSuccess('Profile picture updated successfully!', {
            description: 'Your profile picture has been saved.',
          });
          
          // Reset file input and preview
          setProfilePictureFile(null);
          setProfilePicturePreview(null);
          
          // Refetch member data to show updated picture
          await refetch();
        } catch (mutationError: any) {
          console.error('Error updating profile picture:', mutationError);
          toast('Failed to save profile picture', {
            description: mutationError.message || 'An error occurred while saving the profile picture.',
          });
        }
      };
      
      reader.onerror = () => {
        toast('Failed to process image file', {
          description: 'Could not read the selected image file.',
        });
      };
      
      reader.readAsDataURL(profilePictureFile);
    } catch (error: any) {
      console.error('Error processing profile picture:', error);
      toast('Failed to process profile picture', {
        description: error.message || 'An error occurred while processing the image.',
      });
    }
  };

  const handleCancelProfilePictureChange = () => {
    setShowProfilePictureConfirm(false);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
  };

  const handleRemoveProfilePicture = async () => {
    if (!member) return;
    
    setShowRemoveProfilePictureConfirm(false);
    
    try {
      // Set profile picture to empty string to remove it
      await updateMemberInformation({
        variables: {
          uuid: member.uuid,
          information: {
            profilePicture: '',
          },
        },
      });
      
      toastSuccess('Profile picture removed successfully!', {
        description: 'Your profile picture has been removed.',
      });
      
      // Refetch member data
      await refetch();
    } catch (error: any) {
      console.error('Error removing profile picture:', error);
      toast('Failed to remove profile picture', {
        description: error.message || 'An error occurred while removing the profile picture.',
      });
    }
  };

  const handleEditMember = (data: any) => {
    toastSuccess('Profile updated successfully!', {
      description: `${data.firstName} ${data.lastName}'s information has been updated.`,
    });
    refetch();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/members');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack} 
            className="gap-2 border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl">User Profile</h1>
            <p className="text-gray-600 mt-1">View and manage user information</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview Card */}
          <Card className={baseCardClassName}>
            <CardHeader className={cardHeaderClassName}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="relative h-20 w-20 rounded-full overflow-hidden"
                    onMouseEnter={() => setIsHoveringProfilePicture(true)}
                    onMouseLeave={() => setIsHoveringProfilePicture(false)}
                  >
                    <Avatar className="h-20 w-20">
                      {profilePicturePreview || member.profilePicture ? (
                        <img 
                          src={profilePicturePreview || member.profilePicture || ''} 
                          alt={displayName}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    {/* Hover Overlay with Camera and Trash Icons */}
                    {isHoveringProfilePicture && (
                      <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center gap-2 transition-opacity z-10">
                        <button
                          onClick={handleOpenEditProfilePicture}
                          className="cursor-pointer p-2 hover:bg-black/30 rounded-full transition-colors flex items-center justify-center"
                        >
                          <Camera className="h-6 w-6 text-white" />
                        </button>
                        {member.profilePicture && (
                          <button
                            onClick={() => setShowRemoveProfilePictureConfirm(true)}
                            className="cursor-pointer p-2 hover:bg-black/30 rounded-full transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="h-6 w-6 text-white" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">{displayName}</CardTitle>
                      <Badge
                        variant={member.active ? 'default' : 'secondary'}
                        className={
                          member.active
                            ? 'bg-green-700 text-white hover:bg-green-800'
                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }
                      >
                        {member.active ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {member.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {member.preferredName && member.preferredName !== displayName && (
                      <CardDescription className="mb-2">
                        Preferred name: {member.preferredName}
                      </CardDescription>
                    )}
                    <Badge
                      variant="outline"
                      className={`${roleDisplay.className} border`}
                    >
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleDisplay.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {member.bio && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Bio</p>
                    <p className="text-sm font-medium whitespace-pre-line">
                      {member.bio}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className={baseCardClassName}>
            <CardHeader className={cardHeaderClassName}>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach this user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Email Address</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-medium">{member.email}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyEmail}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {member.phone && (
                <>
                  <Separator className={dividerClassName} />
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-sm font-medium mt-1">
                        {formatPhoneNumber(member.phone) || '—'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <>
                <Separator className={dividerClassName} />
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-sm font-medium mt-1 whitespace-pre-line">
                      {fullAddress || 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            </CardContent>
          </Card>

          {/* Favourite Restaurants Card */}
          {member.favouriteRestaurants && member.favouriteRestaurants.length > 0 && (
            <Card className={`${baseCardClassName} border-l-4 border-l-orange-500`}>
              <CardHeader className={cardHeaderClassName}>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-orange-600" />
                  <CardTitle>Favourite Restaurants</CardTitle>
                </div>
                <CardDescription>User's favorite dining locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.favouriteRestaurants.map((restaurant, idx) => (
                    <div key={restaurant.uuid || idx}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                          <Star className="h-4 w-4 text-orange-600 fill-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{restaurant.name}</p>
                          {restaurant.city?.location && (
                            <p className="text-xs text-gray-500 mt-0.5">{restaurant.city.location}</p>
                          )}
                        </div>
                      </div>
                      {idx < member.favouriteRestaurants!.length - 1 && (
                        <Separator className={`${dividerClassName} mt-3`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dietary Restrictions & Preferences Card */}
          <Card className={`${baseCardClassName} border-l-4 border-l-orange-500`}>
            <CardHeader className={cardHeaderClassName}>
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-orange-600" />
                <CardTitle>Dietary Information</CardTitle>
              </div>
              <CardDescription>
                Food preferences, restrictions, and allergies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dietary Preference */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Dietary Preference</p>
                  {member.preferences?.preference && member.preferences.preference !== 'None' ? (
                    <Badge className="mt-1 bg-green-100 text-green-700">
                      {member.preferences.preference}
                    </Badge>
                  ) : (
                    <p className="text-sm font-medium mt-1 text-gray-400">N/A</p>
                  )}
                </div>
              </div>

              {/* Food Allergies */}
              <Separator className={dividerClassName} />
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">Food Allergies</p>
                  {member.allergies && member.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {member.allergies.map((allergy: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-400">N/A</p>
                  )}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <Separator className={dividerClassName} />
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Info className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">Dietary Restrictions</p>
                  {member.restrictions && member.restrictions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {member.restrictions.map((restriction: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-400">N/A</p>
                  )}
                </div>
              </div>

              {/* Additional Notes - Only show if note exists */}
              {member.note && (
                <>
                  <Separator className={dividerClassName} />
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Additional Notes</p>
                      <p className="text-sm font-medium mt-1">{member.note}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Stats */}
        <div className="space-y-6">
          {/* Access & IDs Card */}
          <Card className={`${baseCardClassName} border-l-4 border-l-purple-500`}>
            <CardHeader className={cardHeaderClassName}>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-600" />
                <CardTitle>Access &amp; IDs</CardTitle>
              </div>
              <CardDescription>Credentials and system identifiers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Credentials
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="text-sm font-medium mt-1 break-all">
                      {member.username || member.email || '—'}
                    </p>
                  </div>
                </div>

                <Separator className={dividerClassName} />

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Key className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Password</p>
                    <p className="text-sm font-medium mt-1">••••••••</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Passwords are not displayed for security.
                    </p>
                  </div>
                </div>

                <Separator className={dividerClassName} />

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleRequestPasswordReset}
                  disabled={!member.email || isResettingPassword}
                >
                  <Key className="h-4 w-4" />
                  {isResettingPassword ? 'Sending reset email...' : 'Reset Password'}
                </Button>
              </div>

              <Separator className={dividerClassName} />

              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                System Identifiers
              </div>
              <div className="space-y-4">
                {member.federatedId && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Fingerprint className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 mb-1">Federate ID</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all flex-1 min-w-0">
                          {member.federatedId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyFederateId}
                          className="h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-200"
                          title="Copy Federate ID"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {member.uuid && (
                  <>
                    {member.federatedId && <Separator className={dividerClassName} />}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <Key className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 mb-1">UUID</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all flex-1 min-w-0">
                            {member.uuid}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyUuid}
                            className="h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-200"
                            title="Copy UUID"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!member.federatedId && !member.uuid && (
                  <p className="text-sm text-gray-500">No identifiers available.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Bookings Card */}
          <Card className={`${baseCardClassName} border-l-4 border-l-blue-500`}>
            <CardHeader className={cardHeaderClassName}>
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-600" />
                <CardTitle>Active Bookings</CardTitle>
              </div>
              <CardDescription>Current and upcoming reservations</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  Loading bookings...
                </div>
              ) : activeBookings.length > 0 ? (
                activeBookings.map((booking: any, idx: number) => {
                  const dateTimeStr = formatReservationDateTime(booking.dateStart, booking.restaurant?.timezone);
                  return (
                    <React.Fragment key={booking.uuid || idx}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">
                            {booking.restaurant?.name || 'Unknown Restaurant'}
                            {booking.restaurant?.city?.location && (
                              <span className="text-xs text-gray-500 font-normal"> - {booking.restaurant.city.location}</span>
                            )}
                          </p>
                          {dateTimeStr && (
                            <p className="text-xs text-gray-600 mb-1">{dateTimeStr}</p>
                          )}
                          {booking.table?.label && (
                            <p className="text-xs text-gray-500">Table: {booking.table.label}</p>
                          )}
                          {booking.table?.reservedPartySize && (
                            <p className="text-xs text-gray-500">Party Size: {booking.table.reservedPartySize}</p>
                          )}
                        </div>
                      </div>
                      {idx < activeBookings.length - 1 && (
                        <Separator className={`${dividerClassName} my-3`} />
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  N/A
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card className={baseCardClassName}>
            <CardHeader className={cardHeaderClassName}>
              <CardTitle>User Info</CardTitle>
              <CardDescription>Account dates and organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(teamsLoading || corporationsLoading) ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  Loading organization information...
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-sm font-medium mt-1">{primaryCorporation || '—'}</p>
                    </div>
                  </div>

                  <Separator className={dividerClassName} />

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <UsersRound className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Team</p>
                      <p className="text-sm font-medium mt-1">{primaryTeam || '—'}</p>
                    </div>
                  </div>

                  {teams.length > 1 && (
                    <>
                      <Separator className={dividerClassName} />
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-2">Additional Teams</p>
                          <div className="space-y-1">
                            {teams.slice(1).map((team: any, idx: number) => (
                              <div key={team.uuid || idx} className="text-sm">
                                <span className="font-medium">{team.name || '—'}</span>
                                {team.corporation?.name && (
                                  <span className="text-gray-500 ml-2">@ {team.corporation.name}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {memberCorporations.length > 1 && (
                    <>
                      <Separator className={dividerClassName} />
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-2">Additional Corporations</p>
                          <div className="space-y-1">
                            {memberCorporations.slice(1).map((corpName: string, idx: number) => (
                              <div key={idx} className="text-sm font-medium">
                                {corpName}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <Separator className={dividerClassName} />

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium mt-1">{formatDate(member.createdAt) || '—'}</p>
                </div>
              </div>

              <Separator className={dividerClassName} />

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Birth Date</p>
                  <p className="text-sm font-medium mt-1">{formatDate(member.birthDate) || '—'}</p>
                </div>
              </div>

              <Separator className={dividerClassName} />

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="text-sm font-medium mt-1">{formatDate(member.joinDate) || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className={baseCardClassName}>
            <CardHeader className={cardHeaderClassName}>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common user management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleChangeRole}
              >
                <Shield className="h-4 w-4" />
                Change Role
              </Button>
              <Separator className={`${dividerClassName} my-2`} />
              <Button
                variant="outline"
                className={`w-full justify-start gap-2 ${
                  member.active 
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                }`}
                onClick={() => setIsDeactivateModalOpen(true)}
              >
                {member.active ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Deactivate User
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Activate User
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Summary Card */}
          <Card className={baseCardClassName}>
            <CardHeader className={cardHeaderClassName}>
              <CardTitle>Status Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <Badge
                  variant={member.active ? 'default' : 'secondary'}
                  className={
                    member.active
                      ? 'bg-green-700 text-white'
                      : 'bg-red-100 text-red-700'
                  }
                >
                  {member.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

      {/* Edit Member Modal */}
      <EditUserModal
        member={member as any}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          toastSuccess('Profile updated successfully!', {
            description: 'Member information has been updated.',
          });
          refetch();
        }}
      />

      {/* Deactivate/Activate User Modal */}
      <DeactivateUserModal
        member={member as any}
        open={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        onSuccess={() => {
          toastSuccess(
            member.active ? 'User deactivated successfully!' : 'User activated successfully!',
            {
              description: `The user account has been ${member.active ? 'deactivated' : 'activated'}.`,
            }
          );
          refetch();
        }}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        open={isChangeRoleModalOpen}
        onClose={() => setIsChangeRoleModalOpen(false)}
        member={member as any}
        currentRole={member.role || null}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Reset Password Confirmation Modal */}
      <Modal
        open={showResetPasswordConfirm}
        onClose={() => setShowResetPasswordConfirm(false)}
        title="Reset Password"
        size="sm"
        showCloseButton={false}
      >
        <div className="space-y-6 py-4">
          <p className="text-sm text-gray-600">
            This will send a password reset email to:
          </p>
          <p className="text-sm font-medium break-all">{member.email || '—'}</p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowResetPasswordConfirm(false)}
              disabled={isResettingPassword}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmPasswordReset} disabled={isResettingPassword}>
              {isResettingPassword ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Profile Picture Change Confirmation Modal */}
      <Modal
        open={showProfilePictureConfirm}
        onClose={handleCancelProfilePictureChange}
        title="Change Profile Picture"
        size="md"
        showCloseButton={false}
      >
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Upload a new profile picture. Recommended size: 400x400px
            </p>
            
            {profilePicturePreview && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={profilePicturePreview}
                    alt="Preview"
                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
                <div 
                  className="bg-gray-50 p-8 rounded-lg w-full border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-gray-400">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">Drag and drop your image here</p>
                    <p className="text-xs text-gray-400">or</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={handleChooseFileClick}
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              </div>
            )}

            {!profilePicturePreview && (
              <div 
                className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-gray-400">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Drag and drop your image here</p>
                  <p className="text-xs text-gray-400">or</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={handleChooseFileClick}
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancelProfilePictureChange}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSaveProfilePicture}
              disabled={!profilePicturePreview}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Upload Photo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Profile Picture Confirmation Modal */}
      <Modal
        open={showRemoveProfilePictureConfirm}
        onClose={() => setShowRemoveProfilePictureConfirm(false)}
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Remove Profile Picture</span>
          </div>
        }
        size="md"
        showCloseButton={false}
      >
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove your profile picture? Your profile will display your initials instead.
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500">Your profile will look like this:</p>
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowRemoveProfilePictureConfirm(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveProfilePicture}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Remove Picture
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

