// Legacy entry point — forwards to the refactored chat bubble in
// `components/chat/ChatBubble.tsx`. Kept so any code path importing
// `'../components/ChatBubble'` keeps working without churn.
export { default } from './chat/ChatBubble';
