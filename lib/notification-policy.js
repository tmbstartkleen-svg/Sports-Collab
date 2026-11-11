export const EVENT_TYPES = Object.freeze(['completed','failed','blocked','quota_exhausted']);
export const MAX_NOTICES = 50;
export function sanitizeNotice({type,message,at} = {}) {
  if (!EVENT_TYPES.includes(type)) throw new Error('Unsupported event type');
  if (typeof message !== 'string' || message.length > 240) throw new Error('Invalid message');
  const timestamp = typeof at === 'string' && !Number.isNaN(Date.parse(at)) ? at : new Date().toISOString();
  return {type,message,at:timestamp};
}
export function appendNotice(history,notice) {
  const clean = sanitizeNotice(notice);
  return [...(Array.isArray(history) ? history : []),clean].slice(-MAX_NOTICES);
}
export function shouldNotify({type,silent=false,inApp=true,iphonePush=true}={}) {
  if (!EVENT_TYPES.includes(type) || silent) return {inApp:false,push:false};
  return {inApp:!!inApp,push:false,reason:iphonePush?'Push delivery not implemented':'Push preference off'};
}
