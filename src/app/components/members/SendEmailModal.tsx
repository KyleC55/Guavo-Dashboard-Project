import { useState } from 'react';
import Modal from '../modal';
import { Mail, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { toastSuccess, toast } from '../../utils/toast';
import { keycloak } from '../../../keycloak';

interface SendEmailModalProps {
  open: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string;
}

export function SendEmailModal({ 
  open, 
  onClose, 
  recipientEmail,
  recipientName 
}: SendEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showReview, setShowReview] = useState(false);

  // Get current logged-in user info from Keycloak token
  const currentUserEmail = (keycloak.tokenParsed as any)?.email || '';
  const currentUserName = 
    `${(keycloak.tokenParsed as any)?.given_name || ''} ${(keycloak.tokenParsed as any)?.family_name || ''}`.trim() ||
    (keycloak.tokenParsed as any)?.name ||
    'Current User';

  const handleCopyRecipientEmail = () => {
    navigator.clipboard.writeText(recipientEmail);
    toastSuccess('Recipient email copied to clipboard');
  };

  const handleCopySenderEmail = () => {
    if (currentUserEmail) {
      navigator.clipboard.writeText(currentUserEmail);
      toastSuccess('Your email copied to clipboard');
    }
  };

  const handleReview = () => {
    if (!subject.trim()) {
      toast('Please enter a subject');
      return;
    }
    setShowReview(true);
  };

  const handleConfirmSend = () => {
    // Create mailto link with subject and body
    const subjectEncoded = encodeURIComponent(subject.trim());
    const bodyEncoded = encodeURIComponent(body.trim());
    const mailtoLink = `mailto:${recipientEmail}?subject=${subjectEncoded}&body=${bodyEncoded}`;
    
    window.location.href = mailtoLink;
    
    // Reset form and close after a brief delay
    setTimeout(() => {
      setSubject('');
      setBody('');
      setShowReview(false);
      onClose();
    }, 300);
  };

  const handleBackFromReview = () => {
    setShowReview(false);
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    setShowReview(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !showReview}
        onClose={handleClose}
        title="Send Email"
        size="md"
        showCloseButton={false}
      >
      <div className="space-y-6 py-4">
        <div className="space-y-4">
          {/* Recipient Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">To (Recipient)</label>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                {recipientName && (
                  <p className="text-sm font-medium text-gray-900">{recipientName}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-700 break-all">{recipientEmail}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyRecipientEmail}
                    className="h-6 w-6 p-0 flex-shrink-0 hover:bg-blue-100"
                    title="Copy recipient email"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sender Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">From (You)</label>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{currentUserName}</p>
                {currentUserEmail ? (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-700 break-all">{currentUserEmail}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopySenderEmail}
                      className="h-6 w-6 p-0 flex-shrink-0 hover:bg-gray-100"
                      title="Copy your email"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic mt-1">Email not available</p>
                )}
              </div>
            </div>
          </div>

          {/* Email Composition Form */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="email-subject" className="text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                id="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email-body" className="text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here..."
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[150px]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReview}
            disabled={!recipientEmail || !subject.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={open && showReview}
        onClose={handleBackFromReview}
        title="Review Email"
        size="md"
        showCloseButton={false}
      >
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-black mb-1">To</p>
                <p className="text-sm font-medium text-black">{recipientEmail}</p>
              </div>
              <div>
                <p className="text-xs text-black mb-1">Subject</p>
                <p className="text-sm font-medium text-black">{subject}</p>
              </div>
              <div>
                <p className="text-xs text-black mb-1">Message</p>
                <div className="text-sm text-black bg-white border border-gray-200 rounded p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {body || <span className="text-gray-400 italic">(No message)</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBackFromReview}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmSend}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
