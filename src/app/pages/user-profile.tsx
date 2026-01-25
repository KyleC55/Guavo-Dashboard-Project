import { useParams, useNavigate } from 'react-router-dom';
import { UserProfileView } from '../components/members/UserProfileView';

export default function UserProfilePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  if (!uuid) {
    return (
      <div className="relative flex min-h-screen bg-white">
        <main className="flex-1 flex flex-col w-full">
          <div className="flex-1 flex items-center justify-center min-h-screen">
            <div className="text-red-500">User UUID is required</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-white">
      <main className="flex-1 flex flex-col w-full">
        <div className="overflow-y-auto">
          <UserProfileView 
            userUuid={uuid} 
            onBack={() => navigate('/members')}
          />
        </div>
      </main>
    </div>
  );
}

