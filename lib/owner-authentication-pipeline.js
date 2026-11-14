// Internal wiring of persistent WebAuthn components. Never enables public routes.
import {makePasskeyCredentialStore} from './passkey-credential-store.js';
import {makePasskeyChallengeStore} from './passkey-challenge-store.js';
import {makeVerifiedAssertionCoordinator} from './passkey-assertion-coordinator.js';
import {makeOwnerSessionStore} from './owner-session-store.js';
import {makePasskeySessionCoordinator} from './passkey-session-coordinator.js';
import {normalizeRpOrigin} from './webauthn-validation.js';
export function makeOwnerAuthenticationPipeline({pool,enabled=false,expectedOrigin}={}){
 const active=enabled===true&&Boolean(normalizeRpOrigin(expectedOrigin))&&!!pool&&typeof pool.query==='function';
 const credentials=makePasskeyCredentialStore({pool,enabled:active});
 const challenges=makePasskeyChallengeStore({pool,enabled:active});
 const assertions=makeVerifiedAssertionCoordinator({credentials,challenges,enabled:active});
 const sessions=makeOwnerSessionStore({pool,enabled:active});
 const bridge=makePasskeySessionCoordinator({assertions,sessions,enabled:active});
 return {enabled:active,async authenticate(input={}){
  if(!active)return {ok:false,error:'Owner authentication pipeline disabled'};
  // Origin is trusted server configuration, never supplied by the browser.
  return bridge.authenticateAndCreateSession({...input,expectedOrigin});
 },async issueChallenge({ownerId}={}){
  if(!active)return {ok:false,error:'Owner authentication pipeline disabled'};
  return challenges.issue({ownerId,purpose:'authenticate'});
 },async verifySession(token){return sessions.verifySession(token)},async revokeSession(token){return sessions.revokeSession(token)}
 };
}
