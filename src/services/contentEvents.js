const UPDATE_EVENT = 'lynn-portfolio-backend-content-updated';
const CHANNEL_NAME = 'lynn-portfolio-backend-content';
let channel;

function getChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  channel ||= new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function notifyContentChanged() {
  window.dispatchEvent(new Event(UPDATE_EVENT));
  getChannel()?.postMessage('content-updated');
}

export function subscribeToContentChanges(callback) {
  const onUpdate = () => callback();
  window.addEventListener(UPDATE_EVENT, onUpdate);
  const broadcast = getChannel();
  if (broadcast) broadcast.addEventListener('message', onUpdate);
  return () => {
    window.removeEventListener(UPDATE_EVENT, onUpdate);
    broadcast?.removeEventListener('message', onUpdate);
  };
}
