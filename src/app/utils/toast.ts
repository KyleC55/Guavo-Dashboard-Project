// Simple toast utility
let toastContainer: HTMLDivElement | null = null;

export interface ToastOptions {
  description?: string;
  duration?: number;
}

export function toast(message: string, options: ToastOptions = {}) {
  const { description, duration = 3000 } = options;
  
  // Create container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-6 right-6 z-[10000] space-y-2';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = 'bg-gray-900 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-in slide-in-from-bottom-5';
  
  toastEl.innerHTML = `
    <div class="flex-1">
      <div class="font-semibold">${message}</div>
      ${description ? `<div class="text-sm text-gray-300 mt-1">${description}</div>` : ''}
    </div>
    <button class="flex-shrink-0 text-white hover:text-gray-200 transition-colors" aria-label="Close">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  
  const closeBtn = toastEl.querySelector('button');
  const closeToast = () => {
    toastEl.style.animation = 'fade-out 0.2s ease-out';
    setTimeout(() => {
      toastEl.remove();
    }, 200);
  };
  
  closeBtn?.addEventListener('click', closeToast);
  
  toastContainer.appendChild(toastEl);
  
  // Auto-remove after duration
  setTimeout(closeToast, duration);
}

// Add success variant
export function toastSuccess(message: string, options: ToastOptions = {}) {
  const { description, duration = 3000 } = options;
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-6 right-6 z-[10000] space-y-2';
    document.body.appendChild(toastContainer);
  }
  
  const toastEl = document.createElement('div');
  toastEl.className = 'bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-in slide-in-from-bottom-5';
  
  toastEl.innerHTML = `
    <div class="flex-shrink-0">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <div class="flex-1">
      <div class="font-semibold">${message}</div>
      ${description ? `<div class="text-sm text-green-100 mt-1">${description}</div>` : ''}
    </div>
    <button class="flex-shrink-0 text-white hover:text-gray-200 transition-colors" aria-label="Close">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  
  const closeBtn = toastEl.querySelector('button');
  const closeToast = () => {
    toastEl.style.animation = 'fade-out 0.2s ease-out';
    setTimeout(() => {
      toastEl.remove();
    }, 200);
  };
  
  closeBtn?.addEventListener('click', closeToast);
  
  toastContainer.appendChild(toastEl);
  
  setTimeout(closeToast, duration);
}

